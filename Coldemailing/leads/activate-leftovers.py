#!/usr/bin/env python3
# Aktiviert Pool-Leftover: unenrollte valid/risky Kontakte, deren Stadt gesetzt ist, aber
# von city_ok wegen unsauberer Strings ("Lauffen am Neckar", "(firmenname) Heilbronn")
# faelschlich als fern verworfen wird. Saeubert die Stadt gegen LOCAL50, klassifiziert ICP
# REGELBASIERT aus Firmenname/Kategorie (route() aus ingest-lokal, kein LLM), schliesst
# Sperrliste + Wrong-ICP (Hausmeister/Monteur/Reinigung) aus, enrollt DB-only.
#   python activate-leftovers.py            (dry-run, zeigt Liste)
#   python activate-leftovers.py --apply
import subprocess, sys, os, re, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev"]
APPLY = "--apply" in sys.argv
STATUSES = ("valid", "risky")

spec = importlib.util.spec_from_file_location("ingest_lokal", os.path.join(HERE, "ingest-lokal.py"))
il = importlib.util.module_from_spec(spec); spec.loader.exec_module(il)
nw, LOCAL50, route = il.nw, il.LOCAL50, il.route

CAMP = {
    "ICP1": "65d59308-2ac6-479e-bdb6-31560415f8f7",  # Hausverwaltungen
    "ICP2": "f3b5688d-9edc-4fca-b3db-540ee598ac78",  # Makler
    "ICP3": "6ad38730-9076-4cc4-84c8-186e4755b795",  # Architekten
    "ICP4": "7b8b2e5a-dfce-4ec2-bcb6-04341bb79e18",  # Bautraeger/Facility
}
# Wrong-ICP: vom Nutzer bewusst raus (Hausmeisterdienste, Monteurzimmer, Reinigung, Beherbergung)
BLOCK = ["hausmeister", "janitor", "monteurzimmer", "monteurwohnung", "reinigung",
         "cleaning", "cleaner", "gebaeudereinigung", "gebäudereinigung", "pension",
         "hostel", "ferienwohn", "objektbetreuung", "software", "saas", "portal"]


def local_match(stadt):
    """Gibt sauberen lokalen Stadtnamen zurueck, wenn <=50km (LOCAL50), sonst None.
    Prueft konservativ: ganzer String, erstes Segment, erstes Wort, erste zwei Woerter."""
    s = (stadt or "").replace("(firmenname)", "").strip()
    if not s:
        return None
    words = [w for w in re.split(r"\s+", s) if w]
    cands = [(nw(s), s), (nw(re.split(r"[\-/(,]", s)[0]), re.split(r"[\-/(,]", s)[0].strip())]
    if words:
        cands.append((nw(words[0]), words[0]))
        if len(words) >= 2:
            cands.append((nw(words[0] + words[1]), words[0] + " " + words[1]))
    for norm, disp in cands:
        if norm and norm in LOCAL50:
            return disp
    return None


def classify(company, category, segment):
    low = " ".join([company or "", category or "", segment or ""]).lower()
    if any(b in low for b in BLOCK):
        return None                       # Wrong-ICP hart raus
    return route(company) or route(category) or route(segment)


def q(sql):
    return subprocess.run(PG + ["-t", "-A", "-F", "|", "-c", sql],
                          capture_output=True, text=True, encoding="utf-8").stdout


def main():
    st_in = ",".join(f"'{s}'" for s in STATUSES)
    rows = q(f"""
      SELECT co.id, lower(co.email),
             COALESCE(co.custom_fields->>'stadt',''),
             COALESCE(co.custom_fields->>'segment',''),
             COALESCE(co.custom_fields->>'category',''),
             COALESCE(co.company,'')
      FROM contacts co
      WHERE co.verification_status IN ({st_in})
        AND co.email LIKE '%@%'
        AND COALESCE(co.custom_fields->>'icp','')=''
        AND NOT EXISTS (SELECT 1 FROM campaign_leads cl WHERE cl.contact_id=co.id)
        AND NOT EXISTS (SELECT 1 FROM suppressed_recipients s WHERE lower(s.email)=lower(co.email))
    """).splitlines()

    buckets = {k: [] for k in CAMP}
    skip_far = skip_block = skip_noicp = 0
    for line in rows:
        p = line.split("|")
        if len(p) < 6:
            continue
        cid, email, stadt, seg, cat, company = p[0], p[1], p[2], p[3], p[4], "|".join(p[5:])
        city = local_match(stadt)
        if not city:
            skip_far += 1
            continue
        low = " ".join([company, cat, seg]).lower()
        if any(b in low for b in BLOCK):
            skip_block += 1
            continue
        icp = classify(company, cat, seg)
        if icp not in CAMP:
            skip_noicp += 1
            continue
        buckets[icp].append((cid, email, city, company))

    total = sum(len(v) for v in buckets.values())
    print(f"=== AKTIVIERBAR (lokal<=50km + ICP-Match + nicht gesperrt + nicht Wrong-ICP) ===")
    for k in CAMP:
        print(f"  {k}: {len(buckets[k])}")
    print(f"  -> gesamt: {total}")
    print(f"  skip fern/Stadt-unklar: {skip_far} | skip Wrong-ICP: {skip_block} | skip kein ICP-Match: {skip_noicp}")

    if not APPLY:
        for k in CAMP:
            if buckets[k]:
                print(f"\n--- {k} ({len(buckets[k])}) ---")
                for cid, email, city, company in buckets[k]:
                    print(f"  {city[:20]:20} | {company[:38]:38} | {email}")
        print("\n(dry-run — mit --apply: custom_fields.icp setzen + in campaign_leads schreiben)")
        return

    ins_total = 0
    for k, camp_id in CAMP.items():
        if not buckets[k]:
            continue
        # custom_fields.icp setzen (fuer spaetere Laeufe/Routing) + Stadt bleibt
        ids = ",".join(f"'{cid}'" for cid, _, _, _ in buckets[k])
        q(f"UPDATE contacts SET custom_fields = custom_fields || '{{\"icp\":\"{k}\"}}'::jsonb "
          f"WHERE id IN ({ids});")
        maxpos = q(f"SELECT COALESCE(MAX(position),0) FROM campaign_leads WHERE campaign_id='{camp_id}'").strip()
        base = int(maxpos or 0)
        vals = ",".join(f"('{cid}','{camp_id}',{base + i + 1})"
                        for i, (cid, _, _, _) in enumerate(buckets[k]))
        r = subprocess.run(PG + ["-c",
             f"INSERT INTO campaign_leads (contact_id, campaign_id, position) VALUES {vals} ON CONFLICT DO NOTHING;"],
             capture_output=True, text=True, encoding="utf-8")
        print(f"  {k} -> {(r.stdout + r.stderr).strip()[:80]}")
        ins_total += len(buckets[k])
    print(f"\nfertig. enrollt: {ins_total}")


if __name__ == "__main__":
    main()

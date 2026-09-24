#!/usr/bin/env python3
# Enrollt bestehende DB-Kontakte (verification_status='valid', <=50km lokal, noch NICHT
# in irgendeiner Kampagne) in die 4 ICP-v3-Kampagnen. DB-only (API-Token tot):
# INSERT INTO campaign_leads (contact_id, campaign_id, position) -- Scheduler seedet progress.
# Locality-Check + LOCAL50 aus ingest-lokal.py wiederverwendet (Single Source of Truth).
# Routing: custom_fields->>'icp' (ICP1..ICP4) zuerst, sonst per Segment/Category.
# Nutzung: python enroll-valid-local.py           (dry-run)
#          python enroll-valid-local.py --apply
import subprocess, sys, os, importlib.util
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev"]
APPLY = "--apply" in sys.argv
# Ohne API/saubere :25-IP ist SMTP-Verify blockiert -> neue Leads erreichen max. 'risky'
# (Domain lebt, Postfach unbestaetigt). --include-risky enrollt diese mit (Bounce-Restrisiko,
# stop_on_reply + Bounce-Tracking fangen es ab).
STATUSES = ("valid", "risky") if "--include-risky" in sys.argv else ("valid",)

# LOCAL50 + nw + city_ok aus ingest-lokal.py (Modulname hat Bindestrich -> importlib)
spec = importlib.util.spec_from_file_location("ingest_lokal", os.path.join(HERE, "ingest-lokal.py"))
il = importlib.util.module_from_spec(spec)
spec.loader.exec_module(il)
city_ok, LOCAL50 = il.city_ok, il.LOCAL50

CAMP = {
    "ICP1": "65d59308-2ac6-479e-bdb6-31560415f8f7",  # Hausverwaltungen
    "ICP2": "f3b5688d-9edc-4fca-b3db-540ee598ac78",  # Makler
    "ICP3": "6ad38730-9076-4cc4-84c8-186e4755b795",  # Architekten
    "ICP4": "7b8b2e5a-dfce-4ec2-bcb6-04341bb79e18",  # Bautraeger/Facility
}

def seg_route(seg):
    s = (seg or "").lower()
    if any(k in s for k in ["hausverwaltung", "immobilienverwaltung", "wohnungsverwaltung", "verwaltung", "facility"]):
        # Facility -> ICP4, reine Verwaltung -> ICP1
        return "ICP4" if "facility" in s else "ICP1"
    if any(k in s for k in ["architekt", "bauingenieur", "planer", "statiker"]):
        return "ICP3"
    if any(k in s for k in ["makler", "immobilien"]):
        if any(x in s for x in ["versicherung", "hypothek", "finanz"]):
            return None
        return "ICP2"
    if any(k in s for k in ["bautraeger", "bauträger", "bauunternehmen", "wohnbau", "projektentwickl", "generalunternehmer"]):
        return "ICP4"
    return None

def q(sql):
    return subprocess.run(PG + ["-t", "-A", "-F", "|", "-c", sql], capture_output=True, text=True, encoding="utf-8").stdout

def main():
    st_in = ",".join(f"'{s}'" for s in STATUSES)
    print(f"(Status-Filter: {', '.join(STATUSES)})")
    rows = q(f"""
      SELECT co.id, lower(co.email),
             COALESCE(co.custom_fields->>'stadt',''),
             COALESCE(co.custom_fields->>'icp',''),
             COALESCE(co.custom_fields->>'segment',''),
             co.company
      FROM contacts co
      WHERE co.verification_status IN ({st_in})
        AND co.email LIKE '%@%'
        AND NOT EXISTS (SELECT 1 FROM campaign_leads cl WHERE cl.contact_id=co.id)
        AND NOT EXISTS (SELECT 1 FROM suppressed_recipients s
                        WHERE lower(s.email)=lower(co.email))
    """).splitlines()

    buckets = {k: [] for k in CAMP}
    skip_far = skip_noicp = 0
    for line in rows:
        p = line.split("|")
        if len(p) < 6:
            continue
        cid, email, stadt, icp, seg, company = p[0], p[1], p[2], p[3], p[4], "|".join(p[5:])
        if not city_ok(stadt):
            skip_far += 1
            continue
        bucket = icp if icp in CAMP else seg_route(seg)
        if bucket not in CAMP:
            skip_noicp += 1
            continue
        buckets[bucket].append((cid, email, stadt, company))

    print("=== ENROLL valid + lokal (<=50km) + frei ===")
    for k in CAMP:
        print(f"  {k}: {len(buckets[k])}")
    total = sum(len(v) for v in buckets.values())
    print(f"  -> gesamt enrollbar: {total}")
    print(f"  skip fern (>50km / stadt leer): {skip_far}")
    print(f"  skip kein ICP-Match: {skip_noicp}")

    if not APPLY:
        print("\n(dry-run — mit --apply in campaign_leads schreiben)")
        for k in CAMP:
            if buckets[k]:
                print(f"\n  --- {k} Beispiele ---")
                for cid, email, stadt, company in buckets[k][:5]:
                    print(f"    {stadt:16} | {company[:34]:34} | {email}")
        return

    # INSERT je Bucket. position = laufende Nummer nach vorhandenem max.
    ins_total = 0
    for k, camp_id in CAMP.items():
        if not buckets[k]:
            continue
        maxpos = q(f"SELECT COALESCE(MAX(position),0) FROM campaign_leads WHERE campaign_id='{camp_id}'").strip()
        base = int(maxpos or 0)
        vals = ",".join(
            f"('{cid}','{camp_id}',{base + i + 1})"
            for i, (cid, _, _, _) in enumerate(buckets[k])
        )
        sql = (f"INSERT INTO campaign_leads (contact_id, campaign_id, position) VALUES {vals} "
               f"ON CONFLICT DO NOTHING;")
        r = subprocess.run(PG + ["-c", sql], capture_output=True, text=True, encoding="utf-8")
        out = (r.stdout + r.stderr).strip()
        print(f"  {k} -> {out[:120]}")
        ins_total += len(buckets[k])
    print(f"\nfertig. enrollt: {ins_total}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# Enrollt Partner-Kontakte (custom_fields.gewerk) in ihre jeweilige Partner-Kampagne.
# Filter: valid/risky + lokal (<=50km, city_ok) + NICHT gesperrt (suppressed_recipients)
# + noch NICHT enrolled. Cap je Kampagne (Default 20 = Test). DB-only INSERT campaign_leads.
#   python enroll-partner.py                  (dry-run)
#   python enroll-partner.py --apply
#   python enroll-partner.py --apply --per-campaign 20   (Cap aendern)
import subprocess, sys, os, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev"]
APPLY = "--apply" in sys.argv
PER = 20
if "--per-campaign" in sys.argv:
    PER = int(sys.argv[sys.argv.index("--per-campaign") + 1])
STATUSES = ("valid", "risky")  # ohne saubere :25-IP erreichen neue Leads max. 'risky'

spec = importlib.util.spec_from_file_location("ingest_lokal", os.path.join(HERE, "ingest-lokal.py"))
il = importlib.util.module_from_spec(spec); spec.loader.exec_module(il)
city_ok = il.city_ok

CAMP = {  # gewerk -> Partner-Kampagne-UUID
    "elektriker":  "4390a801-e5b2-417f-88ff-aee7f935ba90",
    "shk":         "d717099b-047e-4db3-8d98-0d271ec2d2d8",
    "entruempler": "4bd2802a-0699-42bd-86b0-639435c01555",
    "hausmeister": "a3bfa397-a1a4-4de7-aec4-5ecfabffb20f",
}


def q(sql):
    return subprocess.run(PG + ["-t", "-A", "-F", "|", "-c", sql],
                          capture_output=True, text=True, encoding="utf-8").stdout


def main():
    st_in = ",".join(f"'{s}'" for s in STATUSES)
    rows = q(f"""
      SELECT co.id, lower(co.email), COALESCE(co.custom_fields->>'stadt',''),
             COALESCE(co.custom_fields->>'gewerk',''), co.company
      FROM contacts co
      WHERE co.verification_status IN ({st_in})
        AND co.email LIKE '%@%'
        AND COALESCE(co.custom_fields->>'gewerk','') IN ('elektriker','shk','entruempler','hausmeister')
        AND NOT EXISTS (SELECT 1 FROM campaign_leads cl WHERE cl.contact_id=co.id)
        AND NOT EXISTS (SELECT 1 FROM suppressed_recipients s WHERE lower(s.email)=lower(co.email))
    """).splitlines()

    buckets = {k: [] for k in CAMP}
    skip_far = 0
    for line in rows:
        p = line.split("|")
        if len(p) < 5:
            continue
        cid, email, stadt, gewerk, company = p[0], p[1], p[2], p[3], "|".join(p[4:])
        if not city_ok(stadt):
            skip_far += 1
            continue
        if gewerk in buckets:
            buckets[gewerk].append((cid, email, stadt, company))

    print(f"=== ENROLL partner (Cap {PER}/Kampagne, lokal<=50km, nicht gesperrt) ===")
    for k in CAMP:
        avail = len(buckets[k])
        print(f"  {k}: {min(avail, PER)} von {avail} verfuegbar")
    print(f"  skip fern/Stadt-unklar: {skip_far}")

    if not APPLY:
        print("\n(dry-run — mit --apply in campaign_leads schreiben)")
        for k in CAMP:
            for cid, email, stadt, company in buckets[k][:PER][:6]:
                print(f"    {k:12} | {stadt:16} | {company[:30]:30} | {email}")
        return

    ins_total = 0
    for gewerk, camp_id in CAMP.items():
        take = buckets[gewerk][:PER]
        if not take:
            continue
        maxpos = q(f"SELECT COALESCE(MAX(position),0) FROM campaign_leads WHERE campaign_id='{camp_id}'").strip()
        base = int(maxpos or 0)
        vals = ",".join(f"('{cid}','{camp_id}',{base + i + 1})"
                        for i, (cid, _, _, _) in enumerate(take))
        r = subprocess.run(PG + ["-c",
             f"INSERT INTO campaign_leads (contact_id, campaign_id, position) VALUES {vals} ON CONFLICT DO NOTHING;"],
             capture_output=True, text=True, encoding="utf-8")
        print(f"  {gewerk} -> {(r.stdout + r.stderr).strip()[:80]}")
        ins_total += len(take)
    print(f"\nfertig. enrollt: {ins_total}")


if __name__ == "__main__":
    main()

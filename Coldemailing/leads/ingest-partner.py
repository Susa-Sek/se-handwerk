#!/usr/bin/env python3
# DB-only Ingest der Partner-Scrape-CSV (komplementaere Gewerke) -> contacts.
# Wie ingest-band50-dbonly, ABER klassifiziert nach GEWERK (elektriker/shk/entruempler/
# hausmeister) statt Kunden-ICP. Email-Pick + Gewerk-Filter + Locality(<=50km) + dedup.
# custom_fields = stadt/gewerk/quelle/website/category. verification_status='unknown'.
# Danach: reverify-mx.py --apply  ->  enroll-partner.py --apply
# Nutzung: python ingest-partner.py <csv-pfad>            (dry-run)
#          python ingest-partner.py <csv-pfad> --apply
import csv, os, sys, json, subprocess, importlib.util
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
USER_ID = "c9fe81fa-8c10-4b58-b12e-b6e3882772f7"
QUELLE = "gmaps-partner"
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev"]
APPLY = "--apply" in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith("--")]
CSVF = args[0] if args else "grid-partner.csv"

spec = importlib.util.spec_from_file_location("ingest_lokal", os.path.join(HERE, "ingest-lokal.py"))
il = importlib.util.module_from_spec(spec); spec.loader.exec_module(il)
first_email, city_from, city_ok, dom_of = il.first_email, il.city_from, il.city_ok, il.dom_of


def gewerk_route(cat):
    c = (cat or "").lower()
    # Reihenfolge: spezifisch zuerst. Off-Gewerk (Makler/Architekt/Immobilien...) -> None.
    if any(k in c for k in ["elektr", "electric"]):
        return "elektriker"
    if any(k in c for k in ["sanitär", "sanitaer", "heizung", "klempner", "installateur",
                            "plumb", "hvac", "shk", "heating"]):
        return "shk"
    if any(k in c for k in ["entrümpel", "entruempel", "haushaltsauflös", "haushaltsaufloes",
                            "entsorgung", "räumung", "raeumung", "clearance", "aufloesung", "auflösung"]):
        return "entruempler"
    if any(k in c for k in ["hausmeister", "facility", "gebäudemanagement", "gebaeudemanagement",
                            "objektbetreuung", "janitor", "property maintenance"]):
        return "hausmeister"
    return None


def q(sql):
    return subprocess.run(PG + ["-t", "-A", "-c", sql], capture_output=True, text=True, encoding="utf-8").stdout


def esc(s):
    return (s or "").replace("'", "''")


def main():
    if not os.path.exists(CSVF):
        sys.exit(f"CSV nicht gefunden: {CSVF}  (Pfad als 1. Argument angeben)")
    existing = set(l.strip().lower() for l in q("SELECT lower(email) FROM contacts").splitlines() if l.strip())
    rows = list(csv.DictReader(open(CSVF, encoding="utf-8")))
    seen = set(); rec = []
    c_noemail = c_dup = c_offgewerk = c_far = 0
    for r in rows:
        email = first_email(r.get("emails", "") or r.get("email", ""))
        if not email:
            c_noemail += 1; continue
        email = email.lower()
        if email in existing or email in seen:
            c_dup += 1; continue
        gewerk = gewerk_route(r.get("category", ""))
        if gewerk is None:
            c_offgewerk += 1; continue
        city = city_from(r.get("address", ""), r.get("input_id", ""))
        if not city_ok(city):
            c_far += 1; continue
        seen.add(email)
        cf = {"stadt": city, "gewerk": gewerk, "quelle": QUELLE,
              "website": dom_of(email), "category": r.get("category", ""), "geo_ok": "1"}
        rec.append({"email": email, "company": r.get("title", ""), "phone": r.get("phone", ""),
                    "cf": cf, "city": city, "gewerk": gewerk})

    by = Counter(x["gewerk"] for x in rec)
    print("=== INGEST partner (DB-only) ===")
    print(f"  CSV-Zeilen: {len(rows)}")
    print(f"  neu importierbar: {len(rec)}")
    for k in ("elektriker", "shk", "entruempler", "hausmeister"):
        print(f"     {k}: {by.get(k,0)}")
    print(f"  skip kein Email: {c_noemail} | dup: {c_dup} | off-Gewerk: {c_offgewerk} | fern >50km: {c_far}")

    if not APPLY:
        print("\n(dry-run — mit --apply in contacts schreiben)")
        for x in rec[:12]:
            print(f"    {x['gewerk']:12} | {x['city']:16} | {x['company'][:32]:32} | {x['email']}")
        return
    if not rec:
        print("nichts zu importieren."); return

    ins = 0
    for i in range(0, len(rec), 500):
        chunk = rec[i:i+500]
        vals = ",".join(
            "('{uid}','','','{em}','{co}','{ph}','{cf}'::jsonb,'unknown','')".format(
                uid=USER_ID, em=esc(x["email"]), co=esc(x["company"]), ph=esc(x["phone"]),
                cf=esc(json.dumps(x["cf"], ensure_ascii=False)))
            for x in chunk)
        sql = ("INSERT INTO contacts (user_id, first_name, last_name, email, company, phone, "
               "custom_fields, verification_status, verification_reason) VALUES " + vals +
               " ON CONFLICT DO NOTHING;")
        r = subprocess.run(PG, input=sql, capture_output=True, text=True, encoding="utf-8")
        print(f"  chunk {i//500+1}: {(r.stdout + r.stderr).strip()[:120]}")
        ins += len(chunk)
    print(f"\nimportiert (versucht): {ins}. Naechster Schritt: python reverify-mx.py --apply")


if __name__ == "__main__":
    main()

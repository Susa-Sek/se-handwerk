#!/usr/bin/env python3
# Gratis MX-basierte Re-Klassifizierung der 'unknown' Kontakte (Google DoH, DNS-only).
# Funktioniert trotz blocklisteter Maschinen-IP / Port-25-Reputation, die die echte
# SMTP-RCPT-Probe killt (dial [::1]:25 refused / 554 bad reputation).
#   no MX/A   -> invalid  (tote Domain, sicher raus)
#   has MX/A  -> risky    (Domain lebt, Postfach NICHT bestaetigt -> Bounce-Restrisiko)
#   DNS-Fehler-> bleibt unknown
# KEIN Mailbox-Beweis moeglich ohne saubere :25-IP. Default dry-run; --apply schreibt DB.
import json, os, ssl, subprocess, sys, urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(__file__)
MXCACHE = os.path.join(HERE, ".mx-cache.json")
OUT = os.path.join(HERE, "reverify-mx-results.json")
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev", "-tAF", "|"]
APPLY = "--apply" in sys.argv
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

def q(sql):
    return subprocess.run(PG + ["-c", sql], capture_output=True, text=True, encoding="utf-8").stdout

MX = {}
if os.path.exists(MXCACHE):
    try: MX = json.load(open(MXCACHE, encoding="utf-8"))
    except Exception: MX = {}

def mx_ok(domain):
    if not domain: return False
    if domain in MX: return MX[domain]
    try:
        d = json.load(urllib.request.urlopen(f"https://dns.google/resolve?name={domain}&type=MX", timeout=8, context=ctx))
        ok = d.get("Status") == 0 and any(a.get("type") == 15 for a in d.get("Answer", []))
        if not ok:
            d2 = json.load(urllib.request.urlopen(f"https://dns.google/resolve?name={domain}&type=A", timeout=8, context=ctx))
            ok = d2.get("Status") == 0 and any(a.get("type") == 1 for a in d2.get("Answer", []))
        MX[domain] = ok; return ok
    except Exception:
        MX[domain] = None; return None

rows = []
for line in q("SELECT id, lower(email) FROM contacts WHERE verification_status='unknown' AND email LIKE '%@%'").splitlines():
    p = line.split("|")
    if len(p) >= 2 and "@" in p[1]:
        rows.append((p[0], p[1], p[1].split("@")[-1]))
domains = sorted({d for _, _, d in rows})
todo = [d for d in domains if d not in MX]
print(f"unknown leads: {len(rows)} | domains: {len(domains)} | neue MX-checks: {len(todo)}", flush=True)
with ThreadPoolExecutor(max_workers=20) as ex:
    futs = {ex.submit(mx_ok, d): d for d in todo}
    done = 0
    for _ in as_completed(futs):
        done += 1
        if done % 50 == 0: print(f"  MX {done}/{len(todo)}", flush=True)
json.dump(MX, open(MXCACHE, "w", encoding="utf-8"))

res = {}; summ = Counter(); updates = []
for cid, email, dom in rows:
    mx = MX.get(dom)
    st = "risky" if mx is True else ("invalid" if mx is False else "unknown")
    res[cid] = {"email": email, "domain": dom, "mx": mx, "new_status": st}
    summ[st] += 1
    if st != "unknown":
        updates.append((cid, st))
json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print("=== MX-RECLASSIFY (aus 'unknown') ===")
for s, n in summ.most_common(): print(f"  {n:5d} -> {s}")
print(f"-> {OUT}")

if APPLY and updates:
    vals = ",".join(f"('{cid}','{st}')" for cid, st in updates)
    sql = ("UPDATE contacts c SET verification_status=v.st, "
           "verification_reason='mx-only (Domain lebt, Postfach unbestaetigt)', verification_checked_at=now() "
           f"FROM (VALUES {vals}) AS v(id,st) WHERE c.id=v.id::uuid;")
    r = subprocess.run(PG + ["-c", sql], capture_output=True, text=True, encoding="utf-8")
    print("APPLY:", (r.stdout + r.stderr).strip()[:300])
elif not APPLY:
    print("(dry-run; --apply zum Schreiben in die DB)")

#!/usr/bin/env python3
# Wendet die vom lead-verify-icebreaker-Workflow erzeugten Icebreaker an (jsonb-merge auf
# contacts.custom_fields.icebreaker). Nur verifizierte + nicht-leere. Listet unverifizierte
# (tot/unpassend) zum Aussortieren. HTML-Entities werden dekodiert, SQL sauber escaped.
# Nutzung: python apply-icebreakers.py <workflow-output.json> [--apply]
import json, os, sys, html, re, subprocess

args = [a for a in sys.argv[1:] if not a.startswith("--")]
IN = args[0] if args else ""
APPLY = "--apply" in sys.argv
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev"]
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

raw = open(IN, encoding="utf-8").read()
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    m = re.search(r"\{.*\}", raw, re.S)
    data = json.loads(m.group(0))
# Workflow-Output ist gewrappt: eigentliche Rueckgabe unter data['result']
if isinstance(data, dict) and "result" in data and isinstance(data["result"], dict):
    data = data["result"]

res = data.get("results", [])
ok = [r for r in res if r.get("verified") and (r.get("icebreaker") or "").strip() and UUID.match(r.get("id", ""))]
bad = [r for r in res if not (r.get("verified") and (r.get("icebreaker") or "").strip())]
print(f"results: {len(res)} | verifiziert+icebreaker: {len(ok)} | unverifiziert/leer: {len(bad)}")

qa = data.get("qa", {})
if qa:
    print(f"QA: anteil_gut={qa.get('anteil_gut')} | {str(qa.get('urteil',''))[:180]}")
    for p in (qa.get("probleme") or [])[:5]:
        print(f"   - {p}")

print("\n=== Sample Icebreaker (6) ===")
for r in ok[:6]:
    print("  -", html.unescape(r["icebreaker"]).strip()[:120])

def esc(s):
    return html.unescape(s).replace("'", "''").strip()

vals = [f"('{r['id']}','{esc(r['icebreaker'])}')" for r in ok]
sql = ("UPDATE contacts c SET custom_fields = c.custom_fields || jsonb_build_object('icebreaker', v.ib), "
       "updated_at = now() FROM (VALUES\n" + ",\n".join(vals) + "\n) AS v(id, ib) WHERE c.id = v.id::uuid;\n")
sqlfile = os.path.join(os.environ.get("CLAUDE_JOB_DIR", "."), "tmp", "apply-ib.sql")
os.makedirs(os.path.dirname(sqlfile), exist_ok=True)
open(sqlfile, "w", encoding="utf-8").write(sql)
print(f"\nSQL -> {sqlfile} ({len(vals)} updates)")

print(f"\n=== Unverifiziert ({len(bad)}) - Kandidaten zum Aussortieren (erste 20) ===")
for r in bad[:20]:
    print(f"  {r.get('id','')[:8]}  {str(r.get('verdict',''))[:64]}")

if APPLY and vals:
    r = subprocess.run(PG, stdin=open(sqlfile, encoding="utf-8"), capture_output=True, text=True, encoding="utf-8")
    print("\nAPPLY:", (r.stdout + r.stderr).strip()[:200])
elif not APPLY:
    print("\n(dry-run; --apply zum Schreiben)")

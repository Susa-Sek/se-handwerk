#!/usr/bin/env python3
# Ingest lokal-results.csv (gmaps <=50km Heilbronn) -> Email-Filter + dedup vs Warmbly
# + Standort-Verify (<=50km Staedte-Whitelist) + Zielgruppe-Verify (route()->ICP, sonst skip)
# + Segment (seg()) -> Import (quelle='gmaps-lokal-50km') -> Email-Verify -> Status zurueck.
# Idempotent: schon importierte Emails werden uebersprungen. Inkrementell auf wachsender CSV.
# Nutzung: python ingest-lokal.py           (dry-run)
#          python ingest-lokal.py --apply
import csv, re, os, io, sys, json, subprocess, unicodedata, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter

import glob as _glob
SRCS = ["C:/Users/sulie/gmaps-work/lokal-results.csv","C:/Users/sulie/gmaps-work/band-results.csv"] + \
       _glob.glob("C:/Users/sulie/gmaps-work/grid-*.csv")
BASE = "http://localhost:8080/v1"; TF = "C:/Users/sulie/gmaps-work/warmbly-token.json"
PG = ["docker","exec","-i","warmbly-postgres-1","psql","-U","warmbly","-d","warmbly_dev"]
EMAIL = re.compile(r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$")
FREEMAIL = {"gmail.com","googlemail.com","gmx.de","gmx.net","web.de","t-online.de","yahoo.de","yahoo.com","hotmail.de","hotmail.com","outlook.de","outlook.com","aol.com","icloud.com","freenet.de","mail.de"}
BAD_TLD = {"png","jpg","jpeg","gif","svg","webp","css","js","json","ttf","woff","woff2","mp4","pdf"}
try:                                  # Token nur fuer die (tote) API-Verify; Import fuer
    t = json.load(open(TF))           # city_ok/LOCAL50 (z.B. aus enroll-valid-local.py) braucht ihn nicht
except (FileNotFoundError, OSError):
    t = {}

def nw(w):
    w=w.casefold()
    for a,b in (("ä","ae"),("ö","oe"),("ü","ue"),("ß","ss")): w=w.replace(a,b)
    w=unicodedata.normalize("NFKD",w); w="".join(c for c in w if not unicodedata.combining(c))
    return re.sub(r"[^a-z]","",w)

# <=50km Heilbronn: 35km-Kern + 35-50km-Band
LOCAL50_RAW = """Heilbronn Neckarsulm Weinsberg Obersulm Loewenstein Lehrensteinsfeld Ellhofen Eberstadt Erlenbach
Untereisesheim BadFriedrichshall Oedheim Offenau Gundelsheim BadWimpfen BadRappenau Kirchardt Siegelsbach
Nordheim Lauffen Talheim Flein Untergruppenbach Abstatt Ilsfeld Beilstein Brackenheim Cleebronn Gueglingen
Zaberfeld Pfaffenhofen Leingarten Schwaigern Massenbachhausen Neckarwestheim Neudenau Moeckmuehl Roigheim
Widdern Jagsthausen Hardthausen Langenbrettach Oehringen Pfedelbach Zweiflingen Bretzfeld Neuenstein
Waldenburg Kuenzelsau Niedernhall Forchtenberg Wuestenrot Mainhardt Neuenstadt Mosbach Obrigheim Binau
Neckarbischofsheim Waibstadt Sinsheim Hueffenhardt Hassmersheim Eppingen Gemmingen Ittlingen Sulzfeld
Kuernbach Oberderdingen Bretten Besigheim Bietigheim Bissingen Boennigheim Sachsenheim Ingersheim Freiberg
Marbach Steinheim Ludwigsburg KirchheimamNeckar
Stuttgart Fellbach Waiblingen Backnang Kornwestheim Sindelfingen Leonberg Esslingen Pforzheim Muehlacker
Vaihingen Bruchsal Karlsruhe Wiesloch Heidelberg Weinheim SchwaebischHall Gaildorf BadMergentheim Buchen
Osterburken Adelsheim Kraichtal Bretten Sternenfels Kupferzell Ingelfingen Untermuenkheim Spiegelberg
Grosserlach Sulzbach Aspach Weissach Winnenden Schorndorf Kernen Ditzingen Korntal Muenchingen
Mannheim Ludwigshafen Schwetzingen Leimen Eppelheim Nussloch Walldorf Sandhausen Hockenheim Ketsch
Reutlingen Metzingen Nuertingen Filderstadt Ostfildern Neckartenzlingen Boeblingen Renningen Weil der Stadt
Gerlingen Moeglingen Asperg Tamm Freiberg Remseck Marbach Erdmannhausen Affalterbach Oberstenfeld"""
LOCAL50 = {nw(x) for x in LOCAL50_RAW.split()}

def route(cat):
    c=(cat or "").lower()
    # 1) Finanz/Versicherung/Gutachter/Off-Target zuerst RAUS
    if any(x in c for x in ["versicherung","insurance","hypothek","mortgage","finanz","financial","bank",
        "building society","bausparkasse","appraiser","gutachter","sachverst","winery","farm","weingut",
        "business management","notar","notary","lawyer","rechtsanwalt","tax","steuerber"]): return None
    # 2) Architekt (ICP3)
    if any(k in c for k in ["architekt","architect","architecture","bauingenieur","civil engineer",
        "structural engineer","statiker","bauplaner","innenarchitekt","interior design","landschaftsarchitekt"]): return "ICP3"
    # 3) Hausverwaltung (ICP1)
    if any(k in c for k in ["hausverwaltung","immobilienverwaltung","wohnungsverwaltung","property management",
        "property administration","housing society","housing association","apartment rental","real estate rental",
        "letting agent","wohnanlage","wohnungsvermietung","gebäudeverwaltung","gebaeudeverwaltung","verwaltungsservice"]): return "ICP1"
    # 4) Bautraeger / Bau / Facility (ICP4)
    if any(k in c for k in ["bautraeger","bauträger","real estate developer","home builder","construction",
        "general contractor","contractor","builder","wohnungsbau","generalunternehmer","bauunternehmen","bauprojekt",
        "housing development","facility","janitorial","cleaners","cleaning","hausmeister","gebäudeinstandhaltung",
        "gebaeudeinstandhaltung","gebäudereinigung","trockenbau","innenausbau"]): return "ICP4"
    # 5) Makler (ICP2) — breit, kommt zuletzt
    if any(k in c for k in ["makler","real estate agent","real estate agency","real estate consultant",
        "real estate broker","estate agent","commercial real estate","real estate service","immobilienagentur",
        "immobilienvermittlung","immobilienberater","gewerbeimmobilien","immobilieninvest","immobilienvermitt","immobilien"]): return "ICP2"
    return None
def seg(cat):
    c=(cat or "").lower()
    if any(k in c for k in ["architekt","architect","architecture"]): return "Architekt"
    if any(k in c for k in ["property management","property administration","hausverwaltung","immobilienverwaltung","housing","verwaltung","letting","rental"]): return "Hausverwaltung"
    if any(k in c for k in ["developer","builder","construction","contractor","bautrae","bauträ","bauunternehm","wohnungsbau","projekt","facility","janitorial","cleaner","cleaning","hausmeister"]): return "Bautraeger" if "facility" not in c and "janitor" not in c and "clean" not in c and "hausmeister" not in c else "Facility"
    if any(k in c for k in ["makler","real estate","estate agent","immobilien"]): return "Immobilienmakler"
    return "Sonstige-Immobilien"

def dom_of(e): return e.split("@")[-1].lower() if "@" in e else ""
def first_email(cell):
    for raw in re.split(r"[,;\s]+", cell or ""):
        e=raw.strip().strip('"').lower()
        if EMAIL.match(e) and dom_of(e).rsplit(".",1)[-1] not in BAD_TLD and dom_of(e) not in FREEMAIL: return e
    return ""
def city_from(addr, iid):
    m=re.search(r"\b\d{5}\s+([A-Za-zÄÖÜäöüß.\- ]+?)(?:,|$)", addr or "")
    if m: return m.group(1).strip()
    m2=re.search(r" in (.+)$", iid or ""); return m2.group(1).strip() if m2 else ""
def city_ok(city):
    base=nw(re.split(r"[\-/(,]", city or "")[0])
    return base in LOCAL50 or nw(city or "") in LOCAL50

def db(sql):
    return subprocess.run(PG+["-t","-A","-c",sql],capture_output=True,text=True,encoding="utf-8").stdout.strip().splitlines()
def refresh():
    rq=urllib.request.Request(BASE+"/auth/refresh",data=json.dumps({"refresh_token":t["refresh_token"]}).encode(),headers={"Content-Type":"application/json"},method="POST")
    with urllib.request.urlopen(rq,timeout=30) as r: nt=json.loads(r.read().decode())
    t["access_token"]=nt["access_token"]
    if nt.get("refresh_token"): t["refresh_token"]=nt["refresh_token"]
    json.dump(t,open(TF,"w"))
def api(path,method="POST",body=None):
    for a in range(2):
        try:
            h={"Content-Type":"application/json","Authorization":"Bearer "+t["access_token"]}
            req=urllib.request.Request(BASE+path,data=json.dumps(body).encode("utf-8") if body is not None else b"{}",headers=h,method=method)
            with urllib.request.urlopen(req,timeout=60) as r: return r.status,r.read().decode()
        except urllib.error.HTTPError as e:
            if e.code==401 and a==0: refresh(); continue
            return e.code,e.read().decode()
def verify(email):
    try:
        req=urllib.request.Request(BASE+"/emails/verify",data=json.dumps({"email":email}).encode(),headers={"Authorization":"Bearer "+t["access_token"],"Content-Type":"application/json"},method="POST")
        with urllib.request.urlopen(req,timeout=45) as r: return json.loads(r.read().decode())
    except Exception as ex: return {"status":"unknown","reason":str(ex)[:50],"is_catch_all":False}

def main():
    apply="--apply" in sys.argv
    files=[s for s in SRCS if os.path.exists(s)]
    if not files: print("keine results-CSV"); return
    have_e=set(x.lower() for x in db("SELECT lower(email) FROM contacts WHERE email IS NOT NULL"))
    have_d=set(x.lower() for x in db("SELECT DISTINCT lower(split_part(email,'@',2)) FROM contacts WHERE email LIKE '%@%'"))
    rows=[]
    for s in files:
        try: rows.extend(csv.DictReader(open(s,encoding="utf-8")))
        except Exception as ex: print("CSV-Read-Fehler",s,ex)
    seen=set(); leads=[]; drop_email=drop_loc=drop_icp=drop_dup=0
    for r in rows:
        email=first_email(r.get("emails",""))
        if not email: drop_email+=1; continue
        d=dom_of(email)
        if email in have_e or d in have_d or email in seen or d in seen: drop_dup+=1; continue
        city=city_from(r.get("address",""), r.get("input_id",""))
        if not city_ok(city): drop_loc+=1; continue
        icp=route(r.get("category",""))
        if not icp: drop_icp+=1; continue
        seen.add(email); seen.add(d)
        leads.append({"email":email,"company":(r.get("title") or "").strip(),"city":city,
            "website":d,"category":(r.get("category") or "").strip(),"segment":seg(r.get("category","")),"icp":icp})
    print(f"CSV-Zeilen: {len(rows)}")
    print(f"  raus: kein Email {drop_email} | Dup/schon-da {drop_dup} | Standort>50km {drop_loc} | keine Zielgruppe {drop_icp}")
    print(f"  NEUE pipeline-reife Leads (Email+Standort+Zielgruppe): {len(leads)}")
    print("  ICP-Verteilung:", dict(Counter(l["icp"] for l in leads)))
    print("  Top-Staedte:", dict(Counter(l["city"] for l in leads).most_common(10)))
    if not apply: print("\n(dry-run — --apply)"); return
    if not leads: print("nichts Neues."); return
    payload=[{"first_name":"","last_name":"","email":l["email"],"company":l["company"],
        "custom_fields":{"stadt":l["city"],"website":l["website"],"category":l["category"],
                         "segment":l["segment"],"icp":l["icp"],"quelle":"gmaps-lokal-50km"}} for l in leads]
    for i in range(0,len(payload),50):
        st,_=api("/contacts",body=payload[i:i+50])
        if st>=300: print("IMPORT-FEHLER chunk",i)
    print("importiert:",len(payload))
    inl=",".join("'"+p["email"].replace("'","''")+"'" for p in payload)
    rows2=[l.split("\x1f") for l in subprocess.run(PG+["-t","-A","-F","\x1f","-c",f"SELECT id,email FROM contacts WHERE lower(email) IN ({inl})"],capture_output=True,text=True,encoding="utf-8").stdout.splitlines() if "\x1f" in l]
    refresh(); res={}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs={ex.submit(verify,e):(c,e) for c,e in rows2}
        for f in as_completed(futs): c,_=futs[f]; res[c]=f.result()
    print("verify:",dict(Counter(dd.get("status","?") for dd in res.values())))
    buf=io.StringIO(); w=csv.writer(buf,lineterminator="\n")
    for cid,dd in res.items(): w.writerow([cid,dd.get("status","unknown"),(dd.get("reason") or "")[:300],"t" if dd.get("is_catch_all") else "f"])
    sql=("CREATE TEMP TABLE _v(id uuid,status text,reason text,catch bool);\nCOPY _v FROM STDIN WITH (FORMAT csv);\n"+buf.getvalue()+"\\.\nUPDATE contacts c SET verification_status=_v.status,verification_reason=_v.reason,is_catch_all=_v.catch,verification_checked_at=now() FROM _v WHERE c.id=_v.id;\n")
    p=subprocess.run(PG+["-v","ON_ERROR_STOP=1"],input=sql.encode("utf-8"),capture_output=True)
    print("writeback:","OK" if p.returncode==0 else p.stderr.decode('utf-8','replace')[:200])

if __name__=="__main__": main()

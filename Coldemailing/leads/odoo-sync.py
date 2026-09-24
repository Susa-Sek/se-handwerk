#!/usr/bin/env python3
# odoo-sync.py - Einweg-Sync Warmbly (Postgres) -> Odoo CRM (crm.lead via XML-RPC).
# Warmbly bleibt Sende-Engine; Odoo ist Arbeits-CRM. Dieses Skript liest die Warmbly-DB
# STRIKT READ-ONLY (nur SELECTs via docker exec psql) und schreibt idempotent nach Odoo:
#   - eine Opportunity pro Kontakt (Upsert-Schluessel x_warmbly_id = contact-UUID);
#     type='opportunity', weil nur die im Pipeline-Kanban mit Stages sichtbar ist
#   - Stages nur VORWAERTS und nur solange der Nutzer nicht eingegriffen hat (Hands-off-Guard);
#     vom Nutzer wiederhergestellte Lost-Leads werden NICHT erneut archiviert (x_warmbly_lost)
#   - echte Replies als interne Chatter-Notiz (Dedup ueber x_warmbly_reply_keys)
#   - Lost (active=False + lost_reason) fuer invalid/bounced/abgemeldet
# Nutzung: python odoo-sync.py            (Dry-Run: KEINE Schreibzugriffe, zeigt nur Zahlen)
#          python odoo-sync.py --apply    (fuehrt aus, inkl. idempotentem Bootstrap)
# Credentials: leads/odoo-sync.env (ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY)
import subprocess, sys, json, os, html, datetime, xmlrpc.client

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
ORG  = "43938660-3b2e-43bd-af34-70663af28201"
PG   = ["docker","exec","-i","warmbly-postgres-1","psql","-U","warmbly","-d","warmbly_dev","-t","-A"]

APPLY = "--apply" in sys.argv

# ---------------------------------------------------------------- Single-Instance-Lock
# Verhindert Doppel-Lauf (30-Min-Cron + manueller Start) -> doppelte Leads beim Create.
def acquire_lock():
    f = open(os.path.join(HERE, "odoo-sync.lock"), "w")
    try:
        import fcntl  # Linux/macOS
        try:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            sys.exit("odoo-sync laeuft bereits -> Abbruch")
    except ImportError:
        import msvcrt  # Windows
        try:
            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            sys.exit("odoo-sync laeuft bereits -> Abbruch")
    return f  # offen halten; OS gibt Lock bei Prozessende frei

# ---------------------------------------------------------------- Konfiguration
def load_env():
    cfg = {}
    path = os.path.join(HERE, "odoo-sync.env")
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                cfg[k.strip()] = v.strip()
    for k in ("ODOO_URL","ODOO_DB","ODOO_LOGIN","ODOO_API_KEY"):
        if k not in cfg:
            sys.exit(f"FEHLER: {k} fehlt in odoo-sync.env")
    return cfg

# ---------------------------------------------------------------- Warmbly lesen
# Eine Query, JSON-Aggregation statt Pipe-Parsing (Icebreaker/Snippets koennen | und
# Newlines enthalten). Nur SELECTs - niemals Schreibzugriff auf warmbly_dev.
# Suppression: aggressivste Quelle gewinnt (negativ vor Bounce), nicht die aelteste.
# Reply-Snippet: Message-ID-Match zuerst, sonst zeitlich NAECHSTE Mail des Absenders
# (nie die aelteste - sonst bekaeme eine zweite Antwort das Snippet der ersten).
WARMBLY_QUERY = f"""
SELECT COALESCE(json_agg(row_to_json(x)), '[]') FROM (
  SELECT co.id, co.first_name, co.last_name, co.email, co.company, co.phone, co.subscribed,
         co.verification_status,
         co.custom_fields->>'stadt'      AS stadt,
         co.custom_fields->>'website'    AS website,
         co.custom_fields->>'segment'    AS segment,
         co.custom_fields->>'icp'        AS icp,
         co.custom_fields->>'quelle'     AS quelle,
         co.custom_fields->>'icebreaker' AS icebreaker,
         (SELECT COALESCE(string_agg(DISTINCT ca.name, ' + '), '')
            FROM campaign_leads cl JOIN campaigns ca ON ca.id = cl.campaign_id
           WHERE cl.contact_id = co.id)                                            AS campaigns,
         (SELECT count(*) FROM campaign_leads cl WHERE cl.contact_id = co.id)      AS enrolled,
         (SELECT count(*) FROM campaign_contact_progress p
           WHERE p.contact_id = co.id AND p.sent_at IS NOT NULL)                   AS sent_steps,
         (SELECT to_char(max(p.sent_at) AT TIME ZONE 'Europe/Berlin','DD.MM.YYYY HH24:MI')
            FROM campaign_contact_progress p WHERE p.contact_id = co.id)           AS last_sent,
         (SELECT COALESCE(json_agg(json_build_object(
                   'pos',     s.position,
                   'subject', coalesce(nullif(s.subject,''),'(kein Betreff)'),
                   'ts',      to_char(p.sent_at,'YYYY-MM-DD"T"HH24:MI:SS'),
                   'disp',    to_char(p.sent_at AT TIME ZONE 'Europe/Berlin','DD.MM.YYYY')
                 ) ORDER BY p.sent_at), '[]')
            FROM campaign_contact_progress p JOIN sequences s ON s.id = p.sequence_id
           WHERE p.contact_id = co.id AND p.sent_at IS NOT NULL)                   AS sends,
         (SELECT count(*) FROM campaign_contact_progress p
           WHERE p.contact_id = co.id AND p.bounced_at IS NOT NULL)                AS bounced,
         (SELECT sr.source FROM suppressed_recipients sr
           WHERE sr.organization_id = '{ORG}' AND lower(sr.email) = lower(co.email)
           ORDER BY CASE sr.source WHEN 'manual_negative_reply' THEN 0 WHEN 'manual' THEN 1
                                   WHEN 'bounce_sync' THEN 2 WHEN 'bounce' THEN 3 ELSE 4 END
           LIMIT 1)                                                                AS suppressed_source,
         (SELECT COALESCE(json_agg(json_build_object(
                   'key',     p.campaign_id::text || ':' || p.sequence_id::text,
                   'at',      to_char(p.replied_at AT TIME ZONE 'Europe/Berlin','DD.MM.YYYY HH24:MI'),
                   'ts',      to_char(p.replied_at,'YYYY-MM-DD"T"HH24:MI:SS'),
                   'class',   COALESCE(p.reply_class,''),
                   'subject', ue.subject,
                   'snippet', ue.snippet
                 ) ORDER BY p.replied_at), '[]')
            FROM campaign_contact_progress p
            LEFT JOIN LATERAL (
              SELECT u.subject, u.snippet FROM unibox_emails u
              WHERE array_to_string(u.from_addr,';') NOT ILIKE '%mailer-daemon%'
                AND array_to_string(u.from_addr,';') NOT ILIKE '%postmaster%'
                AND ( (p.message_id IS NOT NULL AND p.message_id <> ''
                       AND trim(both '<>' from p.message_id) = ANY(u.in_reply_to))
                      OR array_to_string(u.from_addr,';') ILIKE '%' || co.email || '%' )
              ORDER BY (p.message_id IS NOT NULL AND p.message_id <> ''
                        AND trim(both '<>' from p.message_id) = ANY(u.in_reply_to)) DESC,
                       abs(extract(epoch from (u.internal_date - p.replied_at)))
              LIMIT 1
            ) ue ON true
           WHERE p.contact_id = co.id AND p.replied_at IS NOT NULL)                AS replies
  FROM contacts co
  WHERE co.organization_id = '{ORG}'
) x
"""

def fetch_warmbly():
    p = subprocess.run(PG + ["-c", WARMBLY_QUERY], capture_output=True)
    out = p.stdout.decode("utf-8", "replace").strip()
    if p.returncode != 0 or not out:
        sys.exit(f"FEHLER: Warmbly-Query fehlgeschlagen: {p.stderr.decode('utf-8','replace')[:500]}")
    return json.loads(out)

# ---------------------------------------------------------------- Zielzustand
# Automatische Stages (Sync-owned), Sequenz 1-5; 6-8 sind manuell (Qualifiziert/Angebot/Gewonnen).
AUTO_STAGES = [  # (schluessel, Anzeigename, sequence)
    ("pool",        "Pool (unverifiziert)", 1),
    ("verifiziert", "Verifiziert",          2),
    ("kampagne",    "In Kampagne",          3),
    ("kontaktiert", "Kontaktiert",          4),
    ("geantwortet", "Geantwortet",          5),
]
MANUAL_STAGES = [
    ("qualifiziert", "Qualifiziert", 6),
    ("angebot",      "Angebot",      7),
    ("gewonnen",     "Gewonnen",     8),
]
LOST_REASONS = {
    "negativ": "Abgemeldet / negative Antwort",
    "bounce":  "Hard Bounce",
    "invalid": "E-Mail ungueltig",
}
# Aktivitaetstypen fuer die CRM-Wiedervorlage (name, Default-Frist in Tagen):
#  - "Antworten": wird automatisch beim Reply-Eingang faellig HEUTE gesetzt (To-Do zu antworten)
#  - "Nachfassen": manuell per Klick, wenn nach eigener Antwort keine Reaktion kommt (Default +3 Tage)
ACTIVITY_TYPES = [("Antworten", 0), ("Nachfassen", 3)]
# Manuelle Lead-Klassifizierung (Reiter/Kategorien im CRM). Vom Sync NIE geschrieben -
# reine Handarbeit des Nutzers. Neue Leads defaulten auf "prospect" (ir.default).
KONTAKT_TYP_OPTS = [
    ("prospect",        "Potenzieller Kunde"),
    ("kunde",           "Kunde"),
    ("nachunternehmer", "Nachunternehmer"),
    ("partner",         "Partner"),
    ("sonstig",         "Sonstiger Kontakt"),
]

# reply_class-Werte, die NICHT als echte Antwort zaehlen
NON_REPLIES = {"auto_reply", "out_of_office"}
# suppressed_recipients.source -> Lost-Grund ('manual' = bewusst gesperrt -> wie negativ)
SUPPRESS_LOST = {"manual_negative_reply": "negativ", "manual": "negativ",
                 "bounce_sync": "bounce", "bounce": "bounce"}

def real_replies(c):
    return [r for r in c["replies"] if (r.get("class") or "") not in NON_REPLIES]

def target_state(c):
    """Liefert (stage_key, lost_key|None) aus dem Warmbly-Zustand."""
    lost = None
    classes = {(r.get("class") or "") for r in c["replies"]}
    supp = SUPPRESS_LOST.get(c.get("suppressed_source") or "")
    if supp == "negativ" or classes & {"negative", "unsubscribe"}:
        lost = "negativ"
    elif (c.get("bounced") or 0) > 0 or supp == "bounce":
        lost = "bounce"
    elif c.get("verification_status") == "invalid" or c.get("subscribed") is False:
        lost = "invalid"

    if real_replies(c):
        stage = "geantwortet"
    elif (c.get("sent_steps") or 0) > 0:
        stage = "kontaktiert"
    elif (c.get("enrolled") or 0) > 0:
        stage = "kampagne"
    elif c.get("verification_status") in ("valid", "risky"):
        stage = "verifiziert"
    else:
        stage = "pool"
    return stage, lost

# ---------------------------------------------------------------- Odoo-Client
class Odoo:
    def __init__(self, cfg):
        self.db, self.pw = cfg["ODOO_DB"], cfg["ODOO_API_KEY"]
        common = xmlrpc.client.ServerProxy(cfg["ODOO_URL"] + "/xmlrpc/2/common", allow_none=True)
        self.uid = common.authenticate(self.db, cfg["ODOO_LOGIN"], self.pw, {})
        if not self.uid:
            sys.exit("FEHLER: Odoo-Login fehlgeschlagen (odoo-sync.env pruefen)")
        self.models = xmlrpc.client.ServerProxy(cfg["ODOO_URL"] + "/xmlrpc/2/object", allow_none=True)

    def call(self, model, method, args, kw=None):
        return self.models.execute_kw(self.db, self.uid, self.pw, model, method, args, kw or {})

    def search(self, model, dom, **kw):      return self.call(model, "search", [dom], kw)
    def search_read(self, model, dom, fields, **kw):
        return self.call(model, "search_read", [dom], dict(fields=fields, **kw))
    def create(self, model, vals):           return self.call(model, "create", [vals])
    def write(self, model, ids, vals):       return self.call(model, "write", [ids, vals])

# ---------------------------------------------------------------- Bootstrap
# Idempotent: legt x_-Felder, Stages, Lost-Reasons an, falls sie fehlen - aber NUR mit
# --apply. Im Dry-Run wird ausschliesslich gelesen; Fehlendes bekommt Sentinel-IDs.
# Eigene ir.model.data-XML-IDs (module='warmbly_sync') machen die Stage-Zuordnung
# umbenennungsfest - der Nutzer darf Stages spaeter frei umbenennen.
CUSTOM_FIELDS = [
    ("x_warmbly_id",           "char",    "Warmbly ID",            dict(index=True)),
    ("x_warmbly_stage_id",     "integer", "Warmbly Sync-Stage",    {}),
    ("x_warmbly_lost",         "char",    "Warmbly Lost-Key",      {}),
    ("x_warmbly_email",        "char",    "Warmbly E-Mail",        {}),
    ("x_warmbly_verification", "char",    "Warmbly Verifikation",  {}),
    ("x_warmbly_campaign",     "char",    "Warmbly Kampagne",      {}),
    ("x_warmbly_step",         "char",    "Warmbly Fortschritt",   {}),
    ("x_warmbly_versand",      "text",    "Versand-Verlauf",       {}),
    ("x_warmbly_versand_msg",  "integer", "Versand-Notiz-ID",      {}),
    ("x_warmbly_reply_keys",   "text",    "Warmbly Reply-Keys",    {}),
]
# Odoo-Default-Stages werden beim ersten Lauf adoptiert (umbenannt), nicht geloescht.
DEFAULT_ADOPT = {  # unser Key -> (crm-XML-ID, bekannte Default-Namen en/de)
    "pool":         ("stage_lead1", {"New", "Neu"}),
    "qualifiziert": ("stage_lead2", {"Qualified", "Qualifiziert"}),
    "angebot":      ("stage_lead3", {"Proposition", "Angebot", "Angebotsphase"}),
    "gewonnen":     ("stage_lead4", {"Won", "Gewonnen"}),
}

def xmlid_lookup(o, module, name):
    r = o.search_read("ir.model.data", [("module","=",module),("name","=",name)], ["res_id"], limit=1)
    return r[0]["res_id"] if r else None

def rename_stage(o, sid, label, seq):
    # name ist translate=True -> in beiden Sprachen schreiben, sonst zeigt die
    # deutsche UI weiter den alten uebersetzten Default-Namen (z.B. 'Neu').
    for lang in ("de_DE", "en_US"):
        try:
            o.call("crm.stage", "write", [[sid], {"name": label, "sequence": seq}],
                   {"context": {"lang": lang}})
        except Exception:
            pass

def bootstrap(o):
    """Liefert (stages, reasons, fields_ready). Schreibt nur mit --apply."""
    created, sentinel = [], -1

    # 1) Custom-Felder auf crm.lead
    have = {r["name"] for r in o.search_read("ir.model.fields",
            [("model","=","crm.lead"),("name","like","x_warmbly_%")], ["name"])}
    missing = [f for f in CUSTOM_FIELDS if f[0] not in have]
    if missing and APPLY:
        model_id = o.search("ir.model", [("model","=","crm.lead")])[0]
        for name, ttype, desc, extra in missing:
            vals = {"name":name,"model_id":model_id,"ttype":ttype,"field_description":desc,"state":"manual"}
            vals.update(extra)
            o.create("ir.model.fields", vals)
            created.append(name)
    elif missing:
        created.extend(f[0] + " (wuerde)" for f in missing)
    fields_ready = not missing or APPLY

    # 1b) Manuelles Klassifizierungs-Feld "Kontakt-Typ" (Selection). NICHT x_warmbly_%,
    #     daher eigener Existenz-Check (sonst wuerde die x_warmbly_%-Query es jeden Lauf
    #     neu anlegen wollen). Vom Sync nie geschrieben.
    kt = o.search("ir.model.fields", [("model","=","crm.lead"),("name","=","x_kontakt_typ")])
    if not kt and APPLY:
        crm_model = o.search("ir.model", [("model","=","crm.lead")])[0]
        fid = o.create("ir.model.fields", {"name":"x_kontakt_typ","model_id":crm_model,
                "ttype":"selection","field_description":"Kontakt-Typ","state":"manual"})
        for i, (val, lab) in enumerate(KONTAKT_TYP_OPTS):
            o.create("ir.model.fields.selection",
                     {"field_id":fid,"value":val,"name":lab,"sequence":i*10})
        try:                                 # neue Leads defaulten auf "Potenzieller Kunde"
            o.call("ir.default", "set", ["crm.lead", "x_kontakt_typ", "prospect"])
        except Exception:
            pass
        created.append("x_kontakt_typ")
    elif not kt:
        created.append("x_kontakt_typ (wuerde)")

    # 1c) Reiter: searchPanel-Kategorie (klickbare Tabs mit Zaehlern) auf der Opportunity-
    #     Suche + kompaktes Feld im Formular zum Setzen. Beide per NAME-Guard idempotent
    #     (nicht nur xmlid - eine fehlgeschlagene xmlid-Registrierung war die Ursache der
    #     8 duplizierten Form-Views/Mobil-Garble).
    if APPLY:
        sbase = xmlid_lookup(o, "crm", "view_crm_case_opportunities_filter")
        if sbase and not o.search("ir.ui.view",
                [("model","=","crm.lead"),("name","=","crm.lead Kontakt-Typ Reiter (Warmbly)")]):
            arch = ("<data><xpath expr=\"//search\" position=\"inside\">"
                    "<searchpanel><field name=\"x_kontakt_typ\" string=\"Kontakt-Typ\" "
                    "select=\"one\" enable_counters=\"1\"/></searchpanel></xpath></data>")
            try:
                o.create("ir.ui.view", {"name":"crm.lead Kontakt-Typ Reiter (Warmbly)",
                        "model":"crm.lead","inherit_id":sbase,"arch":arch})
                created.append("searchpanel-typ")
            except Exception as ex:
                print("SearchPanel nicht angelegt:", str(ex)[:120])
        fbase = xmlid_lookup(o, "crm", "crm_lead_view_form")
        if fbase and not o.search("ir.ui.view",
                [("model","=","crm.lead"),("name","=","crm.lead Kontakt-Typ Feld (Warmbly)")]):
            farch = ("<data><xpath expr=\"//field[@name='email_from']\" position=\"after\">"
                     "<field name=\"x_kontakt_typ\"/></xpath></data>")
            try:
                o.create("ir.ui.view", {"name":"crm.lead Kontakt-Typ Feld (Warmbly)",
                        "model":"crm.lead","inherit_id":fbase,"arch":farch})
                created.append("form-feld-typ")
            except Exception as ex:
                print("Form-Feld nicht angelegt:", str(ex)[:120])

    # 2) Stages (adoptieren oder anlegen), registriert unter warmbly_sync.stage_<key>
    stages = {}
    for key, label, seq in AUTO_STAGES + MANUAL_STAGES:
        sid = xmlid_lookup(o, "warmbly_sync", "stage_" + key)
        if not sid:
            if not APPLY:
                stages[key] = sentinel; sentinel -= 1
                created.append("stage:" + key + " (wuerde)")
                continue
            adopt = DEFAULT_ADOPT.get(key)
            if adopt:
                rid = xmlid_lookup(o, "crm", adopt[0])
                if rid:
                    cur = o.search_read("crm.stage", [("id","=",rid)], ["name"], limit=1)
                    if cur and cur[0]["name"] in adopt[1]:
                        sid = rid
            if not sid:
                match = o.search("crm.stage", [("name","=",label)], limit=1)
                sid = match[0] if match else o.create("crm.stage",
                        {"name":label,"sequence":seq,"is_won":key=="gewonnen"})
            rename_stage(o, sid, label, seq)
            o.create("ir.model.data", {"module":"warmbly_sync","name":"stage_"+key,
                                       "model":"crm.stage","res_id":sid,"noupdate":True})
            created.append("stage:" + key)
        stages[key] = sid

    # 3) Lost-Reasons
    reasons = {}
    for key, label in LOST_REASONS.items():
        r = o.search("crm.lost.reason", [("name","=",label)], limit=1)
        if r:
            reasons[key] = r[0]
        elif APPLY:
            reasons[key] = o.create("crm.lost.reason", {"name": label})
            created.append("lost:" + key)
        else:
            reasons[key] = sentinel; sentinel -= 1
            created.append("lost:" + key + " (wuerde)")

    # 4) Admin auf Deutsch/Berlin (best effort - de_DE ist beim DB-Init geladen)
    if APPLY:
        try:
            o.write("res.users", [o.uid], {"lang":"de_DE","tz":"Europe/Berlin"})
        except Exception:
            pass

    # (Kein Formularfeld mehr: der Verlauf steht als Chatter-Notiz im Protokoll — das
    #  Textfeld im Formular rendert auf Mobil ueberlappend/unleserlich.)
    return stages, reasons, fields_ready, created

def ensure_tags(o, names):
    """crm.tag je Name; legt nur mit --apply an, Dry-Run bekommt Sentinels."""
    existing = {t["name"]: t["id"] for t in o.search_read("crm.tag", [], ["name"])}
    out, sentinel = {}, -1000
    for n in sorted(n for n in names if n):
        if n in existing:
            out[n] = existing[n]
        elif APPLY:
            out[n] = existing[n] = o.create("crm.tag", {"name": n})
        else:
            out[n] = sentinel; sentinel -= 1
    return out

def ensure_activity_types(o):
    """mail.activity.type 'Antworten'/'Nachfassen'; legt Fehlende nur mit --apply an."""
    existing = {t["name"]: t["id"] for t in o.search_read("mail.activity.type", [], ["name"])}
    out = {}
    for name, delay in ACTIVITY_TYPES:
        if name in existing:
            out[name] = existing[name]
        elif APPLY:
            out[name] = o.create("mail.activity.type",
                {"name": name, "delay_count": delay, "delay_unit": "days", "category": "default"})
        else:
            out[name] = None
    return out

# ---------------------------------------------------------------- Lead-Aufbau
def lead_title(c):
    base = (c.get("company") or "").strip() \
        or ((c.get("first_name") or "") + " " + (c.get("last_name") or "")).strip() \
        or c.get("email") or "Unbekannt"
    stadt = (c.get("stadt") or "").strip()
    return f"{base} – {stadt}" if stadt else base

def lead_description(c):
    parts = []
    if c.get("icebreaker"): parts.append("Icebreaker: " + c["icebreaker"])
    if c.get("segment"):    parts.append("Segment: " + c["segment"])
    if c.get("quelle"):     parts.append("Quelle: " + c["quelle"])
    return "<br/>".join(html.escape(p) for p in parts) or False

def step_info(c):
    if not c.get("sent_steps"): return ""
    s = f"{c['sent_steps']}/5"
    if c.get("last_sent"): s += " · zuletzt " + c["last_sent"]
    return s

def timeline_lines(c):
    """Chronologische Kommunikations-Zeilen: gesendete Mails + echte Antworten, nach Zeitstempel."""
    items = []
    for s in c.get("sends") or []:
        items.append((s.get("ts") or "", "send", s))
    for r in real_replies(c):
        items.append((r.get("ts") or "", "reply", r))
    items.sort(key=lambda x: x[0])
    out = []
    for _ts, kind, it in items:
        if kind == "send":
            out.append(f"Mail {it.get('pos')} «{it.get('subject') or '(kein Betreff)'}» — {it.get('disp','')}")
        else:
            subj = it.get("subject") or ""
            out.append(f"Antwort erhalten — {it.get('at','')}" + (f" (Betreff: {subj})" if subj else ""))
    return out

def mirror_vals(c):
    return {
        "x_warmbly_verification": c.get("verification_status") or "",
        "x_warmbly_campaign":     c.get("campaigns") or "",
        "x_warmbly_step":         step_info(c),
        "x_warmbly_versand":      " | ".join(timeline_lines(c)),
    }

def versand_body(c):
    """HTML-Protokoll-Notiz: chronologischer Kommunikations-Verlauf (Mails + Antworten)."""
    lines = timeline_lines(c)
    if not lines:
        return ""
    return "<p><b>Kommunikations-Verlauf</b><br/>" + "<br/>".join(html.escape(l) for l in lines) + "</p>"

def contact_vals(c, tags, owner_uid=None):
    tag_ids = [tags[n] for n in (c.get("icp"), c.get("segment")) if n and n in tags]
    v = {
        "name":            lead_title(c),
        # 'opportunity': nur die erscheint im Pipeline-Kanban mit Stages
        # (das Leads-Feature ist in frischem Community aus, type='lead' waere unsichtbar)
        "type":            "opportunity",
        "partner_name":    c.get("company") or False,
        "contact_name":    ((c.get("first_name") or "") + " " + (c.get("last_name") or "")).strip() or False,
        "email_from":      c.get("email") or False,
        "phone":           c.get("phone") or False,
        "city":            c.get("stadt") or False,
        "website":         c.get("website") or False,
        "description":     lead_description(c),
        "tag_ids":         [(6, 0, tag_ids)],
        "x_warmbly_id":    c["id"],
        "x_warmbly_email": c.get("email") or "",
    }
    if owner_uid:
        v["user_id"] = owner_uid   # Lead-Eigentuemer = menschlicher Bearbeiter (nicht der Sync-Account)
    v.update(mirror_vals(c))
    return v

def reply_body(r):
    head = f"Antwort erhalten ({r.get('at') or '?'}"
    if r.get("class") and r["class"] not in ("", "unknown"):
        head += ", " + r["class"]
    head += ")"
    body = f"<p><b>{html.escape(head)}</b></p>"
    if r.get("subject"): body += f"<p>Betreff: {html.escape(r['subject'])}</p>"
    if r.get("snippet"): body += f"<p>{html.escape(r['snippet'])}</p>"
    return body

def post_note(o, lead_id, body):
    # body_is_html=True: seit Odoo 16 escaped message_post str-Bodies; ueber XML-RPC
    # ist kein Markup-Objekt moeglich, ohne das Flag kaeme literales HTML im Chatter an.
    o.call("crm.lead", "message_post", [[lead_id]],
           {"body": body, "message_type": "comment",
            "subtype_xmlid": "mail.mt_note", "body_is_html": True})

# ---------------------------------------------------------------- Sync
def main():
    lock = acquire_lock()  # noqa: F841 - offen halten bis Prozessende
    cfg = load_env()
    contacts = fetch_warmbly()
    print(f"Warmbly: {len(contacts)} Kontakte (Org-gefiltert)")

    o = Odoo(cfg)
    stages, reasons, fields_ready, boot_created = bootstrap(o)
    if boot_created:
        print(("Bootstrap angelegt: " if APPLY else "Bootstrap wuerde anlegen: ") + ", ".join(boot_created))
    auto_ids = {stages[k] for k, _, _ in AUTO_STAGES}
    seq_of   = {stages[k]: seq for k, _, seq in AUTO_STAGES}

    tags = ensure_tags(o, {c.get("icp") for c in contacts} | {c.get("segment") for c in contacts})

    # Optionaler Lead-Eigentuemer: neue Leads gehoeren dem menschlichen Bearbeiter,
    # nicht dem Sync-Account (dann in dessen "Meine Pipeline" sichtbar).
    owner_uid = None
    owner_login = cfg.get("ODOO_OWNER_LOGIN")
    if owner_login:
        r = o.search("res.users", [("login","=",owner_login)])
        owner_uid = r[0] if r else None
        if not owner_uid:
            print(f"WARN: ODOO_OWNER_LOGIN '{owner_login}' nicht gefunden -> Leads gehoeren Sync-Account")

    # Aktivitaetstypen fuer die Wiedervorlage; "Antworten"-To-Do wird bei neuem Reply faellig.
    act_types = ensure_activity_types(o)
    answer_type = act_types.get("Antworten")
    lead_model_id = (o.search("ir.model", [("model","=","crm.lead")]) or [None])[0]
    TODAY = datetime.date.today().isoformat()

    # Ohne x_-Felder (frisches Odoo im Dry-Run) gibt es auch keine synchronisierten Leads.
    leads = []
    if fields_ready:
        leads = o.search_read("crm.lead",
            ["&", ("x_warmbly_id","!=",False), "|", ("active","=",True), ("active","=",False)],
            ["x_warmbly_id","stage_id","active","email_from",
             "x_warmbly_stage_id","x_warmbly_lost","x_warmbly_email","x_warmbly_reply_keys",
             "x_warmbly_verification","x_warmbly_campaign","x_warmbly_step",
             "x_warmbly_versand","x_warmbly_versand_msg","x_kontakt_typ"])
    by_wid = {l["x_warmbly_id"]: l for l in leads}
    print(f"Odoo: {len(leads)} bestehende Warmbly-Leads")

    creates, stage_moves, lost_sets, chatter, mirror_updates = [], [], [], [], []
    versand_notes = []   # (lead_id, alte_msg_id|0, html_body) - eine Verlaufs-Notiz je Lead
    handsoff = 0

    for c in contacts:
        stage_key, lost_key = target_state(c)
        tgt_stage = stages[stage_key]
        lead = by_wid.get(c["id"])

        if lead is None:
            v = contact_vals(c, tags, owner_uid)
            v["stage_id"] = tgt_stage
            v["x_warmbly_stage_id"] = tgt_stage
            creates.append((c, v, lost_key, real_replies(c)))
            continue

        # Spiegelfelder (immer erlaubt, ueberschreiben nie Handarbeit)
        mv = mirror_vals(c)
        diff = {k: val for k, val in mv.items() if (lead.get(k) or "") != val}
        # E-Mail-Korrekturen aus Warmbly (apply-verify FIX) nachziehen - aber nur,
        # wenn der Nutzer email_from in Odoo nicht selbst geaendert hat.
        wb_email = c.get("email") or ""
        old_mirror = lead.get("x_warmbly_email") or ""
        if wb_email and wb_email != old_mirror:
            diff["x_warmbly_email"] = wb_email
            if (lead.get("email_from") or "") in ("", old_mirror):
                diff["email_from"] = wb_email
        # Kontakt-Typ-Automatik: wer in Warmbly antwortet, wird "Potenzieller Kunde" -
        # aber nur wenn noch KEIN Typ gesetzt ist. Manuelle Einstufungen (kunde/
        # nachunternehmer/partner/sonstig) bleiben unberuehrt; kalte Leads ruehrt der
        # Sync nicht an (die behalten ihren prospect-Default).
        if real_replies(c) and not lead.get("x_kontakt_typ"):
            diff["x_kontakt_typ"] = "prospect"
        if diff:
            mirror_updates.append((lead["id"], diff))

        # Kommunikations-Verlauf-Notiz: wenn Verlauf geaendert (Send ODER Antwort) ODER Notiz fehlt.
        if timeline_lines(c) and ("x_warmbly_versand" in diff or not (lead.get("x_warmbly_versand_msg") or 0)):
            versand_notes.append((lead["id"], lead.get("x_warmbly_versand_msg") or 0, versand_body(c)))

        # Neue Replies -> Chatter (immer erlaubt, auch bei lost/handsoff).
        # wants_answer: aktiver, nicht verlorener Lead -> "Antworten"-To-Do faellig.
        seen = set((lead.get("x_warmbly_reply_keys") or "").split(","))
        new_replies = [r for r in real_replies(c) if r["key"] not in seen]
        if new_replies:
            wants_answer = bool(lead["active"]) and not lost_key
            chatter.append((lead["id"], new_replies, (lead.get("x_warmbly_reply_keys") or ""), wants_answer))

        # Hands-off-Guard
        cur_stage = lead["stage_id"][0] if lead["stage_id"] else None
        if lead["active"] is False:
            continue                                   # lost -> Stage nie anfassen
        if lost_key and (lead.get("x_warmbly_lost") or "") == lost_key:
            handsoff += 1; continue                    # Nutzer hat Lost-Lead wiederhergestellt
        if cur_stage not in auto_ids:
            handsoff += 1; continue                    # manuell in Pipeline gezogen
        if lead.get("x_warmbly_stage_id") and cur_stage != lead["x_warmbly_stage_id"]:
            handsoff += 1; continue                    # manuell verschoben

        if lost_key:
            lost_sets.append((lead["id"], lost_key))
        elif seq_of[tgt_stage] > seq_of.get(cur_stage, 0):
            stage_moves.append((lead["id"], tgt_stage))

    n_lost = len(lost_sets) + sum(1 for _, _, lk, _ in creates if lk)
    n_chat = sum(len(r) for _, r, _, _ in chatter) + sum(len(r) for _, _, _, r in creates)
    # "Antworten"-To-Dos: aktive, nicht verlorene Leads mit neuem Reply (bestehend + neu angelegt)
    n_todo = sum(1 for *_, w in chatter if w) + sum(1 for _, _, lk, r in creates if r and not lk)
    print(f"\n{'APPLY' if APPLY else 'DRY-RUN'}:")
    print(f"  Anlegen:        {len(creates)}")
    print(f"  Stage-Moves:    {len(stage_moves)}")
    print(f"  Lost setzen:    {n_lost}")
    n_versand = len(versand_notes) + sum(1 for cc, _v, _lk, _r in creates if timeline_lines(cc))
    print(f"  Chatter-Posts:  {n_chat}")
    print(f"  Antworten-ToDo: {n_todo}")
    print(f"  Versand-Notiz:  {n_versand}")
    print(f"  Spiegel-Update: {len(mirror_updates)}")
    print(f"  Hands-off:      {handsoff}")

    if not APPLY:
        print("\n(Dry-Run - nichts geschrieben. Mit --apply ausfuehren.)")
        return

    # --- Creates in Batches a 200 (Multi-Create). Reply-Keys werden NICHT im Create
    # gesetzt, sondern erst nach erfolgreichem Chatter-Post (Crash-sicher: lieber ein
    # doppelter Post nach Absturz als ein fuer immer verlorener). ---
    for i in range(0, len(creates), 200):
        batch = creates[i:i+200]
        ids = o.create("crm.lead", [v for _, v, _, _ in batch])
        for (c, _v, lost_key, replies), lid in zip(batch, ids):
            if lost_key: lost_sets.append((lid, lost_key))
            if replies:  chatter.append((lid, replies, "", not lost_key))
            if timeline_lines(c):
                versand_notes.append((lid, 0, versand_body(c)))
        print(f"  angelegt: {min(i+200, len(creates))}/{len(creates)}")

    # --- Stage-Moves, gruppiert nach Zielstage ---
    by_tgt = {}
    for lid, s in stage_moves: by_tgt.setdefault(s, []).append(lid)
    for s, ids in by_tgt.items():
        o.write("crm.lead", ids, {"stage_id": s, "x_warmbly_stage_id": s})

    # --- Spiegelfelder, gruppiert nach identischem Diff ---
    by_vals = {}
    for lid, diff in mirror_updates:
        by_vals.setdefault(tuple(sorted(diff.items())), []).append(lid)
    for key, ids in by_vals.items():
        o.write("crm.lead", ids, dict(key))

    # --- Lost setzen: active=False + lost_reason_id ist die kanonische Lost-Darstellung
    # (crm.lead.action_set_lost scheitert ueber XML-RPC am Marshalling seines None-Returns;
    # der write-Weg ist verifiziert und findbar unter dem Standard-'Verloren'-Filter).
    # x_warmbly_lost im selben Schreibvorgang -> Restore-Guard. Gruppiert nach Grund. ---
    by_reason = {}
    for lid, lkey in lost_sets: by_reason.setdefault(lkey, []).append(lid)
    for lkey, ids in by_reason.items():
        o.write("crm.lead", ids, {"active": False, "lost_reason_id": reasons[lkey],
                                  "x_warmbly_lost": lkey, "probability": 0})

    # --- Chatter-Posts + "Antworten"-To-Do; Reply-Keys erst NACH Post fortschreiben ---
    n_todo_created = 0
    for lid, replies, oldkeys, wants_answer in chatter:
        for r in replies:
            post_note(o, lid, reply_body(r))
        # To-Do "Antworten" faellig heute, zugewiesen an den Bearbeiter. Dedup: nur, wenn
        # nicht schon eine offene "Antworten"-Aktivitaet dranhaengt (idempotent bei Re-Runs).
        if wants_answer and answer_type and lead_model_id:
            offen = o.search("mail.activity", [("res_model","=","crm.lead"),
                             ("res_id","=",lid), ("activity_type_id","=",answer_type)])
            if not offen:
                o.create("mail.activity", {
                    "res_model_id": lead_model_id, "res_id": lid,
                    "activity_type_id": answer_type, "summary": "Antworten (Prospect hat geantwortet)",
                    "date_deadline": TODAY, "user_id": owner_uid or o.uid})
                n_todo_created += 1
        allkeys = [k for k in oldkeys.split(",") if k] + [r["key"] for r in replies]
        o.write("crm.lead", [lid], {"x_warmbly_reply_keys": ",".join(allkeys)})
    if n_todo_created:
        print(f"  Antworten-ToDo angelegt: {n_todo_created}")

    # --- Versand-Verlauf-Notiz je Lead: bestehende in-place updaten, sonst posten + Merker ---
    n_vn = 0
    for lid, msg_id, body in versand_notes:
        if not body:
            continue
        try:
            if msg_id:
                try:
                    o.write("mail.message", [msg_id], {"body": body}); n_vn += 1; continue
                except Exception:
                    msg_id = 0   # Notiz weg -> neu posten
            posted = o.call("crm.lead", "message_post", [[lid]],
                            {"body": body, "message_type": "comment",
                             "subtype_xmlid": "mail.mt_note", "body_is_html": True})
            mid = posted[0] if isinstance(posted, (list, tuple)) else posted
            o.write("crm.lead", [lid], {"x_warmbly_versand_msg": mid})
            n_vn += 1
        except Exception as ex:
            print(f"  WARN Versand-Notiz Lead {lid}: {str(ex)[:80]}")
    if n_vn:
        print(f"  Versand-Notizen gesetzt: {n_vn}")

    print("\nFertig.")

if __name__ == "__main__":
    main()

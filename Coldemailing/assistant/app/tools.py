"""Tool-Schemas + Dispatch. READ = sofort ausfuehren, WRITE = nur nach Telegram-Bestaetigung.
Warmbly ist IMMER read-only; nur Odoo wird (nach Bestaetigung) geaendert."""
import json
from . import warmbly_client as W

# --------- Schemas (an Claude uebergeben) ---------
READ_TOOLS = [
    {"name": "warmbly_campaign_status",
     "description": "Cold-Email-Kampagnen-Stand aus Warmbly (Leads/Gesendet/Antworten/Bounces/naechster Send). "
                    "Nutze das bei Fragen wie 'Stand ICP1?', 'wie laeuft die Akquise?'.",
     "input_schema": {"type": "object", "properties": {
         "name_filter": {"type": "string", "description": "optionaler Kampagnen-Namensfilter, z.B. ICP1"}}}},
    {"name": "warmbly_recent_replies",
     "description": "Letzte Prospect-Antworten (Firma, E-Mail, Zeit). Fuer 'wer hat geantwortet?'.",
     "input_schema": {"type": "object", "properties": {"limit": {"type": "integer"}}}},
    {"name": "odoo_find_leads",
     "description": "Leads im CRM suchen (nach Firma/Name/E-Mail). Liefert id, Stage, Kampagne, Schritt. "
                    "Nutze das, um die lead_id fuer eine Firma zu finden bevor du Notizen/Nachfass setzt.",
     "input_schema": {"type": "object", "properties": {
         "query": {"type": "string"}, "email": {"type": "string"}}}},
    {"name": "odoo_lead_detail",
     "description": "Details zu einem Lead: Stage, offene Aufgaben, Beschreibung.",
     "input_schema": {"type": "object", "properties": {"lead_id": {"type": "integer"}},
                      "required": ["lead_id"]}},
    {"name": "odoo_list_activities",
     "description": "Offene To-Dos des Nutzers. Nutze type='Antworten' fuer 'was muss ich beantworten?', "
                    "overdue_only=true fuer 'was ist ueberfaellig?'.",
     "input_schema": {"type": "object", "properties": {
         "type": {"type": "string"}, "overdue_only": {"type": "boolean"}}}},
    {"name": "odoo_list_tasks",
     "description": "Aufgaben-/Auftrags-Karten aus den Boards. project='Auftraege' oder 'Aufgaben'. "
                    "Fuer 'wie viele offene Auftraege?'.",
     "input_schema": {"type": "object", "properties": {
         "project": {"type": "string"}, "open_only": {"type": "boolean"}}}},
]
WRITE_TOOLS = [
    {"name": "odoo_post_note",
     "description": "Interne Notiz in den Chatter eines Leads schreiben (z.B. Telefonat-Ergebnis). "
                    "Braucht lead_id (vorher mit odoo_find_leads holen).",
     "input_schema": {"type": "object", "properties": {
         "lead_id": {"type": "integer"}, "text": {"type": "string"}},
         "required": ["lead_id", "text"]}},
    {"name": "odoo_create_nachfass",
     "description": "Nachfass-Erinnerung (Aktivitaet) fuer einen Lead in X Tagen anlegen.",
     "input_schema": {"type": "object", "properties": {
         "lead_id": {"type": "integer"}, "days": {"type": "integer"},
         "summary": {"type": "string"}}, "required": ["lead_id"]}},
    {"name": "odoo_complete_antworten",
     "description": "Offenes 'Antworten'-To-Do eines Leads als erledigt markieren (wenn du geantwortet hast).",
     "input_schema": {"type": "object", "properties": {"lead_id": {"type": "integer"}},
                      "required": ["lead_id"]}},
    {"name": "odoo_move_stage",
     "description": "Lead in eine andere Pipeline-Stufe schieben (z.B. 'Qualifiziert', 'Angebot', 'Gewonnen').",
     "input_schema": {"type": "object", "properties": {
         "lead_id": {"type": "integer"}, "stage_name": {"type": "string"}},
         "required": ["lead_id", "stage_name"]}},
]
ALL_TOOLS = READ_TOOLS + WRITE_TOOLS
_WRITE_NAMES = {t["name"] for t in WRITE_TOOLS}

def _summary(name, inp):
    lid = inp.get("lead_id", "?")
    if name == "odoo_post_note":
        return f"Notiz an Lead {lid}: {inp.get('text','')[:80]}"
    if name == "odoo_create_nachfass":
        return f"Nachfassen fuer Lead {lid} in {inp.get('days',3)} Tagen"
    if name == "odoo_complete_antworten":
        return f"'Antworten'-To-Do von Lead {lid} als erledigt markieren"
    if name == "odoo_move_stage":
        return f"Lead {lid} -> Stufe '{inp.get('stage_name','')}'"
    return f"{name} {inp}"

def dispatch(name, inp, od, pending):
    """READ -> Ergebnis-String. WRITE -> registriert Pending (pending['token']=...) und liefert Hinweis."""
    try:
        if name in _WRITE_NAMES:
            pending["name"] = name
            pending["input"] = inp
            pending["summary"] = _summary(name, inp)
            return ("Bestaetigung beim Nutzer angefragt: " + pending["summary"] +
                    ". Fuehre KEINE weiteren Aenderungen aus. Beende mit einer kurzen Rueckfrage auf Deutsch.")
        # ---- READ ----
        if name == "warmbly_campaign_status":
            return json.dumps(W.campaign_status(inp.get("name_filter", "")), ensure_ascii=False)
        if name == "warmbly_recent_replies":
            return json.dumps(W.recent_replies(int(inp.get("limit", 8))), ensure_ascii=False)
        if name == "odoo_find_leads":
            return json.dumps(od.find_leads(inp.get("query", ""), inp.get("email", "")), ensure_ascii=False, default=str)
        if name == "odoo_lead_detail":
            return json.dumps(od.lead_detail(int(inp["lead_id"])), ensure_ascii=False, default=str)
        if name == "odoo_list_activities":
            return json.dumps(od.list_activities(inp.get("type", ""), bool(inp.get("overdue_only", False))),
                              ensure_ascii=False, default=str)
        if name == "odoo_list_tasks":
            return json.dumps(od.list_tasks(inp.get("project", ""), bool(inp.get("open_only", True))),
                              ensure_ascii=False, default=str)
        return f"Unbekanntes Tool: {name}"
    except Exception as e:
        return f"FEHLER in {name}: {e}"

def execute_write(name, inp, od):
    """Fuehrt eine bestaetigte WRITE-Aktion aus, liefert Klartext-Ergebnis."""
    if name == "odoo_post_note":
        od.post_note(int(inp["lead_id"]), inp["text"])
        return "Notiz gespeichert."
    if name == "odoo_create_nachfass":
        r = od.create_nachfass(int(inp["lead_id"]), int(inp.get("days", 3)), inp.get("summary", "Nachfassen"))
        return "Nachfass-Erinnerung angelegt." if r != "schon vorhanden" else "Nachfass war schon gesetzt."
    if name == "odoo_complete_antworten":
        n = od.complete_open_activities(int(inp["lead_id"]), "Antworten")
        return f"{n} 'Antworten'-To-Do(s) erledigt."
    if name == "odoo_move_stage":
        ok = od.move_stage(int(inp["lead_id"]), inp["stage_name"])
        return "Stufe geaendert." if ok else "Stufe nicht gefunden."
    return "Unbekannte Aktion."

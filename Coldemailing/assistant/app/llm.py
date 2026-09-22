"""Anthropic-Tool-Use-Loop. READ-Tools laufen automatisch, WRITE-Tools registrieren eine
Bestaetigung. Per-Chat-Historie, Prompt-Caching auf System-Prompt + Tool-Schemas."""
import anthropic
from . import config, tools

SYSTEM = (
    "Du bist der persoenliche Assistent von SE Handwerk, einem Ein-Personen-Handwerksbetrieb in Heilbronn. "
    "Antworte kurz und praezise auf Deutsch, wie ein zupackender Kollege. "
    "Du bist verbunden mit dem Warmbly-Cold-Email-System (Kampagnen-Status, read-only) und dem Odoo-CRM "
    "(Leads, Aufgaben, Boards - lesen und, nach Bestaetigung, pflegen). "
    "Nutze Tools, wenn eine Frage aktuelle Daten braucht - rate keine Zahlen. "
    "Fuer Aenderungen im CRM (Notiz, Nachfassen, Stage, To-Do erledigen) brauchst du zuerst die lead_id "
    "(per odoo_find_leads) und dann rufst du das passende WRITE-Tool auf - der Nutzer bestaetigt es per Knopf. "
    "Formatiere Antworten fuers Handy: knappe Zeilen, keine Tabellen, Euro/Datum menschlich."
)

_client = None
def client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=config.require("ANTHROPIC_API_KEY"))
    return _client

# Per-Chat-Historie (nur User/Assistant-Turns, begrenzt)
_history = {}
MAX_TURNS = 20

def reset(chat_id):
    _history.pop(chat_id, None)

def _system_blocks():
    return [{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}]

def _tool_schemas():
    schemas = [dict(t) for t in tools.ALL_TOOLS]
    if schemas:  # Cache-Breakpoint auf letztem Tool -> tools+system werden gecached
        schemas[-1] = dict(schemas[-1], cache_control={"type": "ephemeral"})
    return schemas

def process(chat_id, user_text, od):
    """Liefert (antwort_text, pending_dict|None). pending_dict = {name, input, summary} fuer WRITE."""
    msgs = _history.get(chat_id, [])
    msgs = msgs[-2 * MAX_TURNS:] + [{"role": "user", "content": user_text}]
    pending = {}
    model = config.ANTHROPIC_MODEL
    for _ in range(8):  # max. 8 Tool-Runden
        resp = client().messages.create(
            model=model, max_tokens=2048,
            thinking={"type": "disabled"},
            system=_system_blocks(), tools=_tool_schemas(), messages=msgs)
        if resp.stop_reason != "tool_use":
            break
        msgs.append({"role": "assistant", "content": resp.content})
        results = []
        for block in resp.content:
            if block.type == "tool_use":
                out = tools.dispatch(block.name, block.input, od, pending)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})
        msgs.append({"role": "user", "content": results})
        if pending:  # WRITE angefragt -> noch eine Runde fuer die Rueckfrage-Antwort, dann stop
            resp = client().messages.create(
                model=model, max_tokens=512, thinking={"type": "disabled"},
                system=_system_blocks(), tools=_tool_schemas(), messages=msgs)
            break
    text = "".join(b.text for b in resp.content if b.type == "text").strip() or "Ok."
    # Historie: nur den finalen Text als Assistant-Turn behalten (kompakt)
    hist = _history.get(chat_id, [])
    hist = hist[-2 * MAX_TURNS:] + [
        {"role": "user", "content": user_text},
        {"role": "assistant", "content": text},
    ]
    _history[chat_id] = hist
    return text, (pending or None)

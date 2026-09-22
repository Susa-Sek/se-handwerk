"""Sent-Ordner-Watcher: erkennt, dass DU einem Lead per kontakt@ geantwortet hast, und fragt
per Telegram, ob Notiz/Nachfass gesetzt werden soll. Deterministisch, kein LLM. State in state/."""
import json, os
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from . import config, mail_client, confirm

CURSOR = os.path.join(config.STATE_DIR, "sent-cursor.json")

def _load():
    try:
        with open(CURSOR, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"uidvalidity": 0, "last_uid": 0, "seen_ids": []}

def _save(st):
    with open(CURSOR, "w", encoding="utf-8") as f:
        json.dump(st, f)

async def run(context):
    """JobQueue-Callback. context.application.bot_data['odoo'] = Odoo-Instanz."""
    app = context.application
    od = app.bot_data.get("odoo")
    if od is None:
        return
    try:
        folder, uidval, msgs = await _to_thread(mail_client.scan_sent, _load()["last_uid"])
    except Exception as e:
        print("sent-watch fehler:", e, flush=True)
        return
    st = _load()
    if uidval and st.get("uidvalidity") != uidval:
        # Ordner-UIDs zuruckgesetzt -> Baseline neu
        st = {"uidvalidity": uidval, "last_uid": 0, "seen_ids": []}
    if not msgs:
        return
    baseline = (st.get("last_uid", 0) == 0 and not st.get("seen_ids"))
    max_uid = st.get("last_uid", 0)
    seen = set(st.get("seen_ids", []))
    for m in msgs:
        max_uid = max(max_uid, m["uid"])
        if m["message_id"] in seen:
            continue
        seen.add(m["message_id"])
        if baseline:
            continue  # erster Lauf: nur Cursor setzen, keine Historien-Flut
        lead = _match_lead(od, m["to"])
        if lead:
            await _ask(app, lead, m)
    st.update(uidvalidity=uidval, last_uid=max_uid, seen_ids=list(seen)[-500:])
    _save(st)

def _match_lead(od, recipients):
    for addr in recipients:
        rows = od.find_leads(email=addr, limit=1)
        if rows:
            return {"id": rows[0]["id"], "name": rows[0]["name"], "email": addr}
    return None

async def _ask(app, lead, msg):
    t_note = confirm.register(config.ALLOWED_CHAT_ID, "odoo_post_note",
        {"lead_id": lead["id"], "text": f"Eigene Antwort an {lead['email']} gesendet "
         f"(Betreff: {msg['subject']}, {msg['date']})."}, "Notiz setzen")
    t_both = confirm.register(config.ALLOWED_CHAT_ID, "note_and_nachfass",
        {"lead_id": lead["id"], "text": f"Eigene Antwort an {lead['email']} gesendet "
         f"(Betreff: {msg['subject']}).", "days": 3}, "Notiz + Nachfassen 3T")
    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("Chatter-Notiz", callback_data=f"ok:{t_note}"),
        InlineKeyboardButton("Notiz + Nachfassen 3T", callback_data=f"ok:{t_both}"),
        InlineKeyboardButton("Nichts", callback_data="no:x"),
    ]])
    await app.bot.send_message(
        config.ALLOWED_CHAT_ID,
        f"Du hast {lead['name']} geantwortet — Betreff \"{msg['subject']}\".\n"
        f"Soll ich das im Lead vermerken?", reply_markup=kb)

async def _to_thread(fn, *a):
    import asyncio
    return await asyncio.to_thread(fn, *a)

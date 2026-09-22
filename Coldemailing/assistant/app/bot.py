"""Telegram-Bot (Long-Polling). Entrypoint des Assistenten.
Sicherheit: harte chat_id-Allowlist auf Messages UND Callbacks."""
import asyncio, logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters)
from . import config, llm, tools, confirm, watchers
from .odoo_client import Odoo

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("assistant")

def _allowed(update: Update) -> bool:
    chat = update.effective_chat
    ok = chat is not None and chat.id == config.ALLOWED_CHAT_ID
    if not ok and chat is not None:
        log.warning("Fremde chat_id ignoriert: %s", chat.id)
    return ok

def get_odoo(app):
    od = app.bot_data.get("odoo")
    if od is None:
        od = Odoo()
        app.bot_data["odoo"] = od
    return od

def _reconnect_odoo(app):
    try:
        app.bot_data["odoo"] = Odoo()
    except Exception as e:
        log.error("Odoo-Reconnect fehlgeschlagen: %s", e)
    return app.bot_data.get("odoo")

async def cmd_start(update, context):
    if not _allowed(update):
        return
    await update.message.reply_text(
        "Servus. Frag mich z.B. 'Stand ICP1?', 'was muss ich beantworten?', "
        "'wie viele offene Auftraege?' oder 'setz Nachfass fuer Menda'. /reset leert den Kontext.")

async def cmd_reset(update, context):
    if not _allowed(update):
        return
    llm.reset(update.effective_chat.id)
    await update.message.reply_text("Kontext geleert.")

async def on_message(update, context):
    if not _allowed(update) or not update.message or not update.message.text:
        return
    chat_id = update.effective_chat.id
    await context.bot.send_chat_action(chat_id, "typing")
    od = get_odoo(context.application)
    try:
        text, pending = await asyncio.to_thread(llm.process, chat_id, update.message.text, od)
    except Exception as e:
        log.exception("LLM/Tool-Fehler")
        _reconnect_odoo(context.application)
        await update.message.reply_text(f"Fehler: {e}")
        return
    if pending:
        token = confirm.register(chat_id, pending["name"], pending["input"], pending["summary"])
        kb = InlineKeyboardMarkup([[
            InlineKeyboardButton("Ja", callback_data=f"ok:{token}"),
            InlineKeyboardButton("Nein", callback_data="no:x")]])
        await update.message.reply_text(text, reply_markup=kb)
    else:
        await update.message.reply_text(text)

async def on_callback(update, context):
    q = update.callback_query
    if not _allowed(update):
        await q.answer("nicht erlaubt")
        return
    await q.answer()
    data = q.data or ""
    if data.startswith("no:"):
        await q.edit_message_text((q.message.text or "") + "\n\n➜ Abgebrochen.")
        return
    if data.startswith("ok:"):
        entry = confirm.pop(data[3:])
        if not entry:
            await q.edit_message_text((q.message.text or "") + "\n\n➜ (abgelaufen)")
            return
        od = get_odoo(context.application)
        try:
            result = await asyncio.to_thread(_execute, entry, od)
        except Exception as e:
            _reconnect_odoo(context.application)
            await q.edit_message_text((q.message.text or "") + f"\n\n➜ Fehler: {e}")
            return
        await q.edit_message_text((q.message.text or "") + f"\n\n➜ {result}")

def _execute(entry, od):
    name, inp = entry["name"], entry["input"]
    if name == "note_and_nachfass":  # Watcher-Kombi: Notiz + Nachfassen + Antworten-ToDo schliessen
        od.post_note(int(inp["lead_id"]), inp["text"])
        od.create_nachfass(int(inp["lead_id"]), int(inp.get("days", 3)), "Nachfassen")
        od.complete_open_activities(int(inp["lead_id"]), "Antworten")
        return "Notiz + Nachfassen gesetzt, To-Do geschlossen."
    if name == "odoo_post_note":  # aus Watcher: auch Antworten-ToDo schliessen
        res = tools.execute_write(name, inp, od)
        od.complete_open_activities(int(inp["lead_id"]), "Antworten")
        return res
    return tools.execute_write(name, inp, od)

def main():
    app = Application.builder().token(config.require("TELEGRAM_BOT_TOKEN")).build()
    try:
        get_odoo(app)
    except Exception as e:
        log.warning("Odoo beim Start nicht erreichbar (wird spaeter erneut versucht): %s", e)
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_message))
    app.add_handler(CallbackQueryHandler(on_callback))
    mins = int(config.get("SENT_WATCH_MINUTES", "5"))
    if config.get("KONTAKT_IMAP_PASSWORD"):
        app.job_queue.run_repeating(watchers.run, interval=mins * 60, first=30)
        log.info("Sent-Watcher aktiv (alle %s Min).", mins)
    else:
        log.info("KONTAKT_IMAP_PASSWORD fehlt -> Sent-Watcher aus.")
    log.info("Assistent laeuft (Long-Polling).")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()

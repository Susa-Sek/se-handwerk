"""Pending-Aktionen fuer Bestaetigungs-Buttons. callback_data ist nur der Token (<64 Byte)."""
import secrets

_PENDING = {}  # token -> dict(name, input, summary, chat_id)

def register(chat_id, name, inp, summary):
    token = secrets.token_urlsafe(8)
    _PENDING[token] = {"chat_id": chat_id, "name": name, "input": inp, "summary": summary}
    return token

def pop(token):
    return _PENDING.pop(token, None)

"""Laedt .env (falls vorhanden) + Prozess-Umgebung. Keine externen Deps."""
import os

def _load_env_file(path: str) -> None:
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip()
            # Prozess-Env hat Vorrang (docker-compose environment ueberschreibt .env-Datei)
            os.environ.setdefault(k, v)

# .env liegt neben app/ (ein Verzeichnis hoeher)
_load_env_file(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

def get(key: str, default: str = "") -> str:
    return os.environ.get(key, default)

def require(key: str) -> str:
    v = os.environ.get(key)
    if not v:
        raise RuntimeError(f"Pflicht-Konfig {key} fehlt (assistant/.env pruefen)")
    return v

# Haeufig gebrauchte Werte
ANTHROPIC_MODEL = get("ANTHROPIC_MODEL", "claude-sonnet-5")
ALLOWED_CHAT_ID = int(get("ALLOWED_CHAT_ID", "0") or "0")
ODOO_OWNER_LOGIN = get("ODOO_OWNER_LOGIN", "kontakt@sehandwerk.de")
WARMBLY_ORG = get("WARMBLY_ORG", "43938660-3b2e-43bd-af34-70663af28201")
STATE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "state")
os.makedirs(STATE_DIR, exist_ok=True)

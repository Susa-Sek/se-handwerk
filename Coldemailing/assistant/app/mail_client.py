"""IMAP: liest den GESENDET-Ordner von kontakt@ (fuer 'du hast geantwortet'-Erkennung).
Parst pro Mail Empfaenger/Betreff/Datum/Message-ID. Kein Schreibzugriff."""
import imaplib, email, ssl
from email.header import decode_header, make_header
from email.utils import getaddresses
from . import config

SENT_CANDIDATES = ["Sent", "INBOX.Sent", "Gesendet", "Sent Items", "INBOX.Sent Items"]

def _hdr(v):
    try:
        return str(make_header(decode_header(v or "")))
    except Exception:
        return v or ""

def _login():
    host = config.require("KONTAKT_IMAP_HOST")
    port = int(config.get("KONTAKT_IMAP_PORT", "993"))
    user = config.require("KONTAKT_IMAP_USER")
    pw = config.require("KONTAKT_IMAP_PASSWORD")
    M = imaplib.IMAP4_SSL(host, port, ssl_context=ssl.create_default_context())
    M.login(user, pw)
    return M

def _pick_sent(M):
    # Bevorzugt den \Sent-SPECIAL-USE-Ordner, sonst bekannte Namen.
    try:
        typ, data = M.list()
        if typ == "OK":
            for raw in data:
                s = raw.decode("utf-8", "replace")
                if "\\Sent" in s:
                    name = s.split(' "')[-1].strip().strip('"')
                    if name:
                        return name
    except Exception:
        pass
    for cand in SENT_CANDIDATES:
        try:
            typ, _ = M.select(f'"{cand}"', readonly=True)
            if typ == "OK":
                return cand
        except Exception:
            continue
    return None

def scan_sent(min_uid=0, max_items=50):
    """Liefert (folder, uidvalidity, [msgs]) mit UID > min_uid. msg = dict(uid,to,subject,date,message_id)."""
    M = _login()
    try:
        folder = _pick_sent(M)
        if not folder:
            return (None, 0, [])
        typ, _ = M.select(f'"{folder}"', readonly=True)
        if typ != "OK":
            return (folder, 0, [])
        uidval = 0
        try:
            typ, resp = M.status(f'"{folder}"', "(UIDVALIDITY)")
            if typ == "OK" and resp:
                s = resp[0].decode("utf-8", "replace")
                uidval = int(s.split("UIDVALIDITY")[1].strip(" ()").split()[0])
        except Exception:
            pass
        typ, data = M.uid("search", None, f"UID {min_uid+1}:*")
        uids = data[0].split() if (typ == "OK" and data and data[0]) else []
        out = []
        for u in uids[-max_items:]:
            uid = int(u)
            if uid <= min_uid:
                continue
            typ, md = M.uid("fetch", u, "(BODY.PEEK[HEADER.FIELDS (TO CC SUBJECT DATE MESSAGE-ID)])")
            if typ != "OK" or not md or not md[0]:
                continue
            msg = email.message_from_bytes(md[0][1])
            recips = [a.lower() for _, a in getaddresses(
                [msg.get("To", ""), msg.get("Cc", "")]) if a]
            out.append(dict(uid=uid, to=recips, subject=_hdr(msg.get("Subject")),
                            date=_hdr(msg.get("Date")),
                            message_id=(msg.get("Message-ID") or "").strip()))
        return (folder, uidval, out)
    finally:
        try:
            M.logout()
        except Exception:
            pass

"""SMTP-Client zum Senden von E-Mails."""

import os
import smtplib
from email.mime.text import MIMEText

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.outreach.smtp")


class SMTPClient:
    """Sendet E-Mails via SMTP STARTTLS."""

    def __init__(self, config: dict):
        ec = config.get("email", {})
        self._host = ec.get("smtp_host", "")
        self._port = ec.get("smtp_port", 587)
        self._absender = ec.get("absender", "")
        self._absender_name = ec.get("absender_name", "SE Handwerk")
        self._passwort = os.getenv("EMAIL_PASSWORT", "")

    def senden(self, empfaenger: str, betreff: str, text: str) -> bool:
        """Sendet eine E-Mail. Gibt True bei Erfolg zurück."""
        if not self._host or not self._absender or not self._passwort:
            logger.warning("SMTP nicht konfiguriert (host/absender/passwort fehlt)")
            return False

        msg = MIMEText(text, "plain", "utf-8")
        msg["From"] = f"{self._absender_name} <{self._absender}>"
        msg["To"] = empfaenger
        msg["Subject"] = betreff
        msg["Reply-To"] = self._absender

        try:
            with smtplib.SMTP(self._host, self._port, timeout=15) as s:
                s.starttls()
                s.login(self._absender, self._passwort)
                s.sendmail(self._absender, [empfaenger], msg.as_string())
            logger.info(f"E-Mail gesendet an: {empfaenger} | Betreff: {betreff[:60]}")
            return True
        except Exception as e:
            logger.error(f"SMTP-Fehler beim Senden an {empfaenger}: {e}")
            return False

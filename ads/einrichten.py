#!/usr/bin/env python3
"""Fragt die Google-Ads-Zugangsdaten ab und legt daraus ads/.env an.

    python ads/einrichten.py

Die geheimen Werte werden verdeckt eingegeben — sie erscheinen weder auf dem
Bildschirm noch im Verlauf des Terminals. Die erzeugte Datei ads/.env ist über
.gitignore vom Repository ausgeschlossen und verlässt deinen Rechner nicht.
"""

from __future__ import annotations

import re
import sys
from getpass import getpass
from pathlib import Path

ENV_DATEI = Path(__file__).parent / ".env"


class Feld:
    def __init__(
        self, name, frage, hinweis, geheim, pruefung=None, warnung=None, optional=False
    ):
        self.name = name
        self.frage = frage
        self.hinweis = hinweis
        self.geheim = geheim
        self.pruefung = pruefung
        self.warnung = warnung
        self.optional = optional


FELDER = [
    Feld(
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "Developer-Token",
        "aus dem API-Center des Manager-Kontos (Schritt 2)",
        geheim=True,
        pruefung=lambda w: len(w) >= 15,
        warnung="Ein Developer-Token ist normalerweise 22 Zeichen lang.",
    ),
    Feld(
        "GOOGLE_ADS_CLIENT_ID",
        "Client-ID",
        "aus der Cloud Console (Schritt 4)",
        geheim=False,
        pruefung=lambda w: w.endswith(".apps.googleusercontent.com"),
        warnung="Eine Client-ID endet normalerweise auf '.apps.googleusercontent.com'.",
    ),
    Feld(
        "GOOGLE_ADS_CLIENT_SECRET",
        "Client-Schlüssel",
        "aus der Cloud Console (Schritt 4)",
        geheim=True,
        pruefung=lambda w: len(w) >= 10,
        warnung="Der Client-Schlüssel beginnt meist mit 'GOCSPX-'.",
    ),
    Feld(
        "GOOGLE_ADS_REFRESH_TOKEN",
        "Refresh-Token",
        "aus dem OAuth Playground (Schritt 5)",
        geheim=True,
        pruefung=lambda w: w.startswith("1//"),
        warnung="Ein Refresh-Token beginnt normalerweise mit '1//'.",
    ),
    Feld(
        "GOOGLE_ADS_CUSTOMER_ID",
        "Kundennummer des Werbekontos",
        "z.B. 905-610-9793",
        geheim=False,
        pruefung=lambda w: len(re.sub(r"\D", "", w)) == 10,
        warnung="Eine Kundennummer hat 10 Ziffern (Format XXX-XXX-XXXX).",
    ),
    Feld(
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
        "Kundennummer des Manager-Kontos",
        "das Konto mit dem Zusatz '(Verwaltung)' — leer lassen, falls keins",
        geheim=False,
        pruefung=lambda w: w == "" or len(re.sub(r"\D", "", w)) == 10,
        warnung="Eine Kundennummer hat 10 Ziffern (Format XXX-XXX-XXXX).",
        optional=True,
    ),
]


def env_lesen() -> dict[str, str]:
    """Liest eine vorhandene .env, damit einzelne Werte änderbar bleiben."""
    if not ENV_DATEI.exists():
        return {}
    werte: dict[str, str] = {}
    for zeile in ENV_DATEI.read_text(encoding="utf-8").splitlines():
        zeile = zeile.strip()
        if zeile and not zeile.startswith("#") and "=" in zeile:
            name, _, wert = zeile.partition("=")
            werte[name.strip()] = wert.strip()
    return werte


def vorschau(feld: Feld, wert: str) -> str:
    """Geheime Werte nur angedeutet zeigen, unkritische vollständig."""
    if not feld.geheim:
        return wert
    return f"{wert[:3]}… ({len(wert)} Zeichen)"


def abfragen(feld: Feld, aktuell: str = "") -> str:
    """Fragt einen Wert ab und lässt bei auffälligem Format nachbessern.

    Gibt es bereits einen Wert, behält eine leere Eingabe ihn bei.
    """
    while True:
        print(f"\n{feld.frage}")
        print(f"  ({feld.hinweis})")
        if aktuell:
            print(f"  aktuell: {vorschau(feld, aktuell)}")
            print("  Enter = beibehalten" + ("  ·  '-' = leeren" if feld.optional else ""))

        wert = (getpass("  > ") if feld.geheim else input("  > ")).strip()

        if not wert and aktuell:
            print("  → unverändert")
            return aktuell

        if wert == "-" and feld.optional:
            print("  → geleert")
            return ""

        if feld.geheim and wert:
            print("  [verdeckt eingegeben]")

        if not wert and not feld.optional:
            print("  Das Feld darf nicht leer bleiben.")
            continue

        if feld.pruefung and not feld.pruefung(wert):
            print(f"  Hinweis: {feld.warnung}")
            if input("  Trotzdem so übernehmen? [j/N] ").strip().lower() != "j":
                continue

        return wert


def main() -> int:
    print("=" * 68)
    print("Google-Ads-Zugangsdaten einrichten")
    print("=" * 68)
    print(
        "\nSechs Werte aus der Einrichtungs-Anleitung. Die geheimen werden\n"
        "verdeckt eingegeben und landen nur in ads/.env auf diesem Rechner."
    )

    vorhanden = env_lesen()
    if vorhanden:
        print(
            f"\nBestehende Werte in {ENV_DATEI.name} gefunden.\n"
            "Mit Enter behältst du einen Wert — so lässt sich auch nur eine\n"
            "einzelne Kundennummer ändern, ohne alles neu zu tippen."
        )

    try:
        werte = {
            feld.name: abfragen(feld, vorhanden.get(feld.name, "")) for feld in FELDER
        }
    except (KeyboardInterrupt, EOFError):
        print("\n\nAbgebrochen, nichts gespeichert.")
        return 1

    werbe = re.sub(r"\D", "", werte.get("GOOGLE_ADS_CUSTOMER_ID", ""))
    manager = re.sub(r"\D", "", werte.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", ""))
    if werbe and werbe == manager:
        print(
            "\nWarnung: Werbekonto und Manager-Konto sind dieselbe Nummer.\n"
            "In einem Manager-Konto lassen sich keine Kampagnen anlegen —\n"
            "ins Werbekonto-Feld gehört das Konto, in dem die Anzeigen laufen."
        )
        if input("Trotzdem speichern? [j/N] ").strip().lower() != "j":
            print("Abgebrochen, nichts gespeichert.")
            return 1

    zeilen = [
        "# Von ads/einrichten.py erzeugt. Enthaelt Zugangsdaten:",
        "# nicht weitergeben, nicht ins Repository aufnehmen.",
        "# (ads/.env ist bereits ueber .gitignore ausgeschlossen.)",
    ]
    zeilen += [f"{name}={wert}" for name, wert in werte.items() if wert]

    ENV_DATEI.write_text("\n".join(zeilen) + "\n", encoding="utf-8")

    # Auf Linux/macOS die Datei nur für den eigenen Nutzer lesbar machen.
    # Unter Windows greift das Rechtemodell anders, dort ist es wirkungslos.
    try:
        ENV_DATEI.chmod(0o600)
    except OSError:
        pass

    print(f"\n{'=' * 68}")
    print(f"Gespeichert: {ENV_DATEI}")
    print("=" * 68)
    print(
        "\nWeiter geht es so:\n\n"
        "  1. python ads/kampagne_erstellen.py\n"
        "     Google prüft die komplette Kampagne, legt aber nichts an.\n\n"
        "  2. python ads/kampagne_erstellen.py --live\n"
        "     Legt die Kampagne an — pausiert, sie gibt nichts aus.\n"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

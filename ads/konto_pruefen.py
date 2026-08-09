#!/usr/bin/env python3
"""Zeigt, welche Google-Ads-Konten deine Zugangsdaten erreichen.

    python ads/konto_pruefen.py

Beantwortet zwei Fragen, bevor irgendetwas angelegt wird:

  1. Funktionieren die Zugangsdaten überhaupt?
  2. Welche Kundennummer gehört ins Werbekonto-Feld und welche ins Manager-Feld?

Reines Lesen — dieses Skript ändert nichts.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from kampagne_erstellen import client_aufbauen, env_datei_laden, nur_ziffern

KONTO_FELDER = (
    "customer.id",
    "customer.descriptive_name",
    "customer.manager",
    "customer.test_account",
    "customer.currency_code",
    "customer.time_zone",
    "customer.status",
)


def meldungen(fehler) -> list[str]:
    """Holt die lesbaren Fehlertexte aus einer GoogleAdsException."""
    failure = getattr(fehler, "failure", None)
    if failure is not None:
        return [e.message for e in failure.errors] or [str(fehler)]
    return [str(fehler).split("\n")[0]]


def deutung(texte: list[str]) -> str | None:
    """Übersetzt die häufigsten Ursachen in Klartext."""
    zusammen = " ".join(texte).lower()
    if "test account" in zusammen and "developer token" in zusammen:
        return (
            "Der Developer-Token darf bisher nur Testkonten ansprechen.\n"
            "      Für echte Konten muss 'Basic access' beantragt werden."
        )
    if "developer token" in zusammen and (
        "not approved" in zusammen or "pending" in zusammen
    ):
        return "Der Developer-Token ist noch nicht freigegeben."
    if "not yet enabled" in zusammen or "customer_not_enabled" in zusammen:
        return (
            "Das Konto ist noch nicht aktiv — meist fehlt die Einrichtung\n"
            "      oder die Zahlungsmethode."
        )
    if "permission" in zusammen or "not allowed" in zusammen:
        return "Dieser Zugang hat keine Berechtigung für dieses Konto."
    return None


def konto_abfragen(client, kunden_id: str):
    """Liest die Stammdaten eines Kontos.

    Gibt (konto, fehlertexte) zurück. Ist konto None, erklären die Fehlertexte,
    warum — 'nicht lesbar' ist ausdrücklich nicht dasselbe wie 'existiert nicht'.
    """
    dienst = client.get_service("GoogleAdsService")
    abfrage = f"SELECT {', '.join(KONTO_FELDER)} FROM customer LIMIT 1"
    try:
        for zeile in dienst.search(customer_id=kunden_id, query=abfrage):
            return zeile.customer, []
    except Exception as fehler:  # noqa: BLE001 - Diagnose, jede Ursache ist relevant
        texte = meldungen(fehler)
        for text in texte:
            print(f"    kein Zugriff: {text}")
        erklaerung = deutung(texte)
        if erklaerung:
            print(f"      → {erklaerung}")
        return None, texte
    return None, []


def kinder_abfragen(client, manager_id: str):
    """Listet die Konten unterhalb eines Manager-Kontos."""
    dienst = client.get_service("GoogleAdsService")
    abfrage = """
        SELECT customer_client.id, customer_client.descriptive_name,
               customer_client.manager, customer_client.level,
               customer_client.currency_code, customer_client.status
        FROM customer_client
        WHERE customer_client.level <= 1
    """
    try:
        return [z.customer_client for z in dienst.search(customer_id=manager_id, query=abfrage)]
    except Exception as fehler:  # noqa: BLE001
        kurz = str(fehler).split("\n")[0][:140]
        print(f"    Unterkonten nicht lesbar: {kurz}")
        return []


def formatiert(kunden_id: int | str) -> str:
    ziffern = nur_ziffern(kunden_id)
    if len(ziffern) == 10:
        return f"{ziffern[:3]}-{ziffern[3:6]}-{ziffern[6:]}"
    return str(kunden_id)


def main() -> int:
    env_datei_laden()
    client = client_aufbauen()

    gesetzt_werbe = nur_ziffern(os.environ.get("GOOGLE_ADS_CUSTOMER_ID", ""))
    gesetzt_manager = nur_ziffern(os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", ""))

    print("=" * 68)
    print("Erreichbare Google-Ads-Konten")
    print("=" * 68)

    dienst = client.get_service("CustomerService")
    try:
        erreichbar = dienst.list_accessible_customers().resource_names
    except Exception as fehler:  # noqa: BLE001
        print(f"\nDie Kontoliste konnte nicht geladen werden:\n  {fehler}")
        return 1

    if not erreichbar:
        print("\nDieser Zugang sieht kein einziges Konto.")
        return 1

    werbekonten: list[tuple[str, str]] = []
    managerkonten: list[tuple[str, str]] = []
    gesperrt: list[str] = []
    alle_fehler: list[str] = []

    for ressource in erreichbar:
        kid = ressource.split("/")[-1]
        print(f"\n  {formatiert(kid)}")

        konto, fehlertexte = konto_abfragen(client, kid)
        if konto is None:
            gesperrt.append(kid)
            alle_fehler.extend(fehlertexte)
            continue

        art = "Manager-Konto" if konto.manager else "Werbekonto"
        name = konto.descriptive_name or "(ohne Namen)"
        print(f"    {art} — {name}")
        print(
            f"    Währung {konto.currency_code} · Zeitzone {konto.time_zone} "
            f"· Status {konto.status.name}"
        )
        if konto.test_account:
            print("    Achtung: Testkonto, hier laufen keine echten Anzeigen.")

        (managerkonten if konto.manager else werbekonten).append((kid, name))

        if konto.manager:
            kinder = [k for k in kinder_abfragen(client, kid) if not k.manager]
            if kinder:
                print("    Darunter:")
                for kind in kinder:
                    kname = kind.descriptive_name or "(ohne Namen)"
                    print(
                        f"      {formatiert(kind.id)} — {kname} "
                        f"({kind.currency_code}, {kind.status.name})"
                    )
                    if not any(k == str(kind.id) for k, _ in werbekonten):
                        werbekonten.append((str(kind.id), kname))
            else:
                print("    Darunter: noch kein Werbekonto verknüpft.")

    # ---------------------------------------------------------------- Fazit
    print("\n" + "=" * 68)
    print("Was das für deine Einstellungen bedeutet")
    print("=" * 68)

    # Konnte kein einziges Konto gelesen werden, liegt es am Zugang selbst —
    # dann sind Aussagen über vorhandene Konten wertlos.
    if gesperrt and not werbekonten and not managerkonten:
        print(
            f"\n  Keines der {len(gesperrt)} sichtbaren Konten ist lesbar.\n"
            "  Das heißt nicht, dass keine Konten da sind — der Zugang greift nicht."
        )
        erklaerung = deutung(alle_fehler)
        if erklaerung:
            print(f"\n  Ursache:\n      {erklaerung}")
        print(
            "\n  Solange das nicht behoben ist, lässt sich nicht feststellen,\n"
            "  welche Nummer in welches Feld gehört.\n"
        )
        return 1

    if gesetzt_werbe and gesetzt_werbe == gesetzt_manager:
        print(
            "\n  Werbekonto und Manager-Konto sind aktuell dieselbe Nummer\n"
            f"  ({formatiert(gesetzt_werbe)}). Das ist fast immer falsch:\n"
            "  In einem Manager-Konto lassen sich keine Kampagnen anlegen."
        )

    if werbekonten:
        print("\n  GOOGLE_ADS_CUSTOMER_ID (hier entsteht die Kampagne):")
        for kid, name in werbekonten:
            marke = "  ← aktuell eingetragen" if kid == gesetzt_werbe else ""
            print(f"    {formatiert(kid)} — {name}{marke}")
    else:
        print(
            "\n  Es ist kein Werbekonto erreichbar, nur Manager-Konten.\n"
            "  Verknüpfe das Konto 'SE Handwerk' unter deinem Manager-Konto\n"
            "  (Konten → Verwaltung → + → Vorhandenes Konto verknüpfen) und\n"
            "  nimm die Einladung im Werbekonto an."
        )

    if managerkonten:
        print("\n  GOOGLE_ADS_LOGIN_CUSTOMER_ID (nur der Zugangsweg):")
        for kid, name in managerkonten:
            marke = "  ← aktuell eingetragen" if kid == gesetzt_manager else ""
            print(f"    {formatiert(kid)} — {name}{marke}")
    else:
        print("\n  Kein Manager-Konto erreichbar — GOOGLE_ADS_LOGIN_CUSTOMER_ID leer lassen.")

    print(
        "\n  Zum Ändern: python ads/einrichten.py erneut ausführen\n"
        "  oder die Werte direkt in ads/.env anpassen.\n"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

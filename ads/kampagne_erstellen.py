#!/usr/bin/env python3
"""Legt die Google-Ads-Testkampagne für sehandwerk.de aus kampagne.yaml an.

Die Kampagne wird immer PAUSIERT erstellt — sie gibt erst Geld aus, wenn sie
bewusst in der Google-Ads-Oberfläche aktiviert wird.

Drei Betriebsarten:

    python kampagne_erstellen.py --check      nur lokale Prüfung (ohne Zugangsdaten)
    python kampagne_erstellen.py              Standard: Google validiert, legt nichts an
    python kampagne_erstellen.py --live       legt die Kampagne wirklich an

Zugangsdaten kommen ausschließlich aus Umgebungsvariablen (siehe README.md),
niemals aus dieser Datei.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import yaml

# Grenzwerte von Google für Responsive Search Ads.
MAX_UEBERSCHRIFT = 30
MAX_BESCHREIBUNG = 90
MIN_UEBERSCHRIFTEN, MAX_UEBERSCHRIFTEN = 3, 15
MIN_BESCHREIBUNGEN, MAX_BESCHREIBUNGEN = 2, 4

# Platzhalter-IDs innerhalb einer atomaren Anfrage. Google löst negative IDs
# innerhalb desselben Requests auf, dadurch können wir Budget, Kampagne,
# Anzeigengruppen und Anzeigen in einem Rutsch anlegen (alles oder nichts).
TEMP_BUDGET = -1
TEMP_KAMPAGNE = -2
TEMP_ANZEIGENGRUPPE_START = -100

CONFIG_ENV = (
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
)


def euro_zu_micros(betrag: float) -> int:
    """Google rechnet intern in Millionstel der Währungseinheit."""
    return int(round(betrag * 1_000_000))


def nur_ziffern(kundennummer: str) -> str:
    """'123-456-7890' -> '1234567890'."""
    return "".join(z for z in str(kundennummer) if z.isdigit())


# ---------------------------------------------------------------------------
# Lokale Prüfung — läuft ohne Zugangsdaten und ohne Netzwerk
# ---------------------------------------------------------------------------

def konfiguration_pruefen(cfg: dict[str, Any]) -> list[str]:
    """Prüft die YAML gegen Googles Formatregeln. Gibt Fehlermeldungen zurück."""
    fehler: list[str] = []

    kampagne = cfg.get("kampagne") or {}
    if not kampagne.get("name"):
        fehler.append("kampagne.name fehlt.")
    if not kampagne.get("ziel_url"):
        fehler.append("kampagne.ziel_url fehlt.")

    budget = kampagne.get("tagesbudget_euro")
    if not isinstance(budget, (int, float)) or budget <= 0:
        fehler.append("kampagne.tagesbudget_euro muss eine Zahl größer 0 sein.")

    strategie = kampagne.get("gebotsstrategie")
    if strategie not in ("max_clicks", "manual_cpc"):
        fehler.append("kampagne.gebotsstrategie muss 'max_clicks' oder 'manual_cpc' sein.")

    zeitplan = kampagne.get("zeitplan") or {}
    von, bis = zeitplan.get("von_stunde"), zeitplan.get("bis_stunde")
    if not isinstance(von, int) or not isinstance(bis, int) or not 0 <= von < bis <= 24:
        fehler.append("kampagne.zeitplan: von_stunde muss kleiner als bis_stunde sein (0-24).")

    gruppen = cfg.get("anzeigengruppen") or []
    if not gruppen:
        fehler.append("Es ist keine Anzeigengruppe definiert.")

    for gruppe in gruppen:
        name = gruppe.get("name", "<ohne Namen>")

        if not gruppe.get("keywords"):
            fehler.append(f"Anzeigengruppe '{name}': keine Keywords definiert.")

        anzeige = gruppe.get("anzeige") or {}
        ueberschriften = anzeige.get("ueberschriften") or []
        beschreibungen = anzeige.get("beschreibungen") or []

        if not MIN_UEBERSCHRIFTEN <= len(ueberschriften) <= MAX_UEBERSCHRIFTEN:
            fehler.append(
                f"Anzeigengruppe '{name}': {len(ueberschriften)} Überschriften — "
                f"Google verlangt {MIN_UEBERSCHRIFTEN} bis {MAX_UEBERSCHRIFTEN}."
            )
        if not MIN_BESCHREIBUNGEN <= len(beschreibungen) <= MAX_BESCHREIBUNGEN:
            fehler.append(
                f"Anzeigengruppe '{name}': {len(beschreibungen)} Beschreibungen — "
                f"Google verlangt {MIN_BESCHREIBUNGEN} bis {MAX_BESCHREIBUNGEN}."
            )

        for text in ueberschriften:
            if len(text) > MAX_UEBERSCHRIFT:
                fehler.append(
                    f"Anzeigengruppe '{name}': Überschrift zu lang "
                    f"({len(text)}/{MAX_UEBERSCHRIFT}): {text!r}"
                )
        for text in beschreibungen:
            if len(text) > MAX_BESCHREIBUNG:
                fehler.append(
                    f"Anzeigengruppe '{name}': Beschreibung zu lang "
                    f"({len(text)}/{MAX_BESCHREIBUNG}): {text!r}"
                )

    return fehler


def uebersicht_ausgeben(cfg: dict[str, Any]) -> None:
    kampagne = cfg["kampagne"]
    gruppen = cfg["anzeigengruppen"]
    negative = cfg.get("negative_keywords") or []
    standort = kampagne.get("standort") or {}

    print(f"  Kampagne        {kampagne['name']}")
    print(f"  Tagesbudget     {kampagne['tagesbudget_euro']:.2f} EUR")
    print(f"  Gebote          {kampagne['gebotsstrategie']}", end="")
    if kampagne["gebotsstrategie"] == "max_clicks":
        print(f" (Obergrenze {kampagne.get('cpc_limit_euro', 0):.2f} EUR)")
    else:
        print()
    print(f"  Standort        {standort.get('radius_km')} km Radius, Präsenz-Targeting")
    print(f"  Ziel-URL        {kampagne['ziel_url']}")
    print(f"  Negative KW     {len(negative)}")
    for gruppe in gruppen:
        anzeige = gruppe["anzeige"]
        print(
            f"  Gruppe          {gruppe['name']} — "
            f"{len(gruppe['keywords'])} Keywords, "
            f"{len(anzeige['ueberschriften'])} Überschriften, "
            f"{len(anzeige['beschreibungen'])} Beschreibungen, "
            f"Startgebot {gruppe['startgebot_euro']:.2f} EUR"
        )


# ---------------------------------------------------------------------------
# Aufbau der API-Operationen
# ---------------------------------------------------------------------------

def operationen_bauen(client, kunden_id: str, cfg: dict[str, Any]) -> list:
    """Baut alle Mutate-Operationen für eine einzige atomare Anfrage."""
    kampagne_cfg = cfg["kampagne"]
    budget_service = client.get_service("CampaignBudgetService")
    campaign_service = client.get_service("CampaignService")
    ad_group_service = client.get_service("AdGroupService")

    budget_rn = budget_service.campaign_budget_path(kunden_id, TEMP_BUDGET)
    kampagne_rn = campaign_service.campaign_path(kunden_id, TEMP_KAMPAGNE)

    operationen: list = []

    # --- Budget -----------------------------------------------------------
    op = client.get_type("MutateOperation")
    budget = op.campaign_budget_operation.create
    budget.resource_name = budget_rn
    budget.name = f"{kampagne_cfg['name']} – Budget"
    budget.amount_micros = euro_zu_micros(kampagne_cfg["tagesbudget_euro"])
    budget.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD
    # Budget gehört ausschließlich zu dieser Kampagne.
    budget.explicitly_shared = False
    operationen.append(op)

    # --- Kampagne ---------------------------------------------------------
    op = client.get_type("MutateOperation")
    kampagne = op.campaign_operation.create
    kampagne.resource_name = kampagne_rn
    kampagne.name = kampagne_cfg["name"]
    kampagne.campaign_budget = budget_rn
    kampagne.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    # Bewusst pausiert: nichts gibt Geld aus, bevor ein Mensch draufgeschaut hat.
    kampagne.status = client.enums.CampaignStatusEnum.PAUSED

    kampagne.network_settings.target_google_search = True
    kampagne.network_settings.target_search_network = bool(
        kampagne_cfg.get("suchnetzwerk_partner", False)
    )
    kampagne.network_settings.target_content_network = bool(
        kampagne_cfg.get("displaynetzwerk", False)
    )
    kampagne.network_settings.target_partner_search_network = False

    if kampagne_cfg["gebotsstrategie"] == "max_clicks":
        kampagne.target_spend.cpc_bid_ceiling_micros = euro_zu_micros(
            kampagne_cfg.get("cpc_limit_euro", 2.0)
        )
    else:
        kampagne.manual_cpc.enhanced_cpc_enabled = False

    standort = kampagne_cfg.get("standort") or {}
    if standort.get("praesenz", True):
        # "Personen an den Zielorten" statt "Interesse an" — sonst zahlst du
        # auch für Suchende, die gar nicht in der Region sind.
        kampagne.geo_target_type_setting.positive_geo_target_type = (
            client.enums.PositiveGeoTargetTypeEnum.PRESENCE
        )
    operationen.append(op)

    # --- Standort-Radius --------------------------------------------------
    if standort:
        op = client.get_type("MutateOperation")
        kriterium = op.campaign_criterion_operation.create
        kriterium.campaign = kampagne_rn
        kriterium.proximity.geo_point.latitude_in_micro_degrees = int(
            round(standort["breitengrad"] * 1_000_000)
        )
        kriterium.proximity.geo_point.longitude_in_micro_degrees = int(
            round(standort["laengengrad"] * 1_000_000)
        )
        kriterium.proximity.radius = float(standort["radius_km"])
        kriterium.proximity.radius_units = (
            client.enums.ProximityRadiusUnitsEnum.KILOMETERS
        )
        operationen.append(op)

    # --- Anzeigenzeitplan -------------------------------------------------
    zeitplan = kampagne_cfg.get("zeitplan") or {}
    for tag in zeitplan.get("tage", []):
        op = client.get_type("MutateOperation")
        kriterium = op.campaign_criterion_operation.create
        kriterium.campaign = kampagne_rn
        kriterium.ad_schedule.day_of_week = getattr(client.enums.DayOfWeekEnum, tag)
        kriterium.ad_schedule.start_hour = zeitplan["von_stunde"]
        kriterium.ad_schedule.start_minute = client.enums.MinuteOfHourEnum.ZERO
        kriterium.ad_schedule.end_hour = zeitplan["bis_stunde"]
        kriterium.ad_schedule.end_minute = client.enums.MinuteOfHourEnum.ZERO
        operationen.append(op)

    # --- Negative Keywords (kampagnenweit) --------------------------------
    for eintrag in cfg.get("negative_keywords") or []:
        op = client.get_type("MutateOperation")
        kriterium = op.campaign_criterion_operation.create
        kriterium.campaign = kampagne_rn
        kriterium.negative = True
        kriterium.keyword.text = eintrag["text"]
        kriterium.keyword.match_type = getattr(
            client.enums.KeywordMatchTypeEnum, eintrag["match"]
        )
        operationen.append(op)

    # --- Anzeigengruppen mit Keywords und Anzeige -------------------------
    for index, gruppe in enumerate(cfg["anzeigengruppen"]):
        gruppe_rn = ad_group_service.ad_group_path(
            kunden_id, TEMP_ANZEIGENGRUPPE_START - index
        )

        op = client.get_type("MutateOperation")
        anzeigengruppe = op.ad_group_operation.create
        anzeigengruppe.resource_name = gruppe_rn
        anzeigengruppe.name = gruppe["name"]
        anzeigengruppe.campaign = kampagne_rn
        anzeigengruppe.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
        anzeigengruppe.status = client.enums.AdGroupStatusEnum.ENABLED
        # Steuert den faktischen Budgetanteil der Gruppe: Google verteilt das
        # Budget auf Kampagnenebene, die Gewichtung läuft über die Gebotshöhe.
        anzeigengruppe.cpc_bid_micros = euro_zu_micros(gruppe["startgebot_euro"])
        operationen.append(op)

        for eintrag in gruppe["keywords"]:
            op = client.get_type("MutateOperation")
            kriterium = op.ad_group_criterion_operation.create
            kriterium.ad_group = gruppe_rn
            kriterium.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
            kriterium.keyword.text = eintrag["text"]
            kriterium.keyword.match_type = getattr(
                client.enums.KeywordMatchTypeEnum, eintrag["match"]
            )
            operationen.append(op)

        op = client.get_type("MutateOperation")
        anzeige = op.ad_group_ad_operation.create
        anzeige.ad_group = gruppe_rn
        anzeige.status = client.enums.AdGroupAdStatusEnum.ENABLED
        anzeige.ad.final_urls.append(kampagne_cfg["ziel_url"])

        for text in gruppe["anzeige"]["ueberschriften"]:
            asset = client.get_type("AdTextAsset")
            asset.text = text
            anzeige.ad.responsive_search_ad.headlines.append(asset)

        for text in gruppe["anzeige"]["beschreibungen"]:
            asset = client.get_type("AdTextAsset")
            asset.text = text
            anzeige.ad.responsive_search_ad.descriptions.append(asset)

        operationen.append(op)

    return operationen


# ---------------------------------------------------------------------------
# Google-Ads-Client
# ---------------------------------------------------------------------------

def client_aufbauen():
    """Baut den Client aus Umgebungsvariablen. Beendet das Skript bei Lücken."""
    try:
        from google.ads.googleads.client import GoogleAdsClient
    except ImportError:
        print(
            "Die Bibliothek 'google-ads' fehlt.\n"
            "  pip install -r ads/requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    fehlend = [name for name in CONFIG_ENV if not os.environ.get(name)]
    if fehlend:
        print("Folgende Umgebungsvariablen fehlen:\n", file=sys.stderr)
        for name in fehlend:
            print(f"  {name}", file=sys.stderr)
        print(
            "\nWie du sie bekommst, steht in ads/README.md.\n"
            "Nur die Formatprüfung ohne Zugangsdaten: --check",
            file=sys.stderr,
        )
        sys.exit(1)

    konfig = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    # Manager-Konto (MCC), unter dem das Werbekonto hängt.
    manager = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
    if manager:
        konfig["login_customer_id"] = nur_ziffern(manager)

    # Keine API-Version festnageln: die Bibliothek bringt ihre eigene mit,
    # ein fester String hier veraltet mit dem nächsten Google-Release.
    #
    # load_from_dict erneuert den Zugriffstoken sofort — falsche oder
    # abgelaufene Zugangsdaten fallen deshalb schon hier auf, nicht erst
    # beim ersten API-Aufruf.
    from google.auth.exceptions import RefreshError

    try:
        return GoogleAdsClient.load_from_dict(konfig)
    except RefreshError as fehler:
        print(
            f"\nDie Zugangsdaten wurden von Google abgelehnt: {fehler}\n\n"
            "Häufige Ursachen:\n"
            "  • Refresh-Token abgelaufen — steht der OAuth-Zustimmungsbildschirm\n"
            "    noch auf 'Testing', verfällt er nach 7 Tagen. Dann neu erzeugen\n"
            "    oder die App auf 'In Produktion' setzen.\n"
            "  • CLIENT_ID/CLIENT_SECRET gehören nicht zu dem OAuth-Client,\n"
            "    mit dem der Refresh-Token erzeugt wurde.\n"
            "  • Zugriff in den Google-Kontoeinstellungen widerrufen.\n\n"
            "Details in ads/README.md, Schritt 4.",
            file=sys.stderr,
        )
        sys.exit(1)


def kampagne_existiert(client, kunden_id: str, name: str) -> bool:
    """Verhindert, dass ein zweiter Lauf eine doppelte Kampagne anlegt."""
    dienst = client.get_service("GoogleAdsService")
    sicher = name.replace("\\", "\\\\").replace("'", "\\'")
    abfrage = (
        "SELECT campaign.id, campaign.name, campaign.status "
        f"FROM campaign WHERE campaign.name = '{sicher}' LIMIT 1"
    )
    for zeile in dienst.search(customer_id=kunden_id, query=abfrage):
        print(
            f"Es gibt bereits eine Kampagne '{zeile.campaign.name}' "
            f"(ID {zeile.campaign.id}, Status {zeile.campaign.status.name}).",
            file=sys.stderr,
        )
        return True
    return False


def fehler_ausgeben(ex) -> None:
    """Übersetzt eine GoogleAdsException in lesbare Zeilen statt Stacktrace."""
    print(f"\nGoogle hat die Anfrage abgelehnt (Request-ID {ex.request_id}):\n",
          file=sys.stderr)
    for fehler in ex.failure.errors:
        print(f"  • {fehler.message}", file=sys.stderr)
        if fehler.location and fehler.location.field_path_elements:
            pfad = ".".join(
                element.field_name
                for element in fehler.location.field_path_elements
            )
            print(f"    Feld: {pfad}", file=sys.stderr)


# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Legt die Google-Ads-Testkampagne aus kampagne.yaml an.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).parent / "kampagne.yaml",
        help="Pfad zur Kampagnendefinition (Standard: kampagne.yaml daneben).",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Nur lokale Formatprüfung, kein Netzwerk, keine Zugangsdaten nötig.",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Kampagne wirklich anlegen. Ohne diese Option validiert Google nur.",
    )
    args = parser.parse_args()

    if not args.config.exists():
        print(f"Konfigurationsdatei nicht gefunden: {args.config}", file=sys.stderr)
        return 1

    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    print("Kampagnendefinition")
    uebersicht_ausgeben(cfg)

    fehler = konfiguration_pruefen(cfg)
    if fehler:
        print(f"\n{len(fehler)} Problem(e) in der Konfiguration:\n", file=sys.stderr)
        for eintrag in fehler:
            print(f"  • {eintrag}", file=sys.stderr)
        return 1
    print("\nLokale Prüfung bestanden (Zeichenlimits, Anzahl Assets, Zeitplan).")

    if args.check:
        print("Nur --check angefordert — keine Verbindung zu Google aufgebaut.")
        return 0

    client = client_aufbauen()
    kunden_id = nur_ziffern(os.environ["GOOGLE_ADS_CUSTOMER_ID"])

    if kampagne_existiert(client, kunden_id, cfg["kampagne"]["name"]):
        print(
            "Abbruch, damit keine doppelte Kampagne entsteht. "
            "Entweder die bestehende Kampagne löschen/umbenennen oder in "
            "kampagne.yaml einen anderen Namen setzen.",
            file=sys.stderr,
        )
        return 1

    operationen = operationen_bauen(client, kunden_id, cfg)
    print(f"{len(operationen)} Operationen vorbereitet.")

    from google.ads.googleads.errors import GoogleAdsException

    dienst = client.get_service("GoogleAdsService")
    anfrage = client.get_type("MutateGoogleAdsRequest")
    anfrage.customer_id = kunden_id
    anfrage.mutate_operations.extend(operationen)
    # validate_only: Google prüft die komplette Kette serverseitig, legt aber
    # nichts an. Das ist der Standard — schreiben nur mit --live.
    anfrage.validate_only = not args.live

    try:
        antwort = dienst.mutate(request=anfrage)
    except GoogleAdsException as ex:
        fehler_ausgeben(ex)
        return 1

    if not args.live:
        print(
            "\nValidierung erfolgreich — Google akzeptiert diese Kampagne, "
            "es wurde nichts angelegt.\nZum echten Anlegen: --live"
        )
        return 0

    angelegt = [
        ergebnis
        for ergebnis in antwort.mutate_operation_responses
        if ergebnis
    ]
    print(f"\nKampagne angelegt ({len(angelegt)} Objekte).")
    print(
        "Sie steht auf PAUSIERT. Vor dem Aktivieren in der Oberfläche prüfen:\n"
        "  1. Abrechnung hinterlegt und Währung EUR\n"
        "  2. Anruf-Asset mit +49 173 4536225 hinterlegt\n"
        "  3. Conversion-Aktionen aus GA4 importiert\n"
        "  4. Anzeigentexte und Keywords gegen das Dossier gegengelesen"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

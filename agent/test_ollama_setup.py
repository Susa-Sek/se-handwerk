"""
Ollama-Setup Test-Skript
Testet die Verbindung zu Ollama (Cloud oder Lokal) und die KI-Client Funktionalität.
"""

import io
import os
import sys
from pathlib import Path

# UTF-8 Encoding auf Windows erzwingen
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# Agent-Verzeichnis zum Pfad hinzufügen
AGENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(AGENT_DIR))

import yaml
from dotenv import load_dotenv
from ki.client import KIClient

# .env laden (liegt im Projekt-Root)
PROJEKT_ROOT = AGENT_DIR.parent
load_dotenv(PROJEKT_ROOT / ".env")


def test_ollama_host():
    """Prüft ob OLLAMA_HOST gesetzt ist."""
    host = os.getenv("OLLAMA_HOST")
    default = "http://localhost:11434"

    if not host:
        print(f"⚠️  OLLAMA_HOST nicht gesetzt, verwende Default: {default}")
        return default

    print(f"✅ OLLAMA_HOST: {host}")
    return host


def test_client_initialization():
    """Testet die KIClient Initialisierung."""
    print("\n--- KIClient Initialisierung ---")
    config_path = AGENT_DIR / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    client = KIClient(config)
    print(f"Client verfügbar: {client.ist_verfuegbar}")

    if client.ist_verfuegbar:
        print(f"✅ KIClient erfolgreich initialisiert ({client.ollama_host})")
        return client
    else:
        print("❌ KIClient nicht verfügbar (Ollama nicht erreichbar)")
        return None


def test_simple_request(client):
    """Testet eine einfache Anfrage."""
    print("\n--- Einfache Anfrage (Deutsch) ---")

    response = client.anfrage(
        system_prompt="Du bist ein hilfreicher deutscher Assistent. Antworte kurz.",
        user_prompt="Was ist 2 + 2?",
        modell="glm-5",
        agent_name="test_einfach",
        max_tokens=50,
    )

    if response:
        print(f"✅ Antwort: {response.strip()}")
        return True
    else:
        print("❌ Keine Antwort erhalten")
        return False


def test_json_mode(client):
    """Testet JSON-Mode."""
    print("\n--- JSON Mode Test ---")

    response = client.anfrage(
        system_prompt="Du bist ein JSON-Generator.",
        user_prompt='Erstelle ein JSON mit {"score": 75, "kategorie": "boden"}',
        modell="glm-5",
        json_mode=True,
        agent_name="test_json",
        max_tokens=100,
    )

    if response:
        print(f"✅ JSON-Antwort: {response.strip()}")
        try:
            import json
            parsed = json.loads(response)
            print(f"✅ Valides JSON: {parsed}")
            return True
        except Exception as e:
            print(f"⚠️ Antwort nicht valides JSON: {e}")
            return False
    else:
        print("❌ Keine Antwort erhalten")
        return False


def test_german_quality(client):
    """Testet die Antwortqualität auf Deutsch."""
    print("\n--- Deutsche Antwortqualität ---")

    prompts = [
        "Erkläre in einem Satz, was Laminat ist.",
        "Schreibe eine kurze Nachricht an einen Kunden: 'Laminat verlegen'.",
        "Was sind die Vorteile von Vinylboden? (Kurze Liste)",
    ]

    results = []
    for i, prompt in enumerate(prompts, 1):
        response = client.anfrage(
            system_prompt="Du bist ein deutscher Handwerks-Experte. Antworte kurz und präzise.",
            user_prompt=prompt,
            modell="glm-5",
            agent_name="test_deutsch",
            max_tokens=150,
        )

        if response:
            print(f"\n{i}. Prompt: {prompt}")
            print(f"   Antwort: {response.strip()}")
            results.append(True)
        else:
            results.append(False)

    success = all(results)
    print(f"\n{'✅' if success else '❌'} Deutsche Antworten: {sum(results)}/{len(results)} erfolgreich")
    return success


def test_token_tracking(client):
    """Testet das Token-Tracking."""
    print("\n--- Token Tracking ---")

    # Ein paar Anfragen machen
    for i in range(3):
        client.anfrage(
            system_prompt="Test",
            user_prompt=f"Test {i}",
            modell="glm-5",
            agent_name="test_tracking",
            max_tokens=50,
        )

    verbrauch = client.token_verbrauch_heute()
    print(f"Token-Verbrauch: {verbrauch}")

    if verbrauch:
        total_input = sum(d.get("input_tokens", 0) for d in verbrauch.values())
        total_output = sum(d.get("output_tokens", 0) for d in verbrauch.values())
        total = total_input + total_output
        print(f"✅ Tokens gesamt: {total} ({total_input} input + {total_output} output)")
        return True
    else:
        print("⚠️ Kein Token-Verbrauch erfasst")
        return False


def main():
    print("=" * 50)
    print("Ollama-Setup Test")
    print("=" * 50)

    # 1. OLLAMA_HOST prüfen
    host = test_ollama_host()

    # 2. Client initialisieren
    client = test_client_initialization()
    if not client:
        return 1

    # 3. Tests durchführen
    results = []

    results.append(("Einfache Anfrage", test_simple_request(client)))
    results.append(("JSON Mode", test_json_mode(client)))
    results.append(("Deutsche Qualität", test_german_quality(client)))
    results.append(("Token Tracking", test_token_tracking(client)))

    # Zusammenfassung
    print("\n" + "=" * 50)
    print("Test-Zusammenfassung")
    print("=" * 50)

    for test_name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")

    total = len(results)
    passed = sum(1 for _, success in results if success)

    print(f"\nGesamt: {passed}/{total} Tests bestanden")

    if passed == total:
        print("\n🎉 Alle Tests bestanden! Ollama-Setup ist einsatzbereit.")
        return 0
    else:
        print(f"\n⚠️ {total - passed} Test(s) fehlgeschlagen.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
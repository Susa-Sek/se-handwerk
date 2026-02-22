#!/usr/bin/env python3
"""Testet die KI-Verbindung zu Ollama Cloud."""

import os
import sys
from pathlib import Path

# .env laden
from dotenv import load_dotenv
ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / ".env")

import yaml
from ki.client import KIClient

def main():
    # Config laden
    with open(ROOT / "config.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    print("=" * 50)
    print("KI-Verbindungstest (Ollama Cloud / GLM-5)")
    print("=" * 50)

    # API-Key prüfen
    api_key = os.getenv("OLLAMA_API_KEY")
    print(f"OLLAMA_API_KEY gesetzt: {bool(api_key)}")
    print(f"OLLAMA_API_KEY Länge: {len(api_key) if api_key else 0}")
    print(f"Base URL: {os.getenv('OLLAMA_BASE_URL', 'https://api.ollama.ai/v1')}")

    # KI-Client initialisieren
    ki = KIClient(config)
    print(f"KI-Client verfügbar: {ki.ist_verfuegbar}")

    if not ki.ist_verfuegbar:
        print("FEHLER: KI-Client nicht verfügbar!")
        sys.exit(1)

    # Test-Call
    print("\nSende Test-Anfrage an GLM-5:cloud...")
    antwort = ki.anfrage(
        system_prompt="Du bist ein hilfreicher Assistent.",
        user_prompt="Antworte kurz mit: 'Hallo, die KI funktioniert!'",
        modell="glm-5:cloud",
        max_tokens=50,
        agent_name="test"
    )

    print("-" * 50)
    if antwort:
        print(f"KI-Antwort: {antwort}")
        print(f"Token-Verbrauch: {ki.token_verbrauch_heute()}")
        print("\nERFOLG: KI-Verbindung funktioniert!")
    else:
        print("FEHLER: Keine Antwort erhalten!")
        sys.exit(1)

if __name__ == "__main__":
    main()
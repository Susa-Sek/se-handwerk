# SE Handwerk Agent – So triggern Sie den Durchlauf

Der Agent sucht nur **100 km um Heilbronn** und nur **Anzeigen nicht älter als 5 Stunden**. So können Sie einen Lauf starten:

---

## 1. Manuell (Terminal)

**Einmaliger Durchlauf** (empfohlen zum Testen):

```bash
cd "Pfad\zu\se-handwerk"
python main.py --einmal
```

**Mit Scheduler** (läuft alle 30 Min. + tägliche Zusammenfassung 20:00):

```bash
python main.py
```

Mit **Ctrl+C** beenden.

---

## 2. Windows Taskplaner

1. **Taskplaner** öffnen (taskschd.msc).
2. **Aufgabe erstellen**:
   - **Trigger:** z.B. alle 30 Minuten oder zu festen Zeiten (z.B. 8:00, 12:00, 16:00, 20:00).
   - **Aktion:** Programm starten  
     - Programm: `python` (oder voller Pfad zu `python.exe`)  
     - Argumente: `main.py --einmal`  
     - Starten in: Projektordner (z.B. `C:\Users\...\se-handwerk`).
3. Optional: **Bei Anmeldung** oder **Beim Start** als zusätzlichen Trigger setzen, damit der Agent im Hintergrund läuft.

---

## 3. Cron (Linux/macOS)

```cron
# Alle 30 Minuten
*/30 * * * * cd /pfad/zu/se-handwerk && python main.py --einmal

# Nur zu Geschäftszeiten (z.B. 8, 12, 16, 20 Uhr)
0 8,12,16,20 * * * cd /pfad/zu/se-handwerk && python main.py --einmal
```

---

## 4. Externer Trigger (HTTP/Webhook)

Falls Sie den Lauf per URL auslösen wollen (z.B. von einem anderen Server oder IFTTT):

- **Option A:** Kleines Flask/FastAPI-Skript, das bei Aufruf `subprocess.run(["python", "main.py", "--einmal"])` startet und mit einem geheimen Token absichert.
- **Option B:** Einen bestehenden Scheduler (z.B. GitHub Actions, Vercel Cron) so konfigurieren, dass er regelmäßig eine solche URL aufruft.

Dafür gibt es im Projekt aktuell **kein vorgefertigtes Skript** – bei Bedarf kann ein kleines `trigger_server.py` ergänzt werden.

---

## 5. Telegram-Test

Nur prüfen, ob Telegram funktioniert:

```bash
python main.py --test
```

---

## Kurzüberblick

| Ziel                         | Befehl                    |
|-----------------------------|----------------------------|
| Einmal jetzt ausführen      | `python main.py --einmal`  |
| Dauerhaft alle 30 Min.      | `python main.py`           |
| Telegram-Verbindung testen   | `python main.py --test`    |
| Andere Config-Datei          | `python main.py --config andere.yaml --einmal` |

Vor dem ersten Start: `.env` mit `TELEGRAM_BOT_TOKEN` und `TELEGRAM_CHAT_ID` anlegen (siehe Projekt-Doku).

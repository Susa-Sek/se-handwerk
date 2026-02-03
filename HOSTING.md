# SE Handwerk Agent – kostenlos hosten & regelmäßig laufen lassen

Drei Wege, den Agenten **kostenlos** und **automatisch** laufen zu lassen.

---

## Option 1: GitHub Actions (empfohlen)

**Vorteile:** Kein eigener Server, DB wird zwischen Läufen gespeichert, kostenlos für öffentliche Repos.

### Schritte

1. **Projekt auf GitHub pushen** (öffentliches oder privates Repo).

2. **Secrets anlegen** (Telegram-Zugangsdaten):
   - Repo → **Settings** → **Secrets and variables** → **Actions**
   - **New repository secret**:
     - `TELEGRAM_BOT_TOKEN` = dein Bot-Token
     - `TELEGRAM_CHAT_ID` = deine Chat-ID

3. **Workflow ist schon da:** `.github/workflows/akquise-agent.yml`
   - Läuft **alle 2 Stunden** (Cron: `0 */2 * * *`).
   - Du kannst ihn auch **manuell** starten: **Actions** → **Akquise-Agent** → **Run workflow**.

4. **Häufiger laufen (z.B. alle 30 Min.):**
   - In `akquise-agent.yml` die Zeile `- cron: "0 */2 * * *"` ersetzen durch:
   - `- cron: "*/30 * * * *"` (alle 30 Min.)
   - **Hinweis:** Bei **privaten** Repos gibt es ein Limit an kostenlosen Minuten/Monat; bei **öffentlichen** Repos ist die Nutzung großzügig kostenlos.

### Grenzen

- Jeder Lauf hat eine begrenzte Laufzeit (ca. 6 Std. bei GitHub).
- Die SQLite-DB wird als Artifact zwischen Läufen gespeichert (90 Tage). Beim ersten Lauf existiert noch keine DB – das ist normal.

---

## Option 2: PythonAnywhere (Free Account)

**Vorteile:** Echter geplanter Task auf einem Python-Server, kein Git nötig.

1. Auf [pythonanywhere.com](https://www.pythonanywhere.com) kostenlosen Account anlegen.

2. **Projekt hochladen:**  
   Dateien (oder Repo per Git) in deinen Account kopieren.

3. **Virtuelle Umgebung** anlegen und Abhängigkeiten installieren:
   ```bash
   pip install -r requirements.txt
   ```

4. **Scheduled Task** anlegen:
   - Tab **Tasks** → **Add a new task**
   - Zeitplan z.B. alle 2 Stunden oder zu festen Zeiten (z.B. 8:00, 12:00, 16:00, 20:00)
   - Befehl: `python /home/DEIN_USERNAME/se-handwerk/main.py --einmal`
   - Umgebungsvariablen für Telegram in der Task-Konfiguration oder in einer `.env` im Projektordner setzen.

5. **Hinweis Free Tier:** Ein geplanter Task ist möglich; genaue Limits in der PythonAnywhere-Doku prüfen.

---

## Option 3: Externer Cron + eigener Rechner / VPS

Wenn du einen **eigenen PC** (z.B. zu Hause) oder einen **kostenlosen VPS** (z.B. Oracle Cloud Free Tier) nutzt:

- **Windows:** Taskplaner (siehe TRIGGER.md).
- **Linux/macOS:** Cron, z.B. alle 2 Stunden:
  ```cron
  0 */2 * * * cd /pfad/zu/se-handwerk && python main.py --einmal
  ```

So hostest du nichts in der Cloud, der Lauf ist aber trotzdem regelmäßig.

---

## Kurzvergleich

| Option            | Kosten | Aufwand | DB bleibt erhalten | Typisches Intervall   |
|------------------|--------|---------|--------------------|------------------------|
| **GitHub Actions** | Kostenlos* | Gering (Secrets setzen) | Ja (als Artifact) | z.B. alle 2 h oder 30 Min. |
| **PythonAnywhere** | Free Tier | Mittel (Upload + Task) | Ja (auf dem Server) | Nach Wahl (z.B. alle 2 h) |
| **Eigener PC / VPS** | Strom/VPS | Nur Cron/Taskplaner | Ja (lokal) | Beliebig |

\* Öffentliche Repos: großzügig kostenlos; private Repos: Kontingent an Minuten/Monat.

---

## Wichtig vor dem ersten geplanten Lauf

- **Telegram:** `TELEGRAM_BOT_TOKEN` und `TELEGRAM_CHAT_ID` müssen gesetzt sein (bei GitHub als Secrets, bei PythonAnywhere/eigenem Rechner in `.env` oder Umgebung).
- **Config:** In `config.yaml` ist das Suchgebiet (100 km Heilbronn) und `max_alter_stunden: 5` bereits eingestellt.

Wenn du dich für **GitHub Actions** entscheidest: Repo pushen, die zwei Secrets anlegen, dann läuft der Agent automatisch alle 2 Stunden (oder nach deiner Anpassung des Cron-Zeitplans).

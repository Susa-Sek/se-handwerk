# Google-Ads-Testkampagne per API

Legt die abgestimmte Testkampagne für sehandwerk.de automatisch an, statt sie in
der Google-Ads-Oberfläche zusammenzuklicken.

| Datei | Zweck |
|---|---|
| `kampagne.yaml` | Alle Inhalte: Keywords, Anzeigentexte, Budget, Gebote, Radius, Zeitplan. **Hier änderst du etwas.** |
| `kampagne_erstellen.py` | Liest die YAML und legt daraus die Kampagne an. |
| `requirements.txt` | Benötigte Python-Pakete. |

**Die Kampagne wird immer PAUSIERT angelegt.** Sie gibt keinen Cent aus, bevor du
sie in der Oberfläche selbst aktivierst.

---

## Sofort nutzbar, ganz ohne Zugangsdaten

Die Formatprüfung läuft offline und meldet z.B. zu lange Anzeigentexte, bevor
irgendetwas an Google geht:

```bash
pip install PyYAML
python ads/kampagne_erstellen.py --check
```

Das lohnt sich nach jeder Änderung an `kampagne.yaml`.

---

## Einmalige Einrichtung

Diese fünf Schritte passieren außerhalb dieses Repos und lassen sich nicht
automatisieren — Google verlangt sie so.

### 1. Manager-Konto (MCC) anlegen

Ein normales Werbekonto hat kein API-Center. Du brauchst ein **Manager-Konto**
unter [ads.google.com/home/tools/manager-accounts](https://ads.google.com/home/tools/manager-accounts).

### 2. Developer-Token beantragen

Im Manager-Konto: **Tools & Einstellungen → Einrichtung → API-Center**.

Der Token hat eine Zugriffsstufe:

| Stufe | Echte Konten? | Wie man sie bekommt |
|---|---|---|
| Test Account | nein | sofort bei Anmeldung |
| **Explorer** | **ja**, 2.880 Operationen/Tag | wird oft automatisch nach der Anmeldung vergeben |
| Basic | ja, 15.000/Tag | Antrag, ca. 5 Werktage |

**Explorer reicht für dieses Skript vollständig aus** — unsere Kampagne braucht
rund 43 Operationen. Explorer sperrt zwar Keyword-Planer, Kontoerstellung und
Abrechnung per API; nichts davon nutzen wir hier.

### 3. Werbekonto unter das Manager-Konto hängen

Im Manager-Konto **Konten → Vorhandenes Konto verknüpfen** und die Kundennummer
von „SE Handwerk" verknüpfen. Ohne diese Verknüpfung darf der Token nicht auf das
Konto zugreifen.

### 4. Refresh-Token erzeugen

**Das Dienstkonto funktioniert hier nicht.** Der Dienstkonto-Weg bräuchte
domainweite Delegation über Google Workspace. Bei einer `@gmail.com`-Adresse geht
das nicht — es muss der OAuth-Nutzerflow sein.

Dafür gibt es zwei Wege:

#### Weg A — nur im Browser (auch auf dem iPad)

Braucht einen OAuth-Client vom Typ **Webanwendung** und Googles eigene Testseite.

1. In der [Cloud Console](https://console.cloud.google.com/apis/credentials) den
   Webclient öffnen und unter **Autorisierte Weiterleitungs-URIs** exakt
   `https://developers.google.com/oauthplayground` eintragen, speichern.
2. Auf dem [OAuth Playground](https://developers.google.com/oauthplayground) das
   Zahnrad öffnen, **Use your own OAuth credentials** ankreuzen, Client-ID und
   Client-Schlüssel eintragen.
3. Links unter *Input your own scopes* `https://www.googleapis.com/auth/adwords`
   eintragen → **Authorize APIs** → anmelden → **Exchange authorization code for
   tokens**.
4. Den **Refresh token** kopieren (beginnt mit `1//`).

#### Weg B — lokal mit Python

Braucht einen OAuth-Client vom Typ **Desktop-App** (keine Redirect-URI nötig):

```bash
pip install google-auth-oauthlib
python -c "
from google_auth_oauthlib.flow import InstalledAppFlow
flow = InstalledAppFlow.from_client_secrets_file(
    'client_secret.json', scopes=['https://www.googleapis.com/auth/adwords'])
creds = flow.run_local_server(port=0)
print('REFRESH_TOKEN =', creds.refresh_token)
"
```

> **Achtung, 7-Tage-Falle:** Steht dein OAuth-Zustimmungsbildschirm auf
> **„Testing"**, verfällt der Refresh-Token nach 7 Tagen und das Skript bricht
> mit einem Anmeldefehler ab. Für dauerhaften Betrieb den Zustimmungsbildschirm
> auf **„In Produktion"** setzen.

### 5. Abrechnung im Werbekonto hinterlegen

Geht per API unter Explorer nicht — einmalig in der Oberfläche erledigen und
dabei prüfen, dass die Währung **EUR** ist.

---

## Zugangsdaten setzen

Als Umgebungsvariablen. **Niemals in eine Datei im Repo schreiben** — `.env` ist
bereits in `.gitignore`.

```bash
export GOOGLE_ADS_DEVELOPER_TOKEN="..."      # aus dem API-Center (Schritt 2)
export GOOGLE_ADS_CLIENT_ID="....apps.googleusercontent.com"
export GOOGLE_ADS_CLIENT_SECRET="..."
export GOOGLE_ADS_REFRESH_TOKEN="..."        # aus Schritt 4
export GOOGLE_ADS_CUSTOMER_ID="123-456-7890" # Werbekonto SE Handwerk
export GOOGLE_ADS_LOGIN_CUSTOMER_ID="..."    # Manager-Konto (optional)
```

Bindestriche in den Kundennummern sind egal, das Skript entfernt sie.

---

## Ausführen

```bash
pip install -r ads/requirements.txt

# 1. Offline-Formatprüfung
python ads/kampagne_erstellen.py --check

# 2. Google validiert die komplette Kampagne serverseitig, legt nichts an
python ads/kampagne_erstellen.py

# 3. Kampagne wirklich anlegen (pausiert)
python ads/kampagne_erstellen.py --live
```

Schritt 2 ist der eigentliche Sicherheitsgurt: Google prüft die gesamte Kette
und meldet Probleme präzise, ohne dass etwas entsteht. **Immer erst Schritt 2,
dann Schritt 3.**

Das Skript legt alles in **einer atomaren Anfrage** an — entweder entsteht die
komplette Kampagne oder gar nichts, nie ein halbfertiger Zustand. Läuft es
versehentlich zweimal, bricht es ab, statt eine doppelte Kampagne anzulegen.

---

## Nach dem Anlegen

Die Kampagne ist pausiert. Vor dem Aktivieren:

1. Conversion-Aktionen aus GA4 importieren (Formular, Telefon, WhatsApp) und ein
   Anruf-Asset mit `+49 173 4536225` hinterlegen.
2. Abrechnung und Währung EUR bestätigen.
3. Anzeigentexte und Keywords in der Oberfläche gegenlesen.

Erst dann aktivieren.

---

## Wo läuft das Skript?

**Auf einem Rechner mit Python** — der saubere Weg. Zugangsdaten bleiben lokal.

**In einer Claude-Code-Session** geht auch, aber dann laufen die Zugangsdaten
durch den Chatverlauf und bleiben dort gespeichert. Wenn du das machst: danach
den Refresh-Token in den
[Google-Kontoeinstellungen](https://myaccount.google.com/permissions) widerrufen
und einen neuen erzeugen. Ein Developer-Token plus Refresh-Token kann echtes
Werbebudget ausgeben — entsprechend behandeln.

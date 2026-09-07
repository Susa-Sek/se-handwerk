# status-notify.ps1 — Regelmaessiger Telegram-Status-Digest der Warmbly-Cold-Email-Kampagnen.
# Damit man auch ohne offenes Claude Code sieht, was das System tut.
#   -Mode kickoff   (08:10) Guten Morgen: heute geplant / gestern gelaufen / System-Health
#   -Mode mittag    (12:30) Zwischenstand: bisher gesendet je Konto / Antworten / Rest-Queue
#   -Mode puls      (stuendlich) kompakter Puls: bisher X/Ziel gesendet / Antworten / naechster Send
#   -Mode detail    (12:30/16:20) je Kampagne: Leads gestartet/offen, Sends je Step, Antworten nach Step
#   -Mode abschluss (16:15) Tagesabschluss: heute gesendet je Konto / Antworten / Kampagnen-Total
# Liest direkt Postgres (kein Warmbly-API-Token noetig), pusht via notify.ps1.
# Antwort-Zahlen kommen aus dem Postfach (unibox_emails, auf aktive Kampagnen gematcht) —
# das ist Ground-Truth wie beim reply-alert und umgeht den Progress-Sync-Gap.
# Bei Docker/Postgres-Ausfall -> [ALARM]-Push (Ausfaelle will man wissen). So = kein Versand -> skip.
# Ausgeloest via Windows Task Scheduler (Mo-Sa). Manuell: powershell -File status-notify.ps1 -Mode mittag
param(
    [Parameter(Mandatory = $true)][ValidateSet('kickoff', 'mittag', 'puls', 'detail', 'abschluss')][string]$Mode,
    [switch]$DryRun  # Nachricht auf Konsole ausgeben statt nach Telegram senden (Test ohne Spam).
)
$ErrorActionPreference = 'Continue'

$Root     = 'C:\Users\sulie\OneDrive\Dokumente\Claude Code\se-handwerk\Coldemailing'
$Notify   = Join-Path $Root 'leads\notify.ps1'
$LogFile  = Join-Path $Root 'leads\status-notify.log'
$Postgres = 'warmbly-postgres-1'
$Backend  = 'warmbly-backend-1'

function Log([string]$m) { Add-Content -Path $LogFile -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + "  [$Mode] " + $m) -Encoding utf8 }
function DB([string]$sql) { return (& docker exec -i $Postgres psql -U warmbly -d warmbly_dev -tAF '|' -c $sql 2>&1 | Out-String).Trim() }
function ToInt([string]$s) { $n = 0; [void][int]::TryParse(($s -replace '[^\d\-]', ''), [ref]$n); return $n }
function Push([string]$text) {
    if ($DryRun) { Write-Output "--- DRYRUN ($Mode) ---`n$text`n---"; Log 'dryrun'; return }
    # Ein Retry, da der Telegram-POST gelegentlich in den 20s-Timeout laeuft (transientes Netz).
    for ($i = 1; $i -le 2; $i++) {
        try { & $Notify -Text $text | Out-Null; Log "push ok (Versuch $i)"; return }
        catch { Log "push Versuch $i fehlgeschlagen: $_"; Start-Sleep -Seconds 3 }
    }
    Log 'push FEHLER: beide Versuche fehlgeschlagen'
}

# Sonntag = kein Versand (Warmbly-Policy Mo-Sa). Belt-and-suspenders zum Weekly-Trigger.
if ((Get-Date).DayOfWeek -eq 'Sunday') { Log 'Sonntag -> skip'; return }

# --- Guard: Docker + Postgres erreichbar? Sonst ALARM. ---
& docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Log 'Docker nicht erreichbar -> ALARM'
    Push '[ALARM] Cold-Email-System: Docker/Container nicht erreichbar. Aktuell KEINE Sends moeglich. Bitte PC/Docker Desktop pruefen.'
    return
}
if ((DB 'SELECT 1;') -ne '1') {
    Log 'Postgres nicht erreichbar -> ALARM'
    Push '[ALARM] Cold-Email-System: Postgres/Datenbank nicht erreichbar. Aktuell KEINE Sends moeglich. Bitte Warmbly-Container pruefen.'
    return
}

# --- Fuer alle Modi ---
$heute = DB "SELECT to_char(now() AT TIME ZONE 'Europe/Berlin','DD.MM.')"
$next  = DB "SELECT coalesce(to_char(min(scheduled_at) AT TIME ZONE 'Europe/Berlin','DD.MM. HH24:MI'),'keiner in Queue') FROM tasks WHERE task_type='campaign' AND status='pending' AND scheduled_at > now()"
# Tagesziel = Summe campaign_limit der aktiven Sende-Konten (20/Konto -> 60). Nicht der Queue-Snapshot!
$ziel  = DB "SELECT coalesce(sum(campaign_limit),0) FROM email_accounts WHERE email ILIKE '%se-handwerk.work%' AND status='active'"
$zielN = ToInt $ziel

# Antwort-Filter (Postfach): echte Prospect-Antwort, kein Autoresponder/keine se-handwerk-Mail.
$replFilter = @'
array_to_string(ue.from_addr,';') NOT ILIKE '%se-handwerk.work%'
  AND (ue.subject ILIKE 'Re:%' OR ue.subject ILIKE 'AW:%')
  AND ue.subject NOT ILIKE '%automatische%' AND ue.subject NOT ILIKE '%abwesen%'
  AND ue.subject NOT ILIKE '%empfangsbest%' AND ue.subject NOT ILIKE '%eingangsbest%' AND ue.subject NOT ILIKE 'auto%'
'@

# Sends heute je Konto (alle 3 Konten, auch 0) -> "team N / hi N / info N"
function SendsHeuteJeKonto {
    $raw = DB @'
SELECT split_part(ea.email,'@',1),
  (SELECT count(*) FROM tasks t WHERE t.email_account_id=ea.id AND t.task_type='campaign' AND t.status='completed'
     AND (t.completed_at AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date)
FROM email_accounts ea WHERE ea.email ILIKE '%se-handwerk.work%' ORDER BY ea.email
'@
    $parts = @(); $sum = 0
    foreach ($l in ($raw -split "`r?`n")) {
        if ($l.Trim() -eq '') { continue }
        $p = $l -split '\|'; $parts += ("{0} {1}" -f $p[0], $p[1]); $sum += (ToInt $p[1])
    }
    return @{ str = ($parts -join ' / '); sum = $sum }
}

$bounceToday = DB "SELECT count(*) FROM campaign_contact_progress WHERE bounced_at IS NOT NULL AND (bounced_at AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date"

if ($Mode -eq 'kickoff') {
    $s     = SendsHeuteJeKonto
    $queueH = DB "SELECT count(*) FROM tasks WHERE task_type='campaign' AND status='pending' AND scheduled_at > now() AND (scheduled_at AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date"
    $gSend = DB "SELECT count(*) FROM tasks WHERE task_type='campaign' AND status='completed' AND (completed_at AT TIME ZONE 'Europe/Berlin')::date = ((now() AT TIME ZONE 'Europe/Berlin')::date - 1)"
    $gRepl = DB @"
SELECT count(DISTINCT ct.id) FROM unibox_emails ue
JOIN contacts ct ON lower(ct.email)=lower(substring(array_to_string(ue.from_addr,';') from '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))
JOIN campaign_leads cl ON cl.contact_id=ct.id
JOIN campaigns c ON c.id=cl.campaign_id AND c.status='active'
WHERE $replFilter
  AND (ue.internal_date AT TIME ZONE 'Europe/Berlin')::date = ((now() AT TIME ZONE 'Europe/Berlin')::date - 1)
"@
    $aktiv = DB "SELECT count(*) FROM campaigns WHERE status='active'"
    $beRun = "$(& docker inspect -f '{{.State.Running}}' $Backend 2>&1)".Trim()
    $beTxt = if ($beRun -eq 'true') { 'System laeuft' } else { 'ACHTUNG Backend-Container down' }
    $msg = "[Kickoff] Guten Morgen - $heute`n" +
           "Tagesziel: $ziel Sends ($([int]($zielN/3))/Konto x 3)`n" +
           "Bisher heute: $($s.sum) raus, $queueH in Queue`n" +
           "Gestern: $gSend gesendet, $gRepl Antworten`n" +
           "$aktiv Kampagnen aktiv | $beTxt`n" +
           "Naechster Send: $next"
    Push $msg
}
elseif ($Mode -eq 'mittag') {
    $s = SendsHeuteJeKonto
    $replToday = DB @"
SELECT count(DISTINCT ct.id) FROM unibox_emails ue
JOIN contacts ct ON lower(ct.email)=lower(substring(array_to_string(ue.from_addr,';') from '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))
JOIN campaign_leads cl ON cl.contact_id=ct.id
JOIN campaigns c ON c.id=cl.campaign_id AND c.status='active'
WHERE $replFilter
  AND (ue.internal_date AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date
"@
    $queue = DB "SELECT count(*) FROM tasks WHERE task_type='campaign' AND status='pending' AND scheduled_at > now() AND (scheduled_at AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date"
    # Stall-Flag: Queue leer aber Tagesziel noch offen = Reconciler seedet nicht nach.
    $stall = if ((ToInt $queue) -eq 0 -and $s.sum -lt $zielN) { "`nACHTUNG Queue leer, Ziel $ziel offen - moeglicher Versand-Stall" } else { '' }
    $msg = "[Zwischenstand] $heute 12:30`n" +
           "Bisher heute: $($s.sum)/$ziel gesendet ($($s.str))`n" +
           "Neue Antworten: $replToday | Bounces: $bounceToday`n" +
           "Rest-Queue heute: $queue Sends | naechster $next$stall"
    Push $msg
}
elseif ($Mode -eq 'puls') {
    $s = SendsHeuteJeKonto
    $replToday = DB @"
SELECT count(DISTINCT ct.id) FROM unibox_emails ue
JOIN contacts ct ON lower(ct.email)=lower(substring(array_to_string(ue.from_addr,';') from '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))
JOIN campaign_leads cl ON cl.contact_id=ct.id
JOIN campaigns c ON c.id=cl.campaign_id AND c.status='active'
WHERE $replFilter
  AND (ue.internal_date AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date
"@
    $uhr = DB "SELECT to_char(now() AT TIME ZONE 'Europe/Berlin','HH24:MI')"
    $msg = "[Puls] $uhr - $($s.sum)/$ziel gesendet ($($s.str))`n" +
           "Neue Antworten heute: $replToday | Bounces: $bounceToday`n" +
           "Naechster Send: $next"
    Push $msg
}
elseif ($Mode -eq 'detail') {
    $uhr = DB "SELECT to_char(now() AT TIME ZONE 'Europe/Berlin','HH24:MI')"
    # Je Kampagne: name|leads|gestartet|steps-sent|antw-total|antw-nach-step|steps-gesamt
    $raw = DB @'
SELECT split_part(c.name,' - ',1),
  (SELECT count(*) FROM campaign_leads cl WHERE cl.campaign_id=c.id),
  (SELECT count(DISTINCT p.contact_id) FROM campaign_contact_progress p WHERE p.campaign_id=c.id AND p.sent_at IS NOT NULL),
  coalesce((SELECT string_agg('S'||s.position||' '||(SELECT count(*) FROM campaign_contact_progress p WHERE p.sequence_id=s.id AND p.sent_at IS NOT NULL), ' / ' ORDER BY s.position)
     FROM sequences s WHERE s.campaign_id=c.id AND s.kind='email'
       AND EXISTS (SELECT 1 FROM campaign_contact_progress p WHERE p.sequence_id=s.id AND p.sent_at IS NOT NULL)),'noch keiner'),
  (SELECT count(*) FROM campaign_contact_progress p WHERE p.campaign_id=c.id AND p.replied_at IS NOT NULL),
  coalesce((SELECT string_agg(x.cnt||'x n.S'||x.pos, ', ' ORDER BY x.pos) FROM (
      SELECT s.position AS pos, count(*) AS cnt FROM campaign_contact_progress p JOIN sequences s ON s.id=p.sequence_id
      WHERE p.campaign_id=c.id AND p.replied_at IS NOT NULL GROUP BY s.position) x),''),
  (SELECT count(*) FROM sequences s WHERE s.campaign_id=c.id AND s.kind='email')
FROM campaigns c WHERE c.name LIKE 'ICP%v3 (reply-gated)' ORDER BY c.name
'@
    $lines = @("[Detail] $heute $uhr"); $offenSum = 0; $antwSum = 0
    foreach ($l in ($raw -split "`r?`n")) {
        if ($l.Trim() -eq '') { continue }
        $f = $l -split '\|'
        $offen = (ToInt $f[1]) - (ToInt $f[2]); $offenSum += $offen; $antwSum += (ToInt $f[4])
        $antwStr = if ((ToInt $f[4]) -gt 0 -and $f[5] -ne '') { "$($f[4]) ($($f[5]))" } else { "$($f[4])" }
        $lines += "$($f[0]): $($f[2])/$($f[1]) gestartet, $offen offen"
        $lines += "  Steps($($f[6])): $($f[3]) | Antw $antwStr"
    }
    $lines += "Gesamt: $offenSum Leads offen, $antwSum Antworten"
    Push ($lines -join "`n")
}
else {
    $s = SendsHeuteJeKonto
    # Je aktive Kampagne: Name | sent-gesamt | Antworten-gesamt | Antworten-heute (alle Postfach-gematcht)
    $perRaw = DB @"
SELECT split_part(c.name,' - ',1) AS nm,
  (SELECT count(*) FROM campaign_contact_progress p WHERE p.campaign_id=c.id AND p.sent_at IS NOT NULL) AS sent,
  (SELECT count(DISTINCT ct.id) FROM unibox_emails ue
     JOIN contacts ct ON lower(ct.email)=lower(substring(array_to_string(ue.from_addr,';') from '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))
     JOIN campaign_leads cl ON cl.contact_id=ct.id AND cl.campaign_id=c.id
     WHERE $replFilter) AS repl,
  (SELECT count(DISTINCT ct.id) FROM unibox_emails ue
     JOIN contacts ct ON lower(ct.email)=lower(substring(array_to_string(ue.from_addr,';') from '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))
     JOIN campaign_leads cl ON cl.contact_id=ct.id AND cl.campaign_id=c.id
     WHERE $replFilter
       AND (ue.internal_date AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date) AS repl_today
FROM campaigns c WHERE c.status='active' ORDER BY c.name
"@
    $perParts = @(); $sentTot = 0; $replTot = 0; $replToday = 0
    foreach ($l in ($perRaw -split "`r?`n")) {
        if ($l.Trim() -eq '') { continue }
        $p = $l -split '\|'
        $perParts += ("{0} {1}/{2}" -f $p[0], $p[1], $p[2])
        $sentTot += (ToInt $p[1]); $replTot += (ToInt $p[2]); $replToday += (ToInt $p[3])
    }
    $rr = if ($sentTot -gt 0) { '{0:N1}' -f (100.0 * $replTot / $sentTot) } else { '0' }
    $msg = "[Tagesabschluss] $heute`n" +
           "Heute gesendet: $($s.sum)/$ziel ($($s.str))`n" +
           "Neue Antworten heute: $replToday | Bounces: $bounceToday`n" +
           "Aktiv: $($perParts.Count) Kampagnen | gesamt $sentTot gesendet, $replTot Antworten (RR $rr%)`n" +
           "Je Kampagne: $($perParts -join ' | ')`n" +
           "Naechster Send: $next"
    Push $msg
}
Log 'done'

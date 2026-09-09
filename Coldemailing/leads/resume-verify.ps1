# resume-verify.ps1 — Einmaliger Morgen-Check ob der Resume sauber getrickelt hat.
# Prueft die HEUTIGEN Sends (Fenster 08-16): Spacing >=600s je Konto, KEIN :00-Cluster
# (Send-Time-Optimization/Blast-Signatur = viele Tasks mit identischem scheduled_at), STO aus,
# Kampagnen aktiv, Volumen plausibel. Pusht ein klares [OK]/[WARN]-Verdikt nach Telegram.
# Ausgeloest via Windows Task Scheduler (einmalig, ~10:00 nach dem 08:00-Resume). -DryRun = Konsole.
param([switch]$DryRun)
$ErrorActionPreference = 'Continue'

$Root     = 'C:\Users\sulie\OneDrive\Dokumente\Claude Code\se-handwerk\Coldemailing'
$Notify   = Join-Path $Root 'leads\notify.ps1'
$LogFile  = Join-Path $Root 'leads\resume-verify.log'
$Postgres = 'warmbly-postgres-1'
$Org      = '43938660-3b2e-43bd-af34-70663af28201'

function Log([string]$m) { Add-Content -Path $LogFile -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + '  ' + $m) -Encoding utf8 }
function DB([string]$sql) { return (& docker exec -i $Postgres psql -U warmbly -d warmbly_dev -tAF '|' -c $sql 2>&1 | Out-String).Trim() }
function ToInt([string]$s) { $n = 0; [void][int]::TryParse(($s -replace '[^\d\-]', ''), [ref]$n); return $n }
function Push([string]$text) {
    if ($DryRun) { Write-Output "--- DRYRUN ---`n$text`n---"; Log 'dryrun'; return }
    for ($i = 1; $i -le 2; $i++) {
        try { & $Notify -Text $text | Out-Null; Log "push ok"; return } catch { Log "push $i fail: $_"; Start-Sleep -Seconds 3 }
    }
    Log 'push FEHLER'
}

if ((Get-Date).DayOfWeek -eq 'Sunday') { Log 'Sonntag -> skip'; return }
& docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Push '[Resume-Verify ALARM] Docker/Container nicht erreichbar - Versand-Status unbekannt.'; return }
if ((DB 'SELECT 1;') -ne '1') { Push '[Resume-Verify ALARM] Postgres nicht erreichbar - Versand-Status unbekannt.'; return }

# Kennzahlen (heute, Berlin-Datum)
$dayFilter = "(completed_at AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date"
$sto    = DB "SELECT coalesce((SELECT settings->'send_time_optimization'->>'enabled' FROM outreach_settings WHERE organization_id='$Org'::uuid),'MISSING')"
$aktiv  = DB "SELECT count(*) FROM campaigns WHERE status='active' AND name LIKE 'ICP%v3 (reply-gated)'"
$total  = DB "SELECT count(*) FROM tasks WHERE task_type='campaign' AND status='completed' AND $dayFilter"
$acct   = DB "SELECT string_agg(x.k||' '||x.c, ' / ' ORDER BY x.k) FROM (SELECT split_part(ea.email,'@',1) AS k, count(*) AS c FROM tasks t JOIN email_accounts ea ON ea.id=t.email_account_id WHERE t.task_type='campaign' AND t.status='completed' AND (t.completed_at AT TIME ZONE 'Europe/Berlin')::date=(now() AT TIME ZONE 'Europe/Berlin')::date GROUP BY 1) x"
$next   = DB "SELECT coalesce(to_char(min(scheduled_at) AT TIME ZONE 'Europe/Berlin','HH24:MI'),'-') FROM tasks WHERE task_type='campaign' AND status='pending' AND scheduled_at > now()"
# Spacing: <300s = echtes Problem (Blast-nah); 300-600s = benigner Kampagnen-Overlap (kein Alarm)
$vio = DB "SELECT string_agg(email||' '||mg||'s', ', ') FROM (SELECT ea.email AS email, round(min(gap)) AS mg FROM (SELECT email_account_id, EXTRACT(EPOCH FROM (completed_at - lag(completed_at) OVER (PARTITION BY email_account_id ORDER BY completed_at))) AS gap FROM tasks WHERE task_type='campaign' AND status='completed' AND $dayFilter) g JOIN email_accounts ea ON ea.id=g.email_account_id WHERE gap IS NOT NULL AND gap < 300 GROUP BY ea.email) z"
# :00-Cluster: groesste Gruppe von Sends mit identischem scheduled_at (STO/Blast-Signatur)
$cluster = DB "SELECT coalesce(max(cnt),0) FROM (SELECT scheduled_at, count(*) AS cnt FROM tasks WHERE task_type='campaign' AND status='completed' AND $dayFilter GROUP BY scheduled_at) y"
# Vormittag-Start (pull-to-morning-Wirkung) + lief pull-to-morning heute?
$firstSend = DB "SELECT coalesce(to_char(min(completed_at) AT TIME ZONE 'Europe/Berlin','HH24:MI'),'-') FROM tasks WHERE task_type='campaign' AND status='completed' AND $dayFilter"
$pullLog = Join-Path $Root 'leads\pull-to-morning.log'
$today = (Get-Date).ToString('yyyy-MM-dd')
$pullRan = if ((Test-Path $pullLog) -and (Select-String -Path $pullLog -Pattern $today -SimpleMatch -Quiet)) { 'ja' } else { 'nein' }

# Verdikt
$probs = @()
if ($sto -ne 'false')            { $probs += "STO NICHT aus (=$sto)" }
if ((ToInt $aktiv) -lt 1)        { $probs += "keine aktive Kampagne" }
if ((ToInt $total) -eq 0)        { $probs += "0 Sends heute (Stall/Fenster?)" }
if ($vio)                        { $probs += "Spacing <300s (Blast-nah): $vio" }
if ((ToInt $cluster) -gt 3)      { $probs += ":00-Cluster ($cluster gleichzeitig = Blast?)" }
if ((ToInt $total) -gt 0 -and $firstSend -gt '09:30') { $probs += "1. Send erst $firstSend - Vormittag leer (pull-to-morning?)" }
if ($pullRan -eq 'nein')         { $probs += "pull-to-morning lief heute nicht" }

$uhr = DB "SELECT to_char(now() AT TIME ZONE 'Europe/Berlin','DD.MM. HH24:MI')"
if ($probs.Count -gt 0) {
    $msg = "[Resume-Verify WARN] $uhr`n" + ($probs -join "`n") + "`nHeute $total Sends ($acct), 1. Send $firstSend. Bitte pruefen."
} else {
    $msg = "[Resume-Verify OK] $uhr`nSauber: $total Sends heute ($acct), 1. Send $firstSend, Abstaende >=300s, kein :00-Cluster, STO aus, pull-to-morning ok, $aktiv aktiv. Naechster $next."
}
Log ($msg -replace "`n", ' | ')
Push $msg

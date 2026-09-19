# odoo-sync.ps1 - Scheduled-Task-Wrapper fuer den Einweg-Sync Warmbly -> Odoo CRM.
# Faehrt beide Docker-Stacks idempotent hoch, wartet auf Warmbly-Postgres + Odoo-Web,
# ruft dann leads/odoo-sync.py --apply. Bei Fehler Telegram-Alarm via notify.ps1.
# Registrierung (einmalig, PowerShell als normaler User):
#   $a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\Users\sulie\OneDrive\Dokumente\Claude Code\se-handwerk\Coldemailing\leads\odoo-sync.ps1"'
#   $t = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday,Saturday -At 08:10
#   $t.Repetition = (New-ScheduledTaskTrigger -Once -At 08:10 -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Hours 12)).Repetition
#   Register-ScheduledTask -TaskName 'Warmbly-Odoo-Sync' -Action $a -Trigger $t -Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable)
$ErrorActionPreference = 'Continue'
$Root     = 'C:\Users\sulie\OneDrive\Dokumente\Claude Code\se-handwerk\Coldemailing'
$LogFile  = Join-Path $Root 'leads\odoo-sync.log'

function Log([string]$m) { Add-Content -Path $LogFile -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + '  ' + $m) -Encoding utf8 }

if ((Get-Date).DayOfWeek -eq 'Sunday') { return }

# --- Boot-Guard: Docker-Daemon abwarten (Kaltstart nach Login dauert) ---
$deadline = (Get-Date).AddSeconds(180)
$dockerUp = $false
while ((Get-Date) -lt $deadline) {
    & docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $dockerUp = $true; break }
    Start-Sleep -Seconds 10
}
if (-not $dockerUp) { Log 'Docker-Daemon nicht erreichbar (Timeout) -> skip'; return }

# --- Beide Stacks idempotent hochfahren ---
& docker compose -f (Join-Path $Root 'warmbly\docker-compose.yml') up -d 2>&1 | Out-Null
& docker compose -f (Join-Path $Root 'odoo\docker-compose.yml') up -d 2>&1 | Out-Null

# --- Warmbly-Postgres bereit? ---
$pgReady = $false
$deadline = (Get-Date).AddSeconds(180)
while ((Get-Date) -lt $deadline) {
    $out = (& docker exec -i warmbly-postgres-1 psql -U warmbly -d warmbly_dev -tAc 'SELECT 1;' 2>&1 | Out-String).Trim()
    if ($out -eq '1') { $pgReady = $true; break }
    Start-Sleep -Seconds 8
}
if (-not $pgReady) { Log 'Warmbly-Postgres nicht bereit (Timeout) -> skip'; return }

# --- Odoo-Web bereit? (braucht nach Kaltstart laenger als Postgres) ---
$odooReady = $false
$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:8069/web/health' -UseBasicParsing -TimeoutSec 10
        if ($r.StatusCode -eq 200) { $odooReady = $true; break }
    } catch {}
    Start-Sleep -Seconds 8
}
if (-not $odooReady) { Log 'Odoo nicht bereit (Timeout) -> skip'; return }

# --- Sync ---
$out = (& python (Join-Path $Root 'leads\odoo-sync.py') --apply 2>&1 | Out-String).Trim()
$code = $LASTEXITCODE
if ($out) { Log ("sync: " + ($out -replace "(\r?\n)+", ' | ')) }
if ($code -ne 0) {
    Log "FEHLER exit=$code"
    try { & "$PSScriptRoot\notify.ps1" -Text "[ODOO-SYNC] Fehler (exit $code), siehe odoo-sync.log" | Out-Null } catch { Log "notify fehlgeschlagen: $_" }
}

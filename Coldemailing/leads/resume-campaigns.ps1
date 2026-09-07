# resume-campaigns.ps1 — Sicherer Resume der Cold-Email-Kampagnen am Fenster-Start (08:00).
# Nach dem STO-Blast 07.09: setzt konservative 30/Tag-Caps (10/Konto), PRUEFT dass Send Time
# Optimization aus ist (sonst Abbruch = kein Blast), und unpaused die 4 ICP-v3-Kampagnen.
# BEWUSST KEIN cancel+restart-Reseed (genau das triggert den STO/Blast-Pfad) — der 5-Min-
# Reconciler seedet die Ketten selbst, STO-off -> sauberer Trickle ~alle 16min ueber 08-16 Uhr.
# Ausgeloest via Windows Task Scheduler (einmalig 08:00). Idempotent. -DryRun = nur anzeigen.
param([switch]$DryRun)
$ErrorActionPreference = 'Continue'

$Root     = 'C:\Users\sulie\OneDrive\Dokumente\Claude Code\se-handwerk\Coldemailing'
$LogFile  = Join-Path $Root 'leads\resume-campaigns.log'
$Notify   = Join-Path $Root 'leads\notify.ps1'
$Postgres = 'warmbly-postgres-1'
$Org      = '43938660-3b2e-43bd-af34-70663af28201'

function Log([string]$m) { Add-Content -Path $LogFile -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + '  ' + $m) -Encoding utf8 }
function DB([string]$sql) { return (& docker exec -i $Postgres psql -U warmbly -d warmbly_dev -tAF '|' -c $sql 2>&1 | Out-String).Trim() }

if ((Get-Date).DayOfWeek -eq 'Sunday') { Log 'Sonntag -> skip'; return }
& docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Log 'Docker nicht erreichbar -> abort'; return }
if ((DB 'SELECT 1;') -ne '1') { Log 'Postgres nicht erreichbar -> abort'; return }

# SICHERHEITS-GATE: nur resumen wenn Send Time Optimization nachweislich AUS ist.
$sto = DB "SELECT coalesce((SELECT settings->'send_time_optimization'->>'enabled' FROM outreach_settings WHERE organization_id='$Org'::uuid),'MISSING')"
if ($sto -ne 'false') {
    Log "STO nicht bestaetigt aus (=$sto) -> RESUME ABGEBROCHEN (Blast-Gefahr)"
    try { & $Notify -Text "[Resume ABGEBROCHEN] Send Time Optimization ist nicht aus (=$sto). Kampagnen bleiben pausiert. Bitte pruefen bevor Versand wieder an." | Out-Null } catch {}
    return
}

if ($DryRun) {
    Write-Output "DRYRUN: STO=$sto (ok). Wuerde jetzt: campaign_limit=10, daily_limit/max_new_leads=10, 4 ICP-v3 Kampagnen -> active."
    Log 'dryrun'
    return
}

# Konservative 30/Tag-Caps (10/Konto)
DB "UPDATE email_accounts SET campaign_limit=10, updated_at=now() WHERE email ILIKE '%se-handwerk.work%';" | Out-Null
DB "UPDATE campaigns SET daily_limit=10, max_new_leads_per_day=10, updated_at=now() WHERE name LIKE 'ICP%v3 (reply-gated)';" | Out-Null
# Unpause (KEIN restart, KEIN task-cancel)
DB "UPDATE campaigns SET status='active', last_status_change_at=now(), updated_at=now() WHERE status='paused' AND name LIKE 'ICP%v3 (reply-gated)';" | Out-Null

$aktiv = DB "SELECT count(*) FROM campaigns WHERE status='active' AND name LIKE 'ICP%v3 (reply-gated)'"
Log "resume ok: $aktiv ICP-v3 Kampagnen aktiv, STO=aus, caps=10/Konto (30/Tag)"
try { & $Notify -Text "[Resume] Cold-Email wieder an: 30/Tag (10/Konto), STO=aus. Trickle ~alle 16min, 08-16 Uhr. $aktiv Kampagnen aktiv." | Out-Null } catch {}

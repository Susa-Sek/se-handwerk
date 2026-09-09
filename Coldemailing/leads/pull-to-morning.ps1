# pull-to-morning.ps1 — Zieht die pending Cold-Email-Sends taeglich in den Vormittag.
# Behebt den Drift: Warmbly's Defer legt den naechsten Send auf "gleiche Uhrzeit +24h" statt
# auf Fenster-Start -> ohne Korrektur wandert der Versand in den Nachmittag und Vormittage
# bleiben leer. Dieses Skript re-scheduled die pending campaign-Tasks auf ~08:10, gestaffelt
# je Konto (>=15min innerhalb Konto, Konten leicht versetzt). KEIN cancel/restart -> kein
# Blast-Risiko (nur bei STO=aus ausgefuehrt). Ausgeloest 08:05 Mo-Sa (Task Scheduler, WakeToRun).
param([switch]$DryRun)
$ErrorActionPreference = 'Continue'

$Root     = 'C:\Users\sulie\OneDrive\Dokumente\Claude Code\se-handwerk\Coldemailing'
$LogFile  = Join-Path $Root 'leads\pull-to-morning.log'
$Notify   = Join-Path $Root 'leads\notify.ps1'
$Postgres = 'warmbly-postgres-1'
$Org      = '43938660-3b2e-43bd-af34-70663af28201'

function Log([string]$m) { Add-Content -Path $LogFile -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + '  ' + $m) -Encoding utf8 }
function DB([string]$sql) { return (& docker exec -i $Postgres psql -U warmbly -d warmbly_dev -tAF '|' -c $sql 2>&1 | Out-String).Trim() }

if ((Get-Date).DayOfWeek -eq 'Sunday') { Log 'Sonntag -> skip'; return }
& docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Log 'Docker nicht erreichbar -> abort'; return }
if ((DB 'SELECT 1;') -ne '1') { Log 'Postgres nicht erreichbar -> abort'; return }

# Sicherheits-Gate: nur bei STO=aus (sonst koennte :00-Snapping mit dem Reschedule interagieren).
$sto = DB "SELECT coalesce((SELECT settings->'send_time_optimization'->>'enabled' FROM outreach_settings WHERE organization_id='$Org'::uuid),'MISSING')"
if ($sto -ne 'false') { Log "STO nicht aus (=$sto) -> abort"; try { & $Notify -Text "[Pull-to-Morning ABGEBROCHEN] STO nicht aus (=$sto)." | Out-Null } catch {}; return }

# Basis = spaetestens jetzt, sonst heute 08:10 (Berlin). Staffelung: je Konto +15min, Konten +4min versetzt.
$resched = @'
WITH base AS (
  SELECT greatest(now(), (date_trunc('day', now() AT TIME ZONE 'Europe/Berlin') + interval '8 hours 10 minutes') AT TIME ZONE 'Europe/Berlin') AS b
),
p AS (
  SELECT t.id,
         row_number() OVER (PARTITION BY t.email_account_id ORDER BY t.scheduled_at) - 1 AS rn,
         dense_rank() OVER (ORDER BY t.email_account_id) - 1 AS acct
  FROM tasks t WHERE t.task_type='campaign' AND t.status='pending'
)
UPDATE tasks t SET scheduled_at = (SELECT b FROM base) + p.rn * interval '15 minutes' + p.acct * interval '4 minutes', updated_at=now()
FROM p WHERE t.id=p.id;
'@

if ($DryRun) {
    $preview = DB @'
WITH base AS (SELECT greatest(now(), (date_trunc('day', now() AT TIME ZONE 'Europe/Berlin') + interval '8 hours 10 minutes') AT TIME ZONE 'Europe/Berlin') AS b),
p AS (SELECT t.id, t.email_account_id,
   row_number() OVER (PARTITION BY t.email_account_id ORDER BY t.scheduled_at)-1 AS rn,
   dense_rank() OVER (ORDER BY t.email_account_id)-1 AS acct
   FROM tasks t WHERE t.task_type='campaign' AND t.status='pending')
SELECT to_char(((SELECT b FROM base) + p.rn*interval '15 minutes' + p.acct*interval '4 minutes') AT TIME ZONE 'Europe/Berlin','HH24:MI') AS neu,
   split_part(ea.email,'@',1) AS konto
FROM p JOIN email_accounts ea ON ea.id=p.email_account_id ORDER BY neu;
'@
    Write-Output "DRYRUN geplante Zeiten (neu | Konto):`n$preview"
    Log 'dryrun'
    return
}

$cnt = DB "SELECT count(*) FROM tasks WHERE task_type='campaign' AND status='pending'"
DB $resched | Out-Null
$next = DB "SELECT coalesce(to_char(min(scheduled_at) AT TIME ZONE 'Europe/Berlin','HH24:MI'),'-') FROM tasks WHERE task_type='campaign' AND status='pending' AND scheduled_at > now()"
Log "pull-to-morning: $cnt pending Tasks in den Vormittag gezogen, naechster $next"

# notify.ps1 — sendet eine Telegram-Nachricht via Sehandwerk_bot.
# Nutzung: powershell -File notify.ps1 -Text "deine Nachricht"
# Liest Token + Chat-ID aus notify.env (gitignored). UTF-8-sicher (Umlaute).
param([Parameter(Mandatory = $true)][string]$Text)
$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot 'notify.env'
if (-not (Test-Path $envFile)) { Write-Error "notify.env fehlt: $envFile"; exit 1 }

$tok = $null; $chat = $null
foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*TELEGRAM_BOT_TOKEN\s*=\s*(.+?)\s*$') { $tok = $Matches[1] }
    if ($line -match '^\s*TELEGRAM_CHAT_ID\s*=\s*(.+?)\s*$')   { $chat = $Matches[1] }
}
if (-not $tok -or -not $chat) { Write-Error 'notify.env: TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID fehlt'; exit 1 }

$payload = @{ chat_id = $chat; text = $Text; disable_web_page_preview = $true } | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
try {
    Invoke-RestMethod -Uri "https://api.telegram.org/bot$tok/sendMessage" -Method Post `
        -ContentType 'application/json; charset=utf-8' -Body $bytes -TimeoutSec 20 | Out-Null
    Write-Output 'SENT'
} catch {
    Write-Error "Telegram send failed: $($_.Exception.Message)"; exit 1
}

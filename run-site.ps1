$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$npm = "C:\Program Files\nodejs\npm.cmd"

if (-not (Test-Path $npm)) {
  $npm = "npm.cmd"
}

$existingFrontend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($existingFrontend) {
  Start-Process "http://localhost:3000"
  Write-Host "Outbox is already running at http://localhost:3000"
  exit 0
}

Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "Set-Location -LiteralPath '$projectRoot'; & '$npm' --prefix '$projectRoot' run dev"
)
Start-Process "http://localhost:3000"
Write-Host "Outbox is starting at http://localhost:3000"
Write-Host "Keep the new server terminal open while using the site."

param(
  [Parameter(Mandatory = $true)]
  [string]$Brief,
  [string]$Out = "news-motion.mp4",
  [switch]$SkipTts
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".\node_modules")) {
  Write-Host "npm install..."
  npm install
}

$briefPath = (Resolve-Path $Brief).Path

if ($SkipTts) {
  npm run render -- --brief=$briefPath --out=$Out --skip-tts
} else {
  npm run render -- --brief=$briefPath --out=$Out
}

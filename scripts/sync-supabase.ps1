# 本番・ステージングの Supabase に migrations / Edge Functions を同期（Windows 用）
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Functions = @(
  "create-reservation",
  "line-oauth",
  "notify-ready",
  "check-line-friend",
  "sync-reservation-history"
)

function Require-Env([string]$Name) {
  if (-not (Get-Item "Env:$Name" -ErrorAction SilentlyContinue)) {
    throw "ERROR: $Name is not set"
  }
}

function Sync-One([string]$Label, [string]$ProjectRef, [string]$DbPassword) {
  Write-Host ""
  Write-Host "========== Supabase sync: $Label ($ProjectRef) =========="

  $env:SUPABASE_PROJECT_ID = $ProjectRef
  $env:SUPABASE_DB_PASSWORD = $DbPassword

  supabase link --project-ref $ProjectRef --password $DbPassword
  supabase db push

  foreach ($fn in $Functions) {
    supabase functions deploy $fn --project-ref $ProjectRef
  }

  if ($env:LINE_LOGIN_CHANNEL_ID -and $env:LINE_LOGIN_CHANNEL_SECRET -and $env:LINE_CHANNEL_ACCESS_TOKEN) {
    supabase secrets set `
      "LINE_LOGIN_CHANNEL_ID=$($env:LINE_LOGIN_CHANNEL_ID)" `
      "LINE_LOGIN_CHANNEL_SECRET=$($env:LINE_LOGIN_CHANNEL_SECRET)" `
      "LINE_CHANNEL_ACCESS_TOKEN=$($env:LINE_CHANNEL_ACCESS_TOKEN)" `
      --project-ref $ProjectRef
  } else {
    Write-Host ">> skip secrets (LINE_* env vars not set)"
  }

  Write-Host ">> done: $Label"
}

Require-Env "SUPABASE_ACCESS_TOKEN"
Require-Env "SUPABASE_PROJECT_REF_PRODUCTION"
Require-Env "SUPABASE_DB_PASSWORD_PRODUCTION"

Sync-One "production" $env:SUPABASE_PROJECT_REF_PRODUCTION $env:SUPABASE_DB_PASSWORD_PRODUCTION

if ($env:SUPABASE_PROJECT_REF_STAGING -and $env:SUPABASE_DB_PASSWORD_STAGING) {
  Sync-One "staging" $env:SUPABASE_PROJECT_REF_STAGING $env:SUPABASE_DB_PASSWORD_STAGING
} else {
  Write-Host ""
  Write-Host "SKIP staging: set SUPABASE_PROJECT_REF_STAGING and SUPABASE_DB_PASSWORD_STAGING to enable."
}

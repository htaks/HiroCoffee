#!/usr/bin/env bash
# Sync migrations and Edge Functions to one Supabase project.
# Usage: sync-supabase-env.sh [production|staging]
set -euo pipefail

TARGET="${1:-all}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FUNCTIONS=(
  create-reservation
  line-oauth
  notify-ready
  check-line-friend
  sync-reservation-history
)

trim() {
  printf '%s' "$1" | tr -d '\r\n'
}

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "ERROR: $name is not set" >&2
    exit 1
  fi
}

db_region_for() {
  case "$1" in
    ytyllufahvcrmirxhlaf) echo "ap-northeast-1" ;;
    zvatauolaadkvyspenfm) echo "ap-southeast-1" ;;
    *) echo "ap-northeast-1" ;;
  esac
}

db_push_for() {
  local project_ref="$1"
  local db_password="$2"
  local region encoded url
  region="$(db_region_for "$project_ref")"
  encoded=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$db_password")

  local urls=(
    "postgresql://postgres:${encoded}@db.${project_ref}.supabase.co:5432/postgres"
    "postgresql://postgres.${project_ref}:${encoded}@aws-1-${region}.pooler.supabase.com:5432/postgres"
    "postgresql://postgres.${project_ref}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres"
    "postgresql://postgres.${project_ref}:${encoded}@aws-1-${region}.pooler.supabase.com:6543/postgres"
    "postgresql://postgres.${project_ref}:${encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres"
  )

  local last_error=""
  for url in "${urls[@]}"; do
    local host
    host="$(python3 -c "import sys, urllib.parse as u; print(u.urlparse(sys.argv[1]).hostname or '')" "$url")"
    echo ">> db push via ${host}"
    if supabase db push --db-url "$url"; then
      echo ">> db push succeeded via ${host}"
      return 0
    fi
    last_error="$host"
  done

  echo "ERROR: db push failed for all connection URLs (last host: ${last_error})" >&2
  return 1
}

write_config() {
  local project_ref="$1"
  cat > supabase/config.toml <<EOF
project_id = "${project_ref}"

[db]
major_version = 15
EOF
}

sync_one() {
  local label="$1"
  local project_ref="$2"
  local db_password="$3"

  db_password="$(trim "$db_password")"
  project_ref="$(trim "$project_ref")"

  echo ""
  echo "========== Supabase sync: $label ($project_ref) =========="

  write_config "$project_ref"

  export SUPABASE_ACCESS_TOKEN

  echo ">> supabase login (access token)"
  supabase login --token "$SUPABASE_ACCESS_TOKEN"

  echo ">> db push (try direct + pooler URLs)"
  db_push_for "$project_ref" "$db_password"

  echo ">> deploy Edge Functions"
  for fn in "${FUNCTIONS[@]}"; do
    echo "   deploy $fn"
    supabase functions deploy "$fn" --project-ref "$project_ref"
  done

  if [ -n "${LINE_LOGIN_CHANNEL_ID:-}" ] && [ -n "${LINE_LOGIN_CHANNEL_SECRET:-}" ] && [ -n "${LINE_CHANNEL_ACCESS_TOKEN:-}" ]; then
    echo ">> set Edge Function secrets"
    supabase secrets set \
      LINE_LOGIN_CHANNEL_ID="$(trim "$LINE_LOGIN_CHANNEL_ID")" \
      LINE_LOGIN_CHANNEL_SECRET="$(trim "$LINE_LOGIN_CHANNEL_SECRET")" \
      LINE_CHANNEL_ACCESS_TOKEN="$(trim "$LINE_CHANNEL_ACCESS_TOKEN")" \
      --project-ref "$project_ref"
  else
    echo ">> skip secrets (LINE_* env vars not set)"
  fi

  echo ">> done: $label"
}

echo "Supabase CLI: $(supabase --version)"
echo "Target: $TARGET"

require_var SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN

case "$TARGET" in
  production)
    require_var SUPABASE_PROJECT_REF_PRODUCTION
    require_var SUPABASE_DB_PASSWORD_PRODUCTION
    sync_one "production" "$SUPABASE_PROJECT_REF_PRODUCTION" "$SUPABASE_DB_PASSWORD_PRODUCTION"
    ;;
  staging)
    require_var SUPABASE_PROJECT_REF_STAGING
    require_var SUPABASE_DB_PASSWORD_STAGING
    sync_one "staging" "$SUPABASE_PROJECT_REF_STAGING" "$SUPABASE_DB_PASSWORD_STAGING"
    ;;
  all)
    require_var SUPABASE_PROJECT_REF_PRODUCTION
    require_var SUPABASE_DB_PASSWORD_PRODUCTION
    sync_one "production" "$SUPABASE_PROJECT_REF_PRODUCTION" "$SUPABASE_DB_PASSWORD_PRODUCTION"
    if [ -n "${SUPABASE_PROJECT_REF_STAGING:-}" ] && [ -n "${SUPABASE_DB_PASSWORD_STAGING:-}" ]; then
      sync_one "staging" "$SUPABASE_PROJECT_REF_STAGING" "$SUPABASE_DB_PASSWORD_STAGING"
    else
      echo "SKIP staging: set SUPABASE_PROJECT_REF_STAGING and SUPABASE_DB_PASSWORD_STAGING."
    fi
    ;;
  *)
    echo "Unknown target: $TARGET (use production, staging, or all)" >&2
    exit 1
    ;;
esac

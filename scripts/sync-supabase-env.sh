#!/usr/bin/env bash
# Sync migrations and Edge Functions to production + staging Supabase projects.
set -euo pipefail

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

sync_one() {
  local label="$1"
  local project_ref="$2"
  local db_password="$3"

  db_password="$(trim "$db_password")"
  project_ref="$(trim "$project_ref")"

  echo ""
  echo "========== Supabase sync: $label ($project_ref) =========="

  export SUPABASE_ACCESS_TOKEN
  export SUPABASE_PROJECT_ID="$project_ref"
  export SUPABASE_DB_PASSWORD="$db_password"

  echo ">> supabase link"
  supabase link --project-ref "$project_ref" --password "$db_password"

  echo ">> db push"
  supabase db push

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

require_var SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN

require_var SUPABASE_PROJECT_REF_PRODUCTION
require_var SUPABASE_DB_PASSWORD_PRODUCTION

sync_one "production" "$SUPABASE_PROJECT_REF_PRODUCTION" "$SUPABASE_DB_PASSWORD_PRODUCTION"

if [ -n "${SUPABASE_PROJECT_REF_STAGING:-}" ] && [ -n "${SUPABASE_DB_PASSWORD_STAGING:-}" ]; then
  sync_one "staging" "$SUPABASE_PROJECT_REF_STAGING" "$SUPABASE_DB_PASSWORD_STAGING"
else
  echo ""
  echo "SKIP staging: set SUPABASE_PROJECT_REF_STAGING and SUPABASE_DB_PASSWORD_STAGING to enable."
fi

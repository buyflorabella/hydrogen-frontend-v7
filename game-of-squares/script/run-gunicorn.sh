#!/usr/bin/env bash
set -e

# Load settings via auto-detector
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${BASE_DIR}/settings.sh"

BACKEND_PATH="$WORKTREE_ROOT/$BACKEND_DIR"

# ─── Export infrastructure vars ────────────────────────────────
export BACKEND_HOST="${BACKEND_HOST}"
export BACKEND_PORT="${BACKEND_PORT}"
export ALLOWED_CORS_DOMAINS="${ALLOWED_CORS_DOMAINS}"

# ─── Export GARDEN_* vars for Flask (app/config.py) ────────────
[[ -n "${GARDEN_MONGO_URI:-}" ]]            && export GARDEN_MONGO_URI
[[ -n "${GARDEN_MONGO_DB:-}" ]]             && export GARDEN_MONGO_DB
[[ -n "${GARDEN_SECRET_KEY:-}" ]]           && export GARDEN_SECRET_KEY
[[ -n "${GARDEN_DEV_MODE:-}" ]]             && export GARDEN_DEV_MODE
[[ -n "${GARDEN_COOLDOWN_SECONDS:-}" ]]     && export GARDEN_COOLDOWN_SECONDS
[[ -n "${GARDEN_REVEAL_MS:-}" ]]            && export GARDEN_REVEAL_MS
[[ -n "${GARDEN_TILE_COUNT:-}" ]]           && export GARDEN_TILE_COUNT
[[ -n "${GARDEN_SQUARES_PER_GARDEN:-}" ]]   && export GARDEN_SQUARES_PER_GARDEN
[[ -n "${GARDEN_REWARD_1_WEIGHT:-}" ]]      && export GARDEN_REWARD_1_WEIGHT
[[ -n "${GARDEN_REWARD_2_WEIGHT:-}" ]]      && export GARDEN_REWARD_2_WEIGHT
[[ -n "${GARDEN_REWARD_3_WEIGHT:-}" ]]      && export GARDEN_REWARD_3_WEIGHT
export GARDEN_PORT="${BACKEND_PORT}"

echo "═══════════════════════════════════════════════"
echo " Memory Garden — Gunicorn"
echo "═══════════════════════════════════════════════"
echo " Environment : ${ENV}"
echo " Workers     : ${WORKERS}"
echo " Bind        : ${BACKEND_HOST}:${BACKEND_PORT}"
echo " Dev Mode    : ${GARDEN_DEV_MODE:-false}"
echo "═══════════════════════════════════════════════"

cd "${BACKEND_PATH}"
exec "${PYTHON_BIN}" -m gunicorn \
    -k eventlet \
    -w "${WORKERS}" \
    -b "${BACKEND_HOST}:${BACKEND_PORT}" \
    "${BACKEND_APP_SCRIPT}:app"

#!/usr/bin/env bash
set -e

# Load settings via auto-detector
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${BASE_DIR}/settings.sh"

FRONTEND_PATH="$WORKTREE_ROOT/$FRONTEND_DIR"

# Generate .env for Vite
"${BASE_DIR}/generate-env.sh"

echo "Environment: ${ENV}"
echo "FRONTEND_PORT=${FRONTEND_PORT}"
echo "Starting Vite dev server..."

cd "$FRONTEND_PATH"
npm run dev -- --host --port "$FRONTEND_PORT"

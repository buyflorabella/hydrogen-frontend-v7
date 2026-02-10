#!/usr/bin/env bash
#
# Environment auto-detector
#
# Inspects $PWD to determine whether we're in a dev, staging, or prod worktree,
# then sources the appropriate environment-specific settings file
# along with the shared settings.txt.
#
# Usage: source script/settings.sh   (from a dev/, staging/, or prod/ worktree)
#

# Resolve the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect environment from caller's working directory
if [[ "$PWD" == */dev/* || "$PWD" == */dev ]]; then
    DETECTED_ENV="dev"
    WORKTREE_ROOT="${PWD%%/dev/*}/dev"
    [[ "$PWD" == */dev ]] && WORKTREE_ROOT="$PWD"
elif [[ "$PWD" == */staging/* || "$PWD" == */staging ]]; then
    DETECTED_ENV="staging"
    WORKTREE_ROOT="${PWD%%/staging/*}/staging"
    [[ "$PWD" == */staging ]] && WORKTREE_ROOT="$PWD"
elif [[ "$PWD" == */prod/* || "$PWD" == */prod ]]; then
    DETECTED_ENV="prod"
    WORKTREE_ROOT="${PWD%%/prod/*}/prod"
    [[ "$PWD" == */prod ]] && WORKTREE_ROOT="$PWD"
else
    # Fallback: default to dev when running from the project root directly
    DETECTED_ENV="dev"
    WORKTREE_ROOT="$PWD"
fi

# Source shared settings first
if [[ -f "$SCRIPT_DIR/settings.txt" ]]; then
    source "$SCRIPT_DIR/settings.txt"
fi

# Source environment-specific settings (overrides shared where applicable)
if [[ -f "$SCRIPT_DIR/settings.${DETECTED_ENV}.sh" ]]; then
    source "$SCRIPT_DIR/settings.${DETECTED_ENV}.sh"
else
    echo "ERROR: Missing $SCRIPT_DIR/settings.${DETECTED_ENV}.sh" >&2
    return 1 2>/dev/null || exit 1
fi

# Export all environment variables
export ENV DETECTED_ENV WORKTREE_ROOT SCRIPT_DIR
export SERVER_ID FRONTEND_PORT BACKEND_PORT NODE_ENV DEBUG
export FRONTEND_DIR FRONTEND_HOST PYTHON_BIN
export WORKERS BACKEND_DIR BACKEND_APP_SCRIPT BACKEND_HOST
export ALLOWED_CORS_DOMAINS

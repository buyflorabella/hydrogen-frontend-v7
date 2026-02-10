#!/usr/bin/env bash
#
# Dev environment settings
# Overrides values from settings.txt for local development.
#

# ─── Infrastructure ─────────────────────────────────────────────
ENV=development
SERVER_ID=1
FRONTEND_PORT=15001
BACKEND_PORT=15002
NODE_ENV=development
DEBUG=true

# ─── Application overrides ─────────────────────────────────────
# Enable dev tools panel + /api/dev/* routes
GARDEN_DEV_MODE="true"

# Shorter cooldown for rapid iteration (10 seconds instead of 24h)
# Uncomment to override the 86400 default from settings.txt:
# GARDEN_COOLDOWN_SECONDS="10"

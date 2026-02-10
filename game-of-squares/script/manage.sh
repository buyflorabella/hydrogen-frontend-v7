#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${BASE_DIR}/settings.txt"

case "$1" in
  --frontend)
    "${BASE_DIR}/run-frontend.sh"
    ;;
  --backend)
    "${BASE_DIR}/run-backend.sh"
    ;;
  --gunicorn)
    "${BASE_DIR}/run-gunicorn.sh"
    ;;
  *)
    echo "Usage:"
    echo "  ./script/manage.sh --frontend   # Start React frontend (Vite dev server)"
    echo "  ./script/manage.sh --backend    # Start Flask backend (development)"
    echo "  ./script/manage.sh --gunicorn   # Start Flask backend (Gunicorn production)"
    ;;
esac

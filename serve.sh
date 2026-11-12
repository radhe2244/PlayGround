#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8000}"
echo "Studio Story is running at http://localhost:${PORT}"
exec python3 -m http.server "$PORT" --bind 127.0.0.1

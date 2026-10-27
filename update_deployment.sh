#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Update repo and rebuild frontend
git pull --ff-only
bun install --frozen-lockfile
(cd frontend && bun install --frozen-lockfile && bun run build)

# Restart the service (need daemon-reload, enable and start first time)
sudo systemctl restart myapp.service
sudo systemctl status myapp.service --no-pager

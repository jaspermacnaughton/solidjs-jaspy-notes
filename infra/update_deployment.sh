#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Update repo and rebuild frontend
git pull --ff-only
bun install --frozen-lockfile
(cd frontend && bun install --frozen-lockfile && bun run build)

# Install the service unit, filling in this machine's user, repo and bun paths
service_user="${SUDO_USER:-$(id -un)}"
bun_path="$(command -v bun)"
sed -e "s|@USER@|$service_user|" -e "s|@REPO@|$PWD|" -e "s|@BUN@|$bun_path|" \
  infra/jaspy-notes.service.template | sudo tee /etc/systemd/system/jaspy-notes.service > /dev/null

# Reload the unit, make sure it starts on boot, and restart with the new code
sudo systemctl daemon-reload
sudo systemctl enable jaspy-notes.service
sudo systemctl restart jaspy-notes.service
sudo systemctl status jaspy-notes.service --no-pager

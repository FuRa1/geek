#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Moves the stack from the Lenovo L590 to the HP T640. Run it ON THE LENOVO.
#
#   ./scripts/migrate-to-t640.sh t640            # Tailscale MagicDNS name
#   ./scripts/migrate-to-t640.sh user@100.x.y.z  # or an explicit target
#
# Sequence:
#   1. fresh backup here
#   2. stop the stack here, so nothing writes after the snapshot
#   3. copy the repo + archive to /opt/home-infra on the target
#   4. restore there
#
# The Lenovo stack is left STOPPED but intact — bring it back with
# `docker compose up -d` if the cutover has to be reverted. Do not run both
# at once: they would race for the same certificate and the same DNS name.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

TARGET=${1:?usage: $0 <[user@]host>}
REMOTE_DIR=${2:-/opt/home-infra}

command -v rsync >/dev/null || { echo "rsync is required" >&2; exit 1; }

echo "==> checking connectivity to $TARGET"
ssh "$TARGET" 'docker --version && docker compose version' \
	|| { echo "target needs docker + compose v2" >&2; exit 1; }

echo "==> taking a fresh backup"
./scripts/backup.sh
ARCHIVE=$(ls -1t backups/home-infra-*.tar.gz | head -1)
echo "    $ARCHIVE"

echo "==> stopping the local stack (the snapshot is now authoritative)"
docker compose down

echo "==> creating $REMOTE_DIR on $TARGET"
ssh "$TARGET" "sudo mkdir -p '$REMOTE_DIR' && sudo chown \$(id -u):\$(id -g) '$REMOTE_DIR'"

echo "==> copying the stack"
# Configuration only. Runtime data and secrets travel inside the archive,
# which restore.sh unpacks with the right ownership and modes.
rsync -a --info=progress2 \
	--exclude=.git --exclude=.env --exclude=data --exclude=backups \
	--exclude=guacamole/schema \
	./ "$TARGET:$REMOTE_DIR/"

echo "==> copying the archive"
ssh "$TARGET" "mkdir -p '$REMOTE_DIR/backups'"
rsync -a --info=progress2 "$ARCHIVE" "$TARGET:$REMOTE_DIR/backups/"

cat <<EOF

Staged on $TARGET. Finish there:

  ssh $TARGET
  cd $REMOTE_DIR
  ./scripts/restore.sh backups/$(basename "$ARCHIVE")

Before the stack can serve traffic, on the T640's site:
  * forward TCP 80 and 443 to the T640
  * point CADDY_DOMAIN at the new public IP and let the record propagate
    (certificate renewal needs port 80 to reach this host)
  * if the hostname itself changes, edit CADDY_DOMAIN in .env and update the
    domain on authentik's providers before restarting caddy

Once it answers on https://, tear the Lenovo copy down for good:
  docker compose down --volumes   # on the Lenovo, after you trust the T640
EOF

#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Restores a backup.sh archive into the current directory. Intended for a
# fresh host (the T640) or a rebuild after a failure.
#
#   ./scripts/restore.sh backups/home-infra-2026-09-12T031500.tar.gz
#
# What it does:
#   1. unpacks the archive to a temp dir
#   2. restores .env and the runtime data directories
#   3. starts postgres alone, waits for it, replays the logical dump
#   4. starts the rest of the stack
#
# Destructive: it replaces .env and ${DATA_ROOT}, and the dump was taken with
# --clean --if-exists, so it drops and recreates every database it contains.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ARCHIVE=${1:?usage: $0 <archive.tar.gz>}
[[ -f "$ARCHIVE" ]] || { echo "no such archive: $ARCHIVE" >&2; exit 1; }
ARCHIVE=$(readlink -f "$ARCHIVE")

read -rp "This overwrites .env and all runtime data in $PWD. Continue? [y/N] " ok
[[ "$ok" == [yY] ]] || exit 1

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
umask 077

echo "==> unpacking"
tar xzf "$ARCHIVE" -C "$WORK"
SRC=$(find "$WORK" -maxdepth 1 -type d -name 'home-infra-*' | head -1)
[[ -n "$SRC" ]] || { echo "archive layout not recognised" >&2; exit 1; }

echo "==> stopping stack"
docker compose down --remove-orphans || true

echo "==> restoring .env and runtime data"
cp "$SRC/.env" .env
chmod 600 .env
# shellcheck disable=SC1091
set -a; source .env; set +a

rm -rf "${DATA_ROOT:?}"
mkdir -p "${DATA_ROOT}"
[[ -d "$SRC/data" ]] && rsync -a "$SRC/data/" "${DATA_ROOT%/}/"

echo "==> regenerating Guacamole schema for ${GUACAMOLE_TAG}"
./scripts/init-guac-schema.sh

echo "==> starting postgres"
docker compose up -d postgres
until docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
	printf '.'; sleep 2
done
echo

echo "==> replaying dump"
# Not run with ON_ERROR_STOP: a fresh container has already created the roles
# and databases named in the dump, so pg_dumpall's leading DROP ROLE /
# CREATE ROLE statements fail — including "current user cannot be dropped".
# Those errors are expected. Anything else is not, so the log is kept.
LOG="restore-$(date +%Y-%m-%dT%H%M%S).log"
gzip -dc "$SRC/postgres.sql.gz" \
	| docker compose exec -T postgres psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
	> "$LOG" 2>&1 || true

if grep -v -e 'role ".*" already exists' \
           -e 'current user cannot be dropped' \
           -e 'is being used by other users' \
           -e 'must be owner of' \
           "$LOG" | grep -q '^ERROR'; then
	echo "unexpected errors during replay — review $LOG before trusting this restore" >&2
else
	echo "    replay clean (benign role errors filtered; full log in $LOG)"
fi

echo "==> starting the rest of the stack"
docker compose up -d

cat <<EOF

Restored. Check:
  docker compose ps
  docker compose logs -f authentik-server
  https://${CADDY_DOMAIN}/

If the hostname changed, update CADDY_DOMAIN in .env, reissue certificates
(docker compose restart caddy) and fix the domain on authentik's providers.
EOF

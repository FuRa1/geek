#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Timestamped backup of everything needed to rebuild this stack elsewhere:
#
#   .env                      the secrets (mode 600 inside the archive)
#   postgres.sql.gz           logical dump of ALL databases, taken live
#   data/authentik/           media, custom templates, outpost certs
#   data/guacamole/           session recordings, shared drive
#   data/caddy/               ACME account + issued certificates
#
# ${DATA_ROOT}/postgres is deliberately NOT archived — a file-level copy of a
# running cluster is not crash-consistent, and the logical dump restores into
# any 16.x server regardless of page layout.
#
#   ./scripts/backup.sh [destination-dir]     (default: ./backups)
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# shellcheck disable=SC1091
set -a; source .env; set +a

command -v rsync >/dev/null || { echo "rsync is required (apt install rsync)" >&2; exit 1; }

DEST=${1:-./backups}
STAMP=$(date +%Y-%m-%dT%H%M%S)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$DEST"
umask 077

echo "==> dumping postgres"
docker compose exec -T postgres \
	pg_dumpall --username "$POSTGRES_USER" --clean --if-exists \
	| gzip -9 > "$WORK/postgres.sql.gz"

# A dump that failed mid-stream still leaves a valid gzip, so check the tail.
gzip -t "$WORK/postgres.sql.gz"
grep -q 'PostgreSQL database cluster dump complete' < <(gzip -dc "$WORK/postgres.sql.gz" | tail -5) \
	|| { echo "pg_dumpall did not complete — aborting" >&2; exit 1; }

echo "==> staging configuration and runtime data"
STAGE="$WORK/home-infra-$STAMP"
mkdir -p "$STAGE"
mv "$WORK/postgres.sql.gz" "$STAGE/"
cp .env "$STAGE/.env"
cp compose.yml "$STAGE/"
cp -r caddy authentik guacamole postgres scripts docs "$STAGE/"

# Runtime data, minus the two directories the logical dump supersedes.
rsync -a --exclude=postgres --exclude=redis "${DATA_ROOT%/}/" "$STAGE/data/"

ARCHIVE="$DEST/home-infra-$STAMP.tar.gz"
tar czf "$ARCHIVE" -C "$WORK" "home-infra-$STAMP"
chmod 600 "$ARCHIVE"

echo "==> $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
echo
echo "This archive contains .env in clear text. Store it encrypted:"
echo "  gpg --symmetric --cipher-algo AES256 $ARCHIVE && rm $ARCHIVE"
echo
echo "Keeping the 14 most recent archives:"
ls -1t "$DEST"/home-infra-*.tar.gz 2>/dev/null | tail -n +15 | while read -r old; do
	echo "  removing $old"; rm -f "$old"
done

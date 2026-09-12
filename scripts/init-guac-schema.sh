#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Generates guacamole/schema/initdb.sql — the PostgreSQL DDL for Guacamole's
# JDBC auth extension. The file is produced by the Guacamole image itself, so
# it always matches ${GUACAMOLE_TAG}; it is vendor output and stays out of Git.
#
# Run this BEFORE the first `docker compose up`: postgres only executes its
# init scripts against an empty data directory.
#
#   ./scripts/init-guac-schema.sh
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

[[ -f .env ]] || { echo ".env not found — run ./scripts/init-secrets.sh first" >&2; exit 1; }

# shellcheck disable=SC1091
set -a; source .env; set +a

: "${GUACAMOLE_TAG:?GUACAMOLE_TAG missing from .env}"

mkdir -p guacamole/schema
out=guacamole/schema/initdb.sql

docker run --rm "guacamole/guacamole:${GUACAMOLE_TAG}" \
	/opt/guacamole/bin/initdb.sh --postgresql > "$out"

[[ -s "$out" ]] || { echo "generated schema is empty — check the image tag" >&2; rm -f "$out"; exit 1; }

printf 'wrote %s (%s bytes, guacamole %s)\n' "$out" "$(wc -c < "$out")" "$GUACAMOLE_TAG"

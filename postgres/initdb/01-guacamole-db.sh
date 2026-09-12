#!/bin/bash
# ---------------------------------------------------------------------------
# Runs once, on the very first boot of an empty postgres data directory.
# Creates the Guacamole role + database alongside authentik's, in the same
# instance. The schema itself is loaded by 02-load-guacamole-schema.sh.
# ---------------------------------------------------------------------------
set -euo pipefail

: "${GUACAMOLE_DB_NAME:?GUACAMOLE_DB_NAME is required}"
: "${GUACAMOLE_DB_USER:?GUACAMOLE_DB_USER is required}"
: "${GUACAMOLE_DB_PASSWORD:?GUACAMOLE_DB_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE ROLE "${GUACAMOLE_DB_USER}" WITH LOGIN PASSWORD '${GUACAMOLE_DB_PASSWORD}';
	CREATE DATABASE "${GUACAMOLE_DB_NAME}" OWNER "${GUACAMOLE_DB_USER}";
EOSQL

# Make sure objects created by the schema load (which runs as the superuser)
# end up owned by the guacamole role.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${GUACAMOLE_DB_NAME}" <<-EOSQL
	ALTER SCHEMA public OWNER TO "${GUACAMOLE_DB_USER}";
	GRANT ALL ON SCHEMA public TO "${GUACAMOLE_DB_USER}";
EOSQL

echo "initdb: created database ${GUACAMOLE_DB_NAME} owned by ${GUACAMOLE_DB_USER}"

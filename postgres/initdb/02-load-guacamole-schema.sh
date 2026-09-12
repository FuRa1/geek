#!/bin/bash
# ---------------------------------------------------------------------------
# Loads the Guacamole JDBC schema into the database created by 01-*.sh.
#
# The .sql files in /docker-entrypoint-initdb.d are applied to $POSTGRES_DB
# (authentik's database), which is the wrong target — hence this wrapper,
# which points psql at the guacamole database explicitly.
#
# The DDL is vendor output, not something to hand-edit or commit. Generate it
# with scripts/init-guac-schema.sh BEFORE the first `docker compose up`.
# ---------------------------------------------------------------------------
set -euo pipefail

SCHEMA=/schema/initdb.sql

if [[ ! -s "$SCHEMA" ]]; then
	echo "initdb: FATAL — $SCHEMA is missing or empty." >&2
	echo "initdb: run ./scripts/init-guac-schema.sh, then delete the postgres" >&2
	echo "initdb: data directory and bring the stack up again." >&2
	exit 1
fi

psql -v ON_ERROR_STOP=1 \
	--username "$POSTGRES_USER" \
	--dbname "${GUACAMOLE_DB_NAME}" \
	--file "$SCHEMA"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${GUACAMOLE_DB_NAME}" <<-EOSQL
	GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${GUACAMOLE_DB_USER}";
	GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO "${GUACAMOLE_DB_USER}";
EOSQL

echo "initdb: loaded Guacamole schema into ${GUACAMOLE_DB_NAME}"

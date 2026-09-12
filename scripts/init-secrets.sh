#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Creates .env from .env.example, filling every CHANGE_ME with a fresh random
# value. Run once per host. Refuses to touch an existing .env — rotating a
# secret in place would orphan the data encrypted or authenticated with it.
#
#   ./scripts/init-secrets.sh
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ -f .env ]]; then
	echo "refusing to overwrite an existing .env" >&2
	echo "to start over: mv .env .env.bak && $0" >&2
	exit 1
fi

command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }

gen() { openssl rand -base64 36 | tr -d '\n=+/' | cut -c1-40; }

umask 077
cp .env.example .env

while IFS= read -r line; do
	case "$line" in
		*CHANGE_ME*)
			key=${line%%=*}
			printf 'generated %s\n' "$key"
			# Escape & and | so sed's replacement text stays literal.
			value=$(gen | sed 's/[&|]/\\&/g')
			sed -i "s|^${key}=CHANGE_ME$|${key}=${value}|" .env
			;;
	esac
done < .env.example

chmod 600 .env

cat <<'EOF'

.env created with mode 600. Still to do by hand:

  CADDY_DOMAIN              your public hostname
  CADDY_EMAIL               Let's Encrypt contact address
  AUTHENTIK_BOOTSTRAP_EMAIL initial admin login

Then: ./scripts/init-guac-schema.sh && docker compose up -d
EOF

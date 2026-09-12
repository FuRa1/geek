# Secrets

## The rule

`.env` is the only file in this tree that holds secrets, it is git-ignored,
and it is created on the host at deploy time. Everything else — `compose.yml`,
the `Caddyfile`, the scripts — reads from it by variable name and can be
published without redaction.

Check before every commit:

```bash
git diff --cached --name-only | grep -E '(^|/)\.env$' && echo "STOP"
git diff --cached -S'CHANGE_ME' --stat        # a real value replacing a placeholder
```

If a secret ever does land in a commit, rotating it is the fix. Rewriting
history is not — assume anything pushed has been read.

## What each secret is

| Variable | What it protects | Rotating it costs |
|---|---|---|
| `AUTHENTIK_SECRET_KEY` | signs sessions and tokens | every session invalidated; everyone logs in again |
| `AUTHENTIK_BOOTSTRAP_PASSWORD` | initial `akadmin` login | nothing after first boot — change the password in the UI and blank this |
| `AUTHENTIK_BOOTSTRAP_TOKEN` | initial API token | nothing after first boot |
| `POSTGRES_PASSWORD` | authentik's database role | must be changed in the database too, see below |
| `GUACAMOLE_DB_PASSWORD` | Guacamole's database role | same |
| `CADDY_EMAIL` | not a secret — Let's Encrypt contact | — |

The secrets that are *not* in `.env` and never should be: the WireGuard
private keys on the AX12, host SSH keys, Tailscale auth keys, the Telegram bot
token that existing Uptime Kuma uses. None of them belong to this stack.

## Generating

`scripts/init-secrets.sh` fills every `CHANGE_ME` with 40 characters from
`openssl rand -base64 36`, stripping `=+/` so the values survive shell and
compose interpolation unquoted. By hand:

```bash
openssl rand -base64 36 | tr -d '\n=+/' | cut -c1-40
```

Do not use a password manager's "memorable" generator here. These are never
typed.

## Rotating a database password

Changing `POSTGRES_PASSWORD` in `.env` alone breaks the stack — the role in
the database still has the old one. Both sides, in order:

```bash
docker compose exec postgres psql -U "$POSTGRES_USER" -c \
  "ALTER ROLE \"$POSTGRES_USER\" WITH PASSWORD 'new-value';"
$EDITOR .env          # set the same value
docker compose up -d --force-recreate authentik-server authentik-worker
```

Same shape for `GUACAMOLE_DB_PASSWORD`, recreating `guacamole`.

## Backups contain secrets

`backup.sh` puts `.env` inside the archive — a restore is useless without it.
That makes every archive as sensitive as the host. It is written mode 600 and
never leaves the host unencrypted:

```bash
gpg --symmetric --cipher-algo AES256 backups/home-infra-<stamp>.tar.gz
rm backups/home-infra-<stamp>.tar.gz
```

Store the passphrase somewhere that is not this host and not the same failure
domain — losing it loses every backup.

## `.env` on the managed MacBook

It should never be there. That machine reaches the stack through the browser
only: HTTPS → authentik → Guacamole → RDP. No SSH keys, no `.env`, no
`docker compose` against a remote socket.

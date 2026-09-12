# home-infra

Portable, security-hardened web-control stack. Runs today on the Lenovo L590
(Nazaré), designed to move to the HP T640 (Bulgaria) by archive-and-restore
rather than by rebuild.

```
Internet ──443──► Caddy ──forward_auth──► authentik ──► Guacamole ──► RDP/SSH
```

Deploy to `/opt/home-infra`, not a home directory — nothing here depends on
the path, but keeping it off `/home` is what makes the host replaceable.

## Quick start

```bash
./scripts/init-secrets.sh        # .env with random secrets, mode 600
$EDITOR .env                     # CADDY_DOMAIN, CADDY_EMAIL, emails
./scripts/init-guac-schema.sh    # MUST run before the first `up`
docker compose up -d
```

Then [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the authentik and Guacamole
setup — the stack is not enforcing anything until the proxy provider is
attached to the embedded outpost.

## Layout

| Path | |
|---|---|
| `compose.yml` | the whole stack; no secrets, no host IPs |
| `.env.example` | template — every real value is `CHANGE_ME` |
| `caddy/Caddyfile` | routing, TLS, the `forward_auth` gate |
| `postgres/initdb/` | one-time database + schema creation |
| `guacamole/schema/` | generated DDL (git-ignored) |
| `scripts/` | secrets, schema, backup, restore, migrate |
| `kuma/` | Uptime Kuma notes and status-page themes (not part of the stack) |
| `docs/` | architecture, deployment, secrets, troubleshooting |
| `data/` | all runtime state (git-ignored) |
| `backups/` | archives (git-ignored) |

## Scripts

| | |
|---|---|
| `init-secrets.sh` | create `.env`; refuses to overwrite one |
| `init-guac-schema.sh` | generate Guacamole DDL from the pinned image |
| `backup.sh` | `pg_dumpall` + `.env` + runtime data → one archive |
| `restore.sh` | rebuild a host from an archive |
| `migrate-to-t640.sh` | backup, stop, ship to the new host |

## Rules this repo keeps

- **No secrets in Git.** `.env` only, created on the host. See
  [docs/SECRETS.md](docs/SECRETS.md).
- **No host IPs in config.** Services address each other by container name.
  The LAN addresses Guacamole connects *to* live in its database and travel in
  the backup.
- **One public port.** Only Caddy publishes anything. SSH, RDP and Ollama are
  never exposed — they are reached through Guacamole or Tailscale.
- **Pinned images.** Every tag is an explicit version in `.env`, bumped
  deliberately after a backup.
- **The AX12 WireGuard config is out of scope.** It works; nothing here
  touches it.

## Not in this stack

**Uptime Kuma** keeps running as it does today, standalone on the Lenovo with
its own Telegram alerting, reached over Tailscale on `:3001`. Adopting it here
would recreate the container, and it has no sub-path support so it cannot be
published under this hostname anyway. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) § Uptime Kuma.

Its status-page themes live in [`kuma/themes/`](kuma/) — paste-in Custom CSS,
versioned here because they are hand-written and easy to lose.

**Open WebUI / Ollama** is Phase 2. Ollama stays bound to the LAN and
Tailscale; if a web UI goes in front of it, it goes behind the same
`forward_auth` gate as everything else.

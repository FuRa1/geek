# Deployment

This is the existing full-stack runbook. Follow the
[implementation plan](IMPLEMENTATION_PLAN.md) and its
[technical version](reference/IASC-VSCode-Chat-Guide.md) for stage order and status.
Host execution has not been verified by the plan revision. Local stages 2–3 need
selective startup; stage 4 tests an isolated HTTPS endpoint, and working apps are
published after stage 5 verifies 2FA. The current 80/443 configuration is pending
the plan's 443-only decision. Review backup/restore and migration helpers before
stages 8–10; the current migration helper stops Lenovo before target validation.

All deployment and lifecycle operations on Lenovo are SSH-only. Connect from the
workstation and run clone/pull, `.env`, runtime data, Docker commands, settings,
backups, restores and updates inside that SSH session. Running the stack locally
is not part of the supported workflow.

## Prerequisites on the host

- Ubuntu 24.04, Docker Engine + Compose v2 (`docker compose version` ≥ 2.20)
- `openssl`, `rsync`
- TCP 80 and 443 forwarded from the router to this host
- `CADDY_DOMAIN` resolving to the site's public IP **before** first start —
  Let's Encrypt validates over port 80 and will fail otherwise

Port 80 stays open permanently. It is not an oversight: HTTP-01 renewal needs
it every 60 days, and Caddy answers it with a redirect to HTTPS.

## First deployment (Lenovo L590)

```bash
ssh user@lenovo

sudo mkdir -p /opt/home-infra
sudo chown "$USER":"$USER" /opt/home-infra
git clone <private-repo> /opt/home-infra
cd /opt/home-infra

./scripts/init-secrets.sh        # writes .env (mode 600) with random secrets
$EDITOR .env                     # set CADDY_DOMAIN, CADDY_EMAIL, emails

./scripts/init-guac-schema.sh    # MUST run before the first `up`

docker compose up -d
docker compose logs -f caddy authentik-server
```

authentik takes 60–90 seconds to migrate its database on first boot. Wait for
its healthcheck to pass before judging anything:

```bash
docker compose ps            # authentik-server should read "healthy"
```

### Test the certificate first

```bash
curl -I https://$CADDY_DOMAIN/
```

If this fails, fix it before going further — every later step assumes TLS.
The usual causes are port 80 not reaching the host, or DNS not yet propagated.
Set `acme_ca` to the Let's Encrypt staging endpoint in the `Caddyfile` while
you iterate; the production endpoint rate-limits to 5 failures per hour.

## Configure authentik

1. Open `https://$CADDY_DOMAIN/if/flow/initial-setup/` and sign in as
   `akadmin` with `AUTHENTIK_BOOTSTRAP_PASSWORD`.
2. Change that password, then blank `AUTHENTIK_BOOTSTRAP_*` in `.env`
   (they are read only on first boot, but there is no reason to keep them).
3. **Enrol a second factor.** Directory → Users → akadmin → MFA. A passkey
   plus a TOTP app as backup; save the recovery codes somewhere that is not
   this host.
4. Create a **Proxy Provider**:
   - Forward auth (single application)
   - External host: `https://$CADDY_DOMAIN`
5. Create an **Application** for it (slug `guacamole`) and bind a policy —
   at minimum, "is member of group `infra-admins`".
6. Add the provider to the **embedded outpost**
   (Applications → Outposts → authentik Embedded Outpost → edit). Nothing is
   enforced until it appears there.

Verify in a private window: `https://$CADDY_DOMAIN/guacamole/` must redirect
to the authentik login flow, not show a Guacamole login form.

## Configure Guacamole

Sign in at `https://$CADDY_DOMAIN/guacamole/` as `guacadmin` / `guacadmin` —
then immediately change that password. It is the stock credential shipped in
the schema and it is the first thing anyone tries.

Add connections (Settings → Connections → New):

| | RDP to MoralMachine | SSH to MoralMachine |
|---|---|---|
| Protocol | RDP | SSH |
| Hostname | `100.84.255.108` | `100.84.255.108` |
| Port | 3389 | 22 |
| Security | NLA | — |
| Ignore cert | yes (self-signed host cert) | — |

Use the Tailscale address, not `192.168.0.129`: it keeps working after the
move to Bulgaria. Note that `guacd` reaches these over the host's network —
Tailscale must be up on the Docker host itself.

## Verify the whole chain

```
browser → https://$CADDY_DOMAIN/guacamole/
        → authentik login + 2FA
        → Guacamole login
        → RDP session to MoralMachine
```

And confirm the things that should *not* work, from outside the LAN:

```bash
nc -zv <public-ip> 3389   # must fail
nc -zv <public-ip> 22     # must fail
nc -zv <public-ip> 11434  # must fail — Ollama is never public
```

## Backups

```bash
./scripts/backup.sh                    # → backups/home-infra-<stamp>.tar.gz
```

The archive holds a live `pg_dumpall`, `.env`, and the runtime data
directories. It contains secrets in clear text — encrypt it before it leaves
the host:

```bash
gpg --symmetric --cipher-algo AES256 backups/home-infra-*.tar.gz
```

Nightly, via the host's crontab (not root's — the stack runs as your user):

```cron
30 3 * * * cd /opt/home-infra && ./scripts/backup.sh >> data/backup.log 2>&1
```

`backup.sh` keeps the 14 most recent archives. A backup you have never
restored is a hypothesis; restore one into a scratch directory once.

## Migration to the HP T640

On the Lenovo:

```bash
./scripts/migrate-to-t640.sh t640
```

It backs up, stops the local stack, and copies configuration + archive to
`/opt/home-infra` on the target. Then on the T640:

```bash
cd /opt/home-infra
./scripts/restore.sh backups/home-infra-<stamp>.tar.gz
```

Then, at the Bulgaria site:

- forward TCP 80 and 443 to the T640
- repoint `CADDY_DOMAIN` at the new public IP; wait for propagation
- if the hostname itself changes, update `CADDY_DOMAIN` in `.env` **and** the
  external host on authentik's proxy provider, then `docker compose restart caddy`

Do not run both stacks at once — they will race for the same certificate and
Let's Encrypt will rate-limit you out of both. Keep the Lenovo copy stopped
but intact until the T640 has served real traffic for a few days.

## Adding a service

1. Add the service to `compose.yml` on the `internal` network, plus `edge`
   only if Caddy must reach it. Publish no host ports.
2. Add its secrets to `.env.example` as `CHANGE_ME`.
3. Add a `handle` block to the `Caddyfile` with `forward_auth`, unless the
   service is genuinely meant to be public.
4. Create its application + provider in authentik and add it to the embedded
   outpost.
5. Confirm it survives `backup.sh` → `restore.sh`.
6. Document it in [ARCHITECTURE.md](ARCHITECTURE.md) and commit — without
   secrets.

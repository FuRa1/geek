# Troubleshooting

Start here, always:

```bash
docker compose ps            # which containers are up, which are healthy
docker compose logs --tail=100 caddy authentik-server guacamole
```

---

### Certificate never issues

```
caddy | could not get certificate from issuer ... timeout during connect
```

Let's Encrypt cannot reach port 80 on this host. In order:

```bash
curl -I http://$CADDY_DOMAIN/           # from outside the LAN, not from the host
dig +short $CADDY_DOMAIN                # does it match your public IP?
sudo ss -tlnp | grep -E ':80|:443'      # is something else already bound?
```

Testing from inside the LAN often works via hairpin NAT even when the outside
world cannot reach you — use a phone on mobile data. While iterating, switch
`acme_ca` to the staging endpoint in the `Caddyfile`: production allows 5
failed validations per account per hour.

### Redirect loop on `/guacamole/`

The browser bounces between authentik and Guacamole forever. Almost always:
the proxy provider is not attached to the embedded outpost
(Applications → Outposts → authentik Embedded Outpost → edit → add it).

The other cause is the `/outpost.goauthentik.io/*` block being moved below the
`/guacamole/*` block in the `Caddyfile`. It has to match first — the auth
check calls back into it, and gating it makes the check require itself.

### `/guacamole/` loads without asking for a login

`forward_auth` is not in effect. Check the request actually goes through Caddy:

```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
docker compose logs caddy | grep -i forward
```

If you reach Guacamole on a host port, the container is publishing one it
should not. Nothing but `caddy` may appear with a `0.0.0.0:` binding in
`docker compose ps`.

### authentik never goes healthy

First boot runs database migrations and takes 60–90 seconds; `start_period` in
the healthcheck allows for that. Beyond it:

```bash
docker compose logs authentik-server | grep -iE 'error|refused|migration'
docker compose exec postgres pg_isready -U "$POSTGRES_USER"
```

`password authentication failed` means `.env` and the database role have
drifted apart — see [SECRETS.md](SECRETS.md) § Rotating a database password.

### Guacamole: "the remote desktop server is currently unreachable"

This is `guacd` failing to dial the target, not a web-tier problem.

```bash
docker compose exec guacd getent hosts 100.84.255.108
docker compose exec guacd nc -zv 100.84.255.108 3389
```

If the Tailscale address does not resolve or connect, Tailscale is down on the
Docker *host*, or the target machine is asleep. Wake-on-LAN does not reach a
Tailscale address.

For RDP specifically: Windows must have RDP enabled, and `Security mode: NLA`
plus `Ignore server certificate: yes` set on the connection — a self-signed
host certificate otherwise fails the handshake with no useful message.

### Postgres init scripts did not run

Symptom: Guacamole logs `relation "guacamole_user" does not exist`, or the
container exits complaining the schema file is empty.

`/docker-entrypoint-initdb.d` runs **only** against an empty data directory.
If you started the stack before `scripts/init-guac-schema.sh`:

```bash
docker compose down
./scripts/init-guac-schema.sh
rm -rf data/postgres          # destroys authentik's data too — restore after
docker compose up -d
```

On an installation with real data, restore from a backup instead of deleting.

### Port already in use on 80/443

Usually a distribution nginx or apache installed as a dependency:

```bash
sudo ss -tlnp | grep -E ':80|:443'
sudo systemctl disable --now nginx apache2 2>/dev/null
```

### Uptime Kuma disappeared

It is not managed by this stack and `docker compose down` here does not touch
it. Check it directly:

```bash
docker ps -a --filter name=kuma
curl -sf http://localhost:3001/ >/dev/null && echo ok
```

If you tried publishing it under `/kuma/` and got a blank page, that is
expected — see [ARCHITECTURE.md](ARCHITECTURE.md) § Uptime Kuma.

### Everything broke after a migration

Confirm only one stack is running. Two hosts serving the same hostname will
fight over the certificate until Let's Encrypt rate-limits both:

```bash
ssh lenovo 'cd /opt/home-infra && docker compose ps'
```

Then check the restore log the script left behind (`restore-*.log`) for errors
other than the benign role ones it filters.

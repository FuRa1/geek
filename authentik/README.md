# authentik/

Identity provider and 2FA gate. Served at the root of `${CADDY_DOMAIN}`;
see [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for why it cannot live under a
sub-path.

There is no config file here. authentik is configured through its own UI and
stores everything in PostgreSQL, which means the backup archive — not this
directory — is what carries your setup between hosts.

## What has to exist for the gate to work

1. A **Proxy Provider**, mode *Forward auth (single application)*, external
   host `https://${CADDY_DOMAIN}`.
2. An **Application** bound to it (slug `guacamole`), with a policy — group
   membership is enough.
3. That provider added to the **embedded outpost**
   (Applications → Outposts → authentik Embedded Outpost).

Step 3 is the one people forget. Without it, `forward_auth` calls an endpoint
that does not know about the application, and `/guacamole/` loops.

## Runtime data

Bind-mounted under `${DATA_ROOT}/authentik/`:

- `media/` — uploaded icons, backgrounds
- `templates/` — custom email/flow templates, if you add any
- `certs/` — certificates authentik manages itself (worker only)

## Upgrades

Pin `AUTHENTIK_TAG` in `.env` and bump it deliberately. authentik runs
database migrations on start and does **not** support downgrades — back up
first, and read the release notes for the versions you skip over.

```bash
./scripts/backup.sh
$EDITOR .env                 # AUTHENTIK_TAG=...
docker compose pull authentik-server authentik-worker
docker compose up -d authentik-server authentik-worker
docker compose logs -f authentik-server
```

Server and worker must run the same version. They share the `&authentik-env`
anchor in `compose.yml` so they cannot drift on configuration, but the image
tag is one variable for both — never bump one alone.

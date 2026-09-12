# Architecture

## Request path

```
            Internet
               │  TCP 443 (and 80, for ACME + redirect) — nothing else
               ▼
        ┌─────────────┐
        │    caddy    │  TLS termination, Let's Encrypt, forward_auth
        └──┬───────┬──┘
           │       │
   /guacamole/*    └─ everything else ──► authentik-server  (login, admin, API)
           │                                    │
           │ forward_auth ──────────────────────┘
           ▼
      ┌──────────┐      ┌────────┐
      │guacamole │─────►│ guacd  │──► RDP 3389 / SSH 22 on the LAN
      └────┬─────┘      └────────┘
           │
           ▼
      ┌──────────┐   ┌───────┐
      │ postgres │   │ redis │
      └──────────┘   └───────┘
```

Two Docker networks:

- **edge** — `caddy`, `authentik-server`, `guacamole`. What the proxy can reach.
- **internal** — `postgres`, `redis`, `guacd`, `authentik-worker`, and the two
  services above. `guacd` sits here because it must dial LAN hosts.

Only `caddy` publishes host ports. Postgres, Redis, guacd and the Guacamole
webapp have no path from the LAN, let alone the Internet.

## Why authentik owns `/`

authentik cannot be hosted under a URL sub-path — its flows, API and static
assets all resolve against the origin root. A dynip hostname gives you exactly
one name, and per-app sub-domains would each need their own certificate (a
wildcard needs a DNS-01 challenge, which sapo's dynip service does not offer).

So: authentik at `/`, Guacamole at `/guacamole/`. Guacamole is the one app
that takes this gracefully — its image already serves under the `guacamole`
servlet context, so Caddy proxies the path through untouched. No
`uri strip_prefix`, no rewriting, no broken asset URLs.

## What actually enforces authentication

`forward_auth` in [`caddy/Caddyfile`](../caddy/Caddyfile). Every request to
`/guacamole/*` is first put to authentik's embedded outpost at
`/outpost.goauthentik.io/auth/caddy`. A 2xx lets the request through with the
`X-authentik-*` identity headers attached; anything else is returned to the
client verbatim — which is the 302 into the login flow.

Routing `/auth/*` to authentik *without* `forward_auth` would put a login page
on the Internet next to an unprotected Guacamole. The outpost endpoints
themselves are matched first and deliberately left open; gating them would
loop forever.

Guacamole keeps its own user database behind that gate — two credentials, not
one. To collapse them into single sign-on later, enable Guacamole's header
authentication extension and have it trust `X-authentik-username`; only do
that once you are certain nothing but Caddy can reach port 8080, because that
header then *is* the credential.

## Data

One PostgreSQL instance, two databases:

| Database | Owner | Created by |
|---|---|---|
| `authentik` | `authentik` | the postgres image, from `POSTGRES_DB` |
| `guacamole` | `guacamole` | [`postgres/initdb/01-guacamole-db.sh`](../postgres/initdb/01-guacamole-db.sh) |

Guacamole's DDL is vendor output, generated from the image itself by
`scripts/init-guac-schema.sh` so it always matches `GUACAMOLE_TAG`. It is
git-ignored and loaded by `02-load-guacamole-schema.sh`.

Both init scripts run **only against an empty data directory**. If you bring
the stack up before generating the schema, the fix is to `docker compose down`,
delete `data/postgres`, and start again.

All state is bind-mounted under `DATA_ROOT` (default `./data`) rather than
living in named volumes, so a backup is a directory copy and a migration is an
rsync.

## Portability

Nothing in `compose.yml` or the `Caddyfile` names a host, an IP or a path
outside the stack directory. Services address each other by container name.
Moving to the T640 is: archive, copy, restore, repoint DNS — see
[DEPLOYMENT.md](DEPLOYMENT.md).

The LAN addresses of the machines Guacamole connects *to* (MoralMachine at
`192.168.0.129`, or `100.84.255.108` over Tailscale) live in Guacamole's own
database, entered through its UI. They are per-site facts, so they travel in
the backup rather than in Git. Prefer the Tailscale address: it survives the
move to Bulgaria, the `192.168.0.x` one will not.

## Uptime Kuma

Kuma is not part of this stack, by choice on two counts:

1. It already runs standalone on the Lenovo with its own volume and Telegram
   alerting. Adopting it into `compose.yml` would recreate the container.
2. It has no sub-path support — under `/kuma/` its assets and its socket.io
   endpoint resolve against `/` and the dashboard never loads.

Keep reaching it over Tailscale on `:3001`. If it needs to be public, give it
a real hostname and uncomment the block at the foot of the `Caddyfile` —
noting that gating it with `forward_auth` also gates its public status pages,
which is usually the opposite of what a status page is for.

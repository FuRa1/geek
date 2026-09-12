# caddy/

TLS termination, Let's Encrypt, and the `forward_auth` gate in front of
Guacamole. See [`Caddyfile`](Caddyfile) — it is commented in place.

## Editing

```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

`reload` is graceful — no dropped connections, no certificate re-issue.
`docker compose restart caddy` is heavier and rarely what you want.

## Gotchas

- **Order matters.** `/outpost.goauthentik.io/*` must be matched before
  `/guacamole/*`, or the auth check requires itself and loops.
- **Port 80 stays open.** HTTP-01 renewal needs it every 60 days.
- **Certificates live in `${DATA_ROOT}/caddy/data`**, which `backup.sh`
  archives. Restoring them avoids a fresh issuance on the new host — useful if
  you are near a rate limit.
- **Staging endpoint while iterating.** Uncomment `acme_ca` in the global
  block; production allows 5 failed validations per hour.

## Adding a route

```caddyfile
handle /newapp/* {
	forward_auth authentik-server:9000 {
		uri /outpost.goauthentik.io/auth/caddy
		copy_headers X-authentik-username X-authentik-groups X-authentik-email
	}
	reverse_proxy newapp:8080
}
```

Place it above the final catch-all `handle`, and only omit `forward_auth` if
the route is genuinely meant to be public.

If the app does not serve itself under `/newapp`, you also need
`uri strip_prefix /newapp` — and then the app must be told its public base
path, or its own generated links will point at the origin root. Apps that
cannot do this (Uptime Kuma, authentik itself) need their own hostname.

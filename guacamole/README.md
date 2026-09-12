# guacamole/

Clientless RDP/SSH gateway, served at `https://${CADDY_DOMAIN}/guacamole/`
behind authentik.

Two containers: `guacamole` (the web app, reachable only by Caddy) and `guacd`
(the protocol daemon that actually dials RDP and SSH on the LAN).

## No `user-mapping.xml` here

The original plan called for one. This stack uses the PostgreSQL JDBC auth
backend instead, so connections and users are managed in the UI and stored in
the database.

`user-mapping.xml` would have meant connection hostnames, usernames and
passwords sitting in a file in Git — exactly what the no-secrets rule forbids.
The database also gives you per-user permissions, connection groups and
session recording, none of which the XML backend supports.

## Schema

`schema/initdb.sql` is generated from the Guacamole image itself:

```bash
./scripts/init-guac-schema.sh
```

It is vendor output, git-ignored, and must exist **before the first**
`docker compose up` — Postgres only runs its init scripts against an empty
data directory. Regenerate it whenever you bump `GUACAMOLE_TAG`; for an
existing database, the upgrade SQL ships in the image under
`/opt/guacamole/postgresql/schema/upgrade/`.

## First login

`guacadmin` / `guacadmin`. Change it immediately — it is shipped in the schema
and is the first credential anyone tries.

## Connections

Add them in Settings → Connections. Use Tailscale addresses
(`100.84.255.108`), not LAN ones (`192.168.0.129`): they survive the move to
the Bulgaria site. `guacd` reaches them over the host's network, so Tailscale
must be up on the Docker host.

RDP to Windows needs `Security mode: NLA` and `Ignore server certificate: yes`
— the host certificate is self-signed and the handshake otherwise fails with
an unhelpful error.

## Session recording

`${DATA_ROOT}/guacamole/recordings` is mounted into `guacd` and included in
backups. Set the recording path on a connection to `/var/lib/guacamole/recordings`
to use it. Recordings are full-fidelity screen captures of an admin session —
treat the directory as sensitive, and prune it.

## Single sign-on, later

Today you authenticate twice: authentik, then Guacamole. To collapse them,
enable Guacamole's header authentication extension and have it trust
`X-authentik-username`. Only do that once you are certain nothing but Caddy
can reach port 8080 — that header then *is* the credential, and anything able
to set it is an administrator.

# Home Infrastructure as Code — Technical Implementation Guide

Synchronized: 2026-09-13. Repository: `geek`.

## Two maintained versions

This is the existing English technical plan, revised against the supplied plan
and repository. The [Russian implementation plan](../IMPLEMENTATION_PLAN.md)
is the primary roadmap. Update both in the same change whenever stage order,
decisions, status or verification results change. Keep stage numbers and checklists
aligned. The roadmap governs order/status; files and host inspection establish
actual configuration. Files present does not mean deployed.

## Baseline to verify on the hosts

These facts come from the original guide and supplied plan, not live inspection:

| Node | Role and recorded network details |
|---|---|
| MEO FiberGateway, Nazaré | Upstream gateway, LAN `192.168.1.0/24` |
| Archer AX12 | LAN `192.168.0.1/24`; working WireGuard `10.5.5.1/32`, local port 51820, external `moralmachine.dynip.sapo.pt:42820` |
| Lenovo L590 | Ubuntu 24.04; temporary infra host; LAN `192.168.0.251`, Tailscale `100.70.34.82`; Docker, Kuma, Tailscale, SSH |
| MoralMachine | Windows, RTX 3090; LAN `192.168.0.129`, Tailscale `100.84.255.108`; RDP, SSH, Ollama, Wake-on-LAN |
| HP T640, Bulgaria | Future primary 24/7 host; readiness unverified |

Preserve Kuma data, monitors and Telegram alerts, AX12 WireGuard, Tailscale,
Ollama and SSH/RDP. Inspect and reuse existing containers/configuration first.
Explain changes and impact before modifying data, volumes, working containers,
firewall, routing, VPN or Internet exposure. Safe reversible work can proceed
normally. One layer → test → update both plans → separate commit → next layer.

All deployment and lifecycle operations are SSH-only. Clone/pull the repository,
create `.env`, run inventory, Docker, configuration, backup, restore, updates and
migration inside an SSH session on the target host. The workstation is only the
SSH client and Git review surface; running the stack locally is not a supported
workflow.

## Repository inventory verified on 2026-09-13

| Existing path | Implementation and remaining work |
|---|---|
| `compose.yml` | Caddy, PostgreSQL, Redis, Authentik server/worker, Guacamole, guacd; host deployment unverified |
| `.env.example`, `.gitignore` | Templates and exclusions exist; verify host secrets/runtime locations |
| `caddy/Caddyfile` | Authentik at `/`, Guacamole at `/guacamole/` behind `forward_auth` |
| `postgres/initdb/` | PostgreSQL-backed Guacamole; generate schema with `scripts/init-guac-schema.sh` before fresh initialization |
| `authentik/`, `guacamole/` | Setup notes exist; no need to invent `config.yml` or `user-mapping.xml` |
| `kuma/` | Standalone service notes and CSS; not managed by this Compose |
| `scripts/` | Secrets, schema, backup, restore and migration helpers; execution unverified |
| `docs/`, `README.md` | Architecture, deployment, secrets, troubleshooting and plans |

`open-webui/` is absent. `data/` and `backups/` are ignored; `backups/` is absent
locally and created by the backup script. `/opt/home-infra` on Lenovo is unverified.
Keep deployment independent of `/home/akeya`.

## Reconciled design decisions

- Target: Internet → HTTPS 443 → Caddy with Authentik/2FA → Guacamole,
  Open WebUI and existing Kuma. Guacamole reaches RDP/SSH; WebUI reaches private
  Ollama at `http://100.84.255.108:11434` or `http://moralmachine:11434`.
- Current Compose publishes 80/443 and deployment assumes HTTP-01/redirect.
  Stage 4 must validate certificate issuance/renewal for 443-only or document
  an explicit port-80 exception. Inspect both routers, DNS and NAT; preserve VPN.
- Keep stages 4 (external HTTPS) and 5 (Authentik): stage 4 uses an isolated Caddy
  test response; publish working applications after stage 5 verifies 2FA.
- Caddy currently depends on Authentik; Guacamole has no host port. Stages 2–3
  need reviewed private access and selective startup configuration. Full-stack
  startup is not the staged bootstrap procedure.
- Preserve current `/` and `/guacamole/` routing and Guacamole's separate login.
  Select hostnames/routes for WebUI and Kuma first. The old `/auth/`, unprotected
  Guacamole and `/kuma/` examples have been removed from this guide.
- Proxy to the existing Kuma after inventory and backup; preserve ownership,
  volumes, history, monitors and alerts. Decide dashboard/status-page access
  separately. Do not create a second Kuma container.
- Git stores configuration; backups store persistent data; secrets have separate
  secure storage. Never commit `.env`, passwords, API/TOTP secrets, private keys
  or database data. Current archives include plaintext `.env`: encrypt them;
  separate secret recovery remains to be documented.
- Back up existing data before changes; stage 8 completes the general strategy.
  Restore secrets/data and databases before starting applications.
- The migration helper stops Lenovo before target validation. Adapt the procedure
  for isolated target checks, a consistent final backup, cutover and rollback
  before stage 10. Preserve the source until target acceptance.

## Shared stage checklist

- [ ] 1. Repository bootstrap
- [ ] 2. Guacamole local
- [ ] 3. Caddy local
- [ ] 4. External HTTPS
- [ ] 5. Authentik
- [ ] 6. Open WebUI
- [ ] 7. Kuma integration
- [ ] 8. Backup / restore
- [ ] 9. Reproducible deployment
- [ ] 10. HP T640 migration

### 1. Repository bootstrap — partially prepared

- [x] Locate Compose, `.env.example`, `.gitignore`, README, docs and scripts.
- [x] Reconcile the supplied plan and guide; define two maintained versions.
- [ ] Through SSH inspect Lenovo: `/opt/home-infra`, Docker/Compose, containers, ownership,
  volumes, networks, occupied ports and data locations without exposing secrets.
- [ ] Verify secrets/data exclusions and runtime directory creation on the host.
- [ ] Prepare and validate stage-2-only startup with private access and no public ports.
- [ ] Review diff, record verification and make a separate stage commit.

Do not proceed to Guacamole until bootstrap is complete.

### 2–10. Acceptance criteria

| Stage | Required verification |
|---|---|
| 2. Guacamole local | Reuse PostgreSQL/guacd/Guacamole; generate schema before fresh DB initialization; never delete an existing DB to rerun initialization. Private UI, changed default password, MoralMachine RDP/SSH, preferably Lenovo SSH, persistence after restart; Kuma unaffected. |
| 3. Caddy local | Test routing, headers, WebSocket, Docker networking and restart in a trusted network using a stage-specific configuration independent of Authentik; preserve the final `forward_auth` configuration. |
| 4. External HTTPS | After local checks, inspect MEO/AX12 NAT and DNS; resolve 443 vs 80/443, test certificate issuance/renewal and isolated HTTPS over mobile Internet. No direct 22/3389/11434/3001/8080/PostgreSQL exposure. Record `docs/NETWORK.md`. |
| 5. Authentik | Configure provider/application/outpost, required 2FA and TOTP recovery outside the host; WebAuthn/passkeys later. Test anonymous, allowed and denied users, proxy bypass prevention and account recovery before publishing working Guacamole. |
| 6. Open WebUI | Add to infra host, select hostname and Authentik integration; test private Ollama connectivity from container, models, streaming, persistence and offline MoralMachine behavior. Browser access without a VPN client; never publish 11434. |
| 7. Kuma integration | Inventory container name, Compose ownership, volumes, database/data location, networks and monitors. Back up before changes; verify proxy/auth, preserved history, monitors, alerts and status-page policy without recreating Kuma. |
| 8. Backup / restore | Review/reuse helpers; document configuration, separate secrets, PostgreSQL, Kuma, WebUI and other persistent data, consistency, encryption, off-host storage, schedule and retention in `docs/BACKUP_RESTORE.md`. Restore on clean isolated Ubuntu and inspect errors. Coverage of standalone Kuma/future WebUI is not established. |
| 9. Reproducible deployment | Verify over SSH: clone → secrets → schema or restore → startup → acceptance on a clean host. Document fresh install/restore separately, manual steps, image versions and dependencies in README/DEPLOYMENT; check compatibility before deployment. |
| 10. HP T640 migration | Prepare Ubuntu/Docker and `/opt/home-infra`; clone, recover secrets/data, validate internally in isolation. Plan write quiescence and final backup, cut over HTTPS after readiness, test the whole stack, retain Lenovo/data for rollback until acceptance. Record `docs/MIGRATION_T640.md`. |

## Documentation and next action

Use [ARCHITECTURE](../ARCHITECTURE.md), [DEPLOYMENT](../DEPLOYMENT.md) and
[SECRETS](../SECRETS.md) for implementation details, subject to the staged plan.
Update them and README when behavior changes. Create NETWORK, BACKUP_RESTORE and
MIGRATION_T640 when verified information exists, without empty placeholders.

For each completed stage, record date, environment, result and limitations in
both versions before checking its box. Files alone do not prove deployment,
backup or migration. `VSCode-Chat-Prompts.md` is a prompt library, not a third plan.

Next: open an SSH session to Lenovo, finish the bootstrap inventory and prepare private selective startup.
No host deployment or service changes were performed in this plan revision.

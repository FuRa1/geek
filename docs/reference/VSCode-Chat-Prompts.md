# Claude VS Code Extension — IASC Chat Prompts

Copy-paste ready prompts for developing your home infrastructure IaC. Use these in Claude's sidebar when working on files.

---

## 🏗️ Architecture & Planning

### 1. Review Baseline & Plan Phase 1
```
I'm building a web-control infrastructure stack on Lenovo L590 (Ubuntu 24.04) 
that will migrate to HP T640. Current baseline:
- Portugal site: MEO router → TP-Link AX12 (WireGuard) → MoralMachine (RDP/SSH)
- Lenovo: 192.168.0.251, Tailscale 100.70.34.82
- Existing: Uptime Kuma (3001), WireGuard (51820) — must not break

Phase 1 stack: Internet → Caddy (443) → Authentik (2FA) → Guacamole (RDP/SSH)
+ PostgreSQL for data

Is this architecture sound for a portable, secure setup? Any risks I should address?
```

### 2. Security Audit Questions
```
I'm designing a web-control portal for home infrastructure. Security goals:
1. Only TCP 443 exposed to Internet (HTTPS via Caddy)
2. No direct RDP (3389) or SSH (22) exposure
3. Authentik handles 2FA (passkeys + TOTP backup)
4. Guacamole proxies RDP/SSH to internal nodes
5. All secrets in .env (not in Git)

What am I missing? Any attack surface I haven't considered?
```

---

## 🐳 Docker & Compose

### 3. Generate compose.yml Template
```
Generate a Docker Compose file for home infrastructure with these services:
- PostgreSQL 15 (data store)
- Authentik (OpenID auth + 2FA)
- Caddy 2 (reverse proxy, auto HTTPS)
- Guacamole (Apache Guacamole for RDP/SSH)

Requirements:
- Use environment variables for all secrets (pulled from .env)
- Volumes persist to /opt/home-infra/data/ (portable between hosts)
- Networks: internal (services talk to each other), caddy_net (reverse proxy)
- Health checks for all services
- Comments explain each service's role

DON'T include secrets in the file—use ${VAR_NAME} placeholders.
```

### 4. Review compose.yml for Portability
```
Does this compose.yml work on both Lenovo (192.168.0.251) and future T640?
Specific concerns:
1. Hard-coded IPs or paths that won't transfer?
2. Volume mounts that assume /home/akeya ?
3. Environment variables flexible enough for different hosts?

File attached: [paste your compose.yml]
```

---

## 🔐 Secrets & Configuration

### 5. Generate .env.example
```
Create a .env.example template for these services:
- PostgreSQL (user, password, database name)
- Authentik (secret key, bootstrap password, bootstrap token)
- Caddy (domain, email for Let's Encrypt)
- Guacamole (MySQL user, password)
- Reverse proxy settings (internal IPs, ports)

Format: One variable per line with a comment explaining what it is.
Include a warning: "Copy to .env and fill in real values; never commit .env"
```

### 6. Script to Initialize Secrets
```
Write a bash script (init-secrets.sh) that:
1. Checks if .env exists (abort if it does)
2. Copies .env.example to .env
3. Generates secure random values for:
   - AUTHENTIK_SECRET_KEY (32 chars, alphanumeric)
   - POSTGRES_PASSWORD (20 chars, strong)
   - Other passwords (16 chars)
4. Prompts user to enter:
   - CADDY_DOMAIN (e.g., control.moralmachine.dynip.sapo.pt)
   - CADDY_EMAIL (for Let's Encrypt)
5. Makes .env readable only by owner (chmod 600)
6. Reports completion with instructions

Include error handling for missing .env.example.
```

---

## 🌐 Reverse Proxy & Routing

### 7. Generate Caddyfile
```
Generate a Caddyfile for these routes (all over HTTPS):

1. Authentik @ /auth (internally on authentik:9000)
2. Guacamole @ /guacamole (internally on guacamole:8080)
3. Uptime Kuma @ /kuma (internally on uptime-kuma:3001)

Requirements:
- Auto HTTPS with Let's Encrypt
- Domain from {$CADDY_DOMAIN} env var
- Email from {$CADDY_EMAIL} env var
- gzip compression
- Security headers (X-Frame-Options, etc.)
- Rate limiting on /auth (to prevent brute force)
- Comments explain each section

Domain: control.moralmachine.dynip.sapo.pt
```

### 8. Test Reverse Proxy Routing
```
I'm setting up Caddy to route:
- /auth → Authentik (9000)
- /guacamole → Guacamole (8080)

When I visit https://control.moralmachine.dynip.sapo.pt/auth, will cookies
and redirects work correctly? Any path-rewriting issues I should expect?

Should I use {uri}/ rewrites or path-stripping?
```

---

## 🔑 Authentication & 2FA

### 9. Authentik Setup Flow
```
Walk me through the Authentik setup process after docker-compose up:
1. First-time admin user creation
2. Setting up TOTP (Time-based One-Time Password)
3. Configuring password policies (length, complexity, expiry)
4. Creating OAuth2 provider for Guacamole
5. Testing 2FA flow

Include the exact web UI steps and what to expect at each stage.
```

### 10. Guacamole + Authentik Integration
```
How do I connect Guacamole to Authentik for SSO login?
Current setup:
- Authentik on https://control.../auth
- Guacamole on https://control.../guacamole

Should I:
a) Set up Authentik as OAuth2 provider, configure Guacamole to use it?
b) Use Guacamole's LDAP integration?
c) Something else?

Which is simpler and more secure?
```

---

## 📊 Monitoring & Logging

### 11. Integrate Uptime Kuma
```
We have Uptime Kuma already running on Lenovo (3001). 
How do I expose it at /kuma in the new Caddy setup without breaking it?

Current Kuma:
- Container name: uptime-kuma
- Port: 3001
- DNS: akeya-thinkpad-l590:3001 (Tailscale)

Guacamole setup is new. Can Kuma stay separate, or should I move it into 
the same compose.yml?
```

### 12. Logging & Debugging
```
Set up Docker logging for this stack:
- All containers log to stdout/stderr
- View logs: docker-compose logs -f <service>
- Centralize logs? (Loki, ELK, or keep it simple?)

What's best for a home infrastructure setup? We need to debug 
connection issues but don't want heavy overhead.
```

---

## 🚀 Deployment & Migration

### 13. Deployment Script
```
Write a deployment script (deploy.sh) that:
1. Pulls latest from Git repo
2. Validates compose.yml syntax
3. Checks .env exists (fail if missing)
4. Stops current stack: docker-compose down
5. Backs up PostgreSQL data
6. Starts new stack: docker-compose up -d
7. Waits for services to be healthy
8. Runs smoke tests (curl to each endpoint)
9. Reports success/failure with logs

Include error handling and rollback instructions.
```

### 14. Backup & Restore
```
Write backup.sh and restore.sh for this setup:

Backup should:
- Export PostgreSQL (authentik, guacamole databases)
- Copy Guacamole config files
- Copy Caddy certificates (if not Let's Encrypt)
- Create timestamped tarball: home-infra-YYYY-MM-DD.tar.gz
- Store in /opt/home-infra/backups/

Restore should:
- Extract tarball
- Import PostgreSQL dumps
- Restore config files
- Verify services start successfully

Both scripts should have safety checks (e.g., don't overwrite existing data).
```

### 15. Migration Plan: Lenovo → T640
```
Outline the steps to migrate this stack from Lenovo L590 to HP T640 without 
re-architecting or losing data.

Constraints:
- T640 is in Bulgaria; Lenovo is in Portugal (may have different IPs)
- Both on Tailscale network
- WireGuard on AX12 must keep working
- Existing Uptime Kuma data should be preserved

Steps should cover:
1. Backup data on Lenovo
2. Transfer /opt/home-infra to T640
3. Update .env if IPs changed
4. Restore data
5. Test all services
6. DNS/domain considerations (DDNS?)
```

---

## 🧪 Testing & Validation

### 16. Smoke Tests
```
Generate a bash script that tests the entire stack after deployment:

Tests should verify:
1. Caddy is listening on 443 and redirects HTTP → HTTPS
2. Authentik login page loads and accepts credentials
3. TOTP 2FA works (or at least prompts for it)
4. Guacamole login page loads post-auth
5. Can view RDP connection configs in Guacamole
6. Database connectivity (PostgreSQL responding)
7. Reverse proxy headers are correct

Make it a self-contained script that exits with 0 (pass) or 1 (fail).
Include colored output for clarity.
```

### 17. Security Scanning
```
What tools should I use to validate the security of this infrastructure?

Stack:
- Caddy (HTTPS, reverse proxy)
- Authentik (auth, 2FA)
- PostgreSQL (encrypted at rest?)
- Guacamole (RDP/SSH proxy)
- Docker networking (internal only?)

Should I use:
- Docker Scout (image scanning)?
- Trivy (vulnerability scanning)?
- OWASP ZAP (web scanning)?
- SSL Labs test for Caddy certs?

Which tools matter most for a home lab?
```

---

## 📖 Documentation

### 18. Generate ARCHITECTURE.md
```
Generate ARCHITECTURE.md that documents:
1. System diagram (text or ASCII art)
2. Data flow (user request → service → response)
3. Security model (what's exposed, what's internal)
4. Service dependencies (what talks to what)
5. Backup & restore strategy
6. Disaster recovery plan

Format: Markdown, include code blocks where helpful.
Audience: Someone setting this up on T640 for the first time.
```

### 19. Generate DEPLOYMENT.md
```
Generate step-by-step deployment instructions:

For Lenovo (Portugal) setup:
- Prerequisites (Docker, Docker Compose versions)
- Clone repo, init secrets, spin up stack
- Configure Authentik (screenshots/steps)
- Configure Guacamole (add RDP to MoralMachine, SSH to Tailscale)
- Test end-to-end flow
- Verify backups work

For T640 (Bulgaria) migration:
- Same as above, plus restore data from backup
- Update .env for new host (IPs, hostname)
- Test all services again

Include troubleshooting tips for common errors.
```

### 20. Generate SECRETS.md
```
Document the secret management strategy:

1. What each .env variable is for
2. How to generate secure values (openssl, python, bash)
3. Where secrets are stored (only .env, never committed)
4. How to rotate secrets (e.g., change AUTHENTIK_SECRET_KEY)
5. Backup strategy (include .env in tarball or separate?)
6. Access control (who can read .env?)
7. Recovery if .env is lost

Audience: Someone taking over the infrastructure.
Include examples of secure value generation.
```

---

## 🛠️ Troubleshooting Prompts

### 21. Debug Caddy Issues
```
I'm getting SSL certificate errors when visiting https://control.moralmachine.dynip.sapo.pt.
Caddy is running in Docker, and Caddyfile looks correct.

How do I:
1. Check Caddy logs for certificate request failures?
2. Verify DNS is resolving correctly?
3. Test if Let's Encrypt can reach my domain?
4. Fall back to self-signed certs for testing?

My setup:
- Caddy container: caddy:latest
- Domain: moralmachine.dynip.sapo.pt (dynamic DNS)
- Email: (from .env CADDY_EMAIL)
```

### 22. Debug Guacamole Connection Failures
```
Added an RDP connection to MoralMachine (192.168.0.129:3389) in Guacamole,
but login fails with "Connection failed."

How do I:
1. Check if Lenovo can reach MoralMachine (ping, telnet)?
2. Verify RDP is enabled on MoralMachine?
3. Check Guacamole logs for the actual error?
4. Test the connection manually from Lenovo?

Lenovo network:
- LAN: 192.168.0.251
- Tailscale: 100.70.34.82
- MoralMachine LAN: 192.168.0.129
```

### 23. Debug PostgreSQL Performance
```
PostgreSQL is slowing down or running out of disk space.

How do I:
1. Check database size?
2. Identify which database/tables are largest?
3. Clean up old logs from Authentik/Guacamole?
4. Set up automatic cleanup (autovacuum)?
5. Monitor resource usage (CPU, memory)?

Using: PostgreSQL 15 in Docker
```

---

## 🎯 Meta-Prompts (Ask Claude About Claude)

### 24. Clarify IaC Best Practices
```
I'm learning Infrastructure as Code. For a home lab like mine:
1. Should I use Docker Compose or move to Kubernetes?
2. How do I handle configuration drift (desired state vs. actual)?
3. When should I add monitoring (Prometheus, Grafana)?
4. Is it worth using a config management tool (Ansible, Terraform)?
5. How do I test IaC changes safely?

Current scope: Single Compose file, manual deployment. Is that OK?
```

### 25. Feedback on My Approach
```
I'm storing all infrastructure code in Git, but never secrets.

My approach:
- Git: compose.yml, Caddyfile, scripts, docs
- .gitignore: .env, backups/, data/, certificates/
- Manual backup of .env and PostgreSQL (tarball, secure storage)

Is this solid, or should I:
- Use a secrets manager (HashiCorp Vault)?
- Use Docker Secrets (Swarm mode)?
- Use GitHub Secrets (if public repo)?
- Stick with local .env for a home lab?

What's the right balance of security vs. simplicity?
```

---

## 📋 Copy This Into Your VS Code Sidebar

When you open Claude in VS Code and open a file related to your IASC project, 
you can reference this guide by saying:

> "I'm working on the home infrastructure IaC stack. Check IASC-VSCode-Chat-Guide.md 
> for context. Now help me with [specific task]."

Claude will understand:
- Your baseline (Portugal site, Lenovo, MoralMachine, etc.)
- Your constraints (no secrets in Git, portability, security)
- Your architecture (Caddy → Authentik → Guacamole)
- Your phase (Phase 1: basic web-control stack)

Good luck building! 🚀

# Home Infrastructure as Code — VS Code Claude Extension Chat Guide

**Project:** Infra (Home Infrastructure) | **Status:** Building web-control stack (Phase 1)  
**Primary Host:** Lenovo L590 (Ubuntu 24.04) → Future: HP T640  
**Main Repo:** Private Git (IaC configs only, no secrets)

---

## 🎯 Project Overview

You're building a **portable, security-hardened web-control infrastructure** that can migrate from Lenovo L590 → HP T640 without architectural changes.

### Architecture
```
Internet → HTTPS 443 (Caddy)
    ↓
Authentik + 2FA
    ├─ Guacamole (RDP/SSH to internal nodes)
    ├─ Uptime Kuma (monitoring dashboard)
    └─ [Later] Open WebUI (Ollama interface)
```

### Key Constraint
- **NO secrets in Git:** compose.yml, Caddyfile, scripts → YES  
- **NO secrets in Git:** .env, API keys, TOTP, private keys → NEVER  
- **Infrastructure → /opt/home-infra** (portable, not tied to /home/akeya)

---

## 📋 Current Baseline

### Portugal Site (Nazaré)
- **Gateway:** MEO FiberGateway (LAN: 192.168.1.0/24)
- **Router:** TP-Link Archer AX12 (LAN: 192.168.0.1/24)
  - WireGuard Server: 10.5.5.1/32, Port 51820
  - External: moralmachine.dynip.sapo.pt:42820
- **MoralMachine** (Windows Desktop, RTX 3090)
  - LAN: 192.168.0.129 | Tailscale: 100.84.255.108
  - Services: RDP (3389), SSH (22), Ollama (11434)
- **Lenovo L590** (Ubuntu 24.04) ← **Your IaC Host**
  - LAN: 192.168.0.251 | Tailscale: 100.70.34.82
  - Services: Docker, Uptime Kuma, Tailscale

### Bulgaria Site (Future)
- **HP T640** (Ubuntu 24 LTS) ← Future main 24/7 host
  - Status: Physical setup only; needs IaC migration

### Existing Services (DO NOT BREAK)
- **Uptime Kuma** on Lenovo (docker, port 3001, Telegram alerts)
- **WireGuard** AX12 (port 51820, working VPN to MoralMachine)
- **Tailscale** network (100.70.x.x, MagicDNS enabled)

---

## 🔧 Phase 1: Web-Control Stack (Current)

### Step 1: Folder Structure
```bash
/opt/home-infra/
├── compose.yml              # Main Docker Compose (portable)
├── .env.example             # Template ONLY—never commit real values
├── .gitignore               # Keep secrets out
├── caddy/
│   ├── Caddyfile           # Reverse proxy config
│   └── README.md           # Caddy notes
├── authentik/
│   ├── config.yml          # Authentik setup template
│   └── README.md
├── guacamole/
│   ├── user-mapping.xml    # Connection configs
│   └── README.md
├── kuma/
│   └── README.md           # Kuma reference (existing)
├── scripts/
│   ├── init-secrets.sh     # Create .env from .env.example
│   ├── backup.sh           # Data backup script
│   └── migrate-to-t640.sh  # Future migration helper
├── docs/
│   ├── ARCHITECTURE.md     # System design
│   ├── DEPLOYMENT.md       # How to deploy & migrate
│   └── SECRETS.md          # Secret management strategy
└── backups/                # Local backup directory (git-ignored)
```

### Step 2: Key Files to Create

#### **compose.yml** (Docker stack orchestration)
- PostgreSQL (for Authentik & Guacamole data)
- Authentik (auth + 2FA)
- Caddy (reverse proxy, auto HTTPS)
- Guacamole (web RDP/SSH)
- Update Kuma reference (if integrating)

#### **.env.example** (Template—never real secrets)
```bash
# Caddy
CADDY_DOMAIN=control.moralmachine.dynip.sapo.pt
CADDY_EMAIL=your-email@example.com

# Authentik
AUTHENTIK_SECRET_KEY=CHANGE_ME
AUTHENTIK_BOOTSTRAP_PASSWORD=CHANGE_ME
AUTHENTIK_BOOTSTRAP_TOKEN=CHANGE_ME

# PostgreSQL
POSTGRES_USER=authentik
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=authentik

# Guacamole
GUACAMOLE_MYSQL_USER=guacamole
GUACAMOLE_MYSQL_PASSWORD=CHANGE_ME

# (Others as needed)
```

#### **Caddyfile** (Reverse proxy template)
```
{$CADDY_DOMAIN} {
    encode gzip
    
    # Authentik
    handle /auth/* {
        reverse_proxy authentik:9000
    }
    
    # Guacamole
    handle /guacamole/* {
        reverse_proxy guacamole:8080
    }
    
    # Uptime Kuma (optional integration)
    handle /kuma/* {
        reverse_proxy uptime-kuma:3001
    }
}
```

### Step 3: Deployment Workflow

**Initial Setup (Lenovo):**
```bash
# 1. Create /opt/home-infra from Git
git clone <your-private-repo> /opt/home-infra

# 2. Initialize secrets
cd /opt/home-infra
./scripts/init-secrets.sh  # Creates .env from .env.example

# 3. Spin up stack
docker-compose up -d

# 4. Configure Authentik (WebUI setup)
# → Set up admin user, TOTP, password policies

# 5. Configure Guacamole
# → Add RDP connection to MoralMachine (192.168.0.129:3389)
# → Add SSH connection (100.84.255.108:22)

# 6. Test: https://control.moralmachine.dynip.sapo.pt/auth/
```

**Migration to T640 (Later):**
```bash
# 1. Backup Lenovo data
./scripts/backup.sh

# 2. Transfer /opt/home-infra + backups to T640
# 3. Restore data from backup
# 4. Update .env if needed (new IPs, domain changes)
# 5. Spin up on T640
```

---

## 🔐 Security Principles

1. **Internet:** TCP 443 only (HTTPS via Caddy + Let's Encrypt)
2. **Authentication:** Authentik (passkeys + TOTP backup)
3. **Internal Access:** Guacamole proxies RDP/SSH (no direct ports open)
4. **Secrets Management:**
   - `.env` → Git-ignored, created at deployment
   - API keys, TOTP secrets → Stored in `.env` only
   - Private keys (WireGuard, SSH) → Not in repo
5. **Managed MacBook:** Use web portal (HTTPS → Guacamole → RDP) only

---

## 🛠️ Common Development Tasks

### Add a New Service
1. **Define compose.yml service** (with templates for .env vars)
2. **Create service-specific config folder** (caddy/, authentik/, etc.)
3. **Update Caddyfile** for reverse-proxy routing
4. **Update .env.example** with new secrets
5. **Document in docs/ARCHITECTURE.md**
6. **Commit to Git** (no secrets)
7. **Test on Lenovo** before deploying elsewhere

### Backup & Restore
```bash
# Backup
./scripts/backup.sh
# Creates timestamped archive of PostgreSQL, Guacamole config, etc.

# Restore (on T640)
tar xzf backups/home-infra-2026-09-12.tar.gz -C /opt/home-infra/
```

### Monitor Health
```bash
# Via Tailscale MagicDNS:
curl http://akeya-thinkpad-l590:3001/status/home  # Uptime Kuma
curl http://100.84.255.108:11434/api/tags         # Ollama health
```

---

## 📝 Development Checklist (Phase 1)

- [ ] Clone private repo to /opt/home-infra
- [ ] Set up .env.example template
- [ ] Create compose.yml with PostgreSQL, Authentik, Caddy, Guacamole
- [ ] Configure Caddyfile with HTTPS + passthrough
- [ ] Spin up stack on Lenovo; test services
- [ ] Configure Authentik (admin user, 2FA, policies)
- [ ] Add RDP/SSH connections in Guacamole
- [ ] Test web access: https://control.moralmachine.dynip.sapo.pt
- [ ] Test login flow: Authentik → TOTP → Guacamole → RDP
- [ ] Set up backup/restore scripts
- [ ] Document architecture in docs/ARCHITECTURE.md
- [ ] Create migration plan for T640

---

## 🚀 When Using Claude in VS Code

### File Context
When you ask Claude to help with a file (Caddyfile, compose.yml, scripts), it will understand:
- **Your baseline:** Portugal site, Lenovo host, existing Uptime Kuma
- **Constraints:** No secrets in repo; portable stack; migration-ready
- **Architecture:** Internet → Caddy → Authentik → Guacamole/Kuma/WebUI

### Example Prompts
- *"Review my compose.yml—does it support data portability to T640?"*
- *"Generate a safe Caddyfile for control.moralmachine.dynip.sapo.pt that routes to Authentik and Guacamole."*
- *"Create a .env.example template for the services we're using."*
- *"Write a backup script that preserves PostgreSQL and Guacamole config."*
- *"Check my Guacamole user-mapping.xml—is it secure?"*

### Red Flags Claude Will Avoid
- **Never storing secrets** in compose.yml, Caddyfile, or scripts
- **Never hardcoding IPs** that differ between Lenovo and T640
- **Never exposing** SSH (22), RDP (3389), Ollama (11434) directly to Internet
- **Never modifying** existing AX12 WireGuard without explicit approval

---

## 📚 Reference Documents (Create in Git Repo)

1. **ARCHITECTURE.md** — System design, data flow, security model
2. **DEPLOYMENT.md** — Step-by-step setup for Lenovo; migration strategy for T640
3. **SECRETS.md** — How to initialize .env; what each secret is for; backup strategy
4. **TROUBLESHOOTING.md** — Common issues (port conflicts, DNS, Tailscale routing)
5. **.gitignore** — Template to keep secrets safe

---

## 🔗 Links & References

- **Docker Compose:** https://docs.docker.com/compose/
- **Caddy:** https://caddyserver.com/docs/caddyfile
- **Authentik:** https://goauthentik.io/docs/
- **Apache Guacamole:** https://guacamole.apache.org/doc/gug/
- **Uptime Kuma:** https://docs.uptime.kuma.pet/
- **Your Baseline:** See "Infra" project instructions above

---

## 📞 Next Steps

1. **Clone your private repo** to /opt/home-infra (create if needed)
2. **Stage Step 1 files:** compose.yml, .env.example, Caddyfile template
3. **Test locally on Lenovo**
4. **Document learnings** as you build (Markdown in docs/)
5. **Prepare migration plan** before T640 deployment

Good luck! Your infrastructure will be repeatable and portable. 🚀

# Pulse

Pulse is a single-Operator HTTP(S) uptime monitor. It Checks named URLs every five minutes, opens an Incident after three consecutive Failed Checks, and shows Public Monitors on one Status Page.

Live Status Page: [https://45.77.128.104.sslip.io](https://45.77.128.104.sslip.io)

It is a portfolio piece run on a $5 Vultr VPS (1 vCPU / 1GB). Visitors never sign in. There is no registration.

## What it does

- **Monitor**: a required display name plus a unique `http` or `https` URL. The Operator may mark it public and may Pause it.
- **Check**: one HTTP GET that does not follow redirects, with a 10s timeout. 2xx and 3xx on the first response are Successful Checks; anything else is a Failed Check.
- **Incident**: opens after three consecutive Failed Checks (the Monitor is then Down). It closes after three consecutive Successful Checks, or when the Operator Pauses. A single Failed Check does not make a Monitor Down.
- **Notification**: an email when an Incident opens or closes, including duration. It goes to the Monitor's Notification address, or to the Operator email if that address is empty. Copy follows the Operator’s last UI language (English by default, Chinese available).
- **Status Page**: unauthenticated. Only Public Monitors; title is the name, not the URL. Each shows Up / Down / Paused, a response-time chart, recent Incidents (UTC), and 90-day Availability. Paused time is excluded from Availability.
- **Retention**: raw Checks older than 30 days become Hourly Summaries and are deleted. Pause and Resume do not rewrite history.

All timestamps are UTC.

## Architecture

One Next.js App Router repo. SQLite (Drizzle + better-sqlite3) on disk.

```
Visitor ──HTTPS──► Caddy ──► web (Next.js)
                              │
                         same Monitoring module
                              │
                         worker (5-minute Check loop)
```

- **web**: Status Page, Operator console, session auth. The Operator is created or updated from `OPERATOR_EMAIL` / `OPERATOR_PASSWORD` on boot.
- **worker**: Checks running Monitors; both processes share one SQLite file and the same `Monitoring` module (Incident thresholds, Pause, uniqueness, Availability, rotation).
- **Caddy**: TLS termination. GitHub Actions builds and pushes the image; the VPS only `docker compose pull` and restarts. The 1GB box never compiles the app.

Rules live behind `lib/monitoring/monitoring.ts`. Tests talk to that interface with a fake clock; they do not stub internal counters or hit Resend.

## Local development

Requires Node.js 22.

```bash
cp .env.example .env
# set OPERATOR_EMAIL, OPERATOR_PASSWORD, and a SESSION_SECRET (≥32 characters)
npm install
npm test
npm run dev          # web: http://localhost:3000
npm run worker       # Check loop (separate process)
```

`MAIL_DRIVER=console` prints Notification copy to the terminal. Set `MAIL_DRIVER=resend` and `RESEND_API_KEY` to send mail.

```bash
npm run typecheck
npm run build
```

## Deploy

Compose files are in `deploy/`. The image is `ghcr.io/changxvdu-source/pulse-monitor`.

On the host (secrets stay in `app.env`, not in git):

```bash
cd /opt/pulse
# .env: PULSE_IMAGE, PULSE_DOMAIN
# app.env: OPERATOR_*, SESSION_SECRET, MAIL_*
docker compose pull
docker compose up -d
```

Pushing `main` runs tests, publishes the image, and (when `PULSE_DEPLOY=1`) SSHs in to pull and restart.

### Host firewall

Do this on the VPS after you can already log in with an SSH key. Enabling UFW or disabling password login without a working key will lock you out.

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

Turn off SSH password login (key auth must already work):

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sudo systemctl reload sshd
```

If the Vultr control panel has a Firewall group, allow only 22, 80, and 443 there too.

## Not in this MVP

Open registration, extra Status Pages, per-Monitor intervals, following redirects, Webhook/SMS, keyword or SSL Monitors.

## License

Private portfolio project unless you add a license file.

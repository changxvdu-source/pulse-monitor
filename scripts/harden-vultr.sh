#!/usr/bin/env bash
#
# Idempotent first-boot hardening for the $5 Vultr VPS.
# Run as root over SSH. Safe to re-run.
#
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "This script must run as root." >&2
  exit 1
fi

DEPLOY_USER="${DEPLOY_USER:-linuxuser}"

echo "==> 1/7 System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg fail2ban ufw unattended-upgrades apt-listchanges

echo "==> 2/7 Unattended security upgrades"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo "==> 3/7 Deploy user SSH key"
if id "$DEPLOY_USER" >/dev/null 2>&1; then
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  if [[ -s /root/.ssh/authorized_keys ]]; then
    install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
      /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
  fi
  usermod -aG sudo "$DEPLOY_USER"
else
  echo "Deploy user $DEPLOY_USER does not exist; skipping." >&2
fi

echo "==> 4/7 SSH: key-only auth"
# OpenSSH uses the first matching directive. A 10- file must load before
# cloud-init's 50-cloud-init.conf, otherwise PasswordAuthentication stays yes.
cat >/etc/ssh/sshd_config.d/10-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
EOF
printf 'PasswordAuthentication no\n' >/etc/ssh/sshd_config.d/50-cloud-init.conf
rm -f /etc/ssh/sshd_config.d/99-hardening.conf
sshd -t
if systemctl is-active --quiet ssh; then
  systemctl reload ssh
else
  systemctl reload sshd
fi

echo "==> 5/7 UFW: 22/80/443"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 6/7 fail2ban sshd jail"
cat >/etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
backend = systemd
banaction = ufw
bantime = 1h
findtime = 10m
maxretry = 5
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> 7/7 Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

mkdir -p /etc/docker
cat >/etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl enable --now docker
systemctl restart docker

if id "$DEPLOY_USER" >/dev/null 2>&1; then
  usermod -aG docker "$DEPLOY_USER"
fi

echo
echo "Hardening complete."
echo "  docker:     $(docker --version)"
echo "  compose:    $(docker compose version)"
echo "  fail2ban:   $(systemctl is-active fail2ban)"
echo "  ufw:        $(ufw status | head -1)"
echo "  deploy user: $DEPLOY_USER (sudo + docker group; re-login required for group)"

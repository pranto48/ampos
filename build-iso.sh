#!/usr/bin/env bash
#
# Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
# This file is part of AMPOS.
#
# This program is not free software: you can not redistribute it and/or modify
# it under the terms of the GNU Affero General Public License...
# (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
#

set -e

echo "============================================================"
echo "          AmPOS Bare-Metal ISO Image Builder               "
echo "   Target Hardware: HPE ProLiant (iLO) & General Bare-Metal  "
echo "============================================================"
echo ""

# 1. Dependency Verification
echo "[1/6] Checking build dependencies..."
REQUIRED_TOOLS=("lb" "xorriso" "mksquashfs" "debootstrap")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        MISSING_TOOLS+=("$tool")
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "Warning: Missing required build tools: ${MISSING_TOOLS[*]}"
    echo "Attempting to install missing dependencies via apt-get..."
    if [ "$EUID" -ne 0 ]; then
        echo "Error: Root privileges required to install dependencies. Please run with sudo."
        exit 1
    fi
    apt-get update
    apt-get install -y live-build xorriso squashfs-tools mtools debootstrap curl git nodejs npm
fi

# 2. Build Production Web Bundle
echo "[2/6] Building AmpOS production web bundle..."
if [ -f "package.json" ]; then
    npm install
    npm run build
else
    echo "Error: package.json not found. Run this script from the root of the ampos repository."
    exit 1
fi

if [ ! -d "dist" ]; then
    echo "Error: dist directory was not created by npm run build."
    exit 1
fi

# 3. Environment Setup & Live-Build Configuration
echo "[3/6] Initializing live-build environment..."
BUILD_DIR="iso-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

lb config \
    --apt-indices false \
    --apt-recommends false \
    --architectures amd64 \
    --distribution bookworm \
    --archive-areas "main contrib non-free non-free-firmware" \
    --bootloader syslinux \
    --debian-installer false \
    --iso-application "AmPOS Linux Server Shell" \
    --iso-publisher "IT Support BD <https://itsupport.com.bd>" \
    --iso-volume "AMPOS_LIVE"

# 4. Customizing Chroot & Package Selection
echo "[4/6] Configuring Minimal GUI (Openbox + Kiosk Browser) & Network Stack..."
mkdir -p config/package-lists

cat << 'EOF' > config/package-lists/ampos.list.chroot
xserver-xorg-core
xserver-xorg-video-all
xinit
openbox
chromium
lightdm
python3
nodejs
npm
git
curl
net-tools
procps
sudo
firmware-linux-free
firmware-realtek
firmware-bnx2
firmware-bnx2x
EOF

# Kiosk Auto-Login via LightDM
mkdir -p config/includes.chroot/etc/lightdm
cat << 'EOF' > config/includes.chroot/etc/lightdm/lightdm.conf
[Seat:*]
autologin-user=amposadmin
autologin-user-timeout=0
user-session=openbox
EOF

# User Creation & Openbox Kiosk Autostart Hook
mkdir -p config/hooks/live
cat << 'EOF' > config/hooks/live/0100-create-user.hook.chroot
#!/bin/sh
set -e
if ! id amposadmin >/dev/null 2>&1; then
    useradd -m -s /bin/bash -g users -G sudo,video,audio,input amposadmin
    echo "amposadmin ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
fi

mkdir -p /home/amposadmin/.config/openbox
cat << 'AUTOKIOSK' > /home/amposadmin/.config/openbox/autostart
# Disable screen saver & power management
xset s off
xset s numpy
xset -dpms

# Launch Chromium in Kiosk Mode pointing to local AmPOS Web Runtime
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disk-cache-dir=/tmp/cache \
  --check-for-update-interval=31536000 \
  http://localhost:80 &
AUTOKIOSK

chown -R amposadmin:users /home/amposadmin
EOF
chmod +x config/hooks/live/0100-create-user.hook.chroot

# 5. AmpOS Injection & Systemd Service Setup
echo "[5/6] Injecting AmpOS web app & configuring systemd service..."
mkdir -p config/includes.chroot/opt/ampos
cp -r ../dist/* config/includes.chroot/opt/ampos/

mkdir -p config/includes.chroot/etc/systemd/system
cat << 'EOF' > config/includes.chroot/etc/systemd/system/ampos.service
[Unit]
Description=AmPOS Web Runtime Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ampos
ExecStart=/usr/bin/python3 -m http.server 80 --directory /opt/ampos
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Systemd Enablement Hook
cat << 'EOF' > config/hooks/live/0200-enable-ampos-service.hook.chroot
#!/bin/sh
set -e
systemctl enable ampos.service
systemctl enable lightdm.service
EOF
chmod +x config/hooks/live/0200-enable-ampos-service.hook.chroot

# 6. Build ISO File
echo "[6/6] Compiling live ISO image..."
if [ "$EUID" -ne 0 ]; then
    echo "Running 'sudo lb build'..."
    sudo lb build
else
    lb build
fi

if [ -f "live-image-amd64.hybrid.iso" ]; then
    cp live-image-amd64.hybrid.iso ../ampos-server-amd64.iso
    cd ..
    echo ""
    echo "============================================================"
    echo " ✅ SUCCESS! AmPOS Bare-Metal ISO generated successfully."
    echo " Location: $(pwd)/ampos-server-amd64.iso"
    echo " Size:     $(du -h ampos-server-amd64.iso | cut -f1)"
    echo "============================================================"
    echo ""
    echo "HPE iLO Virtual Media Deployment Instructions:"
    echo " 1. Log in to HPE iLO Web Interface (iLO 4 / iLO 5 / iLO 6)."
    echo " 2. Open HTML5 Remote Console."
    echo " 3. Click 'Virtual Media' -> 'Connect CD/DVD'."
    echo " 4. Select ISO: $(pwd)/ampos-server-amd64.iso"
    echo " 5. Power cycle server / press F11 for One-Time Boot Menu."
    echo " 6. Boot from 'iLO Virtual CD-ROM' to launch bare-metal AmPOS."
    echo "============================================================"
else
    echo "Error: ISO build failed. Please inspect live-build output."
    exit 1
fi

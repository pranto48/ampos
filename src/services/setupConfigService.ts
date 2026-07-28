/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */

/**
 * setupConfigService.ts
 *
 * Single source of truth for all AmPOS setup/configuration values that are
 * persisted to localStorage. Any part of the application (Terminal, Settings,
 * future setup wizard) should read and write through this service.
 *
 * localStorage key: "ampos_setup_config"  (one JSON blob for simplicity)
 *
 * Schema version is stored inside the blob so future migrations are safe.
 */

// ─── Schema ────────────────────────────────────────────────────────────────────

export const AMPOS_VERSION = '1.0.0';
const LS_KEY = 'ampos_setup_config';
const SCHEMA_VERSION = 1;

export type NetworkMode = 'dhcp' | 'static';

export interface SetupConfig {
  /** Internal schema version — bump when adding breaking fields */
  _version: number;

  // ── Identity ────────────────────────────────────────────────────────────────
  hostname: string;
  adminUsername: string;
  /** Login password (stored as plain text — suitable for local kiosk use only) */
  adminPassword: string;

  // ── Network ─────────────────────────────────────────────────────────────────
  networkMode: NetworkMode;
  /** Only meaningful when networkMode === 'static' */
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  /** Primary DNS */
  dns1: string;
  /** Secondary DNS */
  dns2: string;

  // ── Services / ports ────────────────────────────────────────────────────────
  sshPort: number;
  ftpPort: number;
  webPort: number;

  // ── Interface name (shown in ifconfig / ip a) ────────────────────────────────
  networkInterface: string;

  // ── MAC address (cosmetic) ───────────────────────────────────────────────────
  macAddress: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

/**
 * Simulated DHCP-assigned address shown when networkMode === 'dhcp'.
 * Stable across sessions so the terminal output is consistent.
 */
const DHCP_IP      = '192.168.1.105';
const DHCP_SUBNET  = '255.255.255.0';
const DHCP_GATEWAY = '192.168.1.1';

export const DEFAULT_CONFIG: SetupConfig = {
  _version:         SCHEMA_VERSION,
  hostname:         'ampos-srv',
  adminUsername:    'admin',
  adminPassword:    'admin',
  networkMode:      'dhcp',
  ipAddress:        DHCP_IP,
  subnetMask:       DHCP_SUBNET,
  gateway:          DHCP_GATEWAY,
  dns1:             '8.8.8.8',
  dns2:             '8.8.4.4',
  sshPort:          22,
  ftpPort:          21,
  webPort:          80,
  networkInterface: 'eth0',
  macAddress:       'b8:27:eb:4a:3c:1f',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reads the setup config from localStorage.
 * Returns defaults merged with whatever is stored, so new fields added in
 * future schema versions are always present.
 */
export function getSetupConfig(): SetupConfig {
  try {
    const raw = localStorage.getItem(LS_KEY) || localStorage.getItem('ampos_config');
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const mapped: Partial<SetupConfig> = {
      ...parsed,
      networkMode: ((parsed.networkMode || parsed.networkType) as NetworkMode) || DEFAULT_CONFIG.networkMode,
      ipAddress: (parsed.ipAddress || parsed.staticIp) as string || DEFAULT_CONFIG.ipAddress,
      subnetMask: (parsed.subnetMask || parsed.staticSubnet) as string || DEFAULT_CONFIG.subnetMask,
      gateway: (parsed.gateway || parsed.staticGateway) as string || DEFAULT_CONFIG.gateway,
      adminUsername: (parsed.adminUsername || parsed.username) as string || DEFAULT_CONFIG.adminUsername,
      adminPassword: (parsed.adminPassword || parsed.password) as string || DEFAULT_CONFIG.adminPassword,
      sshPort: parsed.sshPort ? Number(parsed.sshPort) : DEFAULT_CONFIG.sshPort,
      ftpPort: parsed.ftpPort ? Number(parsed.ftpPort) : DEFAULT_CONFIG.ftpPort,
      webPort: parsed.webPort ? Number(parsed.webPort) : DEFAULT_CONFIG.webPort,
    };
    return { ...DEFAULT_CONFIG, ...mapped };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Persists a (possibly partial) config update to localStorage.
 * Always merges with existing stored values so callers can patch single fields.
 */
export function saveSetupConfig(patch: Partial<Omit<SetupConfig, '_version'>>): void {
  try {
    const current = getSetupConfig();
    const next: SetupConfig = { ...current, ...patch, _version: SCHEMA_VERSION };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    localStorage.setItem('ampos_config', JSON.stringify(next));
  } catch {
    // localStorage may be unavailable in some kiosk environments.
  }
}

/**
 * Clears setup configuration and resets configured flag from localStorage.
 */
export function clearSetupConfig(): void {
  try {
    localStorage.removeItem(AMPOS_CONFIGURED_KEY);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem('ampos_config');
  } catch {
    // Best-effort.
  }
  resetSetupConfig();
}

/**
 * Wipes the entire AmPOS localStorage namespace.
 * Called by the `ampos-reset` Terminal command.
 *
 * Removes only keys owned by AmPOS to avoid clobbering unrelated entries.
 */
const AMPOS_LS_KEYS = [
  LS_KEY,
  'ampos_installed_sha',
  'ampos-theme',
  'ampos-wallpaper',
  'ampos_configured',
];

/** localStorage key that signals first-boot setup has been completed. */
export const AMPOS_CONFIGURED_KEY = 'ampos_configured';

/**
 * Returns true when the user has already completed the setup wizard.
 * Used by OSContext to decide whether to show SetupScreen on boot.
 */
export function isConfigured(): boolean {
  try {
    return localStorage.getItem(AMPOS_CONFIGURED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks setup as complete. Called by SetupScreen after saving all config.
 */
export function markConfigured(): void {
  try {
    localStorage.setItem(AMPOS_CONFIGURED_KEY, 'true');
  } catch {
    // Best-effort.
  }
}

export function resetSetupConfig(): void {
  try {
    AMPOS_LS_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Best-effort.
  }
}

// ─── Derived helpers (used by Terminal commands) ──────────────────────────────

/**
 * Returns the effective IP address, subnet, and gateway for the current
 * network mode. When DHCP is configured the simulated DHCP values are used.
 */
export function getEffectiveNetwork(cfg: SetupConfig): {
  ip: string;
  subnet: string;
  gateway: string;
} {
  if (cfg.networkMode === 'dhcp') {
    return { ip: DHCP_IP, subnet: DHCP_SUBNET, gateway: DHCP_GATEWAY };
  }
  return { ip: cfg.ipAddress, subnet: cfg.subnetMask, gateway: cfg.gateway };
}

/**
 * Converts a dotted-decimal subnet mask to CIDR prefix length.
 * e.g. "255.255.255.0" → 24
 */
export function subnetToCidr(mask: string): number {
  return mask
    .split('.')
    .reduce((acc, octet) => {
      let n = parseInt(octet, 10);
      let bits = 0;
      while (n > 0) { bits += n & 1; n >>= 1; }
      return acc + bits;
    }, 0);
}

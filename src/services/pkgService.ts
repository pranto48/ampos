/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */

/**
 * pkgService.ts
 *
 * Manages package installation status for the simulated Debian apt package manager.
 */

export interface PackageDef {
  name: string;
  version: string;
  size: string;
  description: string;
  binary: string;
}

export const AVAILABLE_PACKAGES: Record<string, PackageDef> = {
  nmap: {
    name: 'nmap',
    version: '7.94-1',
    size: '5.2 MB',
    description: 'Network exploration tool and security / port scanner',
    binary: 'nmap',
  },
  htop: {
    name: 'htop',
    version: '3.2.2-1',
    size: '1.8 MB',
    description: 'Interactive process viewer',
    binary: 'htop',
  },
  git: {
    name: 'git',
    version: '2.39.2-1',
    size: '12.4 MB',
    description: 'Fast, scalable, distributed revision control system',
    binary: 'git',
  },
  cmatrix: {
    name: 'cmatrix',
    version: '2.0-2',
    size: '420 KB',
    description: 'Simulates the display from The Matrix',
    binary: 'cmatrix',
  },
  sl: {
    name: 'sl',
    version: '5.02-1',
    size: '110 KB',
    description: 'Steam Locomotive animation for mistyped ls',
    binary: 'sl',
  },
};

const PKG_LS_KEY = 'ampos_installed_pkgs';

export function getInstalledPackages(): string[] {
  try {
    const raw = localStorage.getItem(PKG_LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isPackageInstalled(pkgName: string): boolean {
  return getInstalledPackages().includes(pkgName.toLowerCase());
}

export function markPackageInstalled(pkgName: string): void {
  try {
    const list = getInstalledPackages();
    if (!list.includes(pkgName.toLowerCase())) {
      list.push(pkgName.toLowerCase());
      localStorage.setItem(PKG_LS_KEY, JSON.stringify(list));
    }
  } catch {
    // Best-effort
  }
}

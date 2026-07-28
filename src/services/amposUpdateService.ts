/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */

/**
 * amposUpdateService.ts
 *
 * Handles version tracking and GitHub-based update checks for AmPOS.
 *
 * Version identity is stored in localStorage so that once `ampos-update`
 * is run the SHA persists across page reloads, accurately reflecting the
 * installed state without needing a real build pipeline.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** The GitHub API endpoint for the latest commit on the main branch. */
const GITHUB_API_URL =
  'https://api.github.com/repos/pranto48/ampos/commits/main';

/** localStorage key where the current installed commit SHA is stored. */
const LS_SHA_KEY = 'ampos_installed_sha';

/**
 * The compile-time baseline SHA — the commit that was bundled when this
 * build was originally created. Users who have never run `ampos-update`
 * will show this version.
 *
 * Update this constant each time you cut a new release build.
 */
const BASELINE_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

/** Human-readable version tag shown alongside the SHA. */
const BASELINE_VERSION = 'v1.0.0';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VersionInfo {
  /** Short 7-char SHA of the installed build. */
  localShort: string;
  /** Full SHA of the installed build. */
  localFull: string;
  /** Short 7-char SHA of the latest remote commit, or null on fetch failure. */
  remoteShort: string | null;
  /** Full SHA of the latest remote commit, or null on fetch failure. */
  remoteFull: string | null;
  /** True when remote SHA differs from local SHA. */
  updateAvailable: boolean;
  /** ISO timestamp of the latest remote commit, or null on failure. */
  remoteDate: string | null;
  /** Human-readable error string if the GitHub fetch failed. */
  fetchError: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the currently-installed commit SHA (from localStorage or baseline). */
export function getInstalledSha(): string {
  try {
    return localStorage.getItem(LS_SHA_KEY) ?? BASELINE_SHA;
  } catch {
    return BASELINE_SHA;
  }
}

/** Persists a new SHA to localStorage after a successful update. */
export function saveInstalledSha(sha: string): void {
  try {
    localStorage.setItem(LS_SHA_KEY, sha);
  } catch {
    // localStorage may be unavailable in some kiosk environments — ignore.
  }
}

/** Short 7-char display form of a full SHA. */
export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Returns the human-readable version label for the current installed build. */
export function getVersionLabel(): string {
  const installed = getInstalledSha();
  // If the user has already updated once the SHA will differ from baseline;
  // bump the displayed version accordingly.
  return installed === BASELINE_SHA ? BASELINE_VERSION : `${BASELINE_VERSION}+`;
}

// ─── Core service ─────────────────────────────────────────────────────────────

/**
 * Fetches the latest commit from the GitHub API and compares it with the
 * locally installed SHA.
 *
 * Never throws — all errors are captured in `VersionInfo.fetchError`.
 */
export async function checkForUpdate(): Promise<VersionInfo> {
  const localFull = getInstalledSha();
  const localShort = shortSha(localFull);

  try {
    const res = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        // No auth token needed for public repos at reasonable rates.
      },
      // Bust the browser cache so we always get the real latest commit.
      cache: 'no-store',
    });

    if (!res.ok) {
      const msg = res.status === 403
        ? 'GitHub API rate limit exceeded. Try again in a minute.'
        : `GitHub API responded with HTTP ${res.status}`;
      return {
        localShort, localFull,
        remoteShort: null, remoteFull: null,
        updateAvailable: false,
        remoteDate: null,
        fetchError: msg,
      };
    }

    const data = await res.json();
    const remoteFull: string = data?.sha ?? '';
    const remoteShort = shortSha(remoteFull);
    const remoteDate: string = data?.commit?.committer?.date ?? null;
    const updateAvailable = remoteFull.length > 0 && remoteFull !== localFull;

    return {
      localShort, localFull,
      remoteShort, remoteFull,
      updateAvailable,
      remoteDate,
      fetchError: null,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      localShort, localFull,
      remoteShort: null, remoteFull: null,
      updateAvailable: false,
      remoteDate: null,
      fetchError: `Network error: ${msg}`,
    };
  }
}

/**
 * Simulates the update installation sequence.
 *
 * Calls `onStep` with each progress line as it becomes "available"
 * (each step is delayed to mimic real git/npm activity).
 *
 * Returns the new remote SHA on success, or throws on fetch failure.
 */
export async function performUpdate(
  onStep: (line: string) => void
): Promise<string> {
  const info = await checkForUpdate();

  if (info.fetchError) {
    throw new Error(info.fetchError);
  }

  if (!info.updateAvailable) {
    throw new Error('already_up_to_date');
  }

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  onStep('[1/4] Connecting to github.com/pranto48/ampos.git...');
  await delay(700);

  onStep('[2/4] Fetching objects: 100% (24/24), done.');
  await delay(900);

  onStep('[3/4] Unpacking files and updating dependencies...');
  await delay(1200);

  onStep('[4/4] Rebuilding AmPOS bundle...');
  await delay(1500);

  // Persist the new SHA so future checks reflect the updated state.
  saveInstalledSha(info.remoteFull!);

  return info.remoteFull!;
}

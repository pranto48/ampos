/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */

/**
 * electron.d.ts
 *
 * TypeScript ambient declaration for the contextBridge surface exposed
 * by electron/preload.js.  Placed in src/ so tsconfig.app.json picks it up
 * automatically via the include glob.
 */

export interface ElectronUpdateResult {
  code: number | null;
  signal: string | null;
}

export interface ElectronAPI {
  /**
   * Starts the real OS update pipeline (git pull → npm install → npm run build).
   *
   * @param onData  Called with each stdout/stderr chunk as it arrives.
   * @param onDone  Called once when the process exits.
   * @returns Cleanup function — removes IPC listeners early if needed.
   */
  runUpdate(
    onData: (chunk: string) => void,
    onDone: (result: ElectronUpdateResult) => void
  ): () => void;

  /**
   * Relaunches the Electron process to load freshly-built dist/ files.
   */
  reboot(): void;
}

declare global {
  interface Window {
    /**
     * Present only when the renderer runs inside Electron (injected by preload.js).
     * Always check for existence before calling:
     *   if (window.electronAPI) { ... }
     */
    electronAPI?: ElectronAPI;
  }
}

/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
/**
 * preload.js
 *
 * Exposes a minimal, typed surface area to the renderer via contextBridge.
 * All node/Electron APIs stay inside the main process; the renderer only
 * calls the functions defined here.
 *
 * window.electronAPI shape:
 *   runUpdate(onData, onDone) – starts the real git+npm update pipeline,
 *     streaming stdout/stderr to onData and calling onDone({code,signal})
 *     when the process exits. Returns a cleanup function that removes the
 *     listeners (call it when the Terminal component unmounts).
 *   reboot()                  – relaunches the Electron app process.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Starts the real OS update (git pull → npm install → npm run build).
   *
   * @param {(chunk: string) => void} onData  – called for every stdout/stderr chunk
   * @param {(result: { code: number|null, signal: string|null }) => void} onDone
   * @returns {() => void} cleanup – call this to remove event listeners
   */
  runUpdate(onData, onDone) {
    const dataHandler = (_event, chunk) => onData(chunk);
    const doneHandler = (_event, result) => {
      onDone(result);
      // Auto-cleanup after done so listeners don't accumulate across sessions.
      ipcRenderer.removeListener('ampos:update-data', dataHandler);
      ipcRenderer.removeListener('ampos:update-done', doneHandler);
    };

    ipcRenderer.on('ampos:update-data', dataHandler);
    ipcRenderer.on('ampos:update-done', doneHandler);

    // Kick off the shell pipeline in the main process.
    ipcRenderer.send('ampos:run-update');

    // Return explicit cleanup for callers that want early teardown.
    return () => {
      ipcRenderer.removeListener('ampos:update-data', dataHandler);
      ipcRenderer.removeListener('ampos:update-done', doneHandler);
    };
  },

  /**
   * Relaunches the Electron process so freshly-built dist/ files are loaded.
   */
  reboot() {
    ipcRenderer.send('ampos:reboot');
  },
});

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
 * Runs in the renderer's context before any web content loads.
 * Use contextBridge to safely expose APIs from the main process
 * to the renderer without enabling full Node.js access.
 *
 * Example:
 *   const { contextBridge, ipcRenderer } = require('electron');
 *
 *   contextBridge.exposeInMainWorld('electronAPI', {
 *     sendMessage: (channel, data) => ipcRenderer.send(channel, data),
 *     onMessage: (channel, callback) =>
 *       ipcRenderer.on(channel, (_event, ...args) => callback(...args)),
 *   });
 */

// No APIs exposed by default; extend as needed.
window.addEventListener('DOMContentLoaded', () => {
  // The renderer DOM is ready.
});

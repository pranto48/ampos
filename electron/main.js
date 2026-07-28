/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const url = require('url');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// ─── Window creation ──────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    // Uncomment to open DevTools in a detached window during development:
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = url.format({
      pathname: path.join(__dirname, '..', 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true,
    });
    mainWindow.loadURL(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC: ampos:run-update ────────────────────────────────────────────────────
//
// Spawns:  git pull https://github.com/pranto48/ampos.git main
//          npm install
//          npm run build
//
// Streams stdout/stderr chunks back to the renderer via 'ampos:update-data'.
// Sends 'ampos:update-done' with { code, signal } when the process exits.
//
// The commands are chained in a single shell invocation so npm install only
// runs after a successful git pull, and build only runs after install.

ipcMain.on('ampos:run-update', (event) => {
  // Project root = one level above electron/
  const cwd = path.join(__dirname, '..');

  const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
  const shellFlag = process.platform === 'win32' ? '/c' : '-c';

  const cmd = [
    'git pull https://github.com/pranto48/ampos.git main',
    'npm install',
    'npm run build',
  ].join(process.platform === 'win32' ? ' && ' : ' && ');

  const child = spawn(shell, [shellFlag, cmd], {
    cwd,
    // Merge stderr into stdout so the renderer sees a single ordered stream.
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  const send = (data) => {
    // Guard: renderer may have been destroyed (e.g. window closed mid-update)
    if (!event.sender.isDestroyed()) {
      event.sender.send('ampos:update-data', String(data));
    }
  };

  child.stdout.on('data', (data) => send(data));
  child.stderr.on('data', (data) => send(data));

  child.on('close', (code, signal) => {
    if (!event.sender.isDestroyed()) {
      event.sender.send('ampos:update-done', { code, signal });
    }
  });

  child.on('error', (err) => {
    send(`\nFailed to start update process: ${err.message}\n`);
    if (!event.sender.isDestroyed()) {
      event.sender.send('ampos:update-done', { code: 1, signal: null });
    }
  });
});

// ─── IPC: ampos:reboot ────────────────────────────────────────────────────────
//
// Relaunches the Electron process from scratch so the freshly-built dist/
// files are loaded without needing a manual restart.

ipcMain.on('ampos:reboot', () => {
  app.relaunch();
  app.exit(0);
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

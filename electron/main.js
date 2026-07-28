/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

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

  // Disable the application menu entirely
  Menu.setApplicationMenu(null);

  if (isDev) {
    // Load Vite dev server
    mainWindow.loadURL('http://localhost:8080');

    // Uncomment to open DevTools in a detached window during development:
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Load the built production files
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

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On Linux quit when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

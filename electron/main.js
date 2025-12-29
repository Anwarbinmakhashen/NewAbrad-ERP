const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'NewAbrad Account ERP',
    backgroundColor: '#ffffff', // Prevent white flash
    show: false, // Don't show until ready
    // icon: path.join(__dirname, '../public/icon.ico'), // Icon removed to fix build error
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allowed for local trusted ERP
      webSecurity: false,
      devTools: false // Disable DevTools in production by default (can be toggled)
    },
    autoHideMenuBar: true // Modern look
  });

  // Start Maximized
  mainWindow.maximize();

  // Determine if we are in Dev or Prod
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to avoid flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single Instance Lock (Prevent multiple instances of ERP)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
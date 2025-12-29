const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

const isDev = !!process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    show: false
  })

  win.maximize()

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    win.loadURL(devUrl).catch(err => console.error('loadURL err', err))
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // packaged: index is inside app.asar/resources/app or app.getAppPath()
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
    const fallback = path.join(__dirname, '..', 'dist', 'index.html')
    const finalPath = fs.existsSync(indexPath) ? indexPath : fallback
    win.loadFile(finalPath).catch(err => {
      console.error('loadFile err', err)
      dialog.showErrorBox('Load Error', String(err))
    })
  }

  win.once('ready-to-show', () => win.show())

  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error('did-fail-load', code, desc, url)
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

ipcMain.handle('get-data-path', () => {
  const userData = app.getPath('userData')
  const dataDir = path.join(userData, 'NewAbrad_Account_Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  return dataDir
})

ipcMain.handle('read-file', (evt, p) => {
  try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null }
  catch (e) { console.error(e); return null }
})

ipcMain.handle('write-file', (evt, p, data) => {
  try { fs.writeFileSync(p, data, 'utf8'); return true }
  catch (e) { console.error(e); return false }
})

ipcMain.handle('mkdir', (evt, p) => {
  try { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); return true }
  catch (e) { console.error(e); return false }
})

ipcMain.handle('exists', (evt, p) => !!fs.existsSync(p))

app.whenReady().then(() => {
  if (process.platform === 'win32' && app.setAppUserModelId) {
    try { app.setAppUserModelId('com.newabrad.erp') } catch {}
  }
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
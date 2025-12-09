import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import allDebrid from './services/allDebrid'
import scraper from './services/scraper'
import vlc from './services/vlc'
import library from './services/library'

function createWindow() {
  // Icon path - dev uses build folder, prod uses extraResources
  const iconPath = is.dev
    ? join(__dirname, '../../build/icon.ico')
    : join(process.resourcesPath, 'icon.ico')
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle(`Watchy v${app.getVersion()}`)
    
    // Set taskbar properties for Windows 11
    if (process.platform === 'win32') {
      mainWindow.setAppDetails({
        appId: 'com.watchy.app',
        appIconPath: iconPath,
        appIconIndex: 0,
        relaunchDisplayName: 'Watchy'
      })
    }
    
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.watchy.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // API Handlers
  ipcMain.handle('api:search', async (_, query) => {
    return await scraper.search(query)
  })

  ipcMain.handle('api:unlock', async (_, magnet) => {
    return await allDebrid.uploadMagnet(magnet)
  })

  ipcMain.handle('api:getStatus', async (_, id) => {
    return await allDebrid.getStatus(id)
  })

  ipcMain.handle('api:getFiles', async (_, link) => {
    // Note: 'unlockLink' in service returns the unlocked link info which contains files
    return await allDebrid.unlockLink(link)
  })

  ipcMain.handle('api:play', (_, url) => {
    vlc.play(url)
  })

  ipcMain.handle('api:saveKey', async (_, key) => {
    await allDebrid.setApiKey(key)
    return true
  })

  ipcMain.handle('api:getKey', () => {
    return allDebrid.apiKey
  })

  // Library handlers
  ipcMain.handle('api:getSavedSearches', () => {
    return library.getSavedSearches()
  })

  ipcMain.handle('api:addSavedSearch', (_, query) => {
    return library.addSavedSearch(query)
  })

  ipcMain.handle('api:removeSavedSearch', (_, id) => {
    return library.removeSavedSearch(id)
  })

  ipcMain.handle('api:getSavedMagnets', () => {
    return library.getSavedMagnets()
  })

  ipcMain.handle('api:addSavedMagnet', (_, magnetData) => {
    return library.addSavedMagnet(magnetData)
  })

  ipcMain.handle('api:removeSavedMagnet', (_, id) => {
    return library.removeSavedMagnet(id)
  })

  // History handlers
  ipcMain.handle('api:getHistory', () => {
    return library.getHistory()
  })

  ipcMain.handle('api:recordPlay', (_, magnetHash, magnetTitle, filename, streamUrl) => {
    return library.recordPlay(magnetHash, magnetTitle, filename, streamUrl)
  })

  ipcMain.handle('api:removeHistoryEntry', (_, id) => {
    return library.removeHistoryEntry(id)
  })

  ipcMain.handle('api:removeAllHistory', () => {
    return library.removeAllHistory()
  })

  ipcMain.handle('api:resetFileWatched', (_, historyId, filename) => {
    return library.resetFileWatched(historyId, filename)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

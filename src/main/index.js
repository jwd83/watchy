import { app, shell, BrowserWindow, ipcMain, nativeImage, dialog } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import allDebrid from './services/allDebrid'
import scraper from './services/scraper'
import vlc from './services/vlc'
import library from './services/library'
import mediaCatalog from './services/mediaCatalog'
import posters from './services/posters'

const downloadTargets = new Map()
const downloadMetadata = new Map() // url -> { magnetTitle }

function getLiveWebContents(webContents) {
  if (!webContents || webContents.isDestroyed()) {
    return null
  }

  return webContents
}

function getLiveWindowWebContents(window) {
  if (!window || window.isDestroyed()) {
    return null
  }

  return getLiveWebContents(window.webContents)
}

function sendDownloadProgress(webContents, payload) {
  const liveWebContents = getLiveWebContents(webContents)

  if (!liveWebContents) {
    return false
  }

  try {
    liveWebContents.send('download:progress', payload)
    return true
  } catch (error) {
    console.warn('Unable to send download progress update:', error)
    return false
  }
}

function safeDecodeFilename(filename = 'unknown') {
  if (!filename) {
    return 'unknown'
  }

  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

function readDownloadItem(item, readValue, fallback) {
  try {
    return readValue(item)
  } catch (error) {
    console.warn('Unable to read download item:', error)
    return fallback
  }
}

function getDownloadProgressData(item, magnetTitle, state) {
  return {
    filename: safeDecodeFilename(
      readDownloadItem(item, (downloadItem) => downloadItem.getFilename(), 'unknown')
    ),
    magnetTitle,
    receivedBytes: readDownloadItem(item, (downloadItem) => downloadItem.getReceivedBytes(), 0),
    totalBytes: readDownloadItem(item, (downloadItem) => downloadItem.getTotalBytes(), 0),
    savePath: readDownloadItem(item, (downloadItem) => downloadItem.getSavePath(), null),
    state
  }
}

// Resolve an AllDebrid hoster link to a direct URL.
// Non-http input and unlock failures fall back to the original value.
async function resolveDirectUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('http')) {
    return url
  }

  try {
    const unlock = await allDebrid.unlockLink(url)
    if (unlock?.status === 'success' && unlock?.data?.link) {
      return unlock.data.link
    }
  } catch {
    // ignore unlock failures; fall back to the original url
  }

  return url
}

// Download queue manager
class DownloadQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent
    this.activeDownloads = new Set()
    this.queue = []
    this.mainWindow = null
  }

  setMainWindow(window) {
    this.mainWindow = window
  }

  getLiveWebContents(sender = null) {
    return getLiveWindowWebContents(this.mainWindow) || getLiveWebContents(sender)
  }

  sendProgress(payload, sender = null) {
    return sendDownloadProgress(this.getLiveWebContents(sender), payload)
  }

  add(url, options, sender) {
    const filename = safeDecodeFilename(url.split('/').pop().split('?')[0] || 'unknown')
    const magnetTitle = options.magnetTitle || null
    this.queue.push({ url, options, sender, filename, magnetTitle })

    this.sendProgress(
      {
        filename,
        magnetTitle,
        state: 'queued',
        queuePosition: this.queue.length
      },
      sender
    )

    this.processQueue()
  }

  processQueue() {
    while (this.activeDownloads.size < this.maxConcurrent && this.queue.length > 0) {
      const { url, options, sender, magnetTitle } = this.queue.shift()
      this.startDownload(url, options, sender, magnetTitle)
    }
  }

  startDownload(url, options, sender, magnetTitle) {
    this.activeDownloads.add(url)
    if (options.directory) {
      downloadTargets.set(url, options.directory)
    }
    if (magnetTitle) {
      downloadMetadata.set(url, { magnetTitle })
    }

    const webContents = this.getLiveWebContents(sender)

    if (!webContents) {
      console.warn(`Unable to start download because the renderer was destroyed: ${url}`)
      this.onDownloadComplete(url)
      return
    }

    try {
      webContents.downloadURL(url)
    } catch (error) {
      console.warn('Unable to start download:', error)
      this.onDownloadComplete(url)
    }
  }

  onDownloadComplete(url) {
    this.activeDownloads.delete(url)
    downloadTargets.delete(url)
    downloadMetadata.delete(url)
    this.processQueue()
  }
}

const downloadQueue = new DownloadQueue(3)

function createWindow() {
  // Icon path - dev uses build folder, prod uses extraResources.
  // Windows prefers .ico; Linux prefers .png.
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const iconPath = is.dev
    ? path.join(__dirname, `../../build/${iconFile}`)
    : path.join(process.resourcesPath, iconFile)

  // Create native image from icon
  const appIcon = nativeImage.createFromPath(iconPath)

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle(`Watchy v${app.getVersion()}`)

    // Force set icon for Windows taskbar
    if (process.platform === 'win32') {
      mainWindow.setIcon(appIcon)
      mainWindow.setAppDetails({
        appId: 'com.watchy.app',
        // appIconPath: iconPath,
        appIconIndex: 0,
        relaunchDisplayName: 'Watchy'
      })
    }
    mainWindow.show()
  })

  // Set the main window reference for download queue
  downloadQueue.setMainWindow(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Track downloads
  const downloadSession = mainWindow.webContents.session
  const handleWillDownload = (_event, item) => {
    const url = readDownloadItem(item, (downloadItem) => downloadItem.getURL(), null)

    if (!url) {
      return
    }

    const metadata = downloadMetadata.get(url) || {}
    const magnetTitle = metadata.magnetTitle || null

    if (downloadTargets.has(url)) {
      const directory = downloadTargets.get(url)
      const filename = readDownloadItem(
        item,
        (downloadItem) => downloadItem.getFilename(),
        'unknown'
      )

      try {
        item.setSavePath(path.join(directory, filename))
      } catch (error) {
        console.warn('Unable to set download save path:', error)
      }

      // cleanup
      downloadTargets.delete(url)
    }

    item.on('updated', (_event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        const isPaused = readDownloadItem(item, (downloadItem) => downloadItem.isPaused(), false)

        if (isPaused) {
          console.log('Download is paused')
        } else {
          downloadQueue.sendProgress(getDownloadProgressData(item, magnetTitle, 'progressing'))
        }
      }
    })

    item.once('done', (_event, state) => {
      const itemUrl = readDownloadItem(item, (downloadItem) => downloadItem.getURL(), url)
      const downloadData = getDownloadProgressData(
        item,
        magnetTitle,
        state === 'completed' ? 'completed' : 'failed'
      )

      if (state === 'completed') {
        console.log('Download successfully')
      } else {
        console.log(`Download failed: ${state}`)
      }

      try {
        // Add to download history (only if magnetTitle is present)
        if (magnetTitle) {
          library.addToDownloadHistory(downloadData)
        }
      } catch (error) {
        console.warn('Unable to add download to history:', error)
      } finally {
        downloadQueue.sendProgress(downloadData)
        // Notify queue that download is complete so next can start
        downloadQueue.onDownloadComplete(itemUrl)
      }
    })
  }

  downloadSession.on('will-download', handleWillDownload)

  mainWindow.on('closed', () => {
    if (downloadQueue.mainWindow === mainWindow) {
      downloadQueue.setMainWindow(null)
    }

    downloadSession.removeListener('will-download', handleWillDownload)
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
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
    const results = await scraper.search(query)

    // Enrich results with catalog metadata for any that have imdb IDs
    const imdbIds = [...new Set(results.map((r) => r.imdb).filter(Boolean))]
    if (imdbIds.length > 0) {
      const catalogMap = mediaCatalog.lookupByImdbIds(imdbIds)
      for (const result of results) {
        if (result.imdb && catalogMap.has(result.imdb)) {
          result.catalogTitle = catalogMap.get(result.imdb).title
        }
      }
    }

    return results
  })

  ipcMain.handle('api:mediaSuggest', (_, query, limit) => {
    return mediaCatalog.suggest(query, limit)
  })

  ipcMain.handle('api:getPosters', (_, imdbIds) => {
    return posters.getPostersByImdbIds(imdbIds)
  })

  ipcMain.handle('api:unlock', async (_, magnet) => {
    return await allDebrid.uploadMagnet(magnet)
  })

  ipcMain.handle('api:getStatus', async (_, id) => {
    return await allDebrid.getStatus(id)
  })

  // v4.1: get magnet status (by id or filter)
  ipcMain.handle('api:getStatusV41', async (_, params) => {
    return await allDebrid.getStatusV41(params)
  })

  // v4: get files for one or more magnet IDs
  ipcMain.handle('api:getMagnetFiles', async (_, ids) => {
    return await allDebrid.getFiles(ids)
  })

  ipcMain.handle('api:getFiles', async (_, link) => {
    // Note: 'unlockLink' in service returns the unlocked link info which contains files for host links
    return await allDebrid.unlockLink(link)
  })

  // Resolve AllDebrid hoster links to a direct URL without playing.
  ipcMain.handle('api:resolve', async (_, url) => {
    return await resolveDirectUrl(url)
  })

  // Resolve AllDebrid hoster links to a direct playable URL before launching VLC.
  // Optionally accepts a subtitle URL to pass to VLC.
  ipcMain.handle('api:play', async (_, url, subtitleUrl = null) => {
    const [playableUrl, playableSubtitleUrl] = await Promise.all([
      resolveDirectUrl(url),
      subtitleUrl ? resolveDirectUrl(subtitleUrl) : null
    ])

    vlc.play(playableUrl, playableSubtitleUrl, {
      enableEnglishSubtitles: library.getSubtitlesEnabledByDefault()
    })
    return playableUrl
  })

  // Open containing folder in file explorer
  ipcMain.handle('api:openFolder', (_, filePath) => {
    shell.showItemInFolder(filePath)
  })

  // Play local file in VLC
  ipcMain.handle('api:playFile', (_, filePath) => {
    vlc.play(filePath, null, {
      enableEnglishSubtitles: library.getSubtitlesEnabledByDefault()
    })
  })

  ipcMain.handle('api:download', (event, url, options = {}) => {
    downloadQueue.add(url, options, event.sender)
  })

  ipcMain.handle('api:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('api:saveKey', async (_, key) => {
    await allDebrid.setApiKey(key)
    return true
  })

  ipcMain.handle('api:getKey', () => {
    return allDebrid.apiKey
  })

  // MagnetId map helpers
  ipcMain.handle('api:getMagnetIdByHash', (_, hash) => {
    return library.getMagnetIdByHash(hash)
  })

  ipcMain.handle('api:setMagnetId', (_, hash, id) => {
    return library.setMagnetId(hash, id)
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

  // Download History handlers
  ipcMain.handle('api:getDownloadHistory', () => {
    return library.getDownloadHistory()
  })

  ipcMain.handle('api:removeFromDownloadHistory', (_, id) => {
    return library.removeFromDownloadHistory(id)
  })

  ipcMain.handle('api:clearDownloadHistory', () => {
    return library.clearDownloadHistory()
  })

  // Settings handlers
  ipcMain.handle('api:getShowNsfw', () => {
    return library.getShowNsfw()
  })

  ipcMain.handle('api:setShowNsfw', (_, value) => {
    return library.setShowNsfw(value)
  })

  ipcMain.handle('api:getSubtitlesEnabledByDefault', () => {
    return library.getSubtitlesEnabledByDefault()
  })

  ipcMain.handle('api:setSubtitlesEnabledByDefault', (_, value) => {
    return library.setSubtitlesEnabledByDefault(value)
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

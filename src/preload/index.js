import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  search: (query) => ipcRenderer.invoke('api:search', query),
  unlock: (magnet) => ipcRenderer.invoke('api:unlock', magnet),
  getStatus: (id) => ipcRenderer.invoke('api:getStatus', id),
  getFiles: (link) => ipcRenderer.invoke('api:getFiles', link),
  play: (url) => ipcRenderer.invoke('api:play', url),
  saveKey: (key) => ipcRenderer.invoke('api:saveKey', key),
  getKey: () => ipcRenderer.invoke('api:getKey')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

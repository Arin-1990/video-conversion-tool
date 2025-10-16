const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  once: (channel, callback) => ipcRenderer.once(channel, callback),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  startConvert: (options) => ipcRenderer.invoke('startConvert', options),
});
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('cledApp', {
  info: () => ipcRenderer.invoke('app-info'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  onUpdate: (cb) => ipcRenderer.on('upd', (e, d) => cb(d))
});

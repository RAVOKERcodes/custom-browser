const { contextBridge, ipcRenderer } = require('electron');

// Expose limited APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    navigate: (url) => ipcRenderer.send('navigate', url),
    goBack: () => ipcRenderer.send('go-back'),
    goForward: () => ipcRenderer.send('go-forward'),
    
    onNavigate: (callback) => ipcRenderer.on('did-navigate', (event, url) => callback(url)),
    onError: (callback) => ipcRenderer.on('navigation-error', (event, error) => callback(error)),
});

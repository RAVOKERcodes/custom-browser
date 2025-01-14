const { app, BrowserWindow } = require('electron');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: __dirname + '/preload.js', // Path to preload.js
            nodeIntegration: false,           // Disable Node.js integration in renderer
            contextIsolation: true,           // Isolate context for security
            webviewTag: true,                 // Enable webview tag if using <webview>
        },
    });

    // Load index.html
    mainWindow.loadFile('index.html');

    // Open DevTools (optional, for debugging)
    // mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

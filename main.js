const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function setupDownloadHandler(mainWindow) {
    // Download handler
    session.defaultSession.on('will-download', (event, item, webContents) => {
        // Get the download path (you can customize this)
        const downloadPath = path.join(app.getPath('downloads'), item.getFilename());
        
        // Set the save path
        item.setSavePath(downloadPath);
        
        // Notify renderer about download start
        mainWindow.webContents.send('download-started', {
            filename: item.getFilename(),
            savePath: downloadPath
        });
        
        item.on('done', (event, state) => {
            if (state === 'completed') {
                mainWindow.webContents.send('download-completed', {
                    filename: item.getFilename(),
                    savePath: downloadPath
                });
            }
        });
    });

    // Listen for download requests from renderer
    ipcMain.on('download-request', (event, { url }) => {
        mainWindow.webContents.downloadURL(url);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'codebro',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            webSecurity: false
        },
    });

    // Setup download handler
    setupDownloadHandler(mainWindow);

    // Rest of your existing window setup code
    mainWindow.loadFile('index.html');
    mainWindow.setTitle('codebro');
    // mainWindow.webContents.openDevTools(); // Open DevTools for debugging
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { net } = require('electron');
const https = require('https');
const os = require('os');
const { networkInterfaces } = require('systeminformation');

let mainWindow;

const PROXY_SERVERS = {
    us: 'us-wa.proxyme.org',
    uk: 'uk-lon.proxyme.org',
    de: 'de-fra.proxyme.org',
    ca: 'ca-tor.proxyme.org',
    nl: 'nl-ams.proxyme.org'
};

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

// VPN Connection Management
function setupVPNHandlers(mainWindow) {
    // IPC handler for VPN connection
    ipcMain.handle('vpn-connect', async (event, location) => {
        try {
            // Validate location
            if (!PROXY_SERVERS[location]) {
                throw new Error('Invalid VPN location');
            }

            const selectedProxy = PROXY_SERVERS[location];

            // Set system-wide proxy
            app.commandLine.appendSwitch('proxy-server', selectedProxy);

            mainWindow.webContents.send('vpn-status', {
                connected: true,
                message: `Connected via proxy: ${selectedProxy}`,
                proxy: selectedProxy,
                location: location
            });

            return { 
                success: true, 
                message: `Connected to ${location.toUpperCase()} proxy server`,
                proxy: selectedProxy,
                location: location
            };
        } catch (error) {
            mainWindow.webContents.send('vpn-status', {
                connected: false,
                message: 'VPN connection failed'
            });

            return { 
                success: false, 
                message: error.message || 'Failed to connect to VPN' 
            };
        }
    });

    // IPC handler for VPN disconnection
    ipcMain.handle('vpn-disconnect', async (event) => {
        try {
            // Remove proxy settings
            app.commandLine.removeSwitch('proxy-server');

            mainWindow.webContents.send('vpn-status', {
                connected: false,
                message: 'VPN disconnected'
            });

            return { 
                success: true, 
                message: 'Disconnected from proxy' 
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Failed to disconnect VPN' 
            };
        }
    });
}

// VPN Proxy Management
function setupProxyHandlers(mainWindow) {
    ipcMain.handle('set-proxy-for-all-tabs', async (event, proxyServer) => {
        try {
            await mainWindow.webContents.session.setProxy({
                proxyRules: proxyServer
            });
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: `Proxy set failed: ${error.message}` 
            };
        }
    });

    ipcMain.handle('clear-proxy-for-all-tabs', async () => {
        try {
            await mainWindow.webContents.session.setProxy({
                proxyRules: ''
            });
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: `Proxy clear failed: ${error.message}` 
            };
        }
    });
}

// History Suggestions Handler
function setupHistorySuggestionsHandler() {
    ipcMain.handle('get-history-suggestions', async (event, query) => {
        try {
            // Retrieve history from the database
            const stmt = db.prepare(`
                SELECT title, url 
                FROM history 
                WHERE title LIKE ? OR url LIKE ? 
                ORDER BY last_visit_time DESC 
                LIMIT 10
            `);
            
            const searchQuery = `%${query}%`;
            const results = stmt.all(searchQuery, searchQuery);
            
            return results.map(item => ({
                title: item.title || item.url,
                url: item.url
            }));
        } catch (error) {
            console.error('Error fetching history suggestions:', error);
            return [];
        }
    });
}

// Network Speed Tracking
function setupNetworkSpeedHandler() {
    ipcMain.handle('get-network-speed', async () => {
        try {
            // Get network interfaces
            const interfaces = await networkInterfaces();
            const activeInterfaces = interfaces.filter(iface => 
                iface.operstate === 'up' && !iface.internal
            );

            if (activeInterfaces.length === 0) {
                return { downloadSpeed: 0, uploadSpeed: 0 };
            }

            // Simulate network speed (you might want to replace this with a more accurate method)
            const downloadSpeed = Math.random() * 50; // Random speed between 0-50 Mbps
            const uploadSpeed = Math.random() * 25;   // Random speed between 0-25 Mbps

            return {
                downloadSpeed: downloadSpeed,
                uploadSpeed: uploadSpeed
            };
        } catch (error) {
            console.error('Network speed tracking error:', error);
            return { downloadSpeed: 0, uploadSpeed: 0 };
        }
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

    // Setup VPN handlers
    setupVPNHandlers(mainWindow);

    // Setup proxy handlers
    setupProxyHandlers(mainWindow);

    // Setup history suggestions handler
    setupHistorySuggestionsHandler();

    // Setup network speed handler
    setupNetworkSpeedHandler();

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

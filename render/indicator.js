// Network Speed Tracking
const downloadSpeedValue = document.getElementById('downloadSpeedValue');
const uploadSpeedValue = document.getElementById('uploadSpeedValue');
const networkSpeedIndicator = document.getElementById('networkSpeedIndicator');

// Network speed tracking function
function trackNetworkSpeed() {
    const networkInterface = require('os').networkInterfaces();
    const { networkInterfaces } = require('systeminformation');

    async function updateNetworkSpeed() {
        try {
            const interfaces = await networkInterfaces();
            const activeInterfaces = interfaces.filter(iface => 
                iface.operstate === 'up' && !iface.internal
            );

            if (activeInterfaces.length > 0) {
                const speedInfo = await ipcRenderer.invoke('get-network-speed');
                
                // Update download and upload speed
                downloadSpeedValue.textContent = speedInfo.downloadSpeed.toFixed(2);
                uploadSpeedValue.textContent = speedInfo.uploadSpeed.toFixed(2);

                // Optional: Color coding for speed
                networkSpeedIndicator.style.opacity = speedInfo.downloadSpeed > 0 ? 1 : 0.5;
            }
        } catch (error) {
            console.error('Network speed tracking error:', error);
            networkSpeedIndicator.style.opacity = 0.5;
        }
    }

    // Update every 5 seconds
    updateNetworkSpeed();
    setInterval(updateNetworkSpeed, 5000);
}

// Initialize network speed tracking
trackNetworkSpeed();

// RAM Usage Tracking
const ramUsageValue = document.getElementById('ramUsageValue');

// RAM tracking function
function trackRAMUsage() {
    async function updateRAMUsage() {
        try {
            const ramInfo = await ipcRenderer.invoke('get-ram-usage');
            
            // Ensure we have a valid number
            const browserRAM = Number(ramInfo.browserRAM);
            
            // Display browser-specific RAM usage
            ramUsageValue.textContent = isNaN(browserRAM) ? '0' : browserRAM;
        } catch (error) {
            console.error('RAM usage tracking error:', error);
            ramUsageValue.textContent = '0';
        }
    }

    // Update every 5 seconds
    updateRAMUsage();
    setInterval(updateRAMUsage, 5000);
}

// Initialize RAM usage tracking
trackRAMUsage();

// Settings Button
const settingsButton = document.createElement('button');
settingsButton.id = 'openSettings';
settingsButton.textContent = '⚙️';
settingsButton.title = 'Open Settings';
settingsButton.addEventListener('click', () => {
    // Open settings in a new tab
    const settingsUrl = 'settings.html';
    tabManager.createNewTab(settingsUrl);
});

// Add settings button to browser controls
const browserControls = document.querySelector('.browser-controls');
browserControls.appendChild(settingsButton);

// Battery Status Tracking
const batteryUsage = document.getElementById('batteryUsage');
const batteryIcon = document.getElementById('batteryIcon');
const batteryPercentage = document.getElementById('batteryPercentage');

// Battery tracking function
// function trackBatteryStatus() {
//     async function updateBatteryStatus() {
//         try {
//             const batteryInfo = await ipcRenderer.invoke('get-battery-status');
            
//             // Update battery percentage
//             if (batteryInfo.percentage !== -1) {
//                 batteryPercentage.textContent = batteryInfo.percentage;

//                 // Add low battery warning
//                 if (batteryInfo.percentage <= 20) {
//                     batteryUsage.classList.add('low-battery');
//                     batteryIcon.textContent = '🔴';
//                 } else {
//                     batteryUsage.classList.remove('low-battery');
//                     batteryIcon.textContent = batteryInfo.isCharging ? '🔌' : '🔋';
//                 }
//             } else {
//                 // No battery detected
//                 batteryPercentage.textContent = 'N/A';
//                 batteryIcon.textContent = '🔋';
//             }
//         } catch (error) {
//             console.error('Battery status tracking error:', error);
//             batteryPercentage.textContent = 'ERR';
//         }
//     }

    // Update every 30 seconds
//     updateBatteryStatus();
//     setInterval(updateBatteryStatus, 30000);
// }



// Battery tracking function
function trackBatteryStatus() {
    async function updateBatteryStatus() {
        try {
            const batteryInfo = await ipcRenderer.invoke('get-battery-status');
            
            console.log('Battery Info:', batteryInfo); // Debug logging
            
            // Ensure batteryInfo is an object and has expected properties
            if (batteryInfo && typeof batteryInfo === 'object') {
                // Check for valid percentage
                const percentage = Number(batteryInfo.percentage);
                
                if (!isNaN(percentage) && percentage !== -1) {
                    batteryPercentage.textContent = percentage;

                    // Add low battery warning
                    if (percentage <= 20) {
                        batteryUsage.classList.add('low-battery');
                        batteryIcon.textContent = '🔴';
                    } else {
                        batteryUsage.classList.remove('low-battery');
                        batteryIcon.textContent = batteryInfo.isCharging ? '🔌' : '🔋';
                    }
                } else {
                    // No valid battery percentage
                    batteryPercentage.textContent = 'N/A';
                    batteryIcon.textContent = '🔋';
                }
            } else {
                // Invalid battery info
                batteryPercentage.textContent = 'N/A';
                batteryIcon.textContent = '🔋';
            }
        } catch (error) {
            console.error('Battery status tracking error:', error);
            batteryPercentage.textContent = 'N/A';
            batteryIcon.textContent = '🔋';
        }
    }

    // Update every 30 seconds
    updateBatteryStatus();
    setInterval(updateBatteryStatus, 30000);
}




// Initialize battery status tracking
trackBatteryStatus();

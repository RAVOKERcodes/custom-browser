
// VPN Management
const vpnModal = document.getElementById('vpnModal');
const vpnToggle = document.getElementById('vpnToggle');
const closeModal = document.querySelector('.close-modal');
const vpnLocations = document.querySelectorAll('.vpn-location');
const connectVPNBtn = document.getElementById('connectVPN');
const cancelVPNBtn = document.getElementById('cancelVPN');
const vpnStatusBar = document.getElementById('vpnStatusBar');
const vpnLocationText = document.getElementById('vpnLocationText');
const vpnLocationFlag = document.getElementById('vpnLocationFlag');
const disconnectVPNBtn = document.getElementById('disconnectVPN');
const closeVPNStatusBtn = document.getElementById('closeVPNStatus');

const FLAGS = {
    us: 'https://flagcdn.com/w80/us.png',
    uk: 'https://flagcdn.com/w80/gb.png',
    de: 'https://flagcdn.com/w80/de.png',
    ca: 'https://flagcdn.com/w80/ca.png',
    nl: 'https://flagcdn.com/w80/nl.png'
};

let selectedVPNLocation = null;
let isVPNConnected = false;

// Show VPN Modal
function showVPNModal() {
    vpnModal.style.display = 'block';
    // Reset previous selection
    vpnLocations.forEach(location => location.classList.remove('selected'));
}

// Close VPN Modal
function closeVPNModal() {
    vpnModal.style.display = 'none';
}

// Location Selection
vpnLocations.forEach(location => {
    location.addEventListener('click', () => {
        // Remove previous selection
        vpnLocations.forEach(loc => loc.classList.remove('selected'));
        
        // Add selection to clicked location
        location.classList.add('selected');
        selectedVPNLocation = location.dataset.location;
    });
});

// Connect to VPN
async function connectVPN() {
    if (!selectedVPNLocation) {
        showNotification('VPN Error', 'Please select a location');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('vpn-connect', selectedVPNLocation);
        
        if (result.success) {
            isVPNConnected = true;
            vpnStatusBar.style.display = 'flex';
            vpnLocationText.textContent = `VPN: ${selectedVPNLocation.toUpperCase()}`;
            
            // Set flag
            vpnLocationFlag.src = FLAGS[selectedVPNLocation];
            vpnLocationFlag.alt = `${selectedVPNLocation.toUpperCase()} Flag`;
            
            closeVPNModal();
            
            // Apply VPN to all tabs using main process
            try {
                await ipcRenderer.invoke('set-proxy-for-all-tabs', result.proxy);
                showNotification('VPN Connected', result.message);
            } catch (proxyError) {
                showNotification('Proxy Error', `Failed to set proxy: ${proxyError.message}`);
            }
        } else {
            showNotification('VPN Connection Failed', result.message);
        }
    } catch (error) {
        showNotification('VPN Error', error.message);
    }
}

// Disconnect VPN
async function disconnectVPN() {
    try {
        const result = await ipcRenderer.invoke('vpn-disconnect');
        
        if (result.success) {
            isVPNConnected = false;
            vpnStatusBar.style.display = 'none';
            vpnLocationText.textContent = 'No VPN';
            selectedVPNLocation = null;

            // Remove proxy from all tabs using main process
            try {
                await ipcRenderer.invoke('clear-proxy-for-all-tabs');
                showNotification('VPN Disconnected', result.message);
            } catch (proxyError) {
                showNotification('Proxy Error', `Failed to clear proxy: ${proxyError.message}`);
            }
        } else {
            showNotification('VPN Disconnection Failed', result.message);
        }
    } catch (error) {
        showNotification('VPN Error', error.message);
    }
}

// Close VPN Status Bar
function closeVPNStatus() {
    vpnStatusBar.style.display = 'none';
}

// Event Listeners
vpnToggle.addEventListener('click', showVPNModal);
closeModal.addEventListener('click', closeVPNModal);
cancelVPNBtn.addEventListener('click', closeVPNModal);
connectVPNBtn.addEventListener('click', connectVPN);
disconnectVPNBtn.addEventListener('click', disconnectVPN);
closeVPNStatusBtn.addEventListener('click', closeVPNStatus);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === vpnModal) {
        closeVPNModal();
    }
});

// Notification Function
function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Initialize VPN status bar as hidden
vpnStatusBar.style.display = 'none';
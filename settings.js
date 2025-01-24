// Sidebar Navigation
const sidebarItems = document.querySelectorAll('.settings-sidebar li');
const settingsSections = document.querySelectorAll('.settings-content section');

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items and sections
        sidebarItems.forEach(i => i.classList.remove('active'));
        settingsSections.forEach(s => s.classList.remove('active'));

        // Add active class to clicked item and corresponding section
        item.classList.add('active');
        const sectionId = item.dataset.section;
        document.getElementById(sectionId).classList.add('active');
    });
});

// Settings Controls
const settingsControls = {
    startupPage: document.getElementById('startupPage'),
    newTabDefault: document.getElementById('newTabDefault'),
    themeSelect: document.getElementById('themeSelect'),
    clearHistoryOnExit: document.getElementById('clearHistoryOnExit'),
    trackingProtection: document.getElementById('trackingProtection'),
    hardwareAcceleration: document.getElementById('hardwareAcceleration'),
    downloadLocation: document.getElementById('downloadLocation'),
    changeDownloadLocation: document.getElementById('changeDownloadLocation'),
    searchEngine: document.getElementById('searchEngine')
};

// Load existing settings
async function loadSettings() {
    try {
        const settings = await window.ipcRenderer.invoke('get-settings');

        // Populate settings controls
        settingsControls.startupPage.checked = settings.startupPage;
        settingsControls.newTabDefault.checked = settings.newTabDefault;
        settingsControls.themeSelect.value = settings.theme;
        settingsControls.clearHistoryOnExit.checked = settings.clearHistoryOnExit;
        settingsControls.trackingProtection.checked = settings.trackingProtection;
        settingsControls.hardwareAcceleration.checked = settings.hardwareAcceleration;
        settingsControls.downloadLocation.value = settings.downloadLocation;
        settingsControls.searchEngine.value = settings.searchEngine || 'google';
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save settings
function saveSettings() {
    const settings = {
        startupPage: settingsControls.startupPage.checked,
        newTabDefault: settingsControls.newTabDefault.checked,
        theme: settingsControls.themeSelect.value,
        clearHistoryOnExit: settingsControls.clearHistoryOnExit.checked,
        trackingProtection: settingsControls.trackingProtection.checked,
        hardwareAcceleration: settingsControls.hardwareAcceleration.checked,
        downloadLocation: settingsControls.downloadLocation.value,
        searchEngine: settingsControls.searchEngine.value
    };

    // Send settings to main process
    window.ipcRenderer.send('update-settings', settings);
}

// Change download location
settingsControls.changeDownloadLocation.addEventListener('click', async () => {
    try {
        const newLocation = await window.ipcRenderer.invoke('choose-download-location');
        settingsControls.downloadLocation.value = newLocation;
        saveSettings();
    } catch (error) {
        console.error('Failed to change download location:', error);
    }
});

// Theme change listener
settingsControls.themeSelect.addEventListener('change', () => {
    const selectedTheme = settingsControls.themeSelect.value;
    window.ipcRenderer.send('apply-theme', selectedTheme);
});

// Auto-save settings when changed
Object.values(settingsControls).forEach(control => {
    if (control.type !== 'button') {
        control.addEventListener('change', saveSettings);
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', loadSettings);

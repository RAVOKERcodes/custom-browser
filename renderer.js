const webview = document.getElementById('webview');
const urlInput = document.getElementById('url');
const goButton = document.getElementById('go');
const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');

// Navigation History
let navigationHistory = [];
let currentHistoryIndex = -1;

// Enhanced navigation function
function navigateTo(input) {
    // Trim and clean the input
    input = input.trim();

    // Comprehensive URL validation regex
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    const ipPattern = /^(https?:\/\/)?((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:\d+)?$/;
    const localhostPattern = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/;

    // Function to search on Google
    function searchOnGoogle(query) {
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    // Check if input is a valid URL, IP, or localhost
    if (urlPattern.test(input) || ipPattern.test(input) || localhostPattern.test(input)) {
        // If URL doesn't start with protocol, add https
        const url = input.startsWith('http://') || input.startsWith('https://') 
            ? input 
            : `https://${input}`;
        webview.src = url;
        urlInput.value = url;
    } 
    // For anything else, search on Google
    else {
        const googleSearchUrl = searchOnGoogle(input);
        webview.src = googleSearchUrl;
        urlInput.value = googleSearchUrl;
    }
}

// Navigate to URL
goButton.addEventListener('click', () => {
    const url = document.getElementById('url').value;
    navigateToURL(url);
});

urlInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const url = urlInput.value;
        navigateToURL(url);
    }
});

// Update the input field with the current URL
webview.addEventListener('did-navigate', (event) => {
    urlInput.value = event.url;
    
    // Add to navigation history
    if (currentHistoryIndex === -1 || event.url !== navigationHistory[currentHistoryIndex]) {
        // If we're not at the end of history, truncate future history
        if (currentHistoryIndex < navigationHistory.length - 1) {
            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
        }
        
        navigationHistory.push(event.url);
        currentHistoryIndex++;
        
        // Save to localStorage
        saveHistory();
    }
    
    // Update navigation button states
    updateNavigationButtons();
});

// Back navigation
backButton.addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const previousUrl = navigationHistory[currentHistoryIndex];
        webview.src = previousUrl;
        urlInput.value = previousUrl;
        updateNavigationButtons();
    }
});

// Forward navigation
forwardButton.addEventListener('click', () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
        currentHistoryIndex++;
        const nextUrl = navigationHistory[currentHistoryIndex];
        webview.src = nextUrl;
        urlInput.value = nextUrl;
        updateNavigationButtons();
    }
});

// Update navigation button states
function updateNavigationButtons() {
    backButton.disabled = currentHistoryIndex <= 0;
    forwardButton.disabled = currentHistoryIndex >= navigationHistory.length - 1;
}

// Panel and Frame Management
let currentPanelId = null;
let activeFrames = new Map(); // Track active frames by their ID

function openPanel(id, url) {
    const panel = document.getElementById('sidePanel');
    const webview = document.getElementById('panelWebview');
    const title = panel.querySelector('.panel-title');
    
    // Check if there's an active frame for this ID
    const frameId = `frame-${id}`;
    const activeFrame = activeFrames.get(id);
    
    if (activeFrame) {
        // Re-attach frame content to panel
        webview.src = activeFrame.webview.src;
        title.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        panel.classList.add('active');
        currentPanelId = id;
        
        // Remove the frame
        activeFrame.element.remove();
        activeFrames.delete(id);
        return;
    }
    
    // If clicking the same button and no frame exists, close the panel
    if (currentPanelId === id) {
        closePanel();
        return;
    }
    
    // Update panel content
    title.textContent = id.charAt(0).toUpperCase() + id.slice(1);
    webview.src = url;
    
    // Show panel
    panel.classList.add('active');
    currentPanelId = id;
}

function closePanel() {
    const panel = document.getElementById('sidePanel');
    panel.classList.remove('active');
    currentPanelId = null;
    
    // Clear webview to stop any running processes
    const webview = document.getElementById('panelWebview');
    webview.src = 'about:blank';
}

function detachPanel() {
    if (!currentPanelId) return;
    
    const panel = document.getElementById('sidePanel');
    const webview = document.getElementById('panelWebview');
    const title = panel.querySelector('.panel-title').textContent;
    const url = webview.src;
    
    // Create new frame
    createFrame(currentPanelId, url);
    
    // Close panel
    closePanel();
}

function createFrame(id, url) {
    const frameId = `frame-${id}`;
    const frame = document.createElement('div');
    frame.id = frameId;
    frame.className = 'frame-container';
    frame.style.width = '800px';
    frame.style.height = '600px';
    
    // Set initial position without transform
    const initialLeft = (window.innerWidth - 800) / 2;
    const initialTop = (window.innerHeight - 600) / 2;
    frame.style.position = 'fixed';
    frame.style.left = initialLeft + 'px';
    frame.style.top = initialTop + 'px';
    
    const header = document.createElement('div');
    header.className = 'frame-header';
    
    const title = document.createElement('div');
    title.textContent = id.charAt(0).toUpperCase() + id.slice(1);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => {
        frame.remove();
        activeFrames.delete(id);
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const webview = document.createElement('webview');
    webview.style.width = '100%';
    webview.style.height = 'calc(100% - 40px)';
    webview.src = url;
    webview.setAttribute('allowpopups', 'true');
    
    frame.appendChild(header);
    frame.appendChild(webview);
    document.body.appendChild(frame);
    
    // Store frame reference
    activeFrames.set(id, {
        element: frame,
        webview: webview
    });
    
    // Make frame draggable
    makeDraggable(frame, header);
    
    // Show frame
    frame.style.display = 'block';
}

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e.preventDefault();
        // Get the current mouse position
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        // Calculate the new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position directly
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        // Add bounds checking to keep frame within window
        const maxTop = window.innerHeight - element.offsetHeight;
        const maxLeft = window.innerWidth - element.offsetWidth;
        
        element.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
        element.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Custom Button Functionality
function showAddButtonForm() {
    document.getElementById('addButtonForm').style.display = 'block';
}

function hideAddButtonForm() {
    document.getElementById('addButtonForm').style.display = 'none';
    document.getElementById('buttonName').value = '';
    document.getElementById('buttonUrl').value = '';
}

function createCustomButton() {
    const name = document.getElementById('buttonName').value.trim();
    const url = document.getElementById('buttonUrl').value.trim();
    
    if (!name || !url) {
        alert('Please fill in both name and URL');
        return;
    }

    if (!url.startsWith('https://')) {
        alert('URL must start with https://');
        return;
    }

    // Check if button name already exists
    const customButtons = JSON.parse(localStorage.getItem('customButtons') || '[]');
    if (customButtons.some(btn => btn.name.toLowerCase() === name.toLowerCase())) {
        alert('A button with this name already exists. Please choose a different name.');
        return;
    }

    // Add to localStorage
    customButtons.push({ name, url });
    localStorage.setItem('customButtons', JSON.stringify(customButtons));
    
    // Then add to UI
    addButtonToUI(name, url);
    hideAddButtonForm();
}

function addButtonToUI(name, url) {
    const button = document.createElement('button');
    button.textContent = name;
    const buttonId = name.toLowerCase();
    button.onclick = () => openPanel(buttonId, url);
    button.id = `button-${Date.now()}`;
    
    // Add right-click event listener for context menu
    button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const contextMenu = document.getElementById('customContextMenu');
        
        // Position the menu at cursor
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.display = 'block';
        
        // Store button info for removal
        contextMenu.setAttribute('data-button-name', name);
        contextMenu.setAttribute('data-button-url', url);
        contextMenu.setAttribute('data-button-element', button.id);
    });
    
    document.getElementById('customButtons').appendChild(button);
}

// Handle context menu actions
document.getElementById('removeButton').addEventListener('click', () => {
    const contextMenu = document.getElementById('customContextMenu');
    const name = contextMenu.getAttribute('data-button-name');
    const url = contextMenu.getAttribute('data-button-url');
    const buttonId = contextMenu.getAttribute('data-button-element');
    
    // Remove from localStorage first
    const customButtons = JSON.parse(localStorage.getItem('customButtons') || '[]');
    const updatedButtons = customButtons.filter(btn => !(btn.name === name && btn.url === url));
    localStorage.setItem('customButtons', JSON.stringify(updatedButtons));
    
    // Then remove from UI
    const button = document.getElementById(buttonId);
    if (button) {
        button.remove();
    }
    
    // Hide context menu
    contextMenu.style.display = 'none';
});

document.getElementById('cancelContextMenu').addEventListener('click', () => {
    document.getElementById('customContextMenu').style.display = 'none';
});

// Hide context menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
        document.getElementById('customContextMenu').style.display = 'none';
    }
});

// Prevent context menu from showing outside custom buttons
document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('#customButtons button')) {
        document.getElementById('customContextMenu').style.display = 'none';
    }
});

// Load custom buttons on startup
document.addEventListener('DOMContentLoaded', () => {
    const customButtons = JSON.parse(localStorage.getItem('customButtons') || '[]');
    const container = document.getElementById('customButtons');
    container.innerHTML = ''; // Clear existing buttons
    
    customButtons.forEach(({ name, url }) => {
        addButtonToUI(name, url);
    });
});

// Edit button functionality
document.getElementById('editButton').addEventListener('click', () => {
    const contextMenu = document.getElementById('customContextMenu');
    const name = contextMenu.getAttribute('data-button-name');
    const url = contextMenu.getAttribute('data-button-url');
    
    // Populate edit modal with current button details
    document.getElementById('editButtonName').value = name;
    document.getElementById('editButtonUrl').value = url;
    
    // Show edit modal
    document.getElementById('editButtonModal').style.display = 'block';
    
    // Hide context menu
    contextMenu.style.display = 'none';
});

// Save edited button
document.getElementById('saveEditButton').addEventListener('click', () => {
    const contextMenu = document.getElementById('customContextMenu');
    const oldName = contextMenu.getAttribute('data-button-name');
    
    // Get new values
    const newName = document.getElementById('editButtonName').value.trim();
    const newUrl = document.getElementById('editButtonUrl').value.trim();
    
    // Validate inputs
    if (!newName || !newUrl) {
        alert('Please enter both name and URL');
        return;
    }
    
    // Get current custom buttons
    let customButtons = JSON.parse(localStorage.getItem('customButtons') || '[]');
    
    // Find and update the button
    const buttonIndex = customButtons.findIndex(btn => btn.name === oldName);
    if (buttonIndex !== -1) {
        customButtons[buttonIndex] = { name: newName, url: newUrl };
        
        // Save updated buttons
        localStorage.setItem('customButtons', JSON.stringify(customButtons));
        
        // Update UI
        const buttonElement = document.querySelector(`#customButtons button[data-name="${oldName}"]`);
        if (buttonElement) {
            buttonElement.textContent = newName;
            buttonElement.setAttribute('data-name', newName);
            buttonElement.setAttribute('data-url', newUrl);
        }
        
        // Close modal
        document.getElementById('editButtonModal').style.display = 'none';
    }
});

// Cancel edit modal
document.getElementById('cancelEditButton').addEventListener('click', () => {
    document.getElementById('editButtonModal').style.display = 'none';
});

// Theme handling
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.innerHTML = `${newTheme === 'light' ? '🌓' : '☀️'} Theme`;
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.innerHTML = `${savedTheme === 'light' ? '🌓' : '☀️'} Theme`;
});

// Webview Context Menu Handling
const webviewContextMenu = document.getElementById('webviewContextMenu');

webview.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent default context menu
    
    // Position the context menu near the mouse click
    webviewContextMenu.style.display = 'block';
    webviewContextMenu.style.left = `${e.clientX}px`;
    webviewContextMenu.style.top = `${e.clientY}px`;
});

// Hide context menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('#webview')) {
        webviewContextMenu.style.display = 'none';
    }
});

// Context Menu Actions
document.getElementById('inspectElement').addEventListener('click', () => {
    webview.inspectElement(webview.getWebContents().getLastFocusedBounds().x, 
                            webview.getWebContents().getLastFocusedBounds().y);
    webviewContextMenu.style.display = 'none';
});

document.getElementById('viewPageSource').addEventListener('click', () => {
    webview.executeJavaScript('window.location.href', false, (url) => {
        const sourceUrl = `view-source:${url}`;
        navigateTo(sourceUrl);
    });
    webviewContextMenu.style.display = 'none';
});

document.getElementById('reloadPage').addEventListener('click', () => {
    webview.reload();
    webviewContextMenu.style.display = 'none';
});

document.getElementById('goBack').addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const previousUrl = navigationHistory[currentHistoryIndex];
        webview.src = previousUrl;
        urlInput.value = previousUrl;
        updateNavigationButtons();
    }
    webviewContextMenu.style.display = 'none';
});

document.getElementById('goForward').addEventListener('click', () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
        currentHistoryIndex++;
        const nextUrl = navigationHistory[currentHistoryIndex];
        webview.src = nextUrl;
        urlInput.value = nextUrl;
        updateNavigationButtons();
    }
    webviewContextMenu.style.display = 'none';
});

document.getElementById('saveAsPDF').addEventListener('click', () => {
    webview.printToPDF({}, (error, data) => {
        if (error) {
            console.error('Error generating PDF:', error);
            return;
        }
        const blob = new Blob([data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'webpage.pdf';
        link.click();
    });
    webviewContextMenu.style.display = 'none';
});

document.getElementById('printPage').addEventListener('click', () => {
    webview.print();
    webviewContextMenu.style.display = 'none';
});

document.getElementById('copyAddress').addEventListener('click', () => {
    webview.executeJavaScript('window.location.href', false, (url) => {
        navigator.clipboard.writeText(url).then(() => {
            console.log('URL copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy URL:', err);
        });
    });
    webviewContextMenu.style.display = 'none';
});

// URL Suggestion and Auto-completion
const urlSuggestionsList = document.createElement('div');
urlSuggestionsList.id = 'urlSuggestions';
urlSuggestionsList.classList.add('url-suggestions');
document.querySelector('.browser-controls').appendChild(urlSuggestionsList);

// Popular search engines and websites for suggestions
const popularSites = [
    'google.com', 'youtube.com', 'wikipedia.org', 
    'github.com', 'stackoverflow.com', 'reddit.com', 
    'twitter.com', 'linkedin.com', 'amazon.com'
];

// Function to generate URL suggestions
function generateUrlSuggestions(input) {
    console.log('Generating suggestions for:', input); // Debug log
    
    // Clear previous suggestions
    urlSuggestionsList.innerHTML = '';
    
    // If input is empty, don't show suggestions
    if (!input) return;

    // Intelligent prefix handling
    const cleanInput = input.trim().toLowerCase();
    
    // Combine suggestions from different sources
    const suggestions = [
        // Add 'www.' prefix suggestions
        ...popularSites.filter(site => 
            site.includes(cleanInput) || 
            `www.${site}`.includes(cleanInput)
        ).map(site => `https://www.${site}`),
        
        // Add direct domain suggestions
        ...popularSites.filter(site => 
            site.startsWith(cleanInput)
        ).map(site => `https://${site}`),
        
        // Add HTTP/HTTPS variations
        ...[
            cleanInput.startsWith('http://') ? 
                cleanInput.replace('http://', 'https://') : 
                `https://${cleanInput}`,
            cleanInput.startsWith('https://') ? 
                cleanInput.replace('https://', 'http://') : 
                `http://${cleanInput}`,
            cleanInput.startsWith('www.') ? 
                `https://${cleanInput}` : 
                `https://www.${cleanInput}`
        ]
    ];

    // Remove duplicates and limit suggestions
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);
    
    console.log('Unique suggestions:', uniqueSuggestions); // Debug log
    
    // Create suggestion elements
    uniqueSuggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.classList.add('suggestion-item');
        suggestionElement.textContent = suggestion;
        suggestionElement.addEventListener('click', () => {
            urlInput.value = suggestion;
            navigateToURL(suggestion);
            urlSuggestionsList.innerHTML = ''; // Clear suggestions
        });
        urlSuggestionsList.appendChild(suggestionElement);
    });

    // Show suggestions only if there are any
    urlSuggestionsList.style.display = uniqueSuggestions.length > 0 ? 'flex' : 'none';
}

// Debounce function to limit suggestion generation frequency
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Add event listener for URL input with debounce
const debouncedSuggestions = debounce((event) => {
    generateUrlSuggestions(event.target.value);
}, 300);

urlInput.addEventListener('input', debouncedSuggestions);

// Hide suggestions when clicking outside
document.addEventListener('click', (event) => {
    if (!urlInput.contains(event.target) && 
        !urlSuggestionsList.contains(event.target)) {
        urlSuggestionsList.style.display = 'none';
    }
});

// History Panel Management
const historyPanel = document.createElement('div');
historyPanel.id = 'historyPanel';
historyPanel.classList.add('side-panel');
historyPanel.innerHTML = `
    <div class="panel-header">
        <h2>Browsing History</h2>
        <button id="clearHistory">Clear History</button>
        <button id="closeHistoryPanel">Close</button>
    </div>
    <div id="historyList"></div>
`;
document.body.appendChild(historyPanel);

const historyListElement = document.getElementById('historyList');
const clearHistoryButton = document.getElementById('clearHistory');
const closeHistoryPanelButton = document.getElementById('closeHistoryPanel');

// Load history from localStorage on startup
function loadHistory() {
    const storedHistory = localStorage.getItem('browserHistory');
    if (storedHistory) {
        navigationHistory = JSON.parse(storedHistory);
        currentHistoryIndex = navigationHistory.length - 1;
        renderHistoryPanel();
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('browserHistory', JSON.stringify(navigationHistory));
}

// Render history panel
function renderHistoryPanel() {
    historyListElement.innerHTML = '';
    navigationHistory.forEach((url, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.textContent = url;
        historyItem.addEventListener('click', () => {
            currentHistoryIndex = index;
            webview.src = url;
            urlInput.value = url;
            updateNavigationButtons();
            toggleHistoryPanel(); // Close panel after selecting
        });
        historyListElement.appendChild(historyItem);
    });
}

// Toggle history panel
function toggleHistoryPanel() {
    historyPanel.classList.toggle('active');
    if (historyPanel.classList.contains('active')) {
        renderHistoryPanel();
    }
}

// Clear history
clearHistoryButton.addEventListener('click', () => {
    navigationHistory = [];
    currentHistoryIndex = -1;
    localStorage.removeItem('browserHistory');
    renderHistoryPanel();
    updateNavigationButtons();
});

// Close history panel
closeHistoryPanelButton.addEventListener('click', toggleHistoryPanel);

// Load history on startup
document.addEventListener('DOMContentLoaded', loadHistory);

// Add event listener for history button
document.getElementById('showHistory').addEventListener('click', toggleHistoryPanel);

// Download Management
const { ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Download Panel Management
const downloadPanel = document.getElementById('downloadPanel');
const downloadList = document.getElementById('downloadList');
const showDownloadsButton = document.getElementById('showDownloads');
const clearDownloadsButton = document.getElementById('clearDownloads');
const closeDownloadPanelButton = document.getElementById('closeDownloadPanel');

// Download state management
let downloads = [];

// Function to save downloads to localStorage
function saveDownloads() {
    localStorage.setItem('browserDownloads', JSON.stringify(downloads));
}

// Function to load downloads from localStorage
function loadDownloads() {
    const storedDownloads = localStorage.getItem('browserDownloads');
    if (storedDownloads) {
        downloads = JSON.parse(storedDownloads);
        renderDownloadPanel();
    }
}

// Function to toggle download panel
function toggleDownloadPanel() {
    downloadPanel.classList.toggle('active');
    if (downloadPanel.classList.contains('active')) {
        renderDownloadPanel();
    }
}

// Function to render download panel
function renderDownloadPanel() {
    downloadList.innerHTML = '';
    
    downloads.forEach((download, index) => {
        const downloadItem = document.createElement('div');
        downloadItem.classList.add('download-item');
        
        // Download details
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('download-item-details');
        
        const nameElement = document.createElement('div');
        nameElement.classList.add('download-item-name');
        nameElement.textContent = download.filename;
        
        const pathElement = document.createElement('div');
        pathElement.classList.add('download-item-path');
        pathElement.textContent = download.path;
        
        detailsContainer.appendChild(nameElement);
        detailsContainer.appendChild(pathElement);
        
        // Actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('download-actions');
        
        // Open file button
        const openFileButton = document.createElement('button');
        openFileButton.classList.add('download-action-btn');
        openFileButton.innerHTML = '📂';
        openFileButton.title = 'Open in Folder';
        openFileButton.addEventListener('click', () => {
            shell.showItemInFolder(download.path);
        });
        
        // Remove download button
        const removeButton = document.createElement('button');
        removeButton.classList.add('download-action-btn');
        removeButton.innerHTML = '❌';
        removeButton.title = 'Remove Download';
        removeButton.addEventListener('click', () => {
            downloads.splice(index, 1);
            saveDownloads();
            renderDownloadPanel();
        });
        
        actionsContainer.appendChild(openFileButton);
        actionsContainer.appendChild(removeButton);
        
        downloadItem.appendChild(detailsContainer);
        downloadItem.appendChild(actionsContainer);
        
        downloadList.appendChild(downloadItem);
    });
}

// Event listeners for download panel
showDownloadsButton.addEventListener('click', toggleDownloadPanel);
closeDownloadPanelButton.addEventListener('click', toggleDownloadPanel);

// Clear all downloads
clearDownloadsButton.addEventListener('click', () => {
    downloads = [];
    saveDownloads();
    renderDownloadPanel();
});

// Listen for download events from main process
ipcRenderer.on('download-started', (event, downloadItem) => {
    const download = {
        filename: downloadItem.filename,
        path: downloadItem.savePath,
        timestamp: Date.now(),
        status: 'started'
    };
    
    downloads.push(download);
    saveDownloads();
    renderDownloadPanel();
});

ipcRenderer.on('download-completed', (event, downloadItem) => {
    // Update download status
    const existingDownload = downloads.find(d => d.filename === downloadItem.filename);
    if (existingDownload) {
        existingDownload.status = 'completed';
        saveDownloads();
        renderDownloadPanel();
    }
});

// Request download from main process
function requestDownload(url) {
    ipcRenderer.send('download-request', { url });
}

// Attach download request to webview
webview.addEventListener('did-navigate', () => {
    // Remove any previous download listeners
    webview.removeEventListener('ipc-message', handleWebviewDownload);
    
    // Add new download listener
    webview.addEventListener('ipc-message', handleWebviewDownload);
});

function handleWebviewDownload(event) {
    if (event.channel === 'download-link') {
        const downloadUrl = event.args[0];
        requestDownload(downloadUrl);
    }
}

// Load downloads on startup
document.addEventListener('DOMContentLoaded', loadDownloads);

// Tab Management
const tabBar = document.getElementById('tabBar');
const addTabBtn = document.getElementById('addTabBtn');
const webviewContainer = document.querySelector('.webview-container');
const mainWebview = document.getElementById('webview');

class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabIndex = -1;
        this.devToolsStates = new WeakMap(); // Track DevTools state for each webview
        this.setupEventListeners();
        this.setupGlobalDevToolsShortcut();
        
        // Convert main webview to first tab
        this.convertMainWebviewToTab();
    }

    convertMainWebviewToTab() {
        // Create tab button for existing webview
        const tabBtn = document.createElement('button');
        tabBtn.classList.add('tab-btn');
        tabBtn.textContent = this.extractDomain(mainWebview.src);

        // Close tab button
        const closeTabBtn = document.createElement('span');
        closeTabBtn.innerHTML = '×';
        closeTabBtn.classList.add('close-tab');

        // Combine tab button and close button
        const tabWrapper = document.createElement('div');
        tabWrapper.classList.add('tab-wrapper', 'active');
        tabWrapper.appendChild(tabBtn);
        tabWrapper.appendChild(closeTabBtn);

        // Add to tab bar
        tabBar.insertBefore(tabWrapper, addTabBtn);

        // Add to tabs array
        this.tabs.push({
            button: tabWrapper,
            webview: mainWebview,
            url: mainWebview.src
        });

        this.activeTabIndex = 0;

        // Setup event listeners
        tabBtn.addEventListener('click', () => this.switchToTab(0));
        closeTabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(0);
        });

        this.setupWebviewListeners(mainWebview, tabBtn);
    }

    setupEventListeners() {
        addTabBtn.addEventListener('click', () => this.createNewTab());
    }

    createNewTab(url = 'https://www.google.com') {
        // Create tab button
        const tabBtn = document.createElement('button');
        tabBtn.classList.add('tab-btn');
        
        // Create webview
        const webview = document.createElement('webview');
        webview.src = url;
        webview.style.width = '100%';
        webview.style.height = '100%';
        webview.style.display = 'none';

        // Tab management
        const tabIndex = this.tabs.length;
        tabBtn.textContent = this.extractDomain(url);
        tabBtn.addEventListener('click', () => this.switchToTab(tabIndex));

        // Close tab button
        const closeTabBtn = document.createElement('span');
        closeTabBtn.innerHTML = '×';
        closeTabBtn.classList.add('close-tab');
        closeTabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabIndex);
        });

        // Combine tab button and close button
        const tabWrapper = document.createElement('div');
        tabWrapper.classList.add('tab-wrapper');
        tabWrapper.appendChild(tabBtn);
        tabWrapper.appendChild(closeTabBtn);

        // Add to tab bar
        tabBar.insertBefore(tabWrapper, addTabBtn);

        // Add to tabs array
        this.tabs.push({
            button: tabWrapper,
            webview: webview,
            url: url
        });

        // Switch to new tab
        this.switchToTab(tabIndex);

        // Add webview to container
        webviewContainer.appendChild(webview);

        // Add navigation event listeners
        this.setupWebviewListeners(webview, tabBtn);
    }

    setupWebviewListeners(webview, tabBtn) {
        // Update URL and tab title on navigation
        webview.addEventListener('did-navigate', (event) => {
            const url = event.url;
            tabBtn.textContent = this.extractDomain(url);
        });

        // Add context menu for DevTools
        webview.addEventListener('context-menu', (event) => {
            const contextMenu = document.createElement('div');
            contextMenu.classList.add('context-menu');
            contextMenu.style.position = 'fixed';
            contextMenu.style.left = `${event.params.x}px`;
            contextMenu.style.top = `${event.params.y}px`;

            // DevTools option
            const devToolsOption = document.createElement('div');
            devToolsOption.textContent = 'Inspect Element';
            devToolsOption.classList.add('context-menu-item');
            devToolsOption.addEventListener('click', () => {
                this.toggleDevTools(webview);
            });

            contextMenu.appendChild(devToolsOption);
            document.body.appendChild(contextMenu);

            // Close context menu when clicking outside
            const closeMenu = (e) => {
                if (!contextMenu.contains(e.target)) {
                    document.body.removeChild(contextMenu);
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        });
    }

    toggleDevTools(webview) {
        // Check if DevTools is already open for this webview
        const isDevToolsOpen = this.devToolsStates.get(webview);

        if (isDevToolsOpen) {
            webview.closeDevTools();
            this.devToolsStates.set(webview, false);
        } else {
            webview.openDevTools();
            this.devToolsStates.set(webview, true);
        }
    }

    setupGlobalDevToolsShortcut() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+I or Cmd+Option+I to open DevTools
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyI') {
                if (this.activeTabIndex !== -1) {
                    const currentWebview = this.tabs[this.activeTabIndex].webview;
                    this.toggleDevTools(currentWebview);
                }
            }
        });
    }

    switchToTab(index) {
        // Hide all webviews
        this.tabs.forEach((tab, i) => {
            tab.webview.style.display = 'none';
            tab.button.classList.remove('active');
        });

        // Show selected webview
        this.tabs[index].webview.style.display = 'flex';
        this.tabs[index].button.classList.add('active');
        this.activeTabIndex = index;

        // Update URL input
        urlInput.value = this.tabs[index].url || this.tabs[index].webview.src;
    }

    closeTab(index) {
        // Prevent closing the last tab
        if (this.tabs.length <= 1) {
            this.createNewTab();
            return;
        }

        // Remove from DOM
        this.tabs[index].button.remove();
        this.tabs[index].webview.remove();

        // Remove from tabs array
        this.tabs.splice(index, 1);

        // Adjust tab indices
        this.tabs.forEach((tab, i) => {
            if (i >= index) {
                // Update event listeners
                tab.button.querySelector('.tab-btn').removeEventListener('click', () => this.switchToTab(i));
                tab.button.querySelector('.tab-btn').addEventListener('click', () => this.switchToTab(i));
            }
        });

        // Switch to last tab or create new tab
        this.switchToTab(Math.min(index, this.tabs.length - 1));
    }

    extractDomain(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return 'New Tab';
        }
    }

    updateActiveTabURL(url) {
        if (this.activeTabIndex !== -1) {
            this.tabs[this.activeTabIndex].webview.src = url;
            this.tabs[this.activeTabIndex].url = url;
            
            // Update tab title
            const currentTabButton = this.tabs[this.activeTabIndex].button.querySelector('.tab-btn');
            currentTabButton.textContent = this.extractDomain(url);
        }
    }
}

// Initialize tab manager
const tabManager = new TabManager();

function navigateToURL(url) {
    // Validate and format URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Check if it's a search query or needs search completion
        if (url.includes(' ') || !url.includes('.')) {
            // Perform Google search for multi-word or incomplete URLs
            url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        } else {
            // Add default protocol
            url = `https://${url}`;
        }
    }

    // Navigate in the current active tab
    if (tabManager.activeTabIndex !== -1) {
        const currentWebview = tabManager.tabs[tabManager.activeTabIndex].webview;
        currentWebview.src = url;
        
        // Update URL in input field
        urlInput.value = url;
        
        // Update tab title
        const currentTabButton = tabManager.tabs[tabManager.activeTabIndex].button.querySelector('.tab-btn');
        currentTabButton.textContent = tabManager.extractDomain(url);
    }
}

// Reload Current Tab
const reloadButton = document.getElementById('reload');
reloadButton.addEventListener('click', () => {
    const currentTab = tabManager.tabs[tabManager.activeTabIndex];
    if (currentTab && currentTab.webview) {
        currentTab.webview.reload();
    }
});

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

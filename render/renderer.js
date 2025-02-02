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





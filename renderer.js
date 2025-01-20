const webview = document.getElementById('webview');
const urlInput = document.getElementById('url');
const goButton = document.getElementById('go');
const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');

// Navigation History
let navigationHistory = [];
let currentHistoryIndex = -1;

// Navigate to URL
goButton.addEventListener('click', () => {
    const url = urlInput.value.startsWith('http') ? urlInput.value : `https://${urlInput.value}`;
    navigateTo(url);
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
    }
    
    // Update navigation button states
    updateNavigationButtons();
});

// Navigation function
function navigateTo(url) {
    webview.src = url;
}

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

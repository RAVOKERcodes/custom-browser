const webview = document.getElementById('webview');
const urlInput = document.getElementById('url');
const goButton = document.getElementById('go');

// Navigate to URL
goButton.addEventListener('click', () => {
    const url = urlInput.value.startsWith('http') ? urlInput.value : `https://${urlInput.value}`;
    webview.src = url;
});

// Update the input field with the current URL
webview.addEventListener('did-navigate', (event) => {
    urlInput.value = event.url;
});

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

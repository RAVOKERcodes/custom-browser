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

function openFrame(frameId, url) {
    let container = document.getElementById(frameId);
    if (!container) {
        container = document.createElement('div');
        container.id = frameId;
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.backgroundColor = 'white';
        container.style.padding = '20px';
        container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        container.style.zIndex = '1000';
        container.style.width = '800px';
        container.style.height = '600px';

        // Create header for dragging
        const header = document.createElement('div');
        header.style.padding = '10px';
        header.style.marginBottom = '10px';
        header.style.backgroundColor = '#f0f0f0';
        header.style.cursor = 'move';
        header.textContent = frameId.charAt(0).toUpperCase() + frameId.slice(1);
        
        const webviewFrame = document.createElement('webview');
        webviewFrame.style.width = '100%';
        webviewFrame.style.height = 'calc(100% - 60px)';
        webviewFrame.style.border = 'none';
        webviewFrame.src = url;
        webviewFrame.setAttribute('allowpopups', 'true');
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.onclick = () => container.remove();
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '5px 10px';
        closeButton.style.cursor = 'pointer';
        
        container.appendChild(header);
        container.appendChild(webviewFrame);
        container.appendChild(closeButton);
        document.body.appendChild(container);

        // Make draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, container);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
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
    button.onclick = () => openFrame(name.toLowerCase(), url);
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

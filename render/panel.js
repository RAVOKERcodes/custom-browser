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

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

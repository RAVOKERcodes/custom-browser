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

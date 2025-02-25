
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
        webview.style.height = 'calc(100vh - 175px)';
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
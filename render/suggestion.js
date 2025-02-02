
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

// Search Suggestions
const suggestionDropdown = document.getElementById('suggestionDropdown');
const historySuggestions = document.getElementById('historySuggestions');
const googleSuggestions = document.getElementById('googleSuggestions');

// Debounce function to limit API calls
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Get suggestions from browser history
async function getHistorySuggestions(query) {
    try {
        const suggestions = await ipcRenderer.invoke('get-history-suggestions', query);
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
        console.error('History suggestions error:', error);
        return [];
    }
}

// Get suggestions from Google
async function getGoogleSuggestions(query) {
    try {
        const response = await fetch(`https://suggestqueries.google.com/complete/search?output=firefox&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data[1].slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
        console.error('Google suggestions error:', error);
        return [];
    }
}

// Render suggestions
function renderSuggestions(historySugs, googleSugs) {
    // Clear previous suggestions
    historySuggestions.innerHTML = '<div class="suggestion-header">Recent History</div>';
    googleSuggestions.innerHTML = '<div class="suggestion-header">Google Suggestions</div>';

    // Render history suggestions
    historySugs.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.innerHTML = `
            <div class="title">${suggestion.title}</div>
            <div class="url">${suggestion.url}</div>
        `;
        suggestionItem.addEventListener('click', () => {
            urlInput.value = suggestion.url;
            navigateTo(suggestion.url);
            suggestionDropdown.style.display = 'none';
        });
        historySuggestions.appendChild(suggestionItem);
    });

    // Render Google suggestions
    googleSugs.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.innerHTML = `
            <div class="title">${suggestion}</div>
        `;
        suggestionItem.addEventListener('click', () => {
            urlInput.value = suggestion;
            navigateTo(`https://www.google.com/search?q=${encodeURIComponent(suggestion)}`);
            suggestionDropdown.style.display = 'none';
        });
        googleSuggestions.appendChild(suggestionItem);
    });

    // Show/hide dropdown based on suggestions
    suggestionDropdown.style.display = 
        (historySugs.length > 0 || googleSugs.length > 0) ? 'block' : 'none';
}

// Fetch and display suggestions
const fetchSuggestions = debounce(async (query) => {
    if (query.length < 2) {
        suggestionDropdown.style.display = 'none';
        return;
    }

    const [historySugs, googleSugs] = await Promise.all([
        getHistorySuggestions(query),
        getGoogleSuggestions(query)
    ]);

    renderSuggestions(historySugs, googleSugs);
}, 300);

// Event listeners
urlInput.addEventListener('input', (e) => fetchSuggestions(e.target.value));

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!urlInput.contains(e.target) && !suggestionDropdown.contains(e.target)) {
        suggestionDropdown.style.display = 'none';
    }
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
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

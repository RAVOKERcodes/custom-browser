// Capture download links
document.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (target && target.href) {
        // List of common downloadable file extensions
        const downloadExtensions = [
            'pdf', 'zip', 'rar', '7z', 
            'exe', 'msi', 
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 
            'mp3', 'wav', 'flac', 
            'mp4', 'avi', 'mkv', 'mov', 
            'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'txt', 'csv'
        ];

        // Check if the link ends with a downloadable extension
        const isDownloadLink = downloadExtensions.some(ext => 
            target.href.toLowerCase().endsWith(`.${ext}`)
        );

        if (isDownloadLink) {
            // Send download request to parent window
            window.parent.postMessage({
                type: 'download-link',
                url: target.href
            }, '*');
        }
    }
});

// Inject download request handler for webview
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'download-link') {
        // Trigger download in webview
        const downloadLink = document.createElement('a');
        downloadLink.href = event.data.url;
        downloadLink.click();
    }
});
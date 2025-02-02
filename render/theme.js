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
const options = [
  { id: 'skipRecap', timerId: 'recapTimer' },
  { id: 'skipIntro', timerId: 'introTimer' },
  { id: 'skipCredits', timerId: 'creditsTimer' }
];

// Load settings
chrome.storage.local.get(options.flatMap(o => [o.id, o.timerId]), (result) => {
  options.forEach(option => {
    document.getElementById(option.id).checked = result[option.id] !== false; // Default to true if not set
    document.getElementById(option.timerId).value = result[option.timerId] || 0;
  });
});

function showStatus() {
  const status = document.getElementById('status');
  status.textContent = 'Settings saved!';
  status.style.color = '#f47521';
  setTimeout(() => {
    status.textContent = 'Settings saved automatically';
    status.style.color = '#888';
  }, 1000);
}

// Save settings on change
options.forEach(option => {
  document.getElementById(option.id).addEventListener('change', (e) => {
    chrome.storage.local.set({ [option.id]: e.target.checked }, showStatus);
  });

  document.getElementById(option.timerId).addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      chrome.storage.local.set({ [option.timerId]: value }, showStatus);
    }
  });
});

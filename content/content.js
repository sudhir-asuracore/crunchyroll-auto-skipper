const CONFIG_KEYS = {
  RECAP: { enabled: 'skipRecap', timer: 'recapTimer' },
  INTRO: { enabled: 'skipIntro', timer: 'introTimer' },
  CREDITS: { enabled: 'skipCredits', timer: 'creditsTimer' }
};

let userSettings = {
  skipRecap: true,
  recapTimer: 0,
  skipIntro: true,
  introTimer: 0,
  skipCredits: true,
  creditsTimer: 0
};

// Load settings initially and listen for changes
chrome.storage.local.get(null, (result) => {
  userSettings = { ...userSettings, ...result };
});

chrome.storage.onChanged.addListener((changes) => {
  for (let [key, { newValue }] of Object.entries(changes)) {
    userSettings[key] = newValue;
  }
});

/**
 * Finds the skip button type based on its text content or classes.
 * @param {HTMLElement} element
 * @returns {string|null}
 */
function getSkipType(element) {
  const text = element.textContent.toUpperCase();
  if (text.includes('RECAP')) return 'RECAP';
  if (text.includes('INTRO') || text.includes('OPENING')) return 'INTRO';
  if (text.includes('CREDITS') || text.includes('ENDING') || text.includes('OUTRO')) return 'CREDITS';

  // Fallback check for classes if text is not clear
  const className = element.className.toLowerCase();
  if (className.includes('recap')) return 'RECAP';
  if (className.includes('intro') || className.includes('opening')) return 'INTRO';
  if (className.includes('credits') || className.includes('ending') || className.includes('outro')) return 'CREDITS';

  return null;
}

const processedButtons = new WeakSet();

function handleSkipButton(button) {
  if (processedButtons.has(button)) return;

  const type = getSkipType(button);
  if (!type) return;

  const config = CONFIG_KEYS[type];
  if (userSettings[config.enabled]) {
    processedButtons.add(button);
    const delay = userSettings[config.timer] * 1000;

    console.log(`[CR Auto Skipper] Detected ${type} skip button. Waiting ${delay}ms...`);

    setTimeout(() => {
      if (document.contains(button)) {
        console.log(`[CR Auto Skipper] Clicking ${type} skip button.`);
        button.click();
      }
    }, delay);
  }
}

/**
 * Recursively search for skip buttons, including inside shadow DOMs.
 * @param {Node} root
 * @param {Array} found
 */
function findSkipButtons(root, found = []) {
  if (root.nodeType !== Node.ELEMENT_NODE) return found;

  if (root.matches('.vilos-skip-button, .erc-skip-button, [class*="skip-button"], [class*="SkipButton"]')) {
    found.push(root);
  }

  // Search children
  root.querySelectorAll('.vilos-skip-button, .erc-skip-button, [class*="skip-button"], [class*="SkipButton"]').forEach(el => found.push(el));

  // Search shadow DOMs
  if (root.shadowRoot) {
    findSkipButtons(root.shadowRoot, found);
  }

  // Recursively search children for shadow roots
  const allElements = root.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      findSkipButtons(el.shadowRoot, found);
    }
  }

  return found;
}

// Observe DOM for skip buttons
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        findSkipButtons(node).forEach(handleSkipButton);
      }
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial check
findSkipButtons(document.body).forEach(handleSkipButton);

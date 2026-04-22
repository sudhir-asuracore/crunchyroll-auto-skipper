const CONFIG_KEYS = {
    RECAP: {enabled: 'skipRecap', timer: 'recapTimer'},
    INTRO: {enabled: 'skipIntro', timer: 'introTimer'},
    CREDITS: {enabled: 'skipCredits', timer: 'creditsTimer'}
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
    userSettings = {...userSettings, ...result};
    // Initial check after settings are loaded
    findSkipButtons(document.body).forEach(handleSkipButton);
});

chrome.storage.onChanged.addListener((changes) => {
    for (let [key, {newValue}] of Object.entries(changes)) {
        userSettings[key] = newValue;
    }
});

/**
 * Finds the skip button type based on its text content or classes.
 * @param {HTMLElement} element
 * @returns {string|null}
 */
function getSkipType(element) {
    const ariaLabel = element.getAttribute('aria-label');

    if (ariaLabel === 'Skip Recap') return 'RECAP';
    if (ariaLabel === 'Skip Intro') return 'INTRO';
    if (ariaLabel === 'Skip Credits') return 'CREDITS';

    return null;
}

function handleSkipButton(button) {
    const type = getSkipType(button);
    if (!type) return;

    const config = CONFIG_KEYS[type];
    if (userSettings[config.enabled]) {
        const delay = userSettings[config.timer] * 1000;
        console.log(`[CR Auto Skipper] Detected ${type} skip button. Waiting ${delay}ms...`);

        setTimeout(() => {
            if (document.contains(button)) {
                console.log(`[CR Auto Skipper] Clicking ${type} skip button.`);
                console.log("HandleSkip: 4");
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
    const selector = '[aria-label="Skip Intro"][aria-hidden="false"], [aria-label="Skip Recap"][aria-hidden="false"], [aria-label="Skip Credits"][aria-hidden="false"]';
    if (root.matches(selector)) {
        found.push(root);
    }
    root.querySelectorAll(selector).forEach(el => found.push(el));
    return found;
}

// Observe DOM for skip buttons
const observer = new MutationObserver((mutations) => {
    mutations
        .filter(mutation => mutation.type === 'attributes')
        .filter(mutation => !mutation.target.matches('[data-testid="timestamp"]'))
        .filter(mutation => mutation.target.matches('[type="button"]'))
        .forEach(mutation => {
            findSkipButtons(mutation.target).forEach(handleSkipButton);
        })
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-hidden', 'class', 'aria-label']
});

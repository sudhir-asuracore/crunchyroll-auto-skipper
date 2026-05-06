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

// Track active auto-skips to allow cancellation and prevent duplicates
const activeSkips = new WeakMap();

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
    // If we're already handling this button, skip
    if (activeSkips.has(button)) return;

    const type = getSkipType(button);
    if (!type) return;

    const config = CONFIG_KEYS[type];
    if (userSettings[config.enabled]) {
        const delaySeconds = userSettings[config.timer];

        // If delay is 0, just click immediately
        if (delaySeconds <= 0) {
            console.log(`[CR Auto Skipper] Clicking ${type} skip button immediately.`);
            button.click();
            return;
        }

        console.log(`[CR Auto Skipper] Detected ${type} skip button. Waiting ${delaySeconds}s...`);

        // Create the cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cr-auto-skip-cancel';
        cancelButton.innerText = `Auto Skip: ${delaySeconds}s - Cancel`;

        // Apply styling
        Object.assign(cancelButton.style, {
            backgroundColor: '#f47521',
            color: '#ffffff',
            border: 'none',
            borderRadius: '24px',
            padding: '8px 20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px',
            zIndex: '9999',
            marginBottom: '10px',
            display: 'inline-flex',
            maxWidth: '220px',
            height: '50px',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transition: 'transform 0.1s, background-color 0.2s',
            fontFamily: '"Source Sans Pro", sans-serif'
        });

        cancelButton.onmouseover = () => {
            cancelButton.style.backgroundColor = '#ff8533';
            cancelButton.style.transform = 'scale(1.02)';
        };
        cancelButton.onmouseout = () => {
            cancelButton.style.backgroundColor = '#f47521';
            cancelButton.style.transform = 'scale(1)';
        };

        // Insert above/beside the skip button
        if (button.parentElement) {
            button.parentElement.insertBefore(cancelButton, button);
        }

        let remainingTime = delaySeconds;

        const timeoutId = setTimeout(() => {
            if (document.contains(button)) {
                console.log(`[CR Auto Skipper] Auto-clicking ${type} skip button.`);
                button.click();
            }
            cleanup();
        }, delaySeconds * 1000);

        const intervalId = setInterval(() => {
            remainingTime--;
            if (remainingTime <= 0) {
                clearInterval(intervalId);
            } else {
                cancelButton.innerText = `Auto Skip: ${remainingTime}s - Cancel`;
            }
        }, 1000);

        const cleanup = (removeFromMap = true) => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            if (cancelButton.parentNode) {
                cancelButton.parentNode.removeChild(cancelButton);
            }
            if (removeFromMap) {
                activeSkips.delete(button);
            }
        };

        cancelButton.onclick = (e) => {
            e.stopPropagation();
            cleanup(false);
            console.log(`[CR Auto Skipper] Auto-skip for ${type} cancelled by user.`);
            // Mark as cancelled so we don't show the button again for this specific skip button instance
            activeSkips.set(button, { cancelled: true });
        };

        // Store info in WeakMap
        activeSkips.set(button, { cleanup, cancelled: false });

        // If the button is removed from DOM or hidden, cleanup
        const checkState = setInterval(() => {
            const isRemoved = !document.contains(button);
            const isHidden = button.getAttribute('aria-hidden') === 'true';
            if (isRemoved || isHidden) {
                cleanup(true);
                clearInterval(checkState);
            }
        }, 500);

        // Ensure cleanup if manual click happens
        button.addEventListener('click', () => {
            cleanup(true);
            clearInterval(checkState);
        }, { once: true });
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

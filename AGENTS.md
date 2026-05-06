### Agent Documentation: Crunchyroll Auto Skipper

This document provides technical context and guidelines for AI agents working on the Crunchyroll Auto Skipper browser extension.

### Project Overview
The extension automatically detects and clicks "Skip" buttons (Intro, Recap, Credits) on the Crunchyroll video player. It allows users to configure delays for each type of skip and provides a "Cancel" button to override an impending auto-skip.

### Core Architecture
- **Content Script (`content/content.js`)**: The heart of the extension. It observes the DOM for changes, identifies skip buttons, and manages the auto-skip timers and UI.
- **Popup (`popup/`)**: A standard browser extension popup for user settings.
- **Storage**: Uses `chrome.storage.local` to persist user preferences (enabled states and delay timers).

### Technical Details for Agents

#### DOM Observation & Selectors
- The extension uses a `MutationObserver` in `content.js` to watch for skip buttons. It specifically filters for `type="button"` and ignores elements with `data-testid="timestamp"` to optimize performance.
- **Critical Selectors**:
    - `[aria-label="Skip Intro"][aria-hidden="false"]`
    - `[aria-label="Skip Recap"][aria-hidden="false"]`
    - `[aria-label="Skip Credits"][aria-hidden="false"]`
- These selectors are based on Crunchyroll's current web player structure. If auto-skipping stops working, these are the first things to check.

#### Skip Logic & State Management
- **`activeSkips` (WeakMap)**: Tracks active `handleSkipButton` instances to prevent duplicate UI elements or multiple timers for the same button.
- **Cancellation**: When a delay is configured (> 0s), a "Cancel" button is injected into the DOM. Clicking it clears the timer and marks that specific button instance as `cancelled: true` in the `WeakMap`.
- **Cleanup**: The script includes a `checkState` interval and a click listener on the original button to ensure timers and injected UI are removed when the button is no longer relevant (e.g., hidden by the player or clicked manually).

#### Styling
- The "Cancel" button is styled inline in `content.js` to avoid external CSS dependencies and ensure it matches the Crunchyroll aesthetic (using hex `#f47521` for the signature orange).

### Guidelines for Agents
1. **DOM Resilience**: Crunchyroll's player often updates its DOM. Always verify selectors if issues are reported.
2. **Memory Leaks**: Use the existing `WeakMap` and cleanup patterns when adding new features that track DOM elements.
3. **User Experience**: Ensure the "Cancel" button doesn't obstruct the player controls or the original skip button.
4. **Permissions**: Any new functionality requiring more permissions must be added to `manifest.json`.

### Common Tasks
- **Updating Selectors**: If Crunchyroll changes their `aria-label` or structure.
- **Adding Skip Types**: Update `CONFIG_KEYS` in `content.js` and the options in `popup/`.
- **UI Refinement**: Adjusting the countdown logic or the "Cancel" button's appearance.

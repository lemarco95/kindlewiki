/* ===== Focus Mode - Popup Script ===== */

const toggleBtn = document.getElementById('toggleBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const statusPreview = document.getElementById('statusPreview');
const errorMsg = document.getElementById('errorMsg');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const fontDown = document.getElementById('fontDown');
const fontUp = document.getElementById('fontUp');
const fontOptions = document.getElementById('fontOptions');
const themeOptions = document.getElementById('themeOptions');
const spacingOptions = document.getElementById('spacingOptions');

let currentPreferences = {
  fontSize: 20,
  fontFamily: 'serif',
  theme: 'light',
  lineSpacing: 'normal',
};
let isActive = false;

/**
 * Get the active tab.
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

/**
 * Ensure the content script is injected into the active tab.
 * Returns the tab id if successful, null otherwise.
 */
async function ensureContentScript() {
  const tab = await getActiveTab();
  if (!tab?.id) return null;

  // Skip non-injectable pages
  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('about:')) {
    return null;
  }

  try {
    // Try to ping the existing content script
    await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
    return tab.id;
  } catch {
    // Content script not loaded — inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content.js'],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['src/content/content.css'],
      });
      // Small delay to let the script initialize
      await new Promise((r) => setTimeout(r, 100));
      return tab.id;
    } catch (e) {
      console.warn('Cannot inject content script:', e.message);
      return null;
    }
  }
}

/**
 * Send a message to the content script of the active tab.
 */
async function sendMessage(action, data = {}) {
  const tabId = await ensureContentScript();
  if (!tabId) return null;
  try {
    return await chrome.tabs.sendMessage(tabId, { action, ...data });
  } catch (e) {
    console.warn('Could not reach content script:', e.message);
    return null;
  }
}

/**
 * Update the popup UI.
 */
function updateUI() {
  // Status
  statusDot.classList.toggle('active', isActive);
  statusText.textContent = isActive ? 'Reader Active' : 'Inactive';

  // Preview
  const themeLabel = currentPreferences.theme.charAt(0).toUpperCase() + currentPreferences.theme.slice(1);
  statusPreview.textContent = isActive ? `${themeLabel} · ${currentPreferences.fontSize}px` : '';

  // Toggle button
  toggleBtn.textContent = isActive ? 'Exit Reader Mode' : 'Enter Reader Mode';
  toggleBtn.className = `toggle-btn ${isActive ? 'deactivate' : 'activate'}`;

  // Settings state
  fontSizeDisplay.textContent = `${currentPreferences.fontSize}px`;

  // Font buttons
  fontOptions.querySelectorAll('[data-font]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.font === currentPreferences.fontFamily);
  });

  // Theme buttons
  themeOptions.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === currentPreferences.theme);
  });

  // Spacing buttons
  spacingOptions.querySelectorAll('[data-spacing]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.spacing === currentPreferences.lineSpacing);
  });
}

/**
 * Send updated settings to the content script.
 */
async function syncSettings() {
  await sendMessage('updateSettings', { settings: { ...currentPreferences } });
  updateUI();
}

/**
 * Init: get state from content script.
 */
async function init() {
  const state = await sendMessage('getState');
  if (state) {
    isActive = state.active;
    if (state.preferences) {
      currentPreferences = { ...currentPreferences, ...state.preferences };
    }
  }
  updateUI();
}

// --- Event Listeners ---

toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  const result = await sendMessage('toggle');
  toggleBtn.disabled = false;

  if (!result) {
    errorMsg.textContent = 'Cannot access this page. Try refreshing.';
    errorMsg.classList.add('visible');
    return;
  }

  if (result.error === 'no-content') {
    errorMsg.textContent = 'Could not extract article content from this page.';
    errorMsg.classList.add('visible');
    return;
  }

  errorMsg.classList.remove('visible');
  isActive = result.active;

  // Re-fetch to get preferences
  const state = await sendMessage('getState');
  if (state?.preferences) {
    currentPreferences = { ...currentPreferences, ...state.preferences };
  }
  updateUI();
});

settingsToggle.addEventListener('click', () => {
  settingsToggle.classList.toggle('open');
  settingsPanel.classList.toggle('open');
});

fontDown.addEventListener('click', () => {
  currentPreferences.fontSize = Math.max(14, currentPreferences.fontSize - 2);
  syncSettings();
});

fontUp.addEventListener('click', () => {
  currentPreferences.fontSize = Math.min(28, currentPreferences.fontSize + 2);
  syncSettings();
});

fontOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-font]');
  if (!btn) return;
  currentPreferences.fontFamily = btn.dataset.font;
  syncSettings();
});

themeOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme]');
  if (!btn) return;
  currentPreferences.theme = btn.dataset.theme;
  syncSettings();
});

spacingOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-spacing]');
  if (!btn) return;
  currentPreferences.lineSpacing = btn.dataset.spacing;
  syncSettings();
});

init();

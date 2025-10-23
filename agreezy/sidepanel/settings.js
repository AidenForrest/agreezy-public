/**
 * Settings Page
 * Clean, production-ready settings management with shared modules
 */

import { STORAGE_KEYS, ROUTES, MESSAGES } from '../lib/constants.js';
import { applyTheme } from '../lib/theme.js';
import { getFromStorage, setInStorage } from '../lib/storage-helper.js';

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Load settings from storage and populate form
 */
async function loadSettings() {
  try {
    const settings = await getFromStorage(Object.values(STORAGE_KEYS));

    // Populate form fields with null-safe defaults
    const userNameInput = document.getElementById('user-name');
    const defaultLanguageSelect = document.getElementById('default-language');
    const defaultSummaryTypeSelect = document.getElementById('default-summary-type');
    const defaultSummaryLengthSelect = document.getElementById('default-summary-length');
    const autoAnalyzeCheckbox = document.getElementById('auto-analyze');
    const autoDetectionCheckbox = document.getElementById('auto-detection');
    const themePreferenceSelect = document.getElementById('theme-preference');
    const showGameCheckbox = document.getElementById('show-game');

    if (userNameInput) userNameInput.value = settings[STORAGE_KEYS.USER_NAME] || '';
    if (defaultLanguageSelect) defaultLanguageSelect.value = settings[STORAGE_KEYS.DEFAULT_LANGUAGE] || 'en';
    if (defaultSummaryTypeSelect) defaultSummaryTypeSelect.value = settings[STORAGE_KEYS.DEFAULT_SUMMARY_TYPE] || 'key-points';
    if (defaultSummaryLengthSelect) defaultSummaryLengthSelect.value = settings[STORAGE_KEYS.DEFAULT_SUMMARY_LENGTH] || 'short';
    if (autoAnalyzeCheckbox) autoAnalyzeCheckbox.checked = settings[STORAGE_KEYS.AUTO_ANALYZE] !== false; // Default true
    if (autoDetectionCheckbox) autoDetectionCheckbox.checked = settings[STORAGE_KEYS.AUTO_DETECTION_ENABLED] !== false; // Default true
    if (themePreferenceSelect) themePreferenceSelect.value = settings[STORAGE_KEYS.THEME_PREFERENCE] || 'auto';
    if (showGameCheckbox) showGameCheckbox.checked = settings[STORAGE_KEYS.SHOW_GAME] !== false; // Default true

    // Apply current theme
    applyTheme(settings[STORAGE_KEYS.THEME_PREFERENCE] || 'auto');
  } catch (error) {
    console.error('[Settings] Failed to load:', error);
    showStatus('Failed to load settings.  Please refresh the page.', true);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    // Show saving state
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    // Gather settings from form
    const settings = {
      [STORAGE_KEYS.USER_NAME]: document.getElementById('user-name')?.value || '',
      [STORAGE_KEYS.DEFAULT_LANGUAGE]: document.getElementById('default-language')?.value || 'en',
      [STORAGE_KEYS.DEFAULT_SUMMARY_TYPE]: document.getElementById('default-summary-type')?.value || 'key-points',
      [STORAGE_KEYS.DEFAULT_SUMMARY_LENGTH]: document.getElementById('default-summary-length')?.value || 'short',
      [STORAGE_KEYS.AUTO_ANALYZE]: document.getElementById('auto-analyze')?.checked !== false,
      [STORAGE_KEYS.AUTO_DETECTION_ENABLED]: document.getElementById('auto-detection')?.checked !== false,
      [STORAGE_KEYS.THEME_PREFERENCE]: document.getElementById('theme-preference')?.value || 'auto',
      [STORAGE_KEYS.SHOW_GAME]: document.getElementById('show-game')?.checked !== false
    };

    // Save to storage
    const success = await setInStorage(settings);

    if (success) {
      // Apply theme immediately
      applyTheme(settings[STORAGE_KEYS.THEME_PREFERENCE]);

      // Show success message
      showStatus(MESSAGES.SETTINGS_SAVED);
    } else {
      showStatus('Failed to save settings. Please try again.', true);
    }
  } catch (error) {
    console.error('[Settings] Failed to save:', error);
    showStatus('An error occurred while saving. Please try again.', true);
  } finally {
    // Reset button state
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  }
}

/**
 * Show status message
 * @param {string} message - Status message
 * @param {boolean} isError - Whether this is an error message
 */
function showStatus(message, isError = false) {
  const statusEl = document.getElementById('save-status');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.color = isError ? 'var(--red-7)' : 'var(--green-7)';

  // Clear after 3 seconds
  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Reset onboarding and redirect
 */
async function resetOnboarding() {
  if (!confirm('This will reset the onboarding flow. Are you sure?')) {
    return;
  }

  try {
    const success = await setInStorage({ [STORAGE_KEYS.ONBOARDING_COMPLETE]: false });
    if (success) {
      window.location.href = ROUTES.ONBOARDING;
    } else {
      showStatus('Failed to reset onboarding. Please try again.', true);
    }
  } catch (error) {
    console.error('[Settings] Failed to reset onboarding:', error);
    showStatus('An error occurred. Please try again.', true);
  }
}

/**
 * Go back to main app
 */
function goBack() {
  window.location.href = ROUTES.INDEX;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize settings page
 */
function init() {
  // Load settings
  loadSettings();

  // Setup event listeners
  const backBtn = document.getElementById('back-btn');
  const saveBtn = document.getElementById('save-btn');
  const resetOnboardingBtn = document.getElementById('reset-onboarding-btn');
  const themePreferenceSelect = document.getElementById('theme-preference');

  if (backBtn) {
    backBtn.addEventListener('click', goBack);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  if (resetOnboardingBtn) {
    resetOnboardingBtn.addEventListener('click', resetOnboarding);
  }

  // Listen for theme changes and apply immediately
  if (themePreferenceSelect) {
    themePreferenceSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

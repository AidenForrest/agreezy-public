/**
 * Application State Management
 * Centralized state to avoid redundant storage reads
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';
import { getFromStorage } from './storage-helper.js';

class AppState {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.isLoaded = false;
    this.isManualTrigger = false;
  }

  /**
   * Load settings from storage
   * @returns {Promise<Object>} Loaded settings
   */
  async load() {
    const stored = await getFromStorage(Object.values(STORAGE_KEYS));

    // Merge with defaults
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...stored
    };

    this.isLoaded = true;
    return this.settings;
  }

  /**
   * Get a specific setting
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    if (!this.isLoaded) {
      console.warn('[AppState] Settings not loaded yet');
    }
    return this.settings[key];
  }

  /**
   * Set a specific setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  set(key, value) {
    this.settings[key] = value;
  }

  /**
   * Update multiple settings
   * @param {Object} updates - Settings to update
   */
  update(updates) {
    this.settings = { ...this.settings, ...updates };
  }

  /**
   * Check if auto-analyze is enabled
   * @returns {boolean}
   */
  shouldAutoAnalyze() {
    return this.settings[STORAGE_KEYS.AUTO_ANALYZE] !== false;
  }

  /**
   * Check if game should be shown
   * @returns {boolean}
   */
  shouldShowGame() {
    return this.settings[STORAGE_KEYS.SHOW_GAME] !== false;
  }

  /**
   * Check if auto-detection is enabled
   * @returns {boolean}
   */
  isAutoDetectionEnabled() {
    return this.settings[STORAGE_KEYS.AUTO_DETECTION_ENABLED] !== false;
  }

  /**
   * Get user's name
   * @returns {string}
   */
  getUserName() {
    return this.settings[STORAGE_KEYS.USER_NAME] || '';
  }

  /**
   * Get theme preference
   * @returns {string}
   */
  getTheme() {
    return this.settings[STORAGE_KEYS.THEME_PREFERENCE] || 'auto';
  }

  /**
   * Get default language
   * @returns {string}
   */
  getDefaultLanguage() {
    return this.settings[STORAGE_KEYS.DEFAULT_LANGUAGE] || 'en';
  }

  /**
   * Get default summary type
   * @returns {string}
   */
  getDefaultSummaryType() {
    return this.settings[STORAGE_KEYS.DEFAULT_SUMMARY_TYPE] || 'key-points';
  }

  /**
   * Get default summary length
   * @returns {string}
   */
  getDefaultSummaryLength() {
    return this.settings[STORAGE_KEYS.DEFAULT_SUMMARY_LENGTH] || 'short';
  }

  /**
   * Set manual trigger flag
   * @param {boolean} value
   */
  setManualTrigger(value) {
    this.isManualTrigger = value;
  }

  /**
   * Check if current action is manual trigger
   * @returns {boolean}
   */
  isManual() {
    return this.isManualTrigger;
  }
}

// Export singleton instance
export const appState = new AppState();

/**
 * Theme Management Module
 * Shared theme application logic to eliminate duplication
 */

import { THEMES } from './constants.js';

/**
 * Apply theme to the document
 * @param {string} theme - Theme preference (auto|light|dark)
 */
export function applyTheme(theme) {
  if (theme === THEMES.DARK) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (theme === THEMES.LIGHT) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // Auto - use system preference
    const prefersDark = window.matchMedia &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

/**
 * Get current effective theme
 * @returns {string} Current theme (light|dark)
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Listen for system theme changes
 * @param {Function} callback - Callback when system theme changes
 * @returns {Function} Cleanup function to remove listener
 */
export function watchSystemTheme(callback) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);

  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handler);
}

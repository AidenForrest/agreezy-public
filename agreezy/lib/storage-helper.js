/**
 * Storage Helper Module
 * Safe storage operations with error handling
 */

/**
 * Safely get items from chrome.storage.local
 * @param {string|string[]|Object} keys - Keys to retrieve
 * @returns {Promise<Object>} Retrieved values
 */
export async function getFromStorage(keys) {
  try {
    return await chrome.storage.local.get(keys);
  } catch (error) {
    console.error('[Storage] Failed to get items:', error);
    // Return empty object on failure
    return typeof keys === 'string' ? { [keys]: undefined } : {};
  }
}

/**
 * Safely set items in chrome.storage.local
 * @param {Object} items - Items to store
 * @returns {Promise<boolean>} Success status
 */
export async function setInStorage(items) {
  try {
    await chrome.storage.local.set(items);
    return true;
  } catch (error) {
    console.error('[Storage] Failed to set items:', error);
    return false;
  }
}

/**
 * Safely get items from chrome.storage.session
 * @param {string|string[]|Object} keys - Keys to retrieve
 * @returns {Promise<Object>} Retrieved values
 */
export async function getFromSession(keys) {
  try {
    return await chrome.storage.session.get(keys);
  } catch (error) {
    console.error('[Storage] Failed to get session items:', error);
    return typeof keys === 'string' ? { [keys]: undefined } : {};
  }
}

/**
 * Safely set items in chrome.storage.session
 * @param {Object} items - Items to store
 * @returns {Promise<boolean>} Success status
 */
export async function setInSession(items) {
  try {
    await chrome.storage.session.set(items);
    return true;
  } catch (error) {
    console.error('[Storage] Failed to set session items:', error);
    return false;
  }
}

/**
 * Safely remove items from chrome.storage.local
 * @param {string|string[]} keys - Keys to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeFromStorage(keys) {
  try {
    await chrome.storage.local.remove(keys);
    return true;
  } catch (error) {
    console.error('[Storage] Failed to remove items:', error);
    return false;
  }
}

/**
 * Safely clear all items from chrome.storage.local
 * @returns {Promise<boolean>} Success status
 */
export async function clearStorage() {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Failed to clear storage:', error);
    return false;
  }
}

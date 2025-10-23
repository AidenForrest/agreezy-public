// Agreezy Background Service Worker

// Track which tabs have been notified to avoid spam
const notifiedTabs = new Set();

// Detection notification messages
const DETECTION_MESSAGES = {
  url: {
    title: 'Terms or Policy Detected',
    message: 'This page appears to contain terms or policies you should review.'
  },
  content: {
    title: 'Important Legal Text Detected',
    message: 'This page contains terms of service or privacy policy information.'
  },
  form_signup: {
    title: 'Sign-Up Form Detected',
    message: 'Review the terms before signing up!'
  },
  form_checkout: {
    title: 'Checkout Page Detected',
    message: 'Check the terms and policies before completing your purchase.'
  },
  cookie_consent: {
    title: 'Cookie Consent Detected',
    message: 'Review the cookie policy to understand data collection.'
  }
};

// Setup side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-with-agreezy',
    title: 'Analyze with Agreezy',
    contexts: ['page', 'selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-with-agreezy' && tab?.id) {
    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });

    // Extract and analyze content
    extractContent(tab.id);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  extractContent(activeInfo.tabId);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  // Only extract when the page is completely loaded
  if (changeInfo.status === 'complete') {
    extractContent(tabId);
  }
});

// Extract content from page
async function extractContent(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);

    // Only process http/https pages
    if (!tab.url || !tab.url.startsWith('http')) {
      return;
    }

    const injection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/extract-content.js']
    });

    if (injection && injection[0]?.result) {
      chrome.storage.session.set({ pageContent: injection[0].result });
    }
  } catch (error) {
    console.error('Content extraction failed:', error);
  }
}

// ============================================================================
// AUTO-DETECTION SYSTEM
// ============================================================================

/**
 * Handle detection messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'DETECTION_FOUND') {
    handleDetection(message, sender.tab);
  } else if (message.type === 'OPEN_SIDE_PANEL') {
    // Open side panel when banner "Analyze" button is clicked
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      // Also trigger content extraction
      extractContent(sender.tab.id);
    }
  }
});

/**
 * Handle detection event
 * @param {Object} detection - Detection data
 * @param {Object} tab - Tab where detection occurred
 */
async function handleDetection(detection, tab) {
  if (!tab?.id) return;

  try {
    // Check if auto-detection is enabled
    const { autoDetectionEnabled } = await chrome.storage.local.get('autoDetectionEnabled');

    // Default to true if not set
    if (autoDetectionEnabled === false) {
      return;
    }

    // Avoid spamming notifications for the same tab
    if (notifiedTabs.has(tab.id)) {
      return;
    }

    notifiedTabs.add(tab.id);

    // Set badge on extension icon
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: '!'
    });

    await chrome.action.setBadgeBackgroundColor({
      tabId: tab.id,
      color: '#FF6B6B'
    });

    // Get the highest priority detection type
    const primaryDetection = getPrimaryDetection(detection.detections);
    const notificationConfig = DETECTION_MESSAGES[primaryDetection] || DETECTION_MESSAGES.content;

    // Create notification
    await chrome.notifications.create(`detection-${tab.id}`, {
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: notificationConfig.title,
      message: notificationConfig.message,
      buttons: [
        { title: 'Analyze Now' },
        { title: 'Dismiss' }
      ],
      priority: 1,
      requireInteraction: false
    });
  } catch (error) {
    console.error('[Auto-Detection] Failed to handle detection:', error);
  }
}

/**
 * Get primary detection type (highest priority)
 * @param {Array<string>} detections - Array of detection types
 * @returns {string} Primary detection type
 */
function getPrimaryDetection(detections) {
  // Priority order: checkout > signup > cookie > content > url
  const priorityOrder = ['form_checkout', 'form_signup', 'cookie_consent', 'content', 'url'];

  for (const type of priorityOrder) {
    if (detections.includes(type)) {
      return type;
    }
  }

  return detections[0] || 'content';
}

/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith('detection-')) return;

  // Extract tab ID from notification ID
  const tabId = parseInt(notificationId.replace('detection-', ''));

  if (buttonIndex === 0) {
    // "Analyze Now" button clicked
    try {
      // Open side panel
      await chrome.sidePanel.open({ tabId });

      // Trigger content extraction and analysis
      await extractContent(tabId);
    } catch (error) {
      console.error('[Auto-Detection] Failed to open side panel:', error);
    }
  }

  // Clear notification
  chrome.notifications.clear(notificationId);
});

/**
 * Handle notification clicks (clicking the notification body)
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith('detection-')) return;

  // Extract tab ID from notification ID
  const tabId = parseInt(notificationId.replace('detection-', ''));

  try {
    // Open side panel
    await chrome.sidePanel.open({ tabId });

    // Trigger content extraction and analysis
    await extractContent(tabId);

    // Clear notification
    chrome.notifications.clear(notificationId);
  } catch (error) {
    console.error('[Auto-Detection] Failed to open side panel:', error);
  }
});

/**
 * Clear badge and notification state when tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  notifiedTabs.delete(tabId);
  chrome.notifications.clear(`detection-${tabId}`);
});

/**
 * Clear badge when navigating to a different page
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    // Clear badge and notification state for this tab
    notifiedTabs.delete(tabId);
    chrome.action.setBadgeText({ tabId, text: '' });
  }
});

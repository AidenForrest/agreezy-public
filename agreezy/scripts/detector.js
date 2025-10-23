/**
 * Agreezy Auto-Detector Content Script
 * Detects pages with terms, policies, checkout flows, signup forms, etc.
 */

// Detection configuration (mirrored from constants.js for content script)
const DETECTION_CONFIG = {
  URL_PATTERNS: [
    '/terms',
    '/privacy',
    '/policy',
    '/policies',
    '/checkout',
    '/cart',
    '/signup',
    '/register',
    '/cookies',
    '/cookie-policy',
    '/user-agreement',
    '/tos',
    '/eula',
    '/gdpr',
    '/legal'
  ],

  CONTENT_KEYWORDS: [
    'terms of service',
    'terms and conditions',
    'privacy policy',
    'cookie policy',
    'user agreement',
    'end user license agreement',
    'eula',
    'data protection',
    'gdpr',
    'terms & conditions',
    'acceptable use policy',
    'service agreement'
  ],

  TYPES: {
    URL: 'url',
    CONTENT: 'content',
    FORM_SIGNUP: 'form_signup',
    FORM_CHECKOUT: 'form_checkout',
    COOKIE_CONSENT: 'cookie_consent'
  }
};

/**
 * Check if currently ON a policy/terms page (direct detection)
 * @returns {boolean}
 */
function isOnPolicyPage() {
  const url = window.location.href.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  // Policy-specific URL patterns (not checkout/signup)
  const policyPatterns = [
    '/terms',
    '/privacy',
    '/policy',
    '/policies',
    '/cookies',
    '/cookie-policy',
    '/user-agreement',
    '/tos',
    '/eula',
    '/gdpr',
    '/legal'
  ];

  return policyPatterns.some(pattern =>
    pathname.includes(pattern) || url.includes(pattern)
  );
}

/**
 * Find links to policy documents on the current page
 * @returns {Array<{title: string, url: string}>} Array of policy links
 */
function findPolicyLinks() {
  const links = [];
  const seenUrls = new Set();

  // Common policy link text patterns
  const policyTextPatterns = [
    'privacy policy',
    'terms of service',
    'terms and conditions',
    'terms & conditions',
    'cookie policy',
    'user agreement',
    'end user license agreement',
    'eula',
    'acceptable use',
    'data protection'
  ];

  // Find all links on the page
  const allLinks = document.querySelectorAll('a[href]');

  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    const linkText = link.textContent.toLowerCase().trim();

    if (!href) return;

    // Make URL absolute
    let absoluteUrl;
    try {
      absoluteUrl = new URL(href, window.location.href).href;
    } catch (e) {
      return; // Invalid URL
    }

    // Skip if already seen
    if (seenUrls.has(absoluteUrl)) return;

    // Check if link text matches policy patterns
    const matchesText = policyTextPatterns.some(pattern =>
      linkText.includes(pattern)
    );

    // Check if URL contains policy patterns
    const urlLower = absoluteUrl.toLowerCase();
    const matchesUrl = DETECTION_CONFIG.URL_PATTERNS.some(pattern =>
      urlLower.includes(pattern)
    );

    if (matchesText || matchesUrl) {
      // Determine title from link text or URL
      let title = link.textContent.trim();
      if (!title || title.length > 50) {
        // Extract from URL if text is empty or too long
        if (urlLower.includes('privacy')) title = 'Privacy Policy';
        else if (urlLower.includes('terms')) title = 'Terms of Service';
        else if (urlLower.includes('cookie')) title = 'Cookie Policy';
        else title = 'Legal Document';
      }

      links.push({ title, url: absoluteUrl });
      seenUrls.add(absoluteUrl);
    }
  });

  return links;
}

/**
 * Check if URL matches detection patterns
 * @returns {boolean}
 */
function checkURLPatterns() {
  const url = window.location.href.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  return DETECTION_CONFIG.URL_PATTERNS.some(pattern =>
    pathname.includes(pattern) || url.includes(pattern)
  );
}

/**
 * Check if page content contains detection keywords
 * @returns {boolean}
 */
function checkContentKeywords() {
  // Get visible text from page (limit to first 5000 chars for performance)
  const bodyText = document.body.innerText.toLowerCase().substring(0, 5000);
  const titleText = document.title.toLowerCase();
  const h1Text = Array.from(document.querySelectorAll('h1, h2'))
    .map(el => el.innerText.toLowerCase())
    .join(' ');

  const combinedText = `${titleText} ${h1Text} ${bodyText}`;

  // Check if any keyword appears in the text
  return DETECTION_CONFIG.CONTENT_KEYWORDS.some(keyword =>
    combinedText.includes(keyword)
  );
}

/**
 * Detect signup forms
 * @returns {boolean}
 */
function detectSignupForm() {
  // Look for forms with email/password fields and signup indicators
  const forms = document.querySelectorAll('form');

  for (const form of forms) {
    const hasEmail = form.querySelector('input[type="email"]') !== null;
    const hasPassword = form.querySelector('input[type="password"]') !== null;

    // Check for signup-related text in form or nearby elements
    const formText = form.innerText.toLowerCase();
    const hasSignupIndicator = formText.includes('sign up') ||
                               formText.includes('signup') ||
                               formText.includes('create account') ||
                               formText.includes('register') ||
                               formText.includes('join');

    if ((hasEmail || hasPassword) && hasSignupIndicator) {
      return true;
    }
  }

  return false;
}

/**
 * Detect checkout forms
 * @returns {boolean}
 */
function detectCheckoutForm() {
  // Look for forms with payment/checkout indicators
  const forms = document.querySelectorAll('form');

  for (const form of forms) {
    const formText = form.innerText.toLowerCase();
    const hasCheckoutIndicator = formText.includes('checkout') ||
                                 formText.includes('payment') ||
                                 formText.includes('billing') ||
                                 formText.includes('credit card') ||
                                 formText.includes('place order') ||
                                 formText.includes('complete purchase');

    // Check for payment-related input fields
    const hasPaymentField = form.querySelector('input[name*="card"]') !== null ||
                           form.querySelector('input[name*="billing"]') !== null ||
                           form.querySelector('input[placeholder*="card"]') !== null;

    if (hasCheckoutIndicator || hasPaymentField) {
      return true;
    }
  }

  // Also check URL for checkout indicators
  const url = window.location.href.toLowerCase();
  return url.includes('/checkout') || url.includes('/cart') || url.includes('/payment');
}

/**
 * Detect cookie consent banners
 * @returns {boolean}
 */
function detectCookieConsent() {
  // Look for common cookie consent banner patterns
  const bodyText = document.body.innerText.toLowerCase();

  // Check for cookie-related keywords in visible text
  const hasCookieText = bodyText.includes('we use cookies') ||
                       bodyText.includes('this site uses cookies') ||
                       bodyText.includes('cookie consent') ||
                       bodyText.includes('accept cookies') ||
                       bodyText.includes('cookie policy') ||
                       bodyText.includes('cookie settings');

  // Check for common cookie banner elements
  const hasCookieBanner = document.querySelector('[id*="cookie"]') !== null ||
                         document.querySelector('[class*="cookie"]') !== null ||
                         document.querySelector('[id*="consent"]') !== null ||
                         document.querySelector('[class*="consent"]') !== null;

  return hasCookieText || hasCookieBanner;
}

/**
 * Get banner message based on detection type
 * @param {string} type - Detection type
 * @returns {string} Banner message
 */
function getBannerMessage(type) {
  const messages = {
    url: '📄 Terms or Policy Detected',
    content: '⚖️ Important Legal Text Detected',
    form_signup: '✍️ Sign-Up Form Detected',
    form_checkout: '🛒 Checkout Page Detected',
    cookie_consent: '🍪 Cookie Consent Detected'
  };
  return messages[type] || '📄 Terms or Policy Detected';
}

/**
 * Get banner description based on detection type
 * @param {string} type - Detection type
 * @returns {string} Banner description
 */
function getBannerDescription(type) {
  const descriptions = {
    url: 'This page appears to contain terms or policies you should review.',
    content: 'This page contains terms of service or privacy policy information.',
    form_signup: 'Review the terms before signing up!',
    form_checkout: 'Check the terms and policies before completing your purchase.',
    cookie_consent: 'Review the cookie policy to understand data collection.'
  };
  return descriptions[type] || 'Review important legal information with Agreezy.';
}

/**
 * Create and inject banner into page
 * @param {Array<string>} detections - Array of detection types
 * @param {string} context - Detection context ('direct' or 'indirect')
 * @param {Array<{title: string, url: string}>} policyLinks - Policy links (for indirect)
 */
function showBanner(detections, context = 'direct', policyLinks = []) {
  // Check if banner already exists
  if (document.getElementById('agreezy-detection-banner')) {
    return;
  }

  // Get primary detection type (highest priority)
  const primaryType = getPrimaryDetection(detections);

  let message, description, actionButtons;

  if (context === 'direct') {
    // Direct: User is ON a policy page
    message = '📄 You\'re viewing a Terms or Policy page';
    description = 'Analyze this page to understand the key points and legal obligations.';
    actionButtons = `
      <button class="agreezy-btn" id="agreezy-analyze-btn">
        🔍 Analyze This Page
      </button>
    `;
  } else {
    // Indirect: User is on a page with links to policies
    const linkCount = policyLinks.length;
    message = `🔗 This page links to ${linkCount} policy document${linkCount > 1 ? 's' : ''}`;
    description = 'Click a link below to review the policy document:';

    // Create links HTML
    const linksHTML = policyLinks.map(link => `
      <a href="${link.url}" class="agreezy-policy-link" target="_blank" rel="noopener noreferrer">
        📄 ${link.title}
      </a>
    `).join('');

    actionButtons = `
      <div class="agreezy-links-container">
        ${linksHTML}
      </div>
    `;
  }

  // Create banner HTML
  const banner = document.createElement('div');
  banner.id = 'agreezy-detection-banner';
  banner.innerHTML = `
    <style>
      #agreezy-detection-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: agreezy-slide-down 0.3s ease-out;
        gap: 16px;
      }

      @keyframes agreezy-slide-down {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      #agreezy-detection-banner .agreezy-banner-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      #agreezy-detection-banner .agreezy-banner-text {
        flex: 1;
      }

      #agreezy-detection-banner .agreezy-banner-title {
        font-weight: 600;
        font-size: 15px;
        margin: 0 0 4px 0;
      }

      #agreezy-detection-banner .agreezy-banner-desc {
        font-size: 13px;
        margin: 0;
        opacity: 0.95;
      }

      #agreezy-detection-banner .agreezy-banner-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      #agreezy-detection-banner .agreezy-btn {
        background: white;
        color: #667eea;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      #agreezy-detection-banner .agreezy-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      #agreezy-detection-banner .agreezy-close-btn {
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      #agreezy-detection-banner .agreezy-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      #agreezy-detection-banner .agreezy-links-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 200px;
      }

      #agreezy-detection-banner .agreezy-policy-link {
        background: white;
        color: #667eea;
        padding: 8px 16px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s;
        display: block;
        text-align: center;
      }

      #agreezy-detection-banner .agreezy-policy-link:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        background: #f0f0f0;
      }

      @media (max-width: 640px) {
        #agreezy-detection-banner {
          flex-direction: column;
          align-items: stretch;
          padding: 12px 16px;
        }

        #agreezy-detection-banner .agreezy-banner-actions {
          justify-content: space-between;
        }

        #agreezy-detection-banner .agreezy-btn {
          flex: 1;
        }

        #agreezy-detection-banner .agreezy-links-container {
          min-width: unset;
        }
      }
    </style>

    <div class="agreezy-banner-content">
      <div class="agreezy-banner-text">
        <div class="agreezy-banner-title">${message}</div>
        <div class="agreezy-banner-desc">${description}</div>
      </div>
    </div>

    <div class="agreezy-banner-actions">
      ${actionButtons}
      <button class="agreezy-close-btn" id="agreezy-close-banner" title="Dismiss">
        ×
      </button>
    </div>
  `;

  // Insert banner at the beginning of body
  document.body.insertBefore(banner, document.body.firstChild);

  // Add event listeners
  const analyzeBtn = banner.querySelector('#agreezy-analyze-btn');
  const closeBtn = banner.querySelector('#agreezy-close-banner');

  // Only add analyze button listener if it exists (direct context)
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      // Send message to background script to open side panel
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
      banner.remove();
    });
  }

  closeBtn.addEventListener('click', () => {
    banner.style.animation = 'agreezy-slide-down 0.3s ease-out reverse';
    setTimeout(() => banner.remove(), 300);
  });
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
 * Run all detection checks and notify background script
 */
async function runDetection() {
  try {
    // Check if auto-detection is enabled
    const { autoDetectionEnabled } = await chrome.storage.local.get('autoDetectionEnabled');

    // Default to true if not set
    if (autoDetectionEnabled === false) {
      return;
    }

    const detections = [];
    let context = 'direct';
    let policyLinks = [];

    // Determine if we're ON a policy page (direct) or just have links (indirect)
    const onPolicyPage = isOnPolicyPage();

    if (onPolicyPage) {
      // DIRECT DETECTION: User is viewing a policy page
      context = 'direct';

      // URL pattern detection
      if (checkURLPatterns()) {
        detections.push(DETECTION_CONFIG.TYPES.URL);
      }

      // Content keyword detection
      if (checkContentKeywords()) {
        detections.push(DETECTION_CONFIG.TYPES.CONTENT);
      }
    } else {
      // INDIRECT DETECTION: Look for policy links on this page
      context = 'indirect';

      // Find policy links
      policyLinks = findPolicyLinks();

      // If we found links, add detections
      if (policyLinks.length > 0) {
        detections.push(DETECTION_CONFIG.TYPES.CONTENT);
      }

      // Form detections (signup/checkout pages often have policy links)
      if (detectSignupForm()) {
        detections.push(DETECTION_CONFIG.TYPES.FORM_SIGNUP);
      }

      if (detectCheckoutForm()) {
        detections.push(DETECTION_CONFIG.TYPES.FORM_CHECKOUT);
      }

      // Cookie consent detection
      if (detectCookieConsent()) {
        detections.push(DETECTION_CONFIG.TYPES.COOKIE_CONSENT);
      }
    }

    // Only show banner if we have detections
    if (detections.length > 0) {
      // For indirect detection, only show if we found actual policy links
      if (context === 'indirect' && policyLinks.length === 0) {
        return; // Don't show banner if no links found
      }

      // Show in-page banner with appropriate context
      showBanner(detections, context, policyLinks);

      // Notify background script (for badge)
      chrome.runtime.sendMessage({
        type: 'DETECTION_FOUND',
        detections: detections,
        context: context,
        policyLinks: policyLinks,
        url: window.location.href,
        title: document.title
      });
    }
  } catch (error) {
    console.error('[Agreezy Detector] Detection failed:', error);
  }
}

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runDetection);
} else {
  // DOM already loaded
  runDetection();
}

// Also run detection after a short delay to catch dynamically loaded content
setTimeout(runDetection, 2000);

/**
 * Application Constants
 * Centralized configuration and magic strings to eliminate code duplication
 */

// Storage Keys
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboardingComplete',
  USER_NAME: 'userName',
  THEME_PREFERENCE: 'themePreference',
  DEFAULT_LANGUAGE: 'defaultLanguage',
  DEFAULT_SUMMARY_TYPE: 'defaultSummaryType',
  DEFAULT_SUMMARY_LENGTH: 'defaultSummaryLength',
  AUTO_ANALYZE: 'autoAnalyze',
  AUTO_DETECTION_ENABLED: 'autoDetectionEnabled',
  SHOW_GAME: 'showGame',
  PAGE_CONTENT: 'pageContent'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  [STORAGE_KEYS.AUTO_ANALYZE]: true,
  [STORAGE_KEYS.AUTO_DETECTION_ENABLED]: true,
  [STORAGE_KEYS.SHOW_GAME]: true,
  [STORAGE_KEYS.DEFAULT_LANGUAGE]: 'en',
  [STORAGE_KEYS.DEFAULT_SUMMARY_TYPE]: 'key-points',
  [STORAGE_KEYS.DEFAULT_SUMMARY_LENGTH]: 'short',
  [STORAGE_KEYS.THEME_PREFERENCE]: 'auto'
};

// Theme Values
export const THEMES = {
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark'
};

// DOM IDs
export const DOM_IDS = {
  // Header
  GREETING: 'greeting',
  SETTINGS_BTN: 'settings-btn',
  REANALYZE_BTN: 'reanalyze-btn',

  // Warnings
  WARNING: 'warning',
  API_STATUS: 'api-status',

  // Content
  KEYPOINTS_CONTENT: 'keypoints-content',
  SUMMARY_CONTENT: 'summary-content',
  TRANSLATION_CONTENT: 'translation-content',
  TRANSLATION_RESULT: 'translation-result',
  QA_MESSAGES: 'qa-messages',
  SUGGESTED_LIST: 'suggested-list',

  // Inputs
  QUESTION_INPUT: 'question-input',
  USER_NAME: 'user-name',
  TARGET_LANGUAGE: 'target-language',
  SUMMARY_TYPE: 'type',
  SUMMARY_FORMAT: 'format',
  SUMMARY_LENGTH: 'length',

  // Buttons
  TRANSLATE_BTN: 'translate-btn',
  ASK_BTN: 'ask-btn',

  // Game
  GAME_CONTAINER: 'game-container',
  CLOSE_GAME: 'close-game',
  NEW_GAME: 'new-game',
  TICTACTOE_BOARD: 'tictactoe-board',
  GAME_STATUS: 'game-status'
};

// CSS Classes
export const CSS_CLASSES = {
  TAB_BTN: 'tab-btn',
  TAB_CONTENT: 'tab-content',
  ACTIVE: 'active',
  CARD: 'card',
  PLAY_GAME_BTN: 'play-game-btn',
  STATIC_GAME_BTN: 'static-game-btn',
  QA_MESSAGE: 'qa-message',
  SUGGESTED_QUESTION: 'suggested-question'
};

// Routes
export const ROUTES = {
  INDEX: 'index.html',
  SETTINGS: 'settings.html',
  ONBOARDING: 'onboarding.html'
};

// Messages
export const MESSAGES = {
  NO_CONTENT: 'No content to analyze. Please navigate to a page with text content.',
  READY_TO_ANALYZE: 'Ready to analyze. Click "Re-analyze Page" to start.',
  EXTRACTING_KEY_POINTS: 'Extracting key points...',
  GENERATING_SUMMARY: 'Generating summary...',
  TRANSLATING: 'Translating content...',
  THINKING: 'Thinking...',
  NO_TRANSLATE_CONTENT: 'No content to translate',
  NO_QA_CONTENT: 'No content loaded to answer questions about',
  SETTINGS_SAVED: '✓ Settings saved successfully!',
  WAIT_MESSAGE: 'This may take a few minutes, especially on older devices. Please be patient!'
};

// Auto-Detection Configuration
export const DETECTION = {
  // URL patterns to detect
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

  // Content keywords to detect (case-insensitive)
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

  // Detection types
  TYPES: {
    URL: 'url',
    CONTENT: 'content',
    FORM_SIGNUP: 'form_signup',
    FORM_CHECKOUT: 'form_checkout',
    COOKIE_CONSENT: 'cookie_consent'
  },

  // Notification messages
  NOTIFICATION_MESSAGES: {
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
  }
};

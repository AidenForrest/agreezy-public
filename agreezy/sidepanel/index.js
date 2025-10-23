/* global Summarizer LanguageModel Translator LanguageDetector */
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import TicTacToe from './tictactoe.js';

// Import feature modules
import { summarizeContent } from '../lib/features/summarizer.js';
import { extractKeyPoints, formatKeyPoints } from '../lib/features/key-points.js';
import { translateContent } from '../lib/features/translator.js';
import { answerQuestion, getSuggestedQuestions } from '../lib/features/qa.js';
import { checkAllAPIsAvailability } from '../lib/ai-apis.js';

// Import shared modules
import { STORAGE_KEYS, DOM_IDS, CSS_CLASSES, ROUTES, MESSAGES } from '../lib/constants.js';
import { applyTheme } from '../lib/theme.js';
import { appState } from '../lib/app-state.js';
import { getFromStorage, setInSession } from '../lib/storage-helper.js';

// ============================================================================
// STATE
// ============================================================================

let pageContent = '';
let currentKeyPoints = [];
let suggestedQuestions = [];
let game = null;

// ============================================================================
// DOM ELEMENTS - Cached for performance
// ============================================================================

const warningElement = document.querySelector(`#${DOM_IDS.WARNING}`);
const apiStatusElement = document.querySelector(`#${DOM_IDS.API_STATUS}`);
const reanalyzeBtn = document.querySelector(`#${DOM_IDS.REANALYZE_BTN}`);
const tabButtons = document.querySelectorAll(`.${CSS_CLASSES.TAB_BTN}`);
const tabContents = document.querySelectorAll(`.${CSS_CLASSES.TAB_CONTENT}`);
const keypointsContent = document.querySelector(`#${DOM_IDS.KEYPOINTS_CONTENT}`);
const summaryContent = document.querySelector(`#${DOM_IDS.SUMMARY_CONTENT}`);
const summaryTypeSelect = document.querySelector(`#${DOM_IDS.SUMMARY_TYPE}`);
const summaryFormatSelect = document.querySelector(`#${DOM_IDS.SUMMARY_FORMAT}`);
const summaryLengthSelect = document.querySelector(`#${DOM_IDS.SUMMARY_LENGTH}`);
const targetLanguageSelect = document.querySelector(`#${DOM_IDS.TARGET_LANGUAGE}`);
const translateBtn = document.querySelector(`#${DOM_IDS.TRANSLATE_BTN}`);
const translationContentDiv = document.querySelector(`#${DOM_IDS.TRANSLATION_CONTENT}`);
const translationResult = document.querySelector(`#${DOM_IDS.TRANSLATION_RESULT}`);
const questionInput = document.querySelector(`#${DOM_IDS.QUESTION_INPUT}`);
const askBtn = document.querySelector(`#${DOM_IDS.ASK_BTN}`);
const suggestedList = document.querySelector(`#${DOM_IDS.SUGGESTED_LIST}`);
const qaMessages = document.querySelector(`#${DOM_IDS.QA_MESSAGES}`);
const gameContainer = document.querySelector(`#${DOM_IDS.GAME_CONTAINER}`);
const closeGameBtn = document.querySelector(`#${DOM_IDS.CLOSE_GAME}`);
const newGameBtn = document.querySelector(`#${DOM_IDS.NEW_GAME}`);

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
async function init() {
  try {
    // Check if onboarding is complete
    const { onboardingComplete } = await getFromStorage(STORAGE_KEYS.ONBOARDING_COMPLETE);
    if (!onboardingComplete) {
      window.location.href = ROUTES.ONBOARDING;
      return;
    }

    // Load settings into app state
    await appState.load();

    // Setup UI
    await loadSettings();
    setupEventListeners();
    initGame();

    // Check APIs and load content
    await checkAPIs();
    loadPageContent();
  } catch (error) {
    console.error('[Init] Failed to initialize:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Load and apply user settings
 */
async function loadSettings() {
  // Apply theme
  applyTheme(appState.getTheme());

  // Personalize greeting
  const userName = appState.getUserName();
  if (userName) {
    const greetingEl = document.getElementById(DOM_IDS.GREETING);
    if (greetingEl) {
      greetingEl.textContent = `${getTimeBasedGreeting()}, ${userName}!`;
    }
  }

  // Apply default preferences
  if (targetLanguageSelect) {
    targetLanguageSelect.value = appState.getDefaultLanguage();
  }
  if (summaryTypeSelect) {
    summaryTypeSelect.value = appState.getDefaultSummaryType();
  }
  if (summaryLengthSelect) {
    summaryLengthSelect.value = appState.getDefaultSummaryLength();
  }

  // Show/hide game based on setting
  if (!appState.shouldShowGame()) {
    hideGameFeature();
  }
}

/**
 * Get time-based greeting
 * @returns {string} Greeting message
 */
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Hide game feature completely
 */
function hideGameFeature() {
  if (gameContainer) {
    gameContainer.style.display = 'none';
  }
  document.querySelectorAll(`.${CSS_CLASSES.PLAY_GAME_BTN}`).forEach(btn => {
    btn.style.display = 'none';
  });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Re-analyze button
  if (reanalyzeBtn) {
    reanalyzeBtn.addEventListener('click', triggerReanalysis);
  }

  // Summary settings change
  [summaryTypeSelect, summaryFormatSelect, summaryLengthSelect].forEach(el => {
    if (el) el.addEventListener('change', generateSummary);
  });

  // Translation
  if (translateBtn) {
    translateBtn.addEventListener('click', handleTranslation);
  }

  // Q&A
  if (askBtn) {
    askBtn.addEventListener('click', handleQuestion);
  }
  if (questionInput) {
    questionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleQuestion();
      }
    });
  }

  // Game
  if (closeGameBtn) {
    closeGameBtn.addEventListener('click', hideGame);
  }
  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      if (game) game.reset();
    });
  }

  // Settings button
  const settingsBtn = document.getElementById(DOM_IDS.SETTINGS_BTN);
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = ROUTES.SETTINGS;
    });
  }

  // Use event delegation for dynamic game buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains(CSS_CLASSES.PLAY_GAME_BTN)) {
      showGame();
    }
  });
}

// ============================================================================
// GAME MANAGEMENT
// ============================================================================

/**
 * Initialize tic-tac-toe game
 */
function initGame() {
  if (!gameContainer) return;

  game = new TicTacToe();
  game.init(DOM_IDS.TICTACTOE_BOARD, DOM_IDS.GAME_STATUS);
}

/**
 * Show game
 */
function showGame() {
  if (!appState.shouldShowGame() || !gameContainer) return;

  gameContainer.hidden = false;
  if (game) game.reset();
}

/**
 * Hide game
 */
function hideGame() {
  if (gameContainer) {
    gameContainer.hidden = true;
  }
}

// ============================================================================
// SPINNER CREATION
// ============================================================================

/**
 * Create spinner HTML (synchronous - uses cached settings)
 * @param {string} text - Loading message
 * @returns {string} HTML string
 */
function createSpinner(text) {
  const gameButton = appState.shouldShowGame()
    ? `<button class="${CSS_CLASSES.PLAY_GAME_BTN}">🎮 Play while you wait</button>`
    : '';

  return `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p class="loading-text">${text}</p>
      <p class="loading-subtext">${MESSAGES.WAIT_MESSAGE}</p>
      ${gameButton}
    </div>
  `;
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

/**
 * Switch active tab
 * @param {string} tabName - Tab name to switch to
 */
function switchTab(tabName) {
  tabButtons.forEach(btn => btn.classList.remove(CSS_CLASSES.ACTIVE));
  tabContents.forEach(content => content.classList.remove(CSS_CLASSES.ACTIVE));

  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.querySelector(`#tab-${tabName}`);

  if (activeBtn && activeContent) {
    activeBtn.classList.add(CSS_CLASSES.ACTIVE);
    activeContent.classList.add(CSS_CLASSES.ACTIVE);
  }
}

// ============================================================================
// API AVAILABILITY
// ============================================================================

/**
 * Check API availability and show warnings
 */
async function checkAPIs() {
  try {
    const apis = await checkAllAPIsAvailability();
    const warnings = [];

    if (!apis.promptAPI.available) {
      warnings.push('Prompt API: ' + (apis.promptAPI.reason || 'Not available'));
    }

    if (!apis.summarizer.available) {
      warnings.push('Summarizer API: ' + (apis.summarizer.reason || 'Not available'));
    }

    if (warnings.length > 0) {
      showAPIStatus('Some AI features may not be available: ' + warnings.join('; '));
    }
  } catch (error) {
    console.error('[API Check] Failed:', error);
  }
}

// ============================================================================
// CONTENT LOADING
// ============================================================================

/**
 * Load page content from storage
 */
function loadPageContent() {
  chrome.storage.session.get(STORAGE_KEYS.PAGE_CONTENT, ({ pageContent: content }) => {
    if (content) {
      onContentChange(content);
    }
  });

  // Listen for content changes
  chrome.storage.session.onChanged.addListener((changes) => {
    const pageContentChange = changes[STORAGE_KEYS.PAGE_CONTENT];
    if (pageContentChange) {
      onContentChange(pageContentChange.newValue);
    }
  });
}

/**
 * Handle content change
 * @param {string} newContent - New page content
 */
async function onContentChange(newContent) {
  if (pageContent === newContent) {
    return; // No change
  }

  pageContent = newContent;

  if (!newContent || newContent.trim().length === 0) {
    showError(MESSAGES.NO_CONTENT);
    return;
  }

  clearError();

  // Check if manual trigger or auto-analyze
  if (appState.isManual() || appState.shouldAutoAnalyze()) {
    appState.setManualTrigger(false); // Reset flag
    await analyzeContent();
  } else {
    // Show manual analyze message
    showContent(keypointsContent, MESSAGES.READY_TO_ANALYZE);
    showContent(summaryContent, MESSAGES.READY_TO_ANALYZE);
  }
}

// ============================================================================
// CONTENT ANALYSIS
// ============================================================================

/**
 * Main analysis function
 */
async function analyzeContent() {
  if (!pageContent) return;

  try {
    // Generate key points (primary feature - auto-run)
    await generateKeyPoints();

    // Generate summary
    await generateSummary();

    // Get suggested questions for Q&A
    await generateSuggestedQuestions();
  } catch (error) {
    console.error('[Analysis] Failed:', error);
    showError('Analysis failed. Please try again.');
  }
}

/**
 * Generate key points
 */
async function generateKeyPoints() {
  if (!keypointsContent) return;

  showContent(keypointsContent, MESSAGES.EXTRACTING_KEY_POINTS, true);

  try {
    currentKeyPoints = await extractKeyPoints(pageContent);
    const formatted = formatKeyPoints(currentKeyPoints);
    showMarkdown(keypointsContent, formatted);
  } catch (error) {
    console.error('[Key Points] Extraction failed:', error);
    showContent(keypointsContent, `Error: ${error.message}`);
    hideGame();
  }
}

/**
 * Generate summary
 */
async function generateSummary() {
  if (!pageContent || !summaryContent) return;

  showContent(summaryContent, MESSAGES.GENERATING_SUMMARY, true);

  try {
    const options = {
      type: summaryTypeSelect?.value || 'key-points',
      format: summaryFormatSelect?.value || 'markdown',
      length: summaryLengthSelect?.value || 'short'
    };

    const summary = await summarizeContent(pageContent, options);
    showMarkdown(summaryContent, summary);
  } catch (error) {
    console.error('[Summary] Generation failed:', error);
    showContent(summaryContent, `Error: ${error.message}`);
    hideGame();
  }
}

/**
 * Handle translation
 */
async function handleTranslation() {
  if (!pageContent) {
    showError(MESSAGES.NO_TRANSLATE_CONTENT);
    return;
  }

  if (!translateBtn || !translationResult) return;

  const targetLang = targetLanguageSelect?.value || 'en';

  translateBtn.disabled = true;
  translateBtn.textContent = 'Translating...';
  if (translationContentDiv) {
    translationContentDiv.hidden = false;
  }
  showContent(translationResult, MESSAGES.TRANSLATING, true);

  try {
    const result = await translateContent(pageContent, targetLang);

    if (result.note) {
      showContent(translationResult, `Note: ${result.note}\n\n${result.translatedText}`);
      hideGame();
    } else {
      const header = `Translated from ${result.sourceLanguage} to ${result.targetLanguage}:\n\n---\n\n`;
      showMarkdown(translationResult, header + result.translatedText);
    }
  } catch (error) {
    console.error('[Translation] Failed:', error);
    showContent(translationResult, `Error: ${error.message}`);
    hideGame();
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = 'Translate';
  }
}

// ============================================================================
// Q&A
// ============================================================================

/**
 * Handle question submission
 */
async function handleQuestion() {
  const question = questionInput?.value.trim();
  if (!question) return;

  if (!pageContent) {
    showError(MESSAGES.NO_QA_CONTENT);
    return;
  }

  // Add question to UI
  addQAMessage(question, 'question');

  // Clear input
  questionInput.value = '';

  // Show loading state with spinner
  const loadingId = 'qa-loading-' + Date.now();
  const spinnerHTML = createSpinner(MESSAGES.THINKING);
  addQAMessage(spinnerHTML, 'loading', loadingId);

  // Disable ask button
  if (askBtn) {
    askBtn.disabled = true;
    askBtn.textContent = 'Thinking...';
  }

  try {
    const answer = await answerQuestion(pageContent, question);

    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }

    addQAMessage(answer, 'answer');
    hideGame();
  } catch (error) {
    console.error('[Q&A] Failed:', error);

    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }

    addQAMessage(`Error: ${error.message}`, 'answer');
    hideGame();
  } finally {
    if (askBtn) {
      askBtn.disabled = false;
      askBtn.textContent = 'Ask';
    }
  }
}

/**
 * Generate suggested questions
 */
async function generateSuggestedQuestions() {
  if (!pageContent || !suggestedList) return;

  try {
    suggestedQuestions = await getSuggestedQuestions(pageContent);
    displaySuggestedQuestions();
  } catch (error) {
    console.error('[Suggested Questions] Failed:', error);
  }
}

/**
 * Display suggested questions
 */
function displaySuggestedQuestions() {
  if (!suggestedList) return;

  suggestedList.innerHTML = '';

  suggestedQuestions.forEach(q => {
    const div = document.createElement('div');
    div.className = CSS_CLASSES.SUGGESTED_QUESTION;
    div.textContent = q;
    div.addEventListener('click', () => {
      if (questionInput) {
        questionInput.value = q;
        questionInput.focus();
      }
    });
    suggestedList.appendChild(div);
  });
}

/**
 * Add Q&A message to chat
 * @param {string} text - Message text or HTML
 * @param {string} type - Message type (question|answer|loading)
 * @param {string} id - Optional ID for the message
 */
function addQAMessage(text, type, id = null) {
  if (!qaMessages) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `${CSS_CLASSES.QA_MESSAGE} ${type}`;
  if (id) {
    messageDiv.id = id;
  }

  // Only add label for question/answer types
  if (type !== 'loading') {
    const label = document.createElement('div');
    label.className = 'qa-message-label';
    label.textContent = type === 'question' ? 'You asked:' : 'Answer:';
    messageDiv.appendChild(label);
  }

  const content = document.createElement('div');
  if (type === 'loading') {
    content.innerHTML = text; // Already HTML from createSpinner
  } else {
    content.innerHTML = DOMPurify.sanitize(marked.parse(text));
  }

  messageDiv.appendChild(content);
  qaMessages.appendChild(messageDiv);

  // Scroll to bottom
  qaMessages.scrollTop = qaMessages.scrollHeight;
}

// ============================================================================
// RE-ANALYSIS
// ============================================================================

/**
 * Trigger re-analysis (manual trigger)
 */
async function triggerReanalysis() {
  try {
    // Set manual trigger flag
    appState.setManualTrigger(true);

    if (!pageContent) {
      // Try to reload content from current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const injection = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/extract-content.js']
        });
        if (injection[0]?.result) {
          pageContent = injection[0].result;
          await setInSession({ [STORAGE_KEYS.PAGE_CONTENT]: injection[0].result });
          // Force analysis
          await analyzeContent();
        }
      }
    } else {
      // Force analysis
      await analyzeContent();
    }
  } catch (error) {
    console.error('[Re-analyze] Failed:', error);
    showError('Re-analysis failed. Please try again.');
  } finally {
    appState.setManualTrigger(false);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show content in element (synchronous - uses cached settings)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to display
 * @param {boolean} withSpinner - Show spinner
 */
function showContent(element, text, withSpinner = false) {
  if (!element) return;

  if (withSpinner) {
    element.innerHTML = createSpinner(text);
  } else {
    element.textContent = text;
  }
}

/**
 * Show markdown content
 * @param {HTMLElement} element - Target element
 * @param {string} markdown - Markdown text
 */
function showMarkdown(element, markdown) {
  if (!element) return;

  element.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
  hideGame(); // Hide game when content is ready
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  if (warningElement) {
    warningElement.textContent = message;
    warningElement.hidden = false;
  }
}

/**
 * Clear error message
 */
function clearError() {
  if (warningElement) {
    warningElement.hidden = true;
    warningElement.textContent = '';
  }
}

/**
 * Show API status message
 * @param {string} message - Status message
 */
function showAPIStatus(message) {
  if (apiStatusElement) {
    apiStatusElement.textContent = message;
    apiStatusElement.hidden = false;
  }
}

// ============================================================================
// INITIALIZE ON LOAD
// ============================================================================

init();

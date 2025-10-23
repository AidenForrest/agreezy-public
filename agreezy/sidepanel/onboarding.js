/**
 * Onboarding Flow
 * Clean, production-ready onboarding with error handling
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS, ROUTES } from '../lib/constants.js';
import { setInStorage } from '../lib/storage-helper.js';

// ============================================================================
// STATE
// ============================================================================

let currentStep = 1;

// ============================================================================
// STEP NAVIGATION
// ============================================================================

/**
 * Navigate to next step
 */
function nextStep() {
  if (currentStep < 3) {
    currentStep++;
    updateStep();
  }
}

/**
 * Navigate to previous step
 */
function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStep();
  }
}

/**
 * Update UI to show current step
 */
function updateStep() {
  // Update active step
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.classList.remove('active');
  });

  const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }

  // Update progress dots
  document.querySelectorAll('.dot').forEach(dot => {
    dot.classList.remove('active');
  });

  const currentDot = document.querySelector(`[data-dot="${currentStep}"]`);
  if (currentDot) {
    currentDot.classList.add('active');
  }
}

// ============================================================================
// ONBOARDING COMPLETION
// ============================================================================

/**
 * Complete onboarding and save settings
 */
async function completeOnboarding() {
  try {
    // Show loading state
    const completeBtn = document.getElementById('btn-step-3-complete');
    if (completeBtn) {
      completeBtn.disabled = true;
      completeBtn.textContent = 'Saving...';
    }

    // Gather user preferences
    const userName = document.getElementById('user-name')?.value || '';
    const defaultLanguage = document.getElementById('default-language')?.value || 'en';
    const themePreference = document.getElementById('theme-preference')?.value || 'auto';

    // Save all settings with defaults
    const settings = {
      [STORAGE_KEYS.ONBOARDING_COMPLETE]: true,
      [STORAGE_KEYS.USER_NAME]: userName,
      [STORAGE_KEYS.DEFAULT_LANGUAGE]: defaultLanguage,
      [STORAGE_KEYS.THEME_PREFERENCE]: themePreference,
      // Set sensible defaults for other settings
      ...DEFAULT_SETTINGS
    };

    const success = await setInStorage(settings);

    if (success) {
      // Redirect to main app
      window.location.href = ROUTES.INDEX;
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error('[Onboarding] Failed to complete:', error);

    // Show error and reset button
    alert('Failed to save your preferences. Please try again.');

    const completeBtn = document.getElementById('btn-step-3-complete');
    if (completeBtn) {
      completeBtn.disabled = false;
      completeBtn.textContent = 'Start Using Agreezy';
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize onboarding page
 */
function init() {
  // Step 1 button
  const btnStep1 = document.getElementById('btn-step-1');
  if (btnStep1) {
    btnStep1.addEventListener('click', nextStep);
  }

  // Step 2 buttons
  const btnStep2Back = document.getElementById('btn-step-2-back');
  const btnStep2Next = document.getElementById('btn-step-2-next');
  if (btnStep2Back) {
    btnStep2Back.addEventListener('click', prevStep);
  }
  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', nextStep);
  }

  // Step 3 buttons
  const btnStep3Back = document.getElementById('btn-step-3-back');
  const btnStep3Complete = document.getElementById('btn-step-3-complete');
  if (btnStep3Back) {
    btnStep3Back.addEventListener('click', prevStep);
  }
  if (btnStep3Complete) {
    btnStep3Complete.addEventListener('click', completeOnboarding);
  }

  // Allow clicking dots to navigate
  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const stepNum = parseInt(dot.dataset.dot);
      if (stepNum) {
        currentStep = stepNum;
        updateStep();
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

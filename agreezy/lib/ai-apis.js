/**
 * Chrome AI APIs Integration for Agreezy
 * Handles Prompt API (LanguageModel), Translation API (Translator), and Summarizer API
 */

/**
 * Check if Prompt API (LanguageModel) is available
 */
export async function checkPromptAPIAvailability() {
  try {
    // Check for the global LanguageModel API (Chrome 138+)
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();

      return {
        available: availability === 'readily' || availability === 'after-download' || availability === 'available',
        status: availability,
        needsDownload: availability === 'after-download'
      };
    }

    return { available: false, reason: 'Prompt API (LanguageModel) not supported. Please use Chrome 138+' };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Create a Prompt API session using LanguageModel
 * For general-purpose tasks with balanced creativity/speed
 */
export async function createPromptSession(systemPrompt = '', options = {}) {
  try {
    const session = await LanguageModel.create({
      systemPrompt: systemPrompt,
      temperature: options.temperature ?? 0.3,
      topK: options.topK ?? 3,
      language: 'en'
    });

    return session;
  } catch (error) {
    throw new Error(`Failed to create Prompt API session: ${error.message}`);
  }
}

/**
 * Create a FAST session optimized for JSON/structured output
 * Uses temperature: 0, topK: 1 for maximum speed and determinism
 */
export async function createFastSession(systemPrompt = '') {
  return createPromptSession(systemPrompt, { temperature: 0, topK: 1 });
}

/**
 * Use Prompt API to process text
 */
export async function promptAPI(userPrompt, systemPrompt = '', options = {}) {
  const session = await createPromptSession(systemPrompt, options);
  try {
    const result = await session.prompt(userPrompt);
    return result;
  } finally {
    session.destroy();
  }
}

/**
 * Use FAST Prompt API for JSON/structured output
 * Optimized for speed with temperature: 0, topK: 1
 */
export async function fastPromptAPI(userPrompt, systemPrompt = '') {
  return promptAPI(userPrompt, systemPrompt, { temperature: 0, topK: 1 });
}

/**
 * Check if Summarizer API is available
 */
export async function checkSummarizerAvailability() {
  try {
    if (!window.Summarizer) {
      return { available: false, reason: 'Summarizer API not supported' };
    }

    const availability = await window.Summarizer.availability();

    return {
      available: availability === 'available' || availability === 'after-download',
      status: availability,
      needsDownload: availability === 'after-download'
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Create a summarizer session
 */
export async function createSummarizer(options = {}) {
  try {
    const defaultOptions = {
      sharedContext: 'This is a terms of service or privacy policy document',
      type: 'key-points',
      format: 'markdown',
      length: 'short',
      ...options
    };

    const summarizer = await window.Summarizer.create(defaultOptions);

    // Handle download if needed
    if (summarizer.addEventListener) {
      summarizer.addEventListener('downloadprogress', (e) => {
        console.log(`Summarizer model download: ${Math.round(e.loaded * 100)}%`);
      });
      if (summarizer.ready) {
        await summarizer.ready;
      }
    }

    return summarizer;
  } catch (error) {
    throw new Error(`Failed to create summarizer: ${error.message}`);
  }
}

/**
 * Check if Translation API (Translator) is available
 */
export async function checkTranslationAvailability() {
  try {
    // Check for the global Translator API (Chrome 138+)
    if (typeof Translator !== 'undefined') {
      // Translator may not have an availability() method, so just check if it exists
      return {
        available: true,
        status: 'available'
      };
    }

    return { available: false, reason: 'Translation API (Translator) not supported. Please use Chrome 138+' };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Check if Language Detector API is available
 */
export async function checkLanguageDetectorAvailability() {
  try {
    // Check for the global LanguageDetector API (Chrome 138+)
    if (typeof LanguageDetector !== 'undefined') {
      // LanguageDetector may not have an availability() method, so just check if it exists
      return {
        available: true,
        status: 'available'
      };
    }

    return { available: false, reason: 'Language Detector API not supported. Please use Chrome 138+' };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Detect language of text
 */
export async function detectLanguage(text) {
  try {
    // Try native LanguageDetector API first
    if (typeof LanguageDetector !== 'undefined') {
      const detector = await LanguageDetector.create();
      const results = await detector.detect(text);
      detector.destroy();
      return results[0]?.detectedLanguage || 'en';
    }

    // Fallback: use Prompt API (LanguageModel)
    const systemPrompt = 'You are a language detector. Respond ONLY with the ISO 639-1 language code (2 letters) of the text. Examples: en, es, fr, de, ja, zh. Nothing else.';
    const result = await promptAPI(text.substring(0, 500), systemPrompt);
    return result.trim().toLowerCase();
  } catch (error) {
    console.error('Language detection failed:', error);
    return 'en'; // Default to English
  }
}

/**
 * Translate text using Translator API
 */
export async function translateText(text, targetLanguage = 'en', sourceLanguage = null) {
  try {
    // Try native Translator API first
    if (typeof Translator !== 'undefined') {
      const translator = await Translator.create({
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage: targetLanguage
      });
      const result = await translator.translate(text);
      return result;
    }

    // Fallback: use Prompt API (LanguageModel)
    const systemPrompt = `You are a translator. Translate the following text to ${targetLanguage}. Preserve formatting and structure. Only respond with the translation, nothing else.`;
    const result = await promptAPI(text, systemPrompt);
    return result;
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Check availability of all AI APIs
 */
export async function checkAllAPIsAvailability() {
  const [prompt, summarizer, translation, languageDetector] = await Promise.all([
    checkPromptAPIAvailability(),
    checkSummarizerAvailability(),
    checkTranslationAvailability(),
    checkLanguageDetectorAvailability()
  ]);

  return {
    promptAPI: prompt,
    summarizer: summarizer,
    translation: translation,
    languageDetector: languageDetector
  };
}

export default {
  checkPromptAPIAvailability,
  createPromptSession,
  promptAPI,
  checkSummarizerAvailability,
  createSummarizer,
  checkTranslationAvailability,
  checkLanguageDetectorAvailability,
  detectLanguage,
  translateText,
  checkAllAPIsAvailability
};

/**
 * Translation Feature for Agreezy
 * Translate terms/policies with chunking support
 */

import { chunkContent, validateContentLength } from '../chunker.js';
import { translateText, detectLanguage } from '../ai-apis.js';

/**
 * Translate content to target language with automatic chunking
 */
export async function translateContent(content, targetLanguage = 'en', sourceLanguage = null) {
  // Validate content
  const validation = validateContentLength(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Detect source language if not provided
    if (!sourceLanguage) {
      sourceLanguage = await detectLanguage(content);
    }

    // If already in target language, no translation needed
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: content,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        note: 'Content is already in the target language'
      };
    }

    // Get chunks
    const chunks = chunkContent(content);

    // Translate each chunk
    const translatedChunks = [];

    for (const chunk of chunks) {
      const translated = await translateText(chunk.text, targetLanguage, sourceLanguage);
      translatedChunks.push({
        index: chunk.index,
        translatedText: translated
      });
    }

    // Combine translated chunks
    const fullTranslation = translatedChunks
      .sort((a, b) => a.index - b.index)
      .map(tc => tc.translatedText)
      .join('\n\n');

    return {
      translatedText: fullTranslation,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      chunksProcessed: chunks.length
    };
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' }
  ];
}

export default {
  translateContent,
  getSupportedLanguages
};

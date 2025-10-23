/**
 * Shared Utilities for Agreezy
 * DRY helper functions used across features
 */

/**
 * Clean and parse JSON response from AI
 * Handles markdown code blocks and extracts JSON from conversational text
 */
export function parseJSONResponse(response, type = 'array') {
  let cleaned = response.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  // Extract JSON based on type
  if (type === 'array') {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) cleaned = match[0];
  } else if (type === 'object') {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
  }

  return JSON.parse(cleaned);
}

/**
 * Create standard system prompt for JSON generation
 */
export function createJSONSystemPrompt() {
  return 'You are a JSON generator. You MUST respond ONLY with valid JSON. Do not include any conversational text, explanations, or markdown formatting.';
}

/**
 * Create instruction footer for JSON responses
 */
export function createJSONInstructionFooter() {
  return '\n\nReturn ONLY the JSON (no other text), nothing else.';
}

/**
 * Safe error handler with fallback
 */
export function handleError(error, fallback, context = '') {
  console.error(`${context} failed:`, error);
  return fallback;
}

export default {
  parseJSONResponse,
  createJSONSystemPrompt,
  createJSONInstructionFooter,
  handleError
};

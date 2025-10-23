/**
 * Key Points Extraction Feature for Agreezy
 * PRIMARY MVP FEATURE - Extract important clauses and things users should be aware of
 */

import { chunkContent, getChunkContext, validateContentLength } from '../chunker.js';
import { fastPromptAPI } from '../ai-apis.js';
import { parseJSONResponse, createJSONSystemPrompt, createJSONInstructionFooter } from '../utils.js';

/**
 * Extract key points from content with automatic chunking
 */
export async function extractKeyPoints(content) {
  // Validate content
  const validation = validateContentLength(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Get chunks
    const chunks = chunkContent(content);

    // Extract key points from all chunks IN PARALLEL (major performance boost!)
    const chunkPromises = chunks.map(chunk => extractKeyPointsFromChunk(chunk));
    const chunkResults = await Promise.all(chunkPromises);

    // Flatten results
    const allKeyPoints = chunkResults.flat();

    // If we have multiple chunks, deduplicate and rank
    if (chunks.length > 1) {
      return await deduplicateAndRankKeyPoints(allKeyPoints);
    }

    return allKeyPoints;
  } catch (error) {
    throw new Error(`Key points extraction failed: ${error.message}`);
  }
}

/**
 * Extract key points from a single chunk
 */
async function extractKeyPointsFromChunk(chunk) {
  const context = getChunkContext(chunk);
  const contextText = context ? `${context}\n\n` : '';

  const userPrompt = `Analyze this terms of service/privacy policy and extract 3-7 MOST IMPORTANT points.

Focus on: data collection, user rights, privacy, restrictions, legal terms, changes, termination, third-party sharing, payments.

Return a JSON array:
[{"point": "description", "importance": "high", "category": "privacy"}]

Valid importance: "high", "medium", "low"
Valid category: "privacy", "data", "rights", "legal", "financial", "other"${createJSONInstructionFooter()}

Document:
${contextText + chunk.text}`;

  try {
    // Use FAST API (temperature: 0, topK: 1) for JSON generation
    const response = await fastPromptAPI(userPrompt, createJSONSystemPrompt());
    const keyPoints = parseJSONResponse(response, 'array');

    return keyPoints.map(kp => ({ ...kp, chunkIndex: chunk.index }));
  } catch (error) {
    console.error('Key points extraction failed:', error);
    return [{
      point: 'Unable to extract key points. Please review the document manually.',
      importance: 'high',
      category: 'other',
      chunkIndex: chunk.index
    }];
  }
}

/**
 * Deduplicate and rank key points from multiple chunks
 */
async function deduplicateAndRankKeyPoints(keyPoints) {
  if (keyPoints.length === 0) return [];

  const pointsText = keyPoints.map((kp, idx) =>
    `${idx + 1}. [${kp.importance}] [${kp.category}] ${kp.point}`
  ).join('\n');

  const userPrompt = `Deduplicate, merge related points, and keep TOP 10 most important.

Return JSON array:
[{"point": "description", "importance": "high", "category": "privacy"}]

Valid importance: "high", "medium", "low"
Valid category: "privacy", "data", "rights", "legal", "financial", "other"${createJSONInstructionFooter()}

Points:
${pointsText}`;

  try {
    // Use FAST API for JSON deduplication task
    const response = await fastPromptAPI(userPrompt, createJSONSystemPrompt());
    return parseJSONResponse(response, 'array');
  } catch (error) {
    console.error('Deduplication failed:', error);
    return deduplicateSimple(keyPoints);
  }
}

/**
 * Simple fallback deduplication
 */
function deduplicateSimple(keyPoints) {
  const uniquePoints = [];
  const seen = new Set();

  for (const kp of keyPoints) {
    const normalized = kp.point.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniquePoints.push(kp);
    }
  }

  const importanceOrder = { high: 0, medium: 1, low: 2 };
  uniquePoints.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return uniquePoints.slice(0, 10);
}

/**
 * Format key points for display
 */
export function formatKeyPoints(keyPoints) {
  if (!keyPoints || keyPoints.length === 0) {
    return 'No key points found.';
  }

  const grouped = {};
  for (const kp of keyPoints) {
    const category = kp.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(kp);
  }

  const categoryLabels = {
    privacy: 'Privacy',
    data: 'Data Collection',
    rights: 'Your Rights',
    legal: 'Legal Terms',
    financial: 'Payment & Billing',
    other: 'General'
  };

  const categoryIcons = {
    privacy: '🔒',
    data: '📊',
    rights: '⚖️',
    legal: '📜',
    financial: '💰',
    other: '📌'
  };

  let formatted = '';

  for (const [category, points] of Object.entries(grouped)) {
    const label = categoryLabels[category] || category;
    const icon = categoryIcons[category] || '•';

    // Category header with icon
    formatted += `### ${icon} ${label}\n\n`;

    // Points - clean bullets without emojis
    for (const point of points) {
      formatted += `- ${point.point}\n\n`;
    }

    // Add extra spacing between categories
    formatted += '\n';
  }

  return formatted.trim();
}

export default {
  extractKeyPoints,
  formatKeyPoints
};

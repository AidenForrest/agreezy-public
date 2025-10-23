/**
 * Q&A Feature for Agreezy
 * Answer questions about terms/policy content with chunk-aware context
 */

import { chunkContent, validateContentLength } from '../chunker.js';
import { promptAPI, fastPromptAPI } from '../ai-apis.js';
import { parseJSONResponse, createJSONSystemPrompt, createJSONInstructionFooter } from '../utils.js';

/**
 * Answer a question about the content
 */
export async function answerQuestion(content, question) {
  if (!question || question.trim().length === 0) {
    throw new Error('Please provide a question');
  }

  // Validate content
  const validation = validateContentLength(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Get chunks
    const chunks = chunkContent(content);

    // If single chunk, answer directly
    if (chunks.length === 1) {
      return await answerFromChunk(chunks[0].text, question);
    }

    // Multiple chunks: find relevant chunks first, then answer
    return await answerFromMultipleChunks(chunks, question);
  } catch (error) {
    throw new Error(`Q&A failed: ${error.message}`);
  }
}

/**
 * Answer question from a single chunk
 */
async function answerFromChunk(text, question) {
  const systemPrompt = `You are analyzing a terms of service or privacy policy document. Answer the user's question based ONLY on the provided document content.

Rules:
- If the answer is in the document, provide a clear, concise answer
- Quote relevant sections when helpful
- If the information is not in the document, say "This information is not found in the document"
- Be honest if you're uncertain
- Keep answers focused and relevant

Answer the question clearly and helpfully.`;

  const userPrompt = `Document:\n\n${text}\n\n---\n\nQuestion: ${question}`;

  const answer = await promptAPI(userPrompt, systemPrompt);
  return answer;
}

/**
 * Answer question from multiple chunks (chunk-aware)
 */
async function answerFromMultipleChunks(chunks, question) {
  // Step 1: Find relevant chunks
  const relevantChunks = await findRelevantChunks(chunks, question);

  if (relevantChunks.length === 0) {
    return "I couldn't find relevant information in the document to answer this question.";
  }

  // Step 2: Combine relevant chunks and answer
  const combinedContext = relevantChunks
    .map(rc => `[Part ${rc.index + 1}]\n${rc.text}`)
    .join('\n\n---\n\n');

  return await answerFromChunk(combinedContext, question);
}

/**
 * Find chunks relevant to the question
 */
async function findRelevantChunks(chunks, question) {
  // Check relevance for all chunks IN PARALLEL (major performance boost!)
  const relevancePromises = chunks.map(async (chunk) => {
    const relevance = await assessChunkRelevance(chunk, question);
    return {
      chunk: chunk,
      score: relevance.score,
      reasoning: relevance.reasoning
    };
  });

  const chunkRelevance = await Promise.all(relevancePromises);

  // Sort by relevance and take top 3 chunks
  chunkRelevance.sort((a, b) => b.score - a.score);
  const topChunks = chunkRelevance.slice(0, 3).filter(cr => cr.score > 0);

  return topChunks.map(cr => cr.chunk);
}

/**
 * Assess if a chunk is relevant to the question
 */
async function assessChunkRelevance(chunk, question) {
  const userPrompt = `Rate relevance (0-10) of this chunk for answering the question.

Return JSON: {"score": 7, "reasoning": "brief explanation"}

Score: 0-3: Not relevant, 4-6: Somewhat relevant, 7-10: Highly relevant${createJSONInstructionFooter()}

Question: ${question}

Chunk (Part ${chunk.index + 1} of ${chunk.total}):
${chunk.text.substring(0, 1000)}...`;

  try {
    // Use FAST API for JSON relevance scoring
    const response = await fastPromptAPI(userPrompt, createJSONSystemPrompt());
    const result = parseJSONResponse(response, 'object');
    return { score: result.score || 0, reasoning: result.reasoning || '' };
  } catch (error) {
    console.error('Relevance assessment failed:', error);
    return keywordMatchScore(question, chunk.text);
  }
}

/**
 * Fallback keyword matching for relevance
 */
function keywordMatchScore(question, text) {
  const keywords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const matches = keywords.filter(kw => text.toLowerCase().includes(kw)).length;
  return { score: Math.min(10, matches * 2), reasoning: 'Keyword matching fallback' };
}

/**
 * Get suggested questions based on content
 */
export async function getSuggestedQuestions(content) {
  const preview = content.substring(0, 2000);

  const userPrompt = `Generate 5 helpful questions users commonly want to know about this terms/privacy document.

Focus on: data collection, data usage, account deletion, privacy rights, concerning clauses.

Return JSON array: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]${createJSONInstructionFooter()}

Document preview:
${preview}`;

  try {
    // Use FAST API for JSON array generation
    const response = await fastPromptAPI(userPrompt, createJSONSystemPrompt());
    return parseJSONResponse(response, 'array');
  } catch (error) {
    console.error('Suggested questions generation failed:', error);
    return [
      'What personal data is collected?',
      'How is my data shared with third parties?',
      'Can I delete my account and data?',
      'What are my privacy rights?',
      'Are there any important restrictions I should know about?'
    ];
  }
}

export default {
  answerQuestion,
  getSuggestedQuestions
};

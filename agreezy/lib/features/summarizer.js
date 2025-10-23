/**
 * Chunk-aware Summarization Feature for Agreezy
 */

import { chunkContent, getChunkContext, validateContentLength } from '../chunker.js';
import { createSummarizer, promptAPI } from '../ai-apis.js';

/**
 * Summarize content with automatic chunking for long documents
 */
export async function summarizeContent(content, options = {}) {
  // Validate content
  const validation = validateContentLength(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const {
    type = 'key-points',
    format = 'markdown',
    length = 'short'
  } = options;

  try {
    // Get chunks
    const chunks = chunkContent(content);

    // If single chunk, summarize directly
    if (chunks.length === 1) {
      return await summarizeSingleChunk(chunks[0].text, { type, format, length });
    }

    // Multiple chunks: summarize each then merge
    return await summarizeMultipleChunks(chunks, { type, format, length });
  } catch (error) {
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Summarize a single chunk using Summarizer API
 */
async function summarizeSingleChunk(text, options) {
  const summarizer = await createSummarizer({
    sharedContext: 'This is a terms of service or privacy policy document',
    type: options.type,
    format: options.format,
    length: options.length
  });

  try {
    const summary = await summarizer.summarize(text);
    return summary;
  } finally {
    summarizer.destroy();
  }
}

/**
 * Summarize multiple chunks and merge the results
 */
async function summarizeMultipleChunks(chunks, options) {
  // Summarize all chunks IN PARALLEL (major performance boost!)
  const summaryPromises = chunks.map(async (chunk) => {
    const context = getChunkContext(chunk);
    const contextText = context ? `${context}\n\n` : '';
    const textToSummarize = contextText + chunk.text;

    const summary = await summarizeSingleChunk(textToSummarize, options);
    return {
      index: chunk.index,
      summary: summary
    };
  });

  const chunkSummaries = await Promise.all(summaryPromises);

  // Merge summaries using Prompt API
  return await mergeSummaries(chunkSummaries, options);
}

/**
 * Merge multiple chunk summaries into a coherent final summary
 */
async function mergeSummaries(chunkSummaries, options) {
  const combinedSummaries = chunkSummaries
    .map(cs => `Part ${cs.index + 1}:\n${cs.summary}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are summarizing a terms of service or privacy policy document. You will receive summaries from different parts of the document. Your task is to merge them into one coherent, well-organized ${options.length} summary in ${options.format} format.

Rules:
- Remove duplicate information
- Organize logically (don't just concatenate)
- Maintain the most important points from all parts
- Use ${options.format} formatting
- Keep the ${options.length} length constraint

Respond **ONLY** with the merged summary, nothing else.`;

  try {
    const mergedSummary = await promptAPI(combinedSummaries, systemPrompt);
    return mergedSummary;
  } catch (error) {
    // Fallback: just concatenate summaries if merge fails
    console.error('Summary merging failed, using concatenation:', error);
    return chunkSummaries.map(cs => cs.summary).join('\n\n');
  }
}

export default {
  summarizeContent
};

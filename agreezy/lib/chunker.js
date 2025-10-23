/**
 * Smart Content Chunker for Agreezy
 * Splits long documents into manageable chunks for AI processing
 */

const MAX_CHUNK_SIZE = 3500; // Leave buffer for AI prompts
const CHUNK_OVERLAP = 200; // Overlap between chunks for context
const MAX_DOCUMENT_SIZE = 50000; // Maximum total document size

/**
 * Split text into paragraphs while preserving structure
 */
function splitIntoParagraphs(text) {
  // Split on double newlines, single newlines, or common section markers
  return text
    .split(/\n\n+|\r\n\r\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Create chunks from paragraphs with smart boundaries and overlap
 */
export function chunkContent(content) {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const trimmedContent = content.trim();

  // Check max document size
  if (trimmedContent.length > MAX_DOCUMENT_SIZE) {
    throw new Error(`Document too long (${trimmedContent.length} chars). Maximum supported: ${MAX_DOCUMENT_SIZE} chars.`);
  }

  // If content fits in one chunk, return as-is
  if (trimmedContent.length <= MAX_CHUNK_SIZE) {
    return [{
      text: trimmedContent,
      index: 0,
      total: 1,
      start: 0,
      end: trimmedContent.length
    }];
  }

  const paragraphs = splitIntoParagraphs(trimmedContent);
  const chunks = [];
  let currentChunk = '';
  let chunkStartIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const potentialChunk = currentChunk
      ? currentChunk + '\n\n' + para
      : para;

    // If adding this paragraph exceeds max size
    if (potentialChunk.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk,
        index: chunks.length,
        total: 0, // Will update later
        start: chunkStartIndex,
        end: chunkStartIndex + currentChunk.length
      });

      // Start new chunk with overlap
      // Get last ~CHUNK_OVERLAP chars from current chunk for context
      const overlapText = currentChunk.slice(-CHUNK_OVERLAP);
      chunkStartIndex += currentChunk.length - CHUNK_OVERLAP;
      currentChunk = overlapText + '\n\n' + para;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add final chunk if any content remains
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk,
      index: chunks.length,
      total: 0,
      start: chunkStartIndex,
      end: chunkStartIndex + currentChunk.length
    });
  }

  // Update total count for all chunks
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    chunk.total = totalChunks;
  });

  return chunks;
}

/**
 * Get context-aware prompt for a chunk
 */
export function getChunkContext(chunk) {
  if (chunk.total === 1) {
    return '';
  }
  return `This is part ${chunk.index + 1} of ${chunk.total} of the document.`;
}

/**
 * Validate content length
 */
export function validateContentLength(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'No content to process' };
  }

  const length = content.trim().length;

  if (length > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `Content too long (${length} chars). Maximum: ${MAX_DOCUMENT_SIZE} chars.`,
      length
    };
  }

  return { valid: true, length };
}

export default {
  chunkContent,
  getChunkContext,
  validateContentLength,
  MAX_CHUNK_SIZE,
  CHUNK_OVERLAP,
  MAX_DOCUMENT_SIZE
};

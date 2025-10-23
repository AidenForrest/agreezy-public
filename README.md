# agreezy-public
Its Agreezy Peasy

# Agreezy - AI-Powered Terms & Policy Analyzer

Agreezy is a Chrome extension that helps you understand terms of service, privacy policies, and other complex documents using Chrome's built-in AI (Gemini Nano). Never blindly accept terms again!

## Features

### 🔑 Key Points Extraction (Primary Feature)
Automatically extracts the most important points you should know about:
- Data collection and usage
- Privacy implications
- User rights and obligations
- Important restrictions and legal terms
- Payment and billing terms

### 📝 Smart Summarization
- Generate concise summaries of long documents
- Multiple summary types: Key Points, TL;DR, Teaser, Headline
- Configurable length: Short, Medium, Long
- Automatic chunking for documents over 4000 characters

### 🌐 Translation
- Translate documents to 20+ languages
- Intelligent chunking preserves meaning
- Automatic language detection

### 💬 Q&A
- Ask questions about the document
- Get AI-powered answers based on the content
- Suggested questions to get you started
- Chunk-aware context for accurate responses

## Smart Content Chunking

Agreezy intelligently handles long documents (up to 50,000 characters) by:
- Splitting content on paragraph boundaries
- Maintaining context with overlapping chunks
- Processing each chunk and merging results
- Preserving document structure and meaning

## Installation & Setup

### Prerequisites
- Chrome browser (latest version recommended)
- Chrome AI APIs enabled (Gemini Nano)

### Install Instructions

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd gemini-chrome-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` directory
   - Also, see "releases" folder for packed extension which you can easily drag and drop into chrome://extensions

## How to Use

### Method 1: Extension Icon
1. Click the Agreezy extension icon in your toolbar
2. The side panel opens and automatically analyzes the current page

### Method 2: Right-Click Menu
1. Right-click anywhere on a page
2. Select "Analyze with Agreezy"
3. Side panel opens with analysis

### Method 3: Re-analyze Button
1. Open the side panel
2. Click "Re-analyze Page" to refresh the analysis

### Method 4: Auto-detection
1. Open any page
2. Agreezy will alert you to alanyse terms if they are auto detected

## Features Breakdown

### Key Points Tab
- Automatically extracts 3-10 most important points
- Categorized by: Privacy, Data, Rights, Legal, Financial
- Ranked by importance (high/medium/low)
- Perfect for quickly understanding what you're agreeing to - never miss something important

### Summary Tab
- Customizable summary settings
- Choose type, length, and format
- Automatically regenerates when settings change

### Translate Tab
- Select target language
- Click "Translate" button
- Shows source language detection

### Q&A Tab
- Type your question in the text box
- Click "Ask" or press Enter
- Get contextual answers from the document
- Click suggested questions for quick insights
- Full conversation history

## Technical Details

### Architecture
- **Chunker**: Smart content splitting (3500 char chunks, 200 char overlap)
- **AI APIs Integration**: Prompt API, Summarizer API, Translation API
- **Features**: Modular design for each capability
- **UI**: Clean tab-based interface with real-time updates

### Limits
- Maximum document size: 50,000 characters
- Chunk size: 3,500 characters
- Chunk overlap: 200 characters
- Max chunks per document: ~14

## Chrome AI APIs

This extension uses Chrome's experimental AI APIs:

- **Summarizer API**: For generating summaries
- **Prompt API**: For key points extraction, Q&A, and custom processing
- **Translation API**: For language translation (with Prompt API fallback)
- **Language Detector API**: For auto-detecting source language

### Getting Origin Trial Tokens

1. Visit [Chrome Origin Trials](https://developer.chrome.com/docs/web-platform/origin-trials)
2. Sign up for the AI APIs trials
3. Generate tokens for your extension
4. Update the `trial_tokens` array in `manifest.json`

## Development

### Build
```bash
npm run build
```

### Project Dependencies
- `@mozilla/readability` - Extract main content from pages
- `dompurify` - Sanitize HTML for security
- `marked` - Render markdown in the UI
- `rollup` - Bundle the extension

## Privacy & Security

- All AI processing happens **locally** using Chrome's built-in AI (Gemini Nano)
- No data is sent to external servers
- Content is extracted from the current page only
- Session storage is used (not persistent)

## Future Enhancements

Potential improvements for future versions:
- Persistent history of analyzed documents
- Export analysis results
- Custom highlighting of important sections
- Comparison between different versions
- Browser notification for concerning clauses

## Contributing

This is an MVP. Contributions, suggestions, and improvements are welcome! Azreezy does NOT constitute as legal advice.

## License

MIT

## Credits

Built with Chrome's experimental AI APIs (Gemini Nano)
Based on Chrome's Summarization API sample

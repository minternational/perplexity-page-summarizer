# Pages Summarizer - Browser Extension

This project is a browser-based extension (Chrome Extension, manifest v3) that uses the Perplexity API to automatically create summaries of YouTube videos or any web page.

## Features

- **YouTube video summarization:** Automatically extracts transcripts from YouTube videos and creates summaries.
- **Summarize web pages:** Generates precise and formatted summaries of any web page content.
- Custom options:** Adjustable length, style (bullet points or body text) and an optional custom system prompt.
- **Summary history:** History of past summaries that can be exported or deleted.

## Project structure
```
.
├── background.js
├── history.html
├── history.js
├── icon-dark.png
├── icon-white.png
├── manifest.json
├── marked.js
├── options.html
├── options.js
├── popup.html
├── popup.js
└── styles.css
```

## Project description

### Pages Summarizer - Chrome Extension
A handy Chrome extension for automatically summarizing web page content and YouTube video transcripts.

### Functions
- **Quick summary via context menu** (whole page or selected text).
- **History of saved summaries**, including delete and export function.
- **Customized options** (summary length, style, own prompt).
- **Chrome Context Menu** (right click on any webpage for a general or highlighted text summary)
- **Export of summaries as Markdown or txt**.

### Tech stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **External services:** [Perplexity AI](https://api.perplexity.ai)
- **Parsing Library:** [Marked.js](https://github.com/markedjs/marked)

### Installation
1. clone repository:
```bash
git clone https://github.com/deinusername/pages-summarizer.git
```

2. Load in Chrome:
- Open `chrome://extensions`
- Activate the developer mode.
- Click on “Load unpacked extension”.
- Select the directory of the cloned repository.

### Customizations
- Enter API key for Perplexity in the options.
- Select summary length and style (bullet or continuous text).

### License
This project is licensed under the MIT license.

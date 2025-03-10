import { marked } from './marked.js';

document.addEventListener('DOMContentLoaded', async () => {
  const historyContainer = document.getElementById('historyContainer');

  // Load the history from chrome.storage.local
  const { summaryHistory } = await chrome.storage.local.get('summaryHistory');

  if (!summaryHistory || summaryHistory.length === 0) {
    historyContainer.innerHTML = '<p>No summaries found.</p>';
    return;
  }

  // Sort the history so that the most recent entry is displayed first
  const sortedHistory = summaryHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  // Save globally to be able to access it later via index
  window.globalHistory = sortedHistory;

  // Empty the container and add the entries
  historyContainer.innerHTML = '';
  sortedHistory.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'summary-entry';
    // Formatiere den Zeitstempel in ein lesbares Format
    const date = new Date(entry.timestamp);
    const dateString = date.toLocaleString('de-DE');

    // Create a container for the buttons (Delete & Export)
    entryDiv.innerHTML = `
      <div class="entry-buttons">
        <button class="delete-btn" data-index="${index}">Delete</button>
        <button class="export-btn" data-index="${index}">Export</button>
      </div>
      <div class="timestamp">${dateString}</div>
      <div class="summary-text">${marked.parse(entry.text)}</div>
    `;
    historyContainer.appendChild(entryDiv);
  });

  // Event listener for delete and export buttons
  historyContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      let { summaryHistory } = await chrome.storage.local.get('summaryHistory');
      summaryHistory.splice(index, 1);
      await chrome.storage.local.set({ summaryHistory });
      location.reload();
    }
    if (e.target.classList.contains('export-btn')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      exportEntry(window.globalHistory[index]);
    }
  });
});

// Exports the transferred entry as a Markdown file
function exportEntry(entry) {
  const markdown = entry.text;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Generate file name with timestamp, e.g. “summary-2023-03-09T12-34-56.md”
  const date = new Date(entry.timestamp);
  const dateString = date.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `summary-${dateString}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

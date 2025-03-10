// Retrieve the saved API key, summary options and custom prompt when loading the options page
document.addEventListener('DOMContentLoaded', async () => {
  const { apiKey, summaryLength, summaryStyle, customPrompt } = await chrome.storage.sync.get([
    'apiKey',
    'summaryLength',
    'summaryStyle',
    'customPrompt',
  ]);

  if (apiKey) {
    document.getElementById('apiKey').value = apiKey;
  }
  if (summaryLength) {
    document.getElementById('summaryLength').value = summaryLength;
  }
  if (summaryStyle) {
    document.getElementById('summaryStyle').value = summaryStyle;
  }
  if (customPrompt) {
    document.getElementById('customPrompt').value = customPrompt;
  }
});

// Event listener for the “Save” button: Stores API key, summary options and custom prompt in chrome.storage.sync
document.getElementById('saveBtn').addEventListener('click', async () => {
  const key = document.getElementById('apiKey').value.trim();
  const summaryLength = document.getElementById('summaryLength').value;
  const summaryStyle = document.getElementById('summaryStyle').value;
  const customPrompt = document.getElementById('customPrompt').value;

  if (key.length === 0) {
    document.getElementById('message').textContent = 'Please enter a valid API key.';
    return;
  }

  await chrome.storage.sync.set({ apiKey: key, summaryLength, summaryStyle, customPrompt });
  document.getElementById('message').textContent = 'Settings saved!';
});

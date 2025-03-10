// options.js

// Beim Laden der Optionsseite den gespeicherten API Key, Zusammenfassungsoptionen und den benutzerdefinierten Prompt abrufen
document.addEventListener('DOMContentLoaded', async () => {
  const { apiKey, summaryLength, summaryStyle, customPrompt } = await chrome.storage.sync.get(['apiKey', 'summaryLength', 'summaryStyle', 'customPrompt']);
  
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

// Eventlistener für den "Speichern"-Button: Speichert API-Key, Zusammenfassungsoptionen und benutzerdefinierten Prompt in chrome.storage.sync
document.getElementById('saveBtn').addEventListener('click', async () => {
  const key = document.getElementById('apiKey').value.trim();
  const summaryLength = document.getElementById('summaryLength').value;
  const summaryStyle = document.getElementById('summaryStyle').value;
  const customPrompt = document.getElementById('customPrompt').value;
  
  if (key.length === 0) {
    document.getElementById('message').textContent = 'Bitte einen gültigen API-Schlüssel eingeben.';
    return;
  }
  
  await chrome.storage.sync.set({ apiKey: key, summaryLength, summaryStyle, customPrompt });
  document.getElementById('message').textContent = 'Einstellungen gespeichert!';
});

import { marked } from './marked.js';

let fullHistory = [];

const summaryEl = document.getElementById('summary');
const statusEl = document.getElementById('status');

const renderConversation = () => {
  summaryEl.innerHTML = marked.parse(
    fullHistory
      .filter((msg) => msg.role === 'assistant')
      .map((msg) => `**Prompt:** ${msg.content}`)
      .join('\n\n')
  );
};

const loadSavedConversation = async () => {
  const { savedConversation } = await chrome.storage.local.get('savedConversation');
  if (savedConversation) {
    fullHistory = savedConversation;
    renderConversation();
  }
};

const clearConversation = async () => {
  fullHistory = [];
  await chrome.storage.local.remove('savedConversation');
  summaryEl.innerHTML = '';
  statusEl.textContent = 'Summary deleted.';
};

const copySummary = async () => {
  try {
    await navigator.clipboard.writeText(summaryEl.textContent);
    statusEl.textContent = 'Content copied!';
  } catch (err) {
    statusEl.textContent = `Error when copying: ${err}`;
  }
};

const processStream = async (reader, updateCallback) => {
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const deltaContent = parsed.choices?.[0]?.delta?.content;
        if (deltaContent) updateCallback(deltaContent);
      } catch (err) {
        console.error('JSON parse error:', err);
      }
    }
  }
};

const summarizePage = async () => {
  statusEl.textContent = 'Content is extracted...';

  // Lade API-Key, Zusammenfassungsoptionen und den benutzerdefinierten System-Prompt aus chrome.storage.sync
  const { apiKey, summaryLength, summaryStyle, customPrompt } = await chrome.storage.sync.get([
    'apiKey',
    'summaryLength',
    'summaryStyle',
    'customPrompt',
  ]);
  console.log('Loaded options:', { summaryLength, summaryStyle, customPrompt });

  if (!apiKey) return (statusEl.textContent = 'No API key saved. Check the options.');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    return (statusEl.textContent = 'No active tab found.');
  }

  let pageText = '';

  // Wenn YouTube-Video, versuche das Transkript zu extrahieren
  if (tab.url.includes('youtube.com/watch')) {
    const [{ result: transcriptText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        let transcript = '';
        const transcriptElements = document.querySelectorAll('ytd-transcript-segment-renderer');
        transcriptElements.forEach((el) => {
          transcript += el.innerText + ' ';
        });
        return transcript.trim();
      },
    });
    if (transcriptText && transcriptText.length >= 50) {
      pageText = transcriptText;
    } else {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText,
      });
      pageText = result;
    }
  } else {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    });
    pageText = result;
  }

  if (!pageText || pageText.trim().length < 50) {
    return (statusEl.textContent = 'Contents too short or empty.');
  }

  // Verwende gespeicherten Highlight-Text, falls vorhanden
  const { highlightedText } = await chrome.storage.local.get('highlightedText');
  if (highlightedText && highlightedText.trim().length > 0) {
    pageText = highlightedText;
    await chrome.storage.local.remove('highlightedText');
  }

  // Standard-Prompt als Fallback
  const defaultPrompt = `Erstelle eine prägnante, vollständige Zusammenfassung auf Deutsch. Nutze korrekte Grammatik, verzichte auf Füllwörter. Vorgaben: Länge ${
    summaryLength || 'mittel'
  }, Stil ${summaryStyle === 'bullet' ? 'Bullet-Points' : 'Fließtext'}.`;
  // Nutze benutzerdefinierten Prompt, falls vorhanden, und ersetze Platzhalter {length} und {style}
  const systemPromptTemplate = customPrompt && customPrompt.trim() !== '' ? customPrompt : defaultPrompt;
  const systemPrompt = systemPromptTemplate
    .replace('{length}', summaryLength || 'mittel')
    .replace('{style}', summaryStyle === 'bullet' ? 'Bullet-Points' : 'Fließtext');

  fullHistory = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: pageText },
  ];

  renderConversation();
  statusEl.textContent = 'Summary is created...';

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: fullHistory,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const assistantMsg = { role: 'assistant', content: '' };
    fullHistory.push(assistantMsg);

    await processStream(response.body.getReader(), (content) => {
      assistantMsg.content += content;
      renderConversation();
    });

    await chrome.storage.local.set({ savedConversation: fullHistory });
    addToHistory(assistantMsg.content);
    statusEl.textContent = 'Summary successful!';
  } catch (error) {
    console.error(error);
    statusEl.textContent = `Fehler: ${error.message}`;
  }
};

const handleFollowup = async () => {
  const input = document.getElementById('followupInput');
  const followup = input.value.trim();
  if (!followup) return;

  statusEl.textContent = 'Process follow-up question...';

  const { apiKey } = await chrome.storage.sync.get('apiKey');
  if (!apiKey) return (statusEl.textContent = 'No API key saved.');

  fullHistory.push({ role: 'user', content: followup });
  renderConversation();

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: fullHistory,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);

  const newAssistantMsg = { role: 'assistant', content: '' };
  fullHistory.push(newAssistantMsg);
  renderConversation();

  await processStream(response.body.getReader(), (content) => {
    newAssistantMsg.content += content;
    renderConversation();
  });

  statusEl.textContent = 'Answer received!';
  input.value = '';
};

const exportSummary = () => {
  const text = summaryEl.textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'summary.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  statusEl.textContent = 'Summary exported!';
};

const addToHistory = async (summaryText) => {
  const { summaryHistory } = await chrome.storage.local.get('summaryHistory');
  const newEntry = {
    text: summaryText,
    timestamp: new Date().toISOString(),
  };
  const updatedHistory = summaryHistory ? [...summaryHistory, newEntry] : [newEntry];
  await chrome.storage.local.set({ summaryHistory: updatedHistory });
};

document.getElementById('followupInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleFollowup();
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadSavedConversation();
  const { highlightedText } = await chrome.storage.local.get('highlightedText');
  if (highlightedText && highlightedText.trim().length > 0) {
    summarizePage();
  }
});
document.getElementById('deleteBtn').addEventListener('click', clearConversation);
document.getElementById('copyBtn').addEventListener('click', copySummary);
document.getElementById('summarizeBtn').addEventListener('click', summarizePage);
document.getElementById('followupBtn').addEventListener('click', handleFollowup);
document.getElementById('exportBtn').addEventListener('click', exportSummary);
document.getElementById('historyBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
});

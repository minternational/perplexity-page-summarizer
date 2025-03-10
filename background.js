chrome.runtime.onInstalled.addListener(() => {
  console.log('Pages Summarizer installed');

  // Kontextmenü-Eintrag für den selektierten Text
  chrome.contextMenus.create({
    id: 'summarizeHighlight',
    title: 'Summarize highlight',
    contexts: ['selection'],
  });

  // Neuer Kontextmenü-Eintrag für die gesamte Seite
  chrome.contextMenus.create({
    id: 'summarizePage',
    title: 'Summarize page',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab.id) {
    if (info.menuItemId === 'summarizeHighlight') {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => window.getSelection().toString(),
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          const selectedText = results[0].result;
          console.log('Selected text:', selectedText);
          if (selectedText && selectedText.trim().length > 0) {
            chrome.storage.local.set({ highlightedText: selectedText }, () => {
              chrome.action.openPopup();
            });
          }
        }
      );
    } else if (info.menuItemId === 'summarizePage') {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => document.body.innerText,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          const fullPageText = results[0].result;
          console.log('Full page text:', fullPageText);
          if (fullPageText && fullPageText.trim().length > 0) {
            // Speichere den gesamten Seitentext, damit im Popup automatisch die Zusammenfassung gestartet wird
            chrome.storage.local.set({ highlightedText: fullPageText }, () => {
              chrome.action.openPopup();
            });
          }
        }
      );
    }
  }
});

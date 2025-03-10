chrome.runtime.onInstalled.addListener(() => {
  console.log('Pages Summarizer installed');

  // Kontextmenü-Eintrag für den selektierten Text
  chrome.contextMenus.create({
    id: 'summarizeHighlight',
    title: 'Highlight zusammenfassen',
    contexts: ['selection'],
  });

  // Neuer Kontextmenü-Eintrag für die gesamte Seite
  chrome.contextMenus.create({
    id: 'summarizePage',
    title: 'Seite zusammenfassen',
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
          console.log('Ausgewählter Text:', selectedText);
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
          console.log('Voller Seitentext:', fullPageText);
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

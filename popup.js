// Load and display stats
document.addEventListener('DOMContentLoaded', async () => {
  // Get stats
  const stats = await chrome.storage.local.get(['warningsCount', 'pagesScanned']);
  
  document.getElementById('warningsCount').textContent = stats.warningsCount || 0;
  document.getElementById('pagesScanned').textContent = stats.pagesScanned || 0;

  // Load feature toggles
  const settings = await chrome.storage.local.get(['contentFilter', 'grammarCheck', 'scamDetection']);
  document.getElementById('contentFilter').checked = settings.contentFilter !== false;
  document.getElementById('grammarCheck').checked = settings.grammarCheck !== false;
  document.getElementById('scamDetection').checked = settings.scamDetection !== false;
  
  // Get AI status
  chrome.runtime.sendMessage({ action: 'getAIStatus' }, (response) => {
    if (response) {
      const modeText = document.getElementById('aiModeText');
      modeText.textContent = `AI Mode: ${response.mode}`;
      modeText.style.fontSize = '12px';
    }
  });
});

// Save toggle states
document.getElementById('contentFilter').addEventListener('change', (e) => {
  chrome.storage.local.set({ contentFilter: e.target.checked });
});

document.getElementById('grammarCheck').addEventListener('change', (e) => {
  chrome.storage.local.set({ grammarCheck: e.target.checked });
});

document.getElementById('scamDetection').addEventListener('change', (e) => {
  chrome.storage.local.set({ scamDetection: e.target.checked });
});

// Test button
document.getElementById('testBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      if (typeof scanPageContent === 'function') {
        scanPageContent();
      }
    }
  });
  
  window.close();
});
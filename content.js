const analyzedContent = new Set();
let warningOverlay = null;

console.log('🛡️ Teen Safety Guardian active on:', window.location.hostname);

window.addEventListener('load', () => {
  setTimeout(scanPageContent, 2000);
});

document.addEventListener('input', (e) => {
  if (e.target.matches('input[type="text"], textarea, [contenteditable="true"]')) {
    clearTimeout(window.grammarTimeout);
    window.grammarTimeout = setTimeout(() => handleTextInput(e.target), 1000);
  }
});

async function scanPageContent() {
  try {
    const bodyText = document.body.innerText;
    const contentSample = bodyText.substring(0, 1000);
    
    const contentHash = simpleHash(contentSample);
    if (analyzedContent.has(contentHash)) {
      console.log('Content already analyzed, skipping');
      return;
    }
    analyzedContent.add(contentHash);

    const quickCheck = checkSuspiciousPatterns(contentSample);
    if (quickCheck.suspicious) {
      showQuickWarning(quickCheck.reason);
      
      chrome.storage.local.get(['pagesScanned'], (data) => {
        chrome.storage.local.set({ pagesScanned: (data.pagesScanned || 0) + 1 });
      });
      return;
    }

    console.log('📤 Sending content for analysis...');
    
    chrome.runtime.sendMessage({
      action: 'analyzeContent',
      text: contentSample
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Message error:', chrome.runtime.lastError.message);
        return;
      }
      
      if (!response) {
        console.error('No response from background script');
        return;
      }
      
      console.log('Analysis response:', response);
      
      if (response.error) {
        console.error('Analysis error:', response.error);
        return;
      }
      
      if (!response.safe) {
        showWarning(response);
      }
      
      chrome.storage.local.get(['pagesScanned'], (data) => {
        chrome.storage.local.set({ pagesScanned: (data.pagesScanned || 0) + 1 });
      });
    });
    
  } catch (error) {
    console.error('Scan error:', error);
  }
}

function checkSuspiciousPatterns(text) {
  const patterns = {
    scam: /\b(won|winner|claim.*prize|urgent.*action|verify.*account|suspended.*account|click.*here.*now)\b/gi,
    personalInfo: /\b(ssn|social security|credit card|password|cvv)\b/gi,
    violence: /\b(kill|murder|weapon|blood|gore)\b/gi
  };

  for (const [type, regex] of Object.entries(patterns)) {
    if (regex.test(text)) {
      return { 
        suspicious: true, 
        reason: `Suspicious ${type} content detected` 
      };
    }
  }
  
  return { suspicious: false };
}

async function handleTextInput(element) {
  const text = element.value || element.innerText;
  
  if (text.length < 10) {
    return;
  }
  
  try {
    chrome.storage.local.get(['grammarCheck'], (settings) => {
      if (settings.grammarCheck === false) {
        return;
      }
      
      chrome.runtime.sendMessage({
        action: 'checkGrammar',
        text: text
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Grammar check error:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.hasErrors && response.corrections) {
          showGrammarSuggestions(element, response.corrections);
        }
      });
    });
  } catch (error) {
    console.error('Grammar check error:', error);
  }
}

function showWarning(analysis) {
  if (warningOverlay) {
    return;
  }

  warningOverlay = document.createElement('div');
  warningOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: ${analysis.riskLevel === 'DANGER' ? '#dc2626' : '#f59e0b'};
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;

  const icon = analysis.riskLevel === 'DANGER' ? '🛑' : '⚠️';
  
  warningOverlay.innerHTML = `
    ${icon} <strong>${analysis.riskLevel} CONTENT DETECTED</strong><br>
    ${analysis.reason || 'Potentially harmful content found on this page.'}
    <button id="dismissWarning" style="margin-left: 10px; padding: 5px 10px; background: white; 
           color: #333; border: none; border-radius: 4px; cursor: pointer;">
      Dismiss
    </button>
  `;
  
  document.body.prepend(warningOverlay);
  
  document.getElementById('dismissWarning').addEventListener('click', () => {
    warningOverlay.remove();
    warningOverlay = null;
  });
  
  chrome.runtime.sendMessage({ action: 'incrementWarnings' });
}

function showQuickWarning(reason) {
  const warning = document.createElement('div');
  warning.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f59e0b;
    color: white;
    padding: 12px;
    text-align: center;
    z-index: 999999;
    font-size: 14px;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  warning.innerHTML = `
    ⚠️ ${reason}
    <button style="margin-left: 10px; padding: 4px 8px; background: white; color: #333; 
           border: none; border-radius: 3px; cursor: pointer;" 
           onclick="this.parentElement.remove()">
      Dismiss
    </button>
  `;
  
  document.body.prepend(warning);
  
  setTimeout(() => {
    if (warning.parentElement) {
      warning.remove();
    }
  }, 10000);
  
  chrome.runtime.sendMessage({ action: 'incrementWarnings' });
}

function highlightElement(element, type) {
  element.style.border = type === 'error' ? '2px solid #dc2626' : '2px solid #f59e0b';
  element.style.outline = 'none';
  
  setTimeout(() => {
    element.style.border = '';
  }, 3000);
}

function showInputWarning(element, message) {
  const existing = element.nextElementSibling;
  if (existing && existing.classList.contains('safety-tooltip')) {
    existing.remove();
  }
  
  const tooltip = document.createElement('div');
  tooltip.className = 'safety-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background: #dc2626;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    margin-top: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  tooltip.textContent = message;
  element.parentNode.insertBefore(tooltip, element.nextSibling);
  
  setTimeout(() => tooltip.remove(), 5000);
}

function showGrammarSuggestions(element, corrections) {
  const existing = element.nextElementSibling;
  if (existing && existing.classList.contains('grammar-tooltip')) {
    existing.remove();
  }
  
  const tooltip = document.createElement('div');
  tooltip.className = 'grammar-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background: #3b82f6;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    margin-top: 5px;
    z-index: 10000;
    max-width: 300px;
    font-family: Arial, sans-serif;
  `;
  tooltip.innerHTML = `📝 Suggestions:<br>${corrections.slice(0, 3).join('<br>')}`;
  element.parentNode.insertBefore(tooltip, element.nextSibling);
  
  setTimeout(() => {
    if (tooltip.parentElement) {
      tooltip.remove();
    }
  }, 8000);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}
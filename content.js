// Track analyzed content to avoid duplicates
const analyzedContent = new Set();
let warningOverlay = null;

// Start monitoring when page loads
console.log('🛡️ Teen Safety Guardian active on:', window.location.hostname);

// Analyze page content on load
window.addEventListener('load', () => {
  setTimeout(scanPageContent, 2000); // Wait 2 seconds for page to fully load
});

// Monitor text inputs for real-time grammar checking
document.addEventListener('input', (e) => {
  if (e.target.matches('input[type="text"], textarea, [contenteditable="true"]')) {
    clearTimeout(window.grammarTimeout);
    window.grammarTimeout = setTimeout(() => handleTextInput(e.target), 1000);
  }
});

// Scan page content for inappropriate material
async function scanPageContent() {
  try {
    // Get main text content
    const bodyText = document.body.innerText;
    const contentSample = bodyText.substring(0, 1000); // First 1000 chars
    
    // Skip if already analyzed
    const contentHash = simpleHash(contentSample);
    if (analyzedContent.has(contentHash)) {
      console.log('Content already analyzed, skipping');
      return;
    }
    analyzedContent.add(contentHash);

    // Check for suspicious patterns first (quick check)
    const quickCheck = checkSuspiciousPatterns(contentSample);
    if (quickCheck.suspicious) {
      showQuickWarning(quickCheck.reason);
      
      // Increment page scanned count
      chrome.storage.local.get(['pagesScanned'], (data) => {
        chrome.storage.local.set({ pagesScanned: (data.pagesScanned || 0) + 1 });
      });
      return;
    }

    // Deep AI analysis
    console.log('📤 Sending content for analysis...');
    
    chrome.runtime.sendMessage({
      action: 'analyzeContent',
      text: contentSample
    }, (response) => {
      // Check for errors
      if (chrome.runtime.lastError) {
        console.error('❌ Message error:', chrome.runtime.lastError.message);
        return;
      }
      
      if (!response) {
        console.error('❌ No response from background script');
        return;
      }
      
      console.log('✅ Analysis response:', response);
      
      if (response.error) {
        console.error('❌ Analysis error:', response.error);
        return;
      }
      
      if (!response.safe) {
        showWarning(response);
      }
      
      // Increment page scanned count
      chrome.storage.local.get(['pagesScanned'], (data) => {
        chrome.storage.local.set({ pagesScanned: (data.pagesScanned || 0) + 1 });
      });
    });
    
  } catch (error) {
    console.error('Scan error:', error);
  }
}

// Quick pattern matching for common dangers
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

// Handle text input - grammar checking
async function handleTextInput(element) {
  const text = element.value || element.innerText;
  
  if (text.length < 10) {
    return;
  }
  
  try {
    // Check if grammar checking is enabled
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

// Show warning overlay for dangerous content
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
  
  // Add dismiss handler
  document.getElementById('dismissWarning').addEventListener('click', () => {
    warningOverlay.remove();
    warningOverlay = null;
  });
  
  // Update stats
  chrome.runtime.sendMessage({ action: 'incrementWarnings' });
}

// Show quick warning without AI analysis
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
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (warning.parentElement) {
      warning.remove();
    }
  }, 10000);
  
  // Update stats
  chrome.runtime.sendMessage({ action: 'incrementWarnings' });
}

// Highlight input with warning
function highlightElement(element, type) {
  element.style.border = type === 'error' ? '2px solid #dc2626' : '2px solid #f59e0b';
  element.style.outline = 'none';
  
  // Reset after 3 seconds
  setTimeout(() => {
    element.style.border = '';
  }, 3000);
}

// Show input warning tooltip
function showInputWarning(element, message) {
  // Remove existing tooltip
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

// Show grammar suggestions
function showGrammarSuggestions(element, corrections) {
  // Remove existing tooltip
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
  
  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (tooltip.parentElement) {
      tooltip.remove();
    }
  }, 8000);
}

// Simple hash function to track analyzed content
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}
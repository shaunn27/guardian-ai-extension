// ⚠️ IMPORTANT: Replace YOUR_API_KEY_HERE with your actual API key!
const CONFIG = {
  GEMINI_API_KEY: 'YOUR_API_KEY_HERE', // <<< PUT YOUR KEY HERE
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
};

// Initialize AI sessions
let chromeAIAvailable = false;
let promptSession = null;
let proofreaderSession = null;

// Set up AI when extension starts
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🛡️ Teen Safety Guardian installed');
  await checkAIAvailability();
  
  // Initialize stats
  chrome.storage.local.set({
    warningsCount: 0,
    pagesScanned: 0,
    aiMode: chromeAIAvailable ? 'chrome-builtin' : 'gemini-api'
  });
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('🛡️ Teen Safety Guardian starting up');
  await checkAIAvailability();
});

// Check which AI is available
async function checkAIAvailability() {
  console.log('🔍 Checking AI availability...');
  
  // Try Chrome Built-in AI first
  try {
    if (self.ai && self.ai.languageModel) {
      const capabilities = await self.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        console.log('✅ Chrome Built-in AI available!');
        chromeAIAvailable = true;
        await initializeChromeAI();
        return;
      }
    }
  } catch (error) {
    console.log('ℹ️ Chrome Built-in AI not available:', error.message);
  }
  
  // Fallback to Gemini API
  console.log('🌐 Using Gemini API (cloud-based)');
  chromeAIAvailable = false;
  
  // Test Gemini API connection
  try {
    await testGeminiAPI();
    console.log('✅ Gemini API connected successfully');
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error.message);
    console.error('Check if your API key is correct in background.js');
  }
}

// Initialize Chrome Built-in AI
async function initializeChromeAI() {
  try {
    if (self.ai.languageModel) {
      promptSession = await self.ai.languageModel.create({
        systemPrompt: `You are a teen safety assistant. Analyze content for:
1. Violence or disturbing content
2. Adult/inappropriate material
3. Scam patterns (phishing, fake prizes, suspicious links)
4. Cyberbullying language
Rate severity: SAFE, CAUTION, or DANGER. Be brief and specific.`
      });
      console.log('✅ Chrome Prompt API ready');
    }

    if (self.ai.proofreader) {
      proofreaderSession = await self.ai.proofreader.create();
      console.log('✅ Chrome Proofreader API ready');
    }
  } catch (error) {
    console.error('Chrome AI initialization failed:', error);
    chromeAIAvailable = false;
  }
}

// Test Gemini API connection
async function testGeminiAPI() {
  const url = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ 
        parts: [{ text: 'Respond with OK' }] 
      }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API test failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('API test response:', data);
  return data;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.action);
  
  // Validate request exists
  if (!request || !request.action) {
    sendResponse({ error: 'Invalid request' });
    return true;
  }
  
  if (request.action === 'analyzeContent') {
    // Validate text exists
    if (!request.text) {
      sendResponse({ safe: true, riskLevel: 'SAFE', reason: 'No content to analyze' });
      return true;
    }
    
    console.log('🔍 Analyzing content...');
    
    // Call the analysis function
    (async () => {
      try {
        let result;
        
        if (chromeAIAvailable) {
          result = await analyzeChromeAI(request.text);
        } else {
          result = await analyzeGeminiAPI(request.text);
        }
        
        console.log('✅ Sending result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('❌ Analysis error:', error);
        sendResponse({ 
          safe: true, 
          riskLevel: 'SAFE', 
          reason: 'Analysis error: ' + error.message 
        });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'checkGrammar') {
    if (!request.text) {
      sendResponse({ hasErrors: false, corrections: [] });
      return true;
    }
    
    console.log('📝 Checking grammar...');
    
    (async () => {
      try {
        let result;
        
        if (chromeAIAvailable && proofreaderSession) {
          result = await checkGrammarChromeAI(request.text);
        } else {
          result = await checkGrammarGeminiAPI(request.text);
        }
        
        sendResponse(result);
      } catch (error) {
        console.error('❌ Grammar check error:', error);
        sendResponse({ hasErrors: false, corrections: [] });
      }
    })();
    
    return true;
  }
  
  if (request.action === 'getAIStatus') {
    sendResponse({ 
      mode: chromeAIAvailable ? 'Chrome Built-in AI' : 'Gemini API',
      available: true 
    });
    return true;
  }
  
  if (request.action === 'incrementWarnings') {
    chrome.storage.local.get(['warningsCount'], (data) => {
      chrome.storage.local.set({ warningsCount: (data.warningsCount || 0) + 1 });
    });
    return true;
  }
  
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }
  
  return false;
});

// Analyze using Gemini API
async function analyzeGeminiAPI(text) {
  try {
    const url = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`;
    
    console.log('📤 Calling Gemini API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this content for safety concerns (violence, scams, inappropriate material for teens). 
Respond ONLY with valid JSON in this exact format:
{"safe": true, "riskLevel": "SAFE", "reason": "Content is appropriate"}
OR
{"safe": false, "riskLevel": "WARNING", "reason": "Brief explanation"}

Content to analyze: ${text.substring(0, 500)}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 200
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response Error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 API Response:', data);
    
    // Check if response has the expected structure
    if (!data || !data.candidates || !data.candidates[0]) {
      console.error('❌ Unexpected API response structure:', data);
      return { safe: true, riskLevel: 'SAFE', reason: 'Unable to parse response' };
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      console.error('❌ Missing content in response:', candidate);
      return { safe: true, riskLevel: 'SAFE', reason: 'Unable to parse response' };
    }
    
    const textResult = candidate.content.parts[0].text || '{"safe": true, "riskLevel": "SAFE"}';
    console.log('📄 Raw text result:', textResult);
    
    // Clean and parse JSON
    const cleanedText = textResult.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Analysis result:', parsed);
      return parsed;
    }
    
    return { safe: true, riskLevel: 'SAFE', reason: 'Unable to parse response' };
  } catch (error) {
    console.error('❌ Gemini API analysis failed:', error);
    throw error;
  }
}

// Grammar check using Gemini API (FIXED)
async function checkGrammarGeminiAPI(text) {
  try {
    const url = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Check grammar and suggest improvements. Respond ONLY with valid JSON:
{"hasErrors": true/false, "corrections": ["suggestion 1", "suggestion 2"]}

Text: ${text.substring(0, 300)}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 150
        }
      })
    });
    
    if (!response.ok) {
      console.error('Grammar API error:', response.status);
      return { hasErrors: false, corrections: [] };
    }
    
    const data = await response.json();
    
    // Check response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return { hasErrors: false, corrections: [] };
    }
    
    const textResult = data.candidates[0].content.parts[0].text || '{"hasErrors": false, "corrections": []}';
    const cleanedText = textResult.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { hasErrors: false, corrections: [] };
  } catch (error) {
    console.error('Grammar check failed:', error);
    return { hasErrors: false, corrections: [] };
  }
}

// Analyze using Chrome Built-in AI (FIXED)
async function analyzeChromeAI(text) {
  try {
    if (!promptSession) {
      throw new Error('Prompt session not initialized');
    }
    
    const prompt = `Analyze this content for safety concerns (violence, scams, inappropriate material for teens). 
Respond ONLY with valid JSON in this exact format:
{"safe": true, "riskLevel": "SAFE", "reason": "Content is appropriate"}
OR
{"safe": false, "riskLevel": "WARNING", "reason": "Brief explanation"}

Content to analyze: ${text.substring(0, 500)}`;
    
    const result = await promptSession.prompt(prompt);
    
    // Parse JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { safe: true, riskLevel: 'SAFE', reason: 'Unable to parse response' };
  } catch (error) {
    console.error('Chrome AI analysis failed:', error);
    throw error;
  }
}
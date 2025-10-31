# GuardianAI: Teen-Safe Web Companion

A Chrome Extension built for the **Google Chrome Built-in AI Challenge 2025** that helps teenagers browse safely and write respectfully—using **100% on-device AI**.

## 🌟 Features

- **Scam & Harmful Content Detection**: Uses Chrome's **Prompt API** to analyze page text and user input for violence, adult content, phishing, and scams.
- **Grammar & Tone Improvement**: Uses **Proofreader API** and **Prompt API** to fix errors and suggest kinder phrasing.
- **Privacy-First**: All AI processing happens locally—no data leaves your device.
- **Works Offline**: No internet required after installation.

## 🛠️ APIs Used

- `chrome.ai.prompt` – for safety classification and rewriting
- `chrome.ai.proofreader` – for grammar correction
- (Future) `chrome.ai.summarizer`, `chrome.ai.translator` – planned

## 🚀 How to Test

1. Enable Chrome's Built-in AI (requires Chrome Dev/Canary 126+ and enrollment in [Early Preview Program](https://developer.chrome.com/docs/ai/))
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder
5. Visit any webpage or type in a text box to see GuardianAI in action!

## 📄 License

MIT License
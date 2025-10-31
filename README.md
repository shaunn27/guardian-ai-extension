# 🛡️ Teen Safety Guardian

An AI-powered Chrome Extension that protects teenagers while browsing by detecting harmful content and providing real-time writing assistance.

## ✨ Features

- 🚨 **Real-time Content Filtering** - Detects inappropriate content, scams, and violence
- 📝 **Grammar Assistant** - AI-powered writing suggestions
- 🎯 **Pattern Recognition** - Quick detection of common online dangers
- 🤖 **Dual AI Support** - Works with Chrome Built-in AI or Gemini API
- 📊 **Activity Dashboard** - Track warnings and scanned pages

## 🚀 Installation

### For Users:
1. Download this repository as ZIP
2. Extract the files
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the extracted folder
7. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
8. Add your API key to `background.js`

### For Developers:
```bash
git clone https://github.com/YOUR-USERNAME/guardian-ai-extension.git
cd guardian-ai-extension
```

## 🔧 Setup

1. **Get API Key:**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Copy the key

2. **Configure Extension:**
   - Open `background.js`
   - Replace `YOUR_API_KEY_HERE` with your actual API key
   ```javascript
   const CONFIG = {
     GEMINI_API_KEY: 'your_actual_api_key',
     ...
   };
   ```

3. **Load Extension:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select this folder

## 📖 Usage

### Content Protection:
- Extension automatically scans pages for harmful content
- Shows warnings when dangerous content is detected
- Click "Test Current Page" in the popup to manually scan

### Grammar Checking:
- Type in any text field
- Get real-time grammar suggestions
- Blue tooltips appear with corrections

### Settings:
- Click the extension icon to open popup
- Toggle features on/off
- View statistics

## 🛠️ Technology Stack

- **Chrome Extension API** - Manifest V3
- **Gemini AI API** - Content analysis and grammar checking
- **Chrome Built-in AI** - On-device processing (when available)
- **JavaScript** - Core logic
- **HTML/CSS** - User interface

## 📁 Project Structure

```
guardian-ai-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker & AI logic
├── content.js         # Page scanning & monitoring
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── styles.css         # Styling
├── icons/             # Extension icons
└── README.md          # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This extension is designed to assist with online safety but should not be the only protection measure. Parental supervision and open communication remain essential.

## 🙏 Acknowledgments

- Built for the **Google Chrome Built-in AI Challenge 2025**
- Powered by **Google Gemini API**
- Inspired by the need for safer teen browsing experiences

## 📧 Project Link

Project Link: [https://github.com/YOUR-USERNAME/guardian-ai-extension](https://github.com/YOUR-USERNAME/guardian-ai-extension)

---

**⭐ If this project helped you, please give it a star!**
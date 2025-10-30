# 🧠 Kiro - Your Web Mind

Kiro is an intelligent AI-powered browser assistant that learns your behavior and helps you act faster. It combines Chrome AI/Gemini Nano with a modern web interface to provide contextual assistance through summarization, suggestions, and automation of everyday web actions.

## ✨ Features

- 🤖 **AI-Powered Context Analysis** - Understands what you're doing on any webpage
- 📝 **Smart Summarization** - Instantly summarize articles, research, and content
- 🔄 **Intelligent Automation** - Automate repetitive web tasks and form filling
- 🎯 **Contextual Suggestions** - Get relevant help without explaining your needs
- 🎙️ **Voice Interface** - Hands-free interaction with natural speech
- 🔗 **Service Integrations** - Connect Gmail, Drive, Notion, Slack, and more
- 🛡️ **Privacy-First** - Local AI processing with granular data controls
- 🎨 **Beautiful UI** - Modern glass morphism design with smooth animations

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: Gemini Nano (local), Chrome AI APIs
- **Backend**: Firebase (Firestore, Auth, Functions)
- **Extension**: Chrome Manifest V3
- **Voice**: Web Speech API
- **Visualization**: D3.js, React Flow

## 🏗️ Project Structure

```
kiro-web-mind/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── chat/             # Chat interface
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── extension/            # Chrome extension
│   ├── manifest.json     # Extension manifest
│   ├── background.js     # Service worker
│   ├── content.js        # Content script
│   ├── popup.html        # Extension popup
│   └── popup.js          # Popup logic
├── lib/                  # Shared utilities
│   └── firebase.ts       # Firebase configuration
└── components/           # React components
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Chrome browser for extension development
- Firebase project (optional for local development)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd kiro-web-mind
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:3000`

4. **Load the Chrome extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` folder
   - The Kiro extension should now appear in your browser

### Firebase Setup (Optional)

For full functionality, set up a Firebase project:

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Cloud Functions
3. Copy your Firebase config to `.env.local`
4. Deploy security rules: `firebase deploy --only firestore:rules`

## 🎯 Usage

### Getting Started

1. **Install the Extension**: Load the Chrome extension in developer mode
2. **Visit Any Website**: Kiro will automatically analyze the page content
3. **Interact with Content**: 
   - Highlight text to see contextual actions
   - Fill forms to get auto-fill suggestions
   - Use voice commands for hands-free operation
4. **Open Dashboard**: Access insights, automations, and settings

### Key Features

- **Text Selection**: Highlight any text to get summarization, explanation, or translation options
- **Form Assistance**: Kiro learns your data and suggests auto-fill for forms
- **Voice Commands**: Say "Hey Kiro" to activate voice mode
- **Smart Suggestions**: Get contextual help based on what you're doing
- **Activity Tracking**: View your browsing patterns and insights in the dashboard

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Extension Development

The Chrome extension files are in the `extension/` directory:

- **manifest.json**: Extension configuration and permissions
- **background.js**: Service worker for AI processing and data management
- **content.js**: Injected script for page interaction and analysis
- **popup.html/js**: Extension popup interface

To test changes:
1. Make your changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh button on the Kiro extension
4. Test on any webpage

### Adding New Features

1. **AI Features**: Extend the background service worker with new AI processing functions
2. **UI Components**: Add new React components in the `components/` directory
3. **Dashboard Pages**: Create new pages in the `app/` directory
4. **Content Script Features**: Enhance page interaction in `content.js`

## 🛡️ Privacy & Security

Kiro is built with privacy as a core principle:

- **Local Processing**: Sensitive data is processed locally using Gemini Nano
- **Granular Permissions**: Users control exactly what data Kiro can access
- **Encryption**: All stored data is encrypted using industry-standard methods
- **Transparency**: The knowledge graph shows exactly what Kiro has learned
- **Data Control**: Users can delete their data at any time

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Chrome AI team for Gemini Nano integration
- Firebase team for the excellent backend platform
- The open-source community for the amazing tools and libraries

---

**Built with ❤️ for a smarter, more efficient web browsing experience.**
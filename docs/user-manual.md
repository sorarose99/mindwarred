# Kiro Web Mind User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Dashboard Overview](#dashboard-overview)
4. [Chrome Extension](#chrome-extension)
5. [Voice Interface](#voice-interface)
6. [Automation & Smart Actions](#automation--smart-actions)
7. [Privacy & Data Management](#privacy--data-management)
8. [Tips & Best Practices](#tips--best-practices)

## Getting Started

### What is Kiro Web Mind?

Kiro Web Mind is an intelligent browser assistant that learns from your web browsing patterns and provides contextual AI assistance. It combines a Chrome extension with a web dashboard to offer:

- **Smart Summarization**: Automatically summarize articles and web content
- **Contextual Suggestions**: Get relevant actions based on what you're viewing
- **Voice Interface**: Interact with AI using natural speech
- **Automation**: Automate repetitive web tasks
- **Knowledge Graph**: Visualize your learned preferences and interests

### System Requirements

- **Browser**: Chrome 88+ (with Manifest V3 support)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Internet Connection**: Required for cloud features
- **Microphone**: Optional, for voice features

## Core Features

### 1. AI Sidebar

The AI Sidebar appears on web pages when relevant content is detected or when manually activated.

**How to use:**
1. Visit any webpage
2. The sidebar will automatically appear for articles and content pages
3. Click the Kiro icon in your browser toolbar to manually activate
4. Select text on any page to get contextual suggestions

**Available Actions:**
- **Summarize**: Get a concise summary of the current page
- **Explain**: Get explanations of complex topics
- **Research**: Find related articles and resources
- **Translate**: Translate selected text or entire pages
- **Save**: Save content to your knowledge base

### 2. Smart Summarization

Kiro can automatically summarize long articles, research papers, and web content.

**Features:**
- **Automatic Detection**: Recognizes article content automatically
- **Adjustable Length**: Choose brief, standard, or detailed summaries
- **Key Points**: Highlights the most important information
- **Save Summaries**: Store summaries for later reference

**How to use:**
1. Navigate to an article or long-form content
2. Click "Summarize" in the AI sidebar
3. Choose your preferred summary length
4. Review and save the summary if needed

### 3. Contextual Suggestions

Get intelligent suggestions based on your current browsing context.

**Types of Suggestions:**
- **Related Content**: Articles and resources on similar topics
- **Actions**: Relevant actions you can take (save, share, research)
- **Automation**: Opportunities to automate repetitive tasks
- **Learning**: Educational content to deepen your understanding

## Dashboard Overview

Access your dashboard at [https://kiro-web-mind.web.app](https://kiro-web-mind.web.app)

### Navigation

The dashboard includes several main sections:

#### 1. **Overview**
- Recent activity summary
- AI usage statistics
- Quick access to saved content

#### 2. **Knowledge Graph**
- Visual representation of your interests and topics
- Interactive nodes showing connections between concepts
- Click nodes to explore related content

#### 3. **Automation Hub**
- Create and manage automation rules
- View automation execution history
- Test and debug automation workflows

#### 4. **Activity Feed**
- Chronological view of your web activity
- Filter by date, website, or action type
- Search through your browsing history

#### 5. **Settings**
- Privacy and data controls
- AI preferences and customization
- Extension settings and permissions

### Knowledge Graph

The Knowledge Graph visualizes your learned preferences and interests.

**Understanding the Graph:**
- **Nodes**: Represent topics, websites, or concepts
- **Connections**: Show relationships between different topics
- **Node Size**: Indicates how much you've engaged with a topic
- **Connection Strength**: Thicker lines show stronger relationships

**Interacting with the Graph:**
- **Click Nodes**: View detailed information about a topic
- **Drag Nodes**: Reorganize the graph layout
- **Zoom**: Use mouse wheel to zoom in/out
- **Filter**: Use controls to show/hide specific types of content

## Chrome Extension

### Installation

1. Visit the Chrome Web Store
2. Search for "Kiro Web Mind"
3. Click "Add to Chrome"
4. Follow the installation prompts
5. Grant necessary permissions

### Permissions Explained

Kiro requests the following permissions:

- **Active Tab**: To analyze the current webpage content
- **Storage**: To save your preferences and temporary data
- **Host Permissions**: To inject the AI sidebar on websites
- **Scripting**: To provide contextual features

### Extension Features

#### AI Sidebar
- Appears automatically on relevant pages
- Provides contextual actions and suggestions
- Supports voice activation

#### Popup Interface
- Quick access to recent summaries
- Extension settings and preferences
- Account management

#### Context Menu Integration
- Right-click on selected text for AI actions
- Quick summarization and explanation options

## Voice Interface

### Setup

1. Grant microphone permissions when prompted
2. Test your microphone in Settings > Voice
3. Choose your preferred wake word (optional)

### Voice Commands

**Basic Commands:**
- "Summarize this page"
- "Explain [selected text]"
- "Find related articles"
- "Save this content"
- "Open dashboard"

**Advanced Commands:**
- "Create automation for this action"
- "Search my knowledge for [topic]"
- "What did I read about [topic] yesterday?"

### Voice Settings

- **Wake Word**: Enable hands-free activation
- **Language**: Choose your preferred language
- **Sensitivity**: Adjust microphone sensitivity
- **Feedback**: Enable/disable voice responses

## Automation & Smart Actions

### Creating Automation Rules

1. Navigate to Dashboard > Automation Hub
2. Click "Create New Rule"
3. Define trigger conditions:
   - Page type (article, form, search, etc.)
   - URL patterns
   - Time-based triggers
   - User actions
4. Set up actions:
   - Summarize content
   - Save to knowledge base
   - Send notifications
   - Fill forms automatically

### Example Automation Rules

**Auto-Summarize Articles:**
- **Trigger**: When visiting news or blog articles
- **Action**: Automatically generate and save summary

**Form Auto-Fill:**
- **Trigger**: When encountering contact forms
- **Action**: Fill in your standard information

**Research Assistant:**
- **Trigger**: When reading about specific topics
- **Action**: Suggest related articles and save to research folder

### Managing Automations

- **Enable/Disable**: Toggle rules on/off
- **Edit Rules**: Modify trigger conditions and actions
- **View History**: See when rules were executed
- **Debug Mode**: Test rules before activation

## Privacy & Data Management

### Data Collection

Kiro collects and processes:

- **Browsing Context**: URLs, page titles, and content (with your permission)
- **User Interactions**: Clicks, selections, and voice commands
- **Preferences**: Your settings and customizations
- **Usage Analytics**: Anonymous usage statistics

### Privacy Controls

**Data Collection Levels:**
- **Minimal**: Only essential functionality
- **Standard**: Balanced features and privacy (recommended)
- **Comprehensive**: Full feature set with maximum data collection

**Data Management:**
- **View Data**: See all data Kiro has collected about you
- **Export Data**: Download your data in JSON format
- **Delete Data**: Remove specific data or your entire profile
- **Data Retention**: Set how long data is stored

### Local vs Cloud Processing

- **Local Processing**: Text analysis and summarization using Gemini Nano
- **Cloud Processing**: Complex AI operations and data synchronization
- **Hybrid Approach**: Sensitive data processed locally when possible

## Tips & Best Practices

### Getting the Most from Kiro

1. **Regular Use**: The more you use Kiro, the better it learns your preferences
2. **Feedback**: Rate suggestions and summaries to improve accuracy
3. **Organize**: Use the knowledge graph to organize your interests
4. **Automate**: Set up automation rules for repetitive tasks
5. **Voice Commands**: Use voice for hands-free operation

### Performance Optimization

- **Clear Cache**: Regularly clear browser cache for optimal performance
- **Update Extension**: Keep the extension updated for latest features
- **Manage Data**: Periodically review and clean up stored data
- **Network**: Ensure stable internet connection for cloud features

### Troubleshooting Common Issues

**Extension Not Working:**
1. Check if extension is enabled in Chrome
2. Refresh the webpage
3. Check permissions in Chrome settings
4. Restart Chrome browser

**AI Sidebar Not Appearing:**
1. Verify the page contains readable content
2. Check if the website blocks extensions
3. Try manually activating via toolbar icon
4. Review extension permissions

**Voice Commands Not Working:**
1. Check microphone permissions
2. Test microphone in system settings
3. Verify voice is enabled in Kiro settings
4. Try speaking more clearly or adjusting sensitivity

**Slow Performance:**
1. Close unnecessary browser tabs
2. Check internet connection speed
3. Clear browser cache and cookies
4. Disable other extensions temporarily

### Getting Help

- **In-App Help**: Click the help icon in the dashboard
- **Documentation**: Visit our comprehensive docs
- **Community**: Join our user community for tips and tricks
- **Support**: Contact support for technical issues

### Keyboard Shortcuts

- **Ctrl/Cmd + Shift + K**: Toggle AI sidebar
- **Ctrl/Cmd + Shift + S**: Quick summarize
- **Ctrl/Cmd + Shift + V**: Activate voice mode
- **Ctrl/Cmd + Shift + D**: Open dashboard

---

## Need More Help?

- 📖 [API Documentation](./api/README.md)
- 🔧 [Developer Guide](./developer-guide.md)
- 🛠️ [Troubleshooting Guide](./troubleshooting.md)
- 🔒 [Privacy & Security](./privacy-security.md)

For additional support, visit our [support center](https://support.kiro-web-mind.com) or contact us at support@kiro-web-mind.com.
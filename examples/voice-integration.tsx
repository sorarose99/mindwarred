// Example: Voice Interface Integration

import React, { useState } from 'react'
import { VoiceAISidebar } from '../components/voice/VoiceAISidebar'
import { VoiceSettings, PageContext, ContextAnalysis } from '../lib/types/core'

export const VoiceIntegrationExample: React.FC = () => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    wakeWordEnabled: false,
    wakeWord: 'hey kiro',
    language: 'en-US',
    voiceSpeed: 1,
    voicePitch: 1,
    noiseReduction: true,
    confidenceThreshold: 0.7,
    continuousListening: false
  })

  const [pageContext] = useState<PageContext>({
    url: window.location.href,
    title: document.title,
    content: document.body.innerText,
    pageType: 'article',
    timestamp: Date.now()
  })

  const [contextAnalysis] = useState<ContextAnalysis>({
    pageType: 'article',
    mainTopic: 'Voice Interface Development',
    keyEntities: ['voice', 'speech', 'AI', 'interface'],
    userIntent: 'learning',
    confidence: 0.9,
    relevantSuggestions: [
      {
        id: 'suggest-1',
        title: 'Summarize Article',
        description: 'Get a summary of this voice interface guide',
        action: 'summarize',
        confidence: 0.9,
        category: 'productivity'
      }
    ],
    automationOpportunities: [
      {
        id: 'auto-1',
        type: 'content_organization',
        description: 'Auto-summarize technical articles',
        confidence: 0.8,
        estimatedTimeSaved: 300,
        complexity: 'medium'
      }
    ]
  })

  const handleAIAction = (action: string, data: any) => {
    console.log('AI Action:', action, data)
    
    switch (action) {
      case 'summarize':
        console.log('Summarizing content:', data)
        break
      case 'explain':
        console.log('Explaining topic:', data.topic)
        break
      case 'search':
        console.log('Searching for:', data.query)
        break
      case 'translate':
        console.log('Translating to:', data.targetLanguage)
        break
      case 'automation':
        console.log('Creating automation:', data)
        break
      case 'bookmark':
        console.log('Saving bookmark:', data)
        break
      case 'settings':
        console.log('Opening settings:', data.section)
        break
      case 'display':
        console.log('Displaying panel:', data.panel)
        break
      default:
        console.log('Unknown action:', action, data)
    }
  }

  return (
    <div className="voice-integration-example">
      <div className="example-header">
        <h1>Voice Interface Integration Example</h1>
        <p>This example demonstrates how to integrate Kiro's voice interface capabilities.</p>
      </div>

      <div className="example-content">
        <div className="example-section">
          <h2>Voice-Enabled AI Sidebar</h2>
          <p>The sidebar below includes full voice interface capabilities:</p>
          
          <div className="sidebar-container">
            <VoiceAISidebar
              settings={voiceSettings}
              onSettingsChange={setVoiceSettings}
              pageContext={pageContext}
              contextAnalysis={contextAnalysis}
              onAIAction={handleAIAction}
              className="example-sidebar"
            />
          </div>
        </div>

        <div className="example-section">
          <h2>Available Voice Commands</h2>
          <div className="command-examples">
            <div className="command-category">
              <h3>Content Commands</h3>
              <ul>
                <li>"Summarize this page" - Get a summary of current content</li>
                <li>"Explain [topic]" - Get detailed explanations</li>
                <li>"Translate to [language]" - Translate selected text</li>
              </ul>
            </div>
            
            <div className="command-category">
              <h3>Navigation Commands</h3>
              <ul>
                <li>"Go to dashboard" - Navigate to main dashboard</li>
                <li>"Open settings" - Access voice settings</li>
                <li>"Go back" - Navigate to previous page</li>
              </ul>
            </div>
            
            <div className="command-category">
              <h3>Utility Commands</h3>
              <ul>
                <li>"Search for [query]" - Search for information</li>
                <li>"Save this page" - Bookmark current page</li>
                <li>"Create automation" - Set up automation rules</li>
                <li>"Help" - Show available commands</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="example-section">
          <h2>Voice Settings</h2>
          <p>Current voice configuration:</p>
          <pre className="settings-display">
            {JSON.stringify(voiceSettings, null, 2)}
          </pre>
        </div>
      </div>

      <style jsx>{`
        .voice-integration-example {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .example-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .example-header h1 {
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .example-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .example-content {
          display: grid;
          gap: 2rem;
        }

        .example-section {
          background: #f9fafb;
          padding: 2rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .example-section h2 {
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .sidebar-container {
          background: #1f2937;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
        }

        .example-sidebar {
          max-width: 400px;
        }

        .command-examples {
          display: grid;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .command-category h3 {
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .command-category ul {
          list-style: none;
          padding: 0;
        }

        .command-category li {
          padding: 0.5rem;
          background: white;
          margin-bottom: 0.25rem;
          border-radius: 0.25rem;
          border-left: 3px solid #3b82f6;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9rem;
        }

        .settings-display {
          background: #1f2937;
          color: #e5e7eb;
          padding: 1rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .voice-integration-example {
            padding: 1rem;
          }
          
          .example-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
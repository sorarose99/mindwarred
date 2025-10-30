// Voice-enabled AI Sidebar Integration

import React, { useState, useEffect, useCallback } from 'react'
import { VoiceInterface } from './VoiceInterface'
import { VoiceFeedback, VoiceIndicator } from './VoiceFeedback'
import { useVoiceInterface } from '../../lib/hooks/use-voice-interface'
import { VoiceCommandProcessor } from '../../lib/voice/voice-command-processor'
import { 
  VoiceSettings, 
  VoiceCommand, 
  VoiceResponse, 
  PageContext,
  ContextAnalysis 
} from '../../lib/types/core'

interface VoiceAISidebarProps {
  settings: VoiceSettings
  onSettingsChange: (settings: VoiceSettings) => void
  pageContext?: PageContext
  contextAnalysis?: ContextAnalysis
  onAIAction?: (action: string, data: any) => void
  className?: string
}

export const VoiceAISidebar: React.FC<VoiceAISidebarProps> = ({
  settings,
  onSettingsChange,
  pageContext,
  contextAnalysis,
  onAIAction,
  className = ''
}) => {
  const [commandProcessor] = useState(() => new VoiceCommandProcessor({
    contextProvider: async () => pageContext || {
      url: window.location.href,
      title: document.title,
      content: document.body.innerText,
      pageType: 'general',
      timestamp: Date.now()
    }
  }))

  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([])

  const handleCommand = useCallback(async (command: VoiceCommand) => {
    // Add to recent commands
    setRecentCommands(prev => [command, ...prev.slice(0, 4)])
    
    // Process command
    try {
      const response = await commandProcessor.processCommand(command)
      
      // Execute actions
      if (response.actions) {
        for (const action of response.actions) {
          await executeVoiceAction(action.type, action.target, action.data)
        }
      }
    } catch (error) {
      console.error('Failed to process voice command:', error)
    }
  }, [commandProcessor])

  const executeVoiceAction = async (type: string, target: string, data: any) => {
    switch (type) {
      case 'execute':
        if (target === 'ai-summarize') {
          onAIAction?.('summarize', data)
        } else if (target === 'ai-explain') {
          onAIAction?.('explain', data)
        } else if (target === 'ai-translate') {
          onAIAction?.('translate', data)
        } else if (target === 'search') {
          onAIAction?.('search', data)
        } else if (target === 'automation-builder') {
          onAIAction?.('automation', data)
        }
        break
        
      case 'navigate':
        if (target === 'back') {
          window.history.back()
        } else if (target === 'forward') {
          window.history.forward()
        } else if (target === 'home') {
          window.location.href = '/'
        } else if (target === 'settings') {
          onAIAction?.('settings', data)
        } else if (target === 'url') {
          // Smart navigation - try to determine if it's a URL or search
          const destination = data.destination
          if (destination.includes('.') || destination.startsWith('http')) {
            window.location.href = destination.startsWith('http') ? destination : `https://${destination}`
          } else {
            onAIAction?.('search', { query: destination })
          }
        }
        break
        
      case 'save':
        if (target === 'bookmark') {
          onAIAction?.('bookmark', data)
        }
        break
        
      case 'display':
        onAIAction?.('display', { panel: target, data })
        break
    }
  }

  const {
    state,
    isSupported,
    startListening,
    stopListening,
    lastCommand,
    lastResponse
  } = useVoiceInterface({
    settings,
    onCommand: handleCommand,
    onError: (error) => console.error('Voice interface error:', error)
  })

  // Auto-show interface when listening starts
  useEffect(() => {
    if (state.isListening) {
      setShowVoiceInterface(true)
    }
  }, [state.isListening])

  // Update command processor context
  useEffect(() => {
    commandProcessor.updateOptions({
      contextProvider: async () => pageContext || {
        url: window.location.href,
        title: document.title,
        content: document.body.innerText,
        pageType: 'general',
        timestamp: Date.now()
      }
    })
  }, [pageContext, commandProcessor])

  if (!isSupported) {
    return (
      <div className={`voice-ai-sidebar voice-ai-sidebar--unsupported ${className}`}>
        <div className="voice-ai-sidebar__error">
          <span className="voice-ai-sidebar__error-icon">🎤</span>
          <p>Voice features not available in this browser</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`voice-ai-sidebar ${className}`}>
      {/* Voice Indicator (always visible when active) */}
      <VoiceIndicator 
        state={state} 
        className="voice-ai-sidebar__indicator"
      />

      {/* Voice Interface Toggle */}
      <div className="voice-ai-sidebar__header">
        <button
          onClick={() => setShowVoiceInterface(!showVoiceInterface)}
          className={`voice-ai-sidebar__toggle ${
            showVoiceInterface ? 'voice-ai-sidebar__toggle--active' : ''
          }`}
          title="Toggle voice interface"
        >
          <span className="voice-ai-sidebar__toggle-icon">🎤</span>
          <span className="voice-ai-sidebar__toggle-text">Voice</span>
          {(state.isListening || state.isProcessing || state.isSpeaking) && (
            <div className="voice-ai-sidebar__toggle-status"></div>
          )}
        </button>
      </div>

      {/* Expandable Voice Interface */}
      {showVoiceInterface && (
        <div className="voice-ai-sidebar__interface">
          <VoiceInterface
            settings={settings}
            onCommand={handleCommand}
            className="voice-ai-sidebar__voice-interface"
          />
          
          <VoiceFeedback
            state={state}
            lastCommand={lastCommand}
            lastResponse={lastResponse}
            className="voice-ai-sidebar__feedback"
          />
        </div>
      )}

      {/* Quick Voice Actions */}
      {!showVoiceInterface && (
        <div className="voice-ai-sidebar__quick-actions">
          <button
            onClick={startListening}
            className="voice-ai-sidebar__quick-action"
            disabled={state.isListening || state.isProcessing}
            title="Start voice input"
          >
            {state.isListening ? '🔴' : '🎤'}
          </button>
        </div>
      )}

      {/* Recent Commands */}
      {recentCommands.length > 0 && showVoiceInterface && (
        <div className="voice-ai-sidebar__recent">
          <div className="voice-ai-sidebar__recent-header">
            Recent Commands
          </div>
          <div className="voice-ai-sidebar__recent-list">
            {recentCommands.map((command, index) => (
              <div key={command.id} className="voice-ai-sidebar__recent-item">
                <div className="voice-ai-sidebar__recent-command">
                  "{command.command}"
                </div>
                <div className="voice-ai-sidebar__recent-intent">
                  {command.intent}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context-Aware Suggestions */}
      {contextAnalysis && showVoiceInterface && (
        <div className="voice-ai-sidebar__suggestions">
          <div className="voice-ai-sidebar__suggestions-header">
            Suggested Voice Commands
          </div>
          <div className="voice-ai-sidebar__suggestions-list">
            {contextAnalysis.pageType === 'article' && (
              <button
                onClick={() => handleCommand({
                  id: `suggestion_${Date.now()}`,
                  command: 'summarize this page',
                  intent: 'summarize',
                  confidence: 1,
                  timestamp: Date.now()
                })}
                className="voice-ai-sidebar__suggestion"
              >
                "Summarize this article"
              </button>
            )}
            
            {contextAnalysis.mainTopic && (
              <button
                onClick={() => handleCommand({
                  id: `suggestion_${Date.now()}`,
                  command: `explain ${contextAnalysis.mainTopic}`,
                  intent: 'explain',
                  parameters: { topic: contextAnalysis.mainTopic },
                  confidence: 1,
                  timestamp: Date.now()
                })}
                className="voice-ai-sidebar__suggestion"
              >
                "Explain {contextAnalysis.mainTopic}"
              </button>
            )}
            
            {contextAnalysis.automationOpportunities.length > 0 && (
              <button
                onClick={() => handleCommand({
                  id: `suggestion_${Date.now()}`,
                  command: 'create automation',
                  intent: 'automate',
                  confidence: 1,
                  timestamp: Date.now()
                })}
                className="voice-ai-sidebar__suggestion"
              >
                "Create automation"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
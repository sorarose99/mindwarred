// Voice Interface Component for AI Sidebar

import React, { useState, useEffect } from 'react'
import { useVoiceInterface, useVoiceFeedback } from '../../lib/hooks/use-voice-interface'
import { VoiceSettings, VoiceCommand, VoiceResponse } from '../../lib/types/core'

interface VoiceInterfaceProps {
  settings: VoiceSettings
  onCommand?: (command: VoiceCommand) => void
  onResponse?: (response: VoiceResponse) => void
  className?: string
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  settings,
  onCommand,
  onResponse,
  className = ''
}) => {
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  const {
    state,
    isSupported,
    startListening,
    stopListening,
    speak,
    lastResult,
    lastCommand,
    lastResponse
  } = useVoiceInterface({
    settings,
    onCommand,
    onResponse,
    onError: setError
  })

  const { sayWelcome } = useVoiceFeedback({ ...settings, enabled: settings.enabled })

  // Handle voice activation
  const handleVoiceToggle = async () => {
    if (state.isListening) {
      stopListening()
    } else {
      try {
        await startListening()
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start voice recognition')
      }
    }
  }

  // Handle wake word greeting
  useEffect(() => {
    if (settings.enabled && isSupported) {
      sayWelcome()
    }
  }, [settings.enabled, isSupported, sayWelcome])

  if (!isSupported) {
    return (
      <div className={`voice-interface voice-interface--unsupported ${className}`}>
        <div className="voice-interface__error">
          <span className="voice-interface__error-icon">🎤</span>
          <p>Voice interface not supported in this browser</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`voice-interface ${className}`}>
      {/* Voice Control Button */}
      <div className="voice-interface__controls">
        <button
          onClick={handleVoiceToggle}
          className={`voice-interface__button ${
            state.isListening ? 'voice-interface__button--listening' : ''
          } ${state.isProcessing ? 'voice-interface__button--processing' : ''}`}
          disabled={state.isProcessing}
          title={state.isListening ? 'Stop listening' : 'Start voice input'}
        >
          <div className="voice-interface__button-icon">
            {state.isListening ? (
              <VoiceWaveAnimation />
            ) : state.isProcessing ? (
              <ProcessingSpinner />
            ) : (
              <MicrophoneIcon />
            )}
          </div>
          <span className="voice-interface__button-text">
            {state.isListening 
              ? 'Listening...' 
              : state.isProcessing 
                ? 'Processing...' 
                : 'Voice Input'
            }
          </span>
        </button>

        {/* Transcript Toggle */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="voice-interface__transcript-toggle"
          title="Show/hide transcript"
        >
          📝
        </button>
      </div>

      {/* Status Indicators */}
      <div className="voice-interface__status">
        {state.isSpeaking && (
          <div className="voice-interface__status-item voice-interface__status-item--speaking">
            <SpeakerIcon />
            <span>Speaking...</span>
          </div>
        )}
        
        {settings.wakeWordEnabled && (
          <div className="voice-interface__status-item voice-interface__status-item--wake-word">
            <span>👂</span>
            <span>Wake word: "{settings.wakeWord}"</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {showTranscript && (
        <div className="voice-interface__transcript">
          {lastResult && (
            <div className="voice-interface__transcript-item">
              <div className="voice-interface__transcript-label">You said:</div>
              <div className="voice-interface__transcript-text">
                "{lastResult.transcript}"
                <span className="voice-interface__confidence">
                  ({Math.round(lastResult.confidence * 100)}% confidence)
                </span>
              </div>
            </div>
          )}
          
          {lastCommand && (
            <div className="voice-interface__transcript-item">
              <div className="voice-interface__transcript-label">Command:</div>
              <div className="voice-interface__transcript-text">
                {lastCommand.intent} - "{lastCommand.command}"
              </div>
            </div>
          )}
          
          {lastResponse && (
            <div className="voice-interface__transcript-item">
              <div className="voice-interface__transcript-label">Response:</div>
              <div className="voice-interface__transcript-text">
                {lastResponse.text}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="voice-interface__error">
          <span className="voice-interface__error-icon">⚠️</span>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="voice-interface__error-dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Commands Help */}
      <div className="voice-interface__help">
        <details>
          <summary>Voice Commands</summary>
          <ul>
            <li>"Summarize this page" - Get a summary of current content</li>
            <li>"Explain [topic]" - Get an explanation</li>
            <li>"Search for [query]" - Search for information</li>
            <li>"Help" - Show available commands</li>
            <li>"Settings" - Open voice settings</li>
          </ul>
        </details>
      </div>
    </div>
  )
}

// Animation Components
const VoiceWaveAnimation: React.FC = () => (
  <div className="voice-wave">
    <div className="voice-wave__bar"></div>
    <div className="voice-wave__bar"></div>
    <div className="voice-wave__bar"></div>
    <div className="voice-wave__bar"></div>
  </div>
)

const ProcessingSpinner: React.FC = () => (
  <div className="processing-spinner">
    <div className="processing-spinner__circle"></div>
  </div>
)

const MicrophoneIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
)

const SpeakerIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
)
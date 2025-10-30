// Visual Feedback Component for Voice Interactions

import React, { useState, useEffect } from 'react'
import { VoiceState, VoiceCommand, VoiceResponse } from '../../lib/types/core'

interface VoiceFeedbackProps {
  state: VoiceState
  lastCommand?: VoiceCommand | null
  lastResponse?: VoiceResponse | null
  className?: string
}

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({
  state,
  lastCommand,
  lastResponse,
  className = ''
}) => {
  const [showTranscript, setShowTranscript] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Trigger animation when state changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [state.isListening, state.isProcessing, state.isSpeaking])

  // Auto-show transcript when there's a command
  useEffect(() => {
    if (lastCommand) {
      setShowTranscript(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowTranscript(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastCommand])

  const getStatusIcon = () => {
    if (state.isListening) return '🎤'
    if (state.isProcessing) return '🧠'
    if (state.isSpeaking) return '🔊'
    return '💬'
  }

  const getStatusText = () => {
    if (state.isListening) return 'Listening...'
    if (state.isProcessing) return 'Processing...'
    if (state.isSpeaking) return 'Speaking...'
    return 'Ready'
  }

  const getStatusColor = () => {
    if (state.isListening) return 'text-red-400'
    if (state.isProcessing) return 'text-yellow-400'
    if (state.isSpeaking) return 'text-green-400'
    return 'text-blue-400'
  }

  return (
    <div className={`voice-feedback ${className}`}>
      {/* Main Status Display */}
      <div className={`voice-feedback__status ${getStatusColor()}`} key={animationKey}>
        <div className="voice-feedback__status-icon">
          {getStatusIcon()}
        </div>
        <div className="voice-feedback__status-text">
          {getStatusText()}
        </div>
        {state.isListening && <ListeningAnimation />}
        {state.isProcessing && <ProcessingAnimation />}
        {state.isSpeaking && <SpeakingAnimation />}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="voice-feedback__error">
          <span className="voice-feedback__error-icon">⚠️</span>
          <span className="voice-feedback__error-text">{state.error}</span>
        </div>
      )}

      {/* Command Transcript */}
      {showTranscript && (lastCommand || lastResponse) && (
        <div className="voice-feedback__transcript">
          <div className="voice-feedback__transcript-header">
            <span>Voice Interaction</span>
            <button
              onClick={() => setShowTranscript(false)}
              className="voice-feedback__transcript-close"
            >
              ✕
            </button>
          </div>
          
          {lastCommand && (
            <div className="voice-feedback__transcript-item">
              <div className="voice-feedback__transcript-label">You said:</div>
              <div className="voice-feedback__transcript-content">
                "{lastCommand.command}"
                <span className="voice-feedback__intent-badge">
                  {lastCommand.intent}
                </span>
              </div>
            </div>
          )}
          
          {lastResponse && (
            <div className="voice-feedback__transcript-item">
              <div className="voice-feedback__transcript-label">Kiro:</div>
              <div className="voice-feedback__transcript-content">
                {lastResponse.text}
              </div>
              {lastResponse.followUp && (
                <div className="voice-feedback__followup">
                  {lastResponse.followUp}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!state.isListening && !state.isProcessing && (
        <div className="voice-feedback__quick-actions">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="voice-feedback__quick-action"
            title="Show/hide transcript"
          >
            📝
          </button>
        </div>
      )}
    </div>
  )
}

// Animation Components
const ListeningAnimation: React.FC = () => (
  <div className="listening-animation">
    <div className="listening-animation__pulse"></div>
    <div className="listening-animation__wave">
      <div className="listening-animation__wave-bar"></div>
      <div className="listening-animation__wave-bar"></div>
      <div className="listening-animation__wave-bar"></div>
    </div>
  </div>
)

const ProcessingAnimation: React.FC = () => (
  <div className="processing-animation">
    <div className="processing-animation__dots">
      <div className="processing-animation__dot"></div>
      <div className="processing-animation__dot"></div>
      <div className="processing-animation__dot"></div>
    </div>
  </div>
)

const SpeakingAnimation: React.FC = () => (
  <div className="speaking-animation">
    <div className="speaking-animation__sound-waves">
      <div className="speaking-animation__wave"></div>
      <div className="speaking-animation__wave"></div>
      <div className="speaking-animation__wave"></div>
      <div className="speaking-animation__wave"></div>
    </div>
  </div>
)

// Compact Voice Indicator for minimal UI
export const VoiceIndicator: React.FC<{ state: VoiceState; className?: string }> = ({
  state,
  className = ''
}) => {
  if (!state.isListening && !state.isProcessing && !state.isSpeaking) {
    return null
  }

  return (
    <div className={`voice-indicator ${className}`}>
      <div className={`voice-indicator__dot ${
        state.isListening ? 'voice-indicator__dot--listening' :
        state.isProcessing ? 'voice-indicator__dot--processing' :
        state.isSpeaking ? 'voice-indicator__dot--speaking' : ''
      }`}>
        {state.isListening ? '🎤' : state.isProcessing ? '🧠' : '🔊'}
      </div>
    </div>
  )
}

// Voice Command Suggestions
export const VoiceCommandSuggestions: React.FC<{
  onSuggestionClick?: (command: string) => void
  className?: string
}> = ({ onSuggestionClick, className = '' }) => {
  const suggestions = [
    { text: "Summarize this page", command: "summarize this page" },
    { text: "Explain this topic", command: "explain this" },
    { text: "Search for information", command: "search for artificial intelligence" },
    { text: "Help me", command: "help" }
  ]

  return (
    <div className={`voice-suggestions ${className}`}>
      <div className="voice-suggestions__header">
        Try saying:
      </div>
      <div className="voice-suggestions__list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick?.(suggestion.command)}
            className="voice-suggestions__item"
          >
            "{suggestion.text}"
          </button>
        ))}
      </div>
    </div>
  )
}
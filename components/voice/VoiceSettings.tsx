// Voice Settings Component for Dashboard

import React, { useState, useEffect } from 'react'
import { VoiceSettings as VoiceSettingsType } from '../../lib/types/core'
import { useVoiceFeedback } from '../../lib/hooks/use-voice-interface'

interface VoiceSettingsProps {
  settings: VoiceSettingsType
  onSettingsChange: (settings: VoiceSettingsType) => void
  className?: string
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onSettingsChange,
  className = ''
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettingsType>(settings)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [testText, setTestText] = useState('Hello! This is a test of the voice interface.')

  const { speak, isSupported } = useVoiceFeedback(localSettings)

  // Load available voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices()
        setAvailableVoices(voices)
      }

      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleTestVoice = async () => {
    if (isSupported) {
      try {
        await speak(testText)
      } catch (error) {
        console.error('Voice test failed:', error)
      }
    }
  }

  const getLanguageOptions = () => {
    const languages = new Set<string>()
    availableVoices.forEach(voice => {
      languages.add(voice.lang)
    })
    return Array.from(languages).sort()
  }

  if (!isSupported) {
    return (
      <div className={`voice-settings voice-settings--unsupported ${className}`}>
        <div className="voice-settings__error">
          <h3>Voice Interface Not Supported</h3>
          <p>Your browser doesn't support the Web Speech API required for voice features.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`voice-settings ${className}`}>
      <div className="voice-settings__header">
        <h3>Voice Interface Settings</h3>
        <p>Configure how Kiro responds to and processes voice commands</p>
      </div>

      <div className="voice-settings__sections">
        {/* Basic Settings */}
        <section className="voice-settings__section">
          <h4>Basic Settings</h4>
          
          <div className="voice-settings__field">
            <label className="voice-settings__label">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="voice-settings__checkbox"
              />
              Enable Voice Interface
            </label>
            <p className="voice-settings__description">
              Allow voice input and audio responses
            </p>
          </div>

          <div className="voice-settings__field">
            <label className="voice-settings__label">
              Language
              <select
                value={localSettings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="voice-settings__select"
                disabled={!localSettings.enabled}
              >
                {getLanguageOptions().map(lang => (
                  <option key={lang} value={lang}>
                    {new Intl.DisplayNames([lang], { type: 'language' }).of(lang) || lang}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="voice-settings__field">
            <label className="voice-settings__label">
              <input
                type="checkbox"
                checked={localSettings.continuousListening}
                onChange={(e) => handleSettingChange('continuousListening', e.target.checked)}
                className="voice-settings__checkbox"
                disabled={!localSettings.enabled}
              />
              Continuous Listening
            </label>
            <p className="voice-settings__description">
              Keep listening for commands without manual activation
            </p>
          </div>
        </section>

        {/* Wake Word Settings */}
        <section className="voice-settings__section">
          <h4>Wake Word</h4>
          
          <div className="voice-settings__field">
            <label className="voice-settings__label">
              <input
                type="checkbox"
                checked={localSettings.wakeWordEnabled}
                onChange={(e) => handleSettingChange('wakeWordEnabled', e.target.checked)}
                className="voice-settings__checkbox"
                disabled={!localSettings.enabled}
              />
              Enable Wake Word Detection
            </label>
            <p className="voice-settings__description">
              Activate voice commands hands-free with a wake word
            </p>
          </div>

          {localSettings.wakeWordEnabled && (
            <div className="voice-settings__field">
              <label className="voice-settings__label">
                Wake Word
                <input
                  type="text"
                  value={localSettings.wakeWord}
                  onChange={(e) => handleSettingChange('wakeWord', e.target.value)}
                  className="voice-settings__input"
                  placeholder="hey kiro"
                  disabled={!localSettings.enabled}
                />
              </label>
              <p className="voice-settings__description">
                Say this phrase to activate voice commands
              </p>
            </div>
          )}
        </section>

        {/* Voice Quality Settings */}
        <section className="voice-settings__section">
          <h4>Voice Quality</h4>
          
          <div className="voice-settings__field">
            <label className="voice-settings__label">
              Speech Speed: {localSettings.voiceSpeed}x
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localSettings.voiceSpeed}
                onChange={(e) => handleSettingChange('voiceSpeed', parseFloat(e.target.value))}
                className="voice-settings__range"
                disabled={!localSettings.enabled}
              />
            </label>
          </div>

          <div className="voice-settings__field">
            <label className="voice-settings__label">
              Voice Pitch: {localSettings.voicePitch}x
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localSettings.voicePitch}
                onChange={(e) => handleSettingChange('voicePitch', parseFloat(e.target.value))}
                className="voice-settings__range"
                disabled={!localSettings.enabled}
              />
            </label>
          </div>

          <div className="voice-settings__field">
            <label className="voice-settings__label">
              <input
                type="checkbox"
                checked={localSettings.noiseReduction}
                onChange={(e) => handleSettingChange('noiseReduction', e.target.checked)}
                className="voice-settings__checkbox"
                disabled={!localSettings.enabled}
              />
              Noise Reduction
            </label>
            <p className="voice-settings__description">
              Filter background noise for better recognition
            </p>
          </div>
        </section>

        {/* Recognition Settings */}
        <section className="voice-settings__section">
          <h4>Recognition Settings</h4>
          
          <div className="voice-settings__field">
            <label className="voice-settings__label">
              Confidence Threshold: {Math.round(localSettings.confidenceThreshold * 100)}%
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={localSettings.confidenceThreshold}
                onChange={(e) => handleSettingChange('confidenceThreshold', parseFloat(e.target.value))}
                className="voice-settings__range"
                disabled={!localSettings.enabled}
              />
            </label>
            <p className="voice-settings__description">
              Minimum confidence required to process voice commands
            </p>
          </div>
        </section>

        {/* Test Section */}
        <section className="voice-settings__section">
          <h4>Test Voice</h4>
          
          <div className="voice-settings__field">
            <label className="voice-settings__label">
              Test Text
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="voice-settings__textarea"
                rows={2}
                disabled={!localSettings.enabled}
              />
            </label>
          </div>

          <button
            onClick={handleTestVoice}
            className="voice-settings__test-button"
            disabled={!localSettings.enabled}
          >
            🔊 Test Voice
          </button>
        </section>
      </div>

      {/* Voice Commands Reference */}
      <section className="voice-settings__section voice-settings__section--reference">
        <h4>Available Voice Commands</h4>
        <div className="voice-settings__commands">
          <div className="voice-settings__command">
            <strong>"Summarize this page"</strong>
            <span>Get a summary of the current webpage</span>
          </div>
          <div className="voice-settings__command">
            <strong>"Explain [topic]"</strong>
            <span>Get an explanation of a specific topic</span>
          </div>
          <div className="voice-settings__command">
            <strong>"Search for [query]"</strong>
            <span>Search for information</span>
          </div>
          <div className="voice-settings__command">
            <strong>"Navigate to [page]"</strong>
            <span>Navigate to a different page or section</span>
          </div>
          <div className="voice-settings__command">
            <strong>"Help"</strong>
            <span>Show available commands and help</span>
          </div>
          <div className="voice-settings__command">
            <strong>"Settings"</strong>
            <span>Open voice settings</span>
          </div>
        </div>
      </section>
    </div>
  )
}
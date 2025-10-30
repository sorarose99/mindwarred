// React hook for Voice Interface integration

import { useState, useEffect, useCallback, useRef } from 'react'
import { VoiceInterface } from '../voice/voice-interface'
import { 
  VoiceSettings, 
  VoiceState, 
  VoiceCommand, 
  VoiceResponse,
  SpeechRecognitionResult 
} from '../types/core'

interface UseVoiceInterfaceOptions {
  settings: VoiceSettings
  onCommand?: (command: VoiceCommand) => void
  onResponse?: (response: VoiceResponse) => void
  onError?: (error: string) => void
}

interface UseVoiceInterfaceReturn {
  // State
  state: VoiceState
  isSupported: boolean
  
  // Actions
  startListening: () => Promise<void>
  stopListening: () => void
  speak: (text: string) => Promise<void>
  updateSettings: (settings: Partial<VoiceSettings>) => void
  
  // Events
  lastResult: SpeechRecognitionResult | null
  lastCommand: VoiceCommand | null
  lastResponse: VoiceResponse | null
}

export function useVoiceInterface(options: UseVoiceInterfaceOptions): UseVoiceInterfaceReturn {
  const voiceInterfaceRef = useRef<VoiceInterface | null>(null)
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false
  })
  const [isSupported, setIsSupported] = useState(false)
  const [lastResult, setLastResult] = useState<SpeechRecognitionResult | null>(null)
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null)

  // Initialize voice interface
  useEffect(() => {
    const voiceInterface = new VoiceInterface(options.settings)
    voiceInterfaceRef.current = voiceInterface
    
    setIsSupported(voiceInterface.isSupported())
    setState(voiceInterface.getState())

    // Set up event listeners
    const handleStateChange = (newState: VoiceState) => {
      setState(newState)
    }

    const handleSpeechResult = (result: SpeechRecognitionResult) => {
      setLastResult(result)
    }

    const handleCommandRecognized = (command: VoiceCommand) => {
      setLastCommand(command)
      options.onCommand?.(command)
    }

    const handleCommandExecuted = ({ command, response }: { command: VoiceCommand, response: VoiceResponse }) => {
      setLastResponse(response)
      options.onResponse?.(response)
    }

    const handleError = (error: string) => {
      options.onError?.(error)
    }

    voiceInterface.on('state-changed', handleStateChange)
    voiceInterface.on('speech-result', handleSpeechResult)
    voiceInterface.on('command-recognized', handleCommandRecognized)
    voiceInterface.on('command-executed', handleCommandExecuted)
    voiceInterface.on('error', handleError)

    return () => {
      voiceInterface.off('state-changed', handleStateChange)
      voiceInterface.off('speech-result', handleSpeechResult)
      voiceInterface.off('command-recognized', handleCommandRecognized)
      voiceInterface.off('command-executed', handleCommandExecuted)
      voiceInterface.off('error', handleError)
      voiceInterface.destroy()
    }
  }, [])

  // Update settings when they change
  useEffect(() => {
    if (voiceInterfaceRef.current) {
      voiceInterfaceRef.current.updateSettings(options.settings)
    }
  }, [options.settings])

  const startListening = useCallback(async () => {
    if (voiceInterfaceRef.current) {
      try {
        await voiceInterfaceRef.current.startListening()
      } catch (error) {
        options.onError?.(error instanceof Error ? error.message : String(error))
      }
    }
  }, [options.onError])

  const stopListening = useCallback(() => {
    if (voiceInterfaceRef.current) {
      voiceInterfaceRef.current.stopListening()
    }
  }, [])

  const speak = useCallback(async (text: string) => {
    if (voiceInterfaceRef.current) {
      try {
        await voiceInterfaceRef.current.speak(text)
      } catch (error) {
        options.onError?.(error instanceof Error ? error.message : String(error))
      }
    }
  }, [options.onError])

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    if (voiceInterfaceRef.current) {
      voiceInterfaceRef.current.updateSettings(newSettings)
    }
  }, [])

  return {
    state,
    isSupported,
    startListening,
    stopListening,
    speak,
    updateSettings,
    lastResult,
    lastCommand,
    lastResponse
  }
}

// Utility hook for simple voice commands
export function useVoiceCommands(
  commands: Record<string, () => void>,
  settings?: Partial<VoiceSettings>
) {
  const defaultSettings: VoiceSettings = {
    enabled: true,
    wakeWordEnabled: false,
    wakeWord: 'hey kiro',
    language: 'en-US',
    voiceSpeed: 1,
    voicePitch: 1,
    noiseReduction: true,
    confidenceThreshold: 0.7,
    continuousListening: false,
    ...settings
  }

  const handleCommand = useCallback((command: VoiceCommand) => {
    const normalizedCommand = command.command.toLowerCase().trim()
    
    // Find matching command
    for (const [pattern, handler] of Object.entries(commands)) {
      if (normalizedCommand.includes(pattern.toLowerCase())) {
        handler()
        break
      }
    }
  }, [commands])

  return useVoiceInterface({
    settings: defaultSettings,
    onCommand: handleCommand
  })
}

// Hook for voice feedback
export function useVoiceFeedback(settings?: Partial<VoiceSettings>) {
  const defaultSettings: VoiceSettings = {
    enabled: true,
    wakeWordEnabled: false,
    wakeWord: 'hey kiro',
    language: 'en-US',
    voiceSpeed: 1,
    voicePitch: 1,
    noiseReduction: true,
    confidenceThreshold: 0.7,
    continuousListening: false,
    ...settings
  }

  const { speak, state, isSupported } = useVoiceInterface({
    settings: defaultSettings
  })

  const saySuccess = useCallback((message?: string) => {
    speak(message || 'Done!')
  }, [speak])

  const sayError = useCallback((message?: string) => {
    speak(message || 'Sorry, something went wrong.')
  }, [speak])

  const sayWelcome = useCallback(() => {
    speak('Hello! I\'m Kiro, your AI assistant. How can I help you today?')
  }, [speak])

  const sayThinking = useCallback(() => {
    speak('Let me think about that...')
  }, [speak])

  return {
    speak,
    saySuccess,
    sayError,
    sayWelcome,
    sayThinking,
    isSpeaking: state.isSpeaking,
    isSupported
  }
}
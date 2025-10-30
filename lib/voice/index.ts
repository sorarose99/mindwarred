// Voice Interface Module Exports

export { VoiceInterface } from './voice-interface'
export { VoiceCommandProcessor } from './voice-command-processor'

// Re-export types
export type {
  VoiceSettings,
  VoiceCommand,
  VoiceResponse,
  VoiceState,
  VoiceIntent,
  VoiceAction,
  SpeechRecognitionResult,
  SpeechAlternative
} from '../types/core'
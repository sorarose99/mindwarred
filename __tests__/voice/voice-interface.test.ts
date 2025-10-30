// Voice Interface Tests

import { VoiceInterface } from '../../lib/voice/voice-interface'
import { VoiceSettings, VoiceState } from '../../lib/types/core'

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null
}

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn(() => []),
  onvoiceschanged: null
}

// Mock global objects
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition)
})

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis
})

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: jest.fn((text) => ({
    text,
    rate: 1,
    pitch: 1,
    lang: 'en-US',
    onstart: null,
    onend: null,
    onerror: null
  }))
})

describe('VoiceInterface', () => {
  let voiceInterface: VoiceInterface
  let defaultSettings: VoiceSettings

  beforeEach(() => {
    defaultSettings = {
      enabled: true,
      wakeWordEnabled: false,
      wakeWord: 'hey kiro',
      language: 'en-US',
      voiceSpeed: 1,
      voicePitch: 1,
      noiseReduction: true,
      confidenceThreshold: 0.7,
      continuousListening: false
    }

    voiceInterface = new VoiceInterface(defaultSettings)
    jest.clearAllMocks()
  })

  afterEach(() => {
    voiceInterface.destroy()
  })

  describe('Initialization', () => {
    test('should initialize with correct settings', () => {
      const state = voiceInterface.getState()
      expect(state.isListening).toBe(false)
      expect(state.isProcessing).toBe(false)
      expect(state.isSpeaking).toBe(false)
    })

    test('should detect browser support', () => {
      expect(voiceInterface.isSupported()).toBe(true)
    })

    test('should handle unsupported browsers gracefully', () => {
      // Temporarily remove speech API
      const originalSpeechRecognition = window.SpeechRecognition
      delete (window as any).SpeechRecognition
      
      const unsupportedInterface = new VoiceInterface(defaultSettings)
      expect(unsupportedInterface.isSupported()).toBe(false)
      
      // Restore
      window.SpeechRecognition = originalSpeechRecognition
      unsupportedInterface.destroy()
    })
  })

  describe('Speech Recognition', () => {
    test('should start listening successfully', async () => {
      await voiceInterface.startListening()
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
    })

    test('should stop listening', () => {
      voiceInterface.stopListening()
      expect(mockSpeechRecognition.stop).toHaveBeenCalled()
    })

    test('should handle recognition results', () => {
      const mockResult = {
        results: [{
          0: { transcript: 'hello world', confidence: 0.9 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      }

      let receivedResult: any = null
      voiceInterface.on('speech-result', (result) => {
        receivedResult = result
      })

      // Simulate recognition result
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockResult as any)
      }

      expect(receivedResult).toMatchObject({
        transcript: 'hello world',
        confidence: 0.9,
        isFinal: true
      })
    })

    test('should handle recognition errors', () => {
      let receivedError: string | null = null
      voiceInterface.on('error', (error) => {
        receivedError = error
      })

      // Simulate recognition error
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror({ error: 'network' } as any)
      }

      expect(receivedError).toBe('network')
    })

    test('should respect confidence threshold', () => {
      const lowConfidenceResult = {
        results: [{
          0: { transcript: 'unclear speech', confidence: 0.3 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      }

      let commandProcessed = false
      voiceInterface.on('command-recognized', () => {
        commandProcessed = true
      })

      // Simulate low confidence result
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(lowConfidenceResult as any)
      }

      expect(commandProcessed).toBe(false)
    })
  })

  describe('Speech Synthesis', () => {
    test('should speak text successfully', async () => {
      const utterancePromise = voiceInterface.speak('Hello world')
      
      // Simulate successful speech
      const utteranceCall = (window.SpeechSynthesisUtterance as jest.Mock).mock.calls[0]
      const utterance = utteranceCall ? { 
        ...utteranceCall, 
        onend: null,
        onerror: null 
      } : null
      
      if (utterance && utterance.onend) {
        utterance.onend()
      }

      await expect(utterancePromise).resolves.toBeUndefined()
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
    })

    test('should handle speech synthesis errors', async () => {
      const utterancePromise = voiceInterface.speak('Hello world')
      
      // Simulate speech error
      const utteranceCall = (window.SpeechSynthesisUtterance as jest.Mock).mock.calls[0]
      const utterance = utteranceCall ? { 
        ...utteranceCall, 
        onend: null,
        onerror: null 
      } : null
      
      if (utterance && utterance.onerror) {
        utterance.onerror({ error: 'synthesis-failed' } as any)
      }

      await expect(utterancePromise).rejects.toThrow('synthesis-failed')
    })

    test('should apply voice settings to speech', async () => {
      const customSettings = {
        ...defaultSettings,
        voiceSpeed: 1.5,
        voicePitch: 0.8,
        language: 'es-ES'
      }

      voiceInterface.updateSettings(customSettings)
      await voiceInterface.speak('Hola mundo')

      const utteranceCall = (window.SpeechSynthesisUtterance as jest.Mock).mock.calls[0]
      expect(utteranceCall).toBeDefined()
    })
  })

  describe('Settings Management', () => {
    test('should update settings correctly', () => {
      const newSettings = {
        voiceSpeed: 1.2,
        confidenceThreshold: 0.8,
        continuousListening: true
      }

      voiceInterface.updateSettings(newSettings)
      
      // Settings should be applied to recognition
      expect(mockSpeechRecognition.continuous).toBe(true)
    })

    test('should emit state changes', () => {
      let stateChanges = 0
      voiceInterface.on('state-changed', () => {
        stateChanges++
      })

      // Simulate state change
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart()
      }

      expect(stateChanges).toBeGreaterThan(0)
    })
  })

  describe('Command Processing', () => {
    test('should process voice commands', () => {
      let processedCommand: any = null
      voiceInterface.on('command-recognized', (command) => {
        processedCommand = command
      })

      const highConfidenceResult = {
        results: [{
          0: { transcript: 'summarize this page', confidence: 0.9 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      }

      // Simulate recognition result
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(highConfidenceResult as any)
      }

      expect(processedCommand).toMatchObject({
        command: 'summarize this page',
        intent: 'summarize'
      })
    })

    test('should handle unknown commands gracefully', () => {
      let executedCommand: any = null
      voiceInterface.on('command-executed', ({ response }) => {
        executedCommand = response
      })

      const unknownCommandResult = {
        results: [{
          0: { transcript: 'do something impossible', confidence: 0.9 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      }

      // Simulate recognition result
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(unknownCommandResult as any)
      }

      expect(executedCommand?.text).toContain("didn't understand")
    })
  })

  describe('Performance', () => {
    test('should start listening within acceptable time', async () => {
      const startTime = performance.now()
      await voiceInterface.startListening()
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should start within 100ms
    })

    test('should handle rapid state changes', () => {
      // Simulate rapid start/stop cycles
      for (let i = 0; i < 10; i++) {
        voiceInterface.startListening()
        voiceInterface.stopListening()
      }
      
      const state = voiceInterface.getState()
      expect(state.isListening).toBe(false)
    })

    test('should clean up resources properly', () => {
      voiceInterface.destroy()
      
      // Should not throw errors after destruction
      expect(() => {
        voiceInterface.startListening()
        voiceInterface.stopListening()
        voiceInterface.speak('test')
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    test('should handle missing speech recognition gracefully', async () => {
      // Create interface without speech recognition
      delete (window as any).SpeechRecognition
      delete (window as any).webkitSpeechRecognition
      
      const limitedInterface = new VoiceInterface(defaultSettings)
      
      await expect(limitedInterface.startListening()).rejects.toThrow('Speech recognition not supported')
      
      limitedInterface.destroy()
    })

    test('should handle missing speech synthesis gracefully', async () => {
      // Create interface without speech synthesis
      delete (window as any).speechSynthesis
      
      const limitedInterface = new VoiceInterface(defaultSettings)
      
      await expect(limitedInterface.speak('test')).rejects.toThrow('Speech synthesis not supported')
      
      limitedInterface.destroy()
    })
  })
})
// Voice Interface Performance and Accuracy Tests

import { VoiceInterface } from '../../lib/voice/voice-interface'
import { VoiceCommandProcessor } from '../../lib/voice/voice-command-processor'
import { VoiceSettings, VoiceCommand, PageContext } from '../../lib/types/core'

// Mock performance API if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  } as any
}

// Mock Web Speech API for performance tests
const createMockSpeechAPI = () => {
  const mockRecognition = {
    start: jest.fn().mockImplementation(() => {
      // Simulate async start with small delay
      setTimeout(() => {
        if (mockRecognition.onstart) mockRecognition.onstart()
      }, 10)
    }),
    stop: jest.fn(),
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    onstart: null,
    onresult: null,
    onerror: null,
    onend: null
  }

  const mockSynthesis = {
    speak: jest.fn().mockImplementation((utterance) => {
      // Simulate async speech with small delay
      setTimeout(() => {
        if (utterance.onstart) utterance.onstart()
        setTimeout(() => {
          if (utterance.onend) utterance.onend()
        }, 50)
      }, 10)
    }),
    cancel: jest.fn(),
    getVoices: jest.fn(() => []),
    onvoiceschanged: null
  }

  return { mockRecognition, mockSynthesis }
}

describe('Voice Interface Performance Tests', () => {
  let voiceInterface: VoiceInterface
  let processor: VoiceCommandProcessor
  let defaultSettings: VoiceSettings
  let mockPageContext: PageContext

  beforeEach(() => {
    const { mockRecognition, mockSynthesis } = createMockSpeechAPI()
    
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      value: jest.fn(() => mockRecognition)
    })

    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSynthesis
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

    mockPageContext = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content for performance testing',
      pageType: 'article',
      timestamp: Date.now()
    }

    voiceInterface = new VoiceInterface(defaultSettings)
    processor = new VoiceCommandProcessor({
      contextProvider: async () => mockPageContext
    })

    jest.clearAllMocks()
  })

  afterEach(() => {
    voiceInterface.destroy()
  })

  describe('Initialization Performance', () => {
    test('should initialize within 100ms', () => {
      const startTime = performance.now()
      const testInterface = new VoiceInterface(defaultSettings)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
      testInterface.destroy()
    })

    test('should handle multiple rapid initializations', () => {
      const startTime = performance.now()
      const interfaces = Array.from({ length: 10 }, () => new VoiceInterface(defaultSettings))
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500)
      interfaces.forEach(iface => iface.destroy())
    })
  })

  describe('Speech Recognition Performance', () => {
    test('should start listening within 500ms (requirement 5.1)', async () => {
      const startTime = performance.now()
      await voiceInterface.startListening()
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500)
    })

    test('should handle rapid start/stop cycles', async () => {
      const cycles = 20
      const startTime = performance.now()

      for (let i = 0; i < cycles; i++) {
        await voiceInterface.startListening()
        voiceInterface.stopListening()
      }

      const endTime = performance.now()
      const avgTimePerCycle = (endTime - startTime) / cycles

      expect(avgTimePerCycle).toBeLessThan(50) // Average 50ms per cycle
    })

    test('should maintain performance under load', async () => {
      const iterations = 100
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        await voiceInterface.startListening()
        voiceInterface.stopListening()
        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)

      expect(avgTime).toBeLessThan(30)
      expect(maxTime).toBeLessThan(100)
    })
  })

  describe('Speech Synthesis Performance', () => {
    test('should start speaking quickly', async () => {
      const startTime = performance.now()
      const speakPromise = voiceInterface.speak('Test message')
      
      // Wait for speech to start (not complete)
      await new Promise(resolve => setTimeout(resolve, 20))
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
      
      // Clean up
      await speakPromise.catch(() => {}) // Ignore potential errors
    })

    test('should handle multiple concurrent speech requests', async () => {
      const messages = Array.from({ length: 5 }, (_, i) => `Message ${i + 1}`)
      
      const startTime = performance.now()
      const promises = messages.map(msg => voiceInterface.speak(msg))
      await Promise.allSettled(promises)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('Command Processing Performance', () => {
    test('should process commands within 100ms', async () => {
      const command: VoiceCommand = {
        id: 'perf-test',
        command: 'summarize this page',
        intent: 'summarize',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const startTime = performance.now()
      await processor.processCommand(command)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })

    test('should maintain performance with complex commands', async () => {
      const complexCommands = [
        'explain artificial intelligence and machine learning algorithms',
        'search for comprehensive tutorials about React hooks and state management',
        'translate this entire page to Spanish and save it as a bookmark',
        'create an automation rule for summarizing articles about technology'
      ]

      const times: number[] = []

      for (const commandText of complexCommands) {
        const command: VoiceCommand = {
          id: `complex-${Date.now()}`,
          command: commandText,
          intent: 'unknown',
          confidence: 0.9,
          timestamp: Date.now()
        }

        const startTime = performance.now()
        await processor.processCommand(command)
        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      expect(avgTime).toBeLessThan(150)
    })

    test('should handle high-frequency command processing', async () => {
      const commandCount = 50
      const commands = Array.from({ length: commandCount }, (_, i) => ({
        id: `batch-${i}`,
        command: `help command ${i}`,
        intent: 'help' as const,
        confidence: 0.9,
        timestamp: Date.now()
      }))

      const startTime = performance.now()
      await Promise.all(commands.map(cmd => processor.processCommand(cmd)))
      const endTime = performance.now()

      const avgTimePerCommand = (endTime - startTime) / commandCount
      expect(avgTimePerCommand).toBeLessThan(20)
    })
  })

  describe('Memory Usage', () => {
    test('should not leak memory with repeated operations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await voiceInterface.startListening()
        voiceInterface.stopListening()
        await voiceInterface.speak(`Test ${i}`)
        
        const command: VoiceCommand = {
          id: `mem-test-${i}`,
          command: 'help',
          intent: 'help',
          confidence: 0.9,
          timestamp: Date.now()
        }
        await processor.processCommand(command)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    test('should clean up event listeners properly', () => {
      const interface1 = new VoiceInterface(defaultSettings)
      const interface2 = new VoiceInterface(defaultSettings)
      const interface3 = new VoiceInterface(defaultSettings)

      // Add many listeners
      for (let i = 0; i < 10; i++) {
        interface1.on('state-changed', () => {})
        interface2.on('speech-result', () => {})
        interface3.on('command-recognized', () => {})
      }

      // Destroy interfaces
      interface1.destroy()
      interface2.destroy()
      interface3.destroy()

      // Should not throw or cause memory leaks
      expect(() => {
        interface1.startListening()
        interface2.speak('test')
      }).not.toThrow()
    })
  })

  describe('Accuracy Simulation', () => {
    test('should handle various confidence levels appropriately', async () => {
      const confidenceLevels = [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.99]
      const results: boolean[] = []

      for (const confidence of confidenceLevels) {
        const command: VoiceCommand = {
          id: `confidence-${confidence}`,
          command: 'summarize this page',
          intent: 'summarize',
          confidence,
          timestamp: Date.now()
        }

        const response = await processor.processCommand(command)
        results.push(response.actions !== undefined && response.actions.length > 0)
      }

      // Higher confidence should generally lead to more successful processing
      const highConfidenceSuccess = results.slice(-3).every(Boolean) // Last 3 (0.9, 0.95, 0.99)
      expect(highConfidenceSuccess).toBe(true)
    })

    test('should maintain 95% accuracy for common commands (requirement 5.2)', async () => {
      const commonCommands = [
        'summarize this page',
        'explain this topic',
        'search for information',
        'help me',
        'go back',
        'save this page',
        'translate to Spanish',
        'create automation',
        'open settings'
      ]

      let successfulProcessing = 0
      const totalCommands = commonCommands.length

      for (const commandText of commonCommands) {
        const command: VoiceCommand = {
          id: `accuracy-${Date.now()}`,
          command: commandText,
          intent: 'unknown',
          confidence: 0.9,
          timestamp: Date.now()
        }

        try {
          const response = await processor.processCommand(command)
          if (response.actions && response.actions.length > 0) {
            successfulProcessing++
          }
        } catch (error) {
          // Command failed to process
        }
      }

      const accuracy = (successfulProcessing / totalCommands) * 100
      expect(accuracy).toBeGreaterThanOrEqual(95)
    })
  })

  describe('Stress Testing', () => {
    test('should handle sustained high-frequency operations', async () => {
      const duration = 1000 // 1 second
      const startTime = performance.now()
      let operationCount = 0

      while (performance.now() - startTime < duration) {
        await voiceInterface.startListening()
        voiceInterface.stopListening()
        operationCount++
      }

      // Should handle at least 10 operations per second
      expect(operationCount).toBeGreaterThan(10)
    })

    test('should recover from errors gracefully', async () => {
      // Simulate various error conditions
      const errorConditions = [
        () => voiceInterface.speak(''), // Empty text
        () => processor.processCommand({
          id: 'error-test',
          command: '',
          intent: 'unknown',
          confidence: 0,
          timestamp: Date.now()
        }), // Invalid command
      ]

      for (const errorCondition of errorConditions) {
        try {
          await errorCondition()
        } catch (error) {
          // Errors are expected, but interface should still work
        }

        // Interface should still be functional after errors
        const state = voiceInterface.getState()
        expect(state).toBeDefined()
        expect(voiceInterface.isSupported()).toBe(true)
      }
    })
  })
})
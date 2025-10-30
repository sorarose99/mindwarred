// Voice Command Processor Tests

import { VoiceCommandProcessor } from '../../lib/voice/voice-command-processor'
import { VoiceCommand, PageContext, VoiceIntent } from '../../lib/types/core'

describe('VoiceCommandProcessor', () => {
  let processor: VoiceCommandProcessor
  let mockPageContext: PageContext

  beforeEach(() => {
    mockPageContext = {
      url: 'https://example.com/article',
      title: 'Test Article',
      content: 'This is a test article about artificial intelligence and machine learning.',
      selectedText: 'artificial intelligence',
      pageType: 'article',
      timestamp: Date.now()
    }

    processor = new VoiceCommandProcessor({
      contextProvider: async () => mockPageContext
    })
  })

  describe('Intent Recognition', () => {
    test('should recognize summarize commands', async () => {
      const commands = [
        'summarize this page',
        'give me a summary',
        'what is this about',
        'brief overview'
      ]

      for (const commandText of commands) {
        const command: VoiceCommand = {
          id: 'test',
          command: commandText,
          intent: 'unknown',
          confidence: 0.9,
          timestamp: Date.now()
        }

        const response = await processor.processCommand(command)
        expect(response.text).toContain('summarize')
      }
    })

    test('should recognize explain commands', async () => {
      const commands = [
        'explain artificial intelligence',
        'what is machine learning',
        'tell me about neural networks',
        'define deep learning'
      ]

      for (const commandText of commands) {
        const command: VoiceCommand = {
          id: 'test',
          command: commandText,
          intent: 'unknown',
          confidence: 0.9,
          timestamp: Date.now()
        }

        const response = await processor.processCommand(command)
        expect(response.text).toContain('explain')
      }
    })

    test('should recognize search commands', async () => {
      const commands = [
        'search for python tutorials',
        'find information about React',
        'look up JavaScript frameworks',
        'what is TypeScript'
      ]

      for (const commandText of commands) {
        const command: VoiceCommand = {
          id: 'test',
          command: commandText,
          intent: 'unknown',
          confidence: 0.9,
          timestamp: Date.now()
        }

        const response = await processor.processCommand(command)
        expect(response.text).toContain('Searching')
      }
    })

    test('should recognize navigation commands', async () => {
      const commands = [
        'go to dashboard',
        'navigate to settings',
        'take me home',
        'go back'
      ]

      for (const commandText of commands) {
        const command: VoiceCommand = {
          id: 'test',
          command: commandText,
          intent: 'unknown',
          confidence: 0.9,
          timestamp: Date.now()
        }

        const response = await processor.processCommand(command)
        expect(response.actions?.some(action => action.type === 'navigate')).toBe(true)
      }
    })
  })

  describe('Parameter Extraction', () => {
    test('should extract search queries', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'search for machine learning algorithms',
        intent: 'search',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.data?.query).toBe('machine learning algorithms')
    })

    test('should extract explanation topics', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'explain neural networks',
        intent: 'explain',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.data?.topic).toBe('neural networks')
    })

    test('should extract navigation destinations', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'go to settings page',
        intent: 'navigate',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.data?.destination).toBe('settings page')
    })

    test('should handle translation parameters', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'translate this to Spanish',
        intent: 'translate',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.data?.targetLanguage).toBe('Spanish')
      expect(response.actions?.[0]?.data?.text).toBe(mockPageContext.selectedText)
    })
  })

  describe('Context Awareness', () => {
    test('should use page context for summarization', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'summarize this page',
        intent: 'summarize',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.data?.content).toBe(mockPageContext.content)
      expect(response.actions?.[0]?.data?.url).toBe(mockPageContext.url)
    })

    test('should handle missing context gracefully', async () => {
      const processorWithoutContext = new VoiceCommandProcessor()
      
      const command: VoiceCommand = {
        id: 'test',
        command: 'summarize this page',
        intent: 'summarize',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processorWithoutContext.processCommand(command)
      expect(response.text).toContain('need access')
    })

    test('should use selected text for translation', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'translate to French',
        intent: 'translate',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.data?.text).toBe(mockPageContext.selectedText)
    })
  })

  describe('Response Generation', () => {
    test('should generate appropriate actions for summarize', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'summarize this page',
        intent: 'summarize',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions).toHaveLength(2)
      expect(response.actions?.[0]?.type).toBe('execute')
      expect(response.actions?.[0]?.target).toBe('ai-summarize')
      expect(response.actions?.[1]?.type).toBe('display')
    })

    test('should generate search actions', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'search for React hooks',
        intent: 'search',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.actions?.[0]?.type).toBe('execute')
      expect(response.actions?.[0]?.target).toBe('search')
    })

    test('should provide helpful responses for help commands', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'help',
        intent: 'help',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.text).toContain('help')
      expect(response.followUp).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'do something impossible',
        intent: 'unknown',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.text).toContain("didn't understand")
      expect(response.followUp).toBeDefined()
    })

    test('should handle processing errors', async () => {
      // Create processor with faulty context provider
      const faultyProcessor = new VoiceCommandProcessor({
        contextProvider: async () => {
          throw new Error('Context provider failed')
        }
      })

      const command: VoiceCommand = {
        id: 'test',
        command: 'summarize this page',
        intent: 'summarize',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await faultyProcessor.processCommand(command)
      expect(response.text).toContain('error')
    })
  })

  describe('Performance', () => {
    test('should process commands quickly', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'help',
        intent: 'help',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const startTime = performance.now()
      await processor.processCommand(command)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50) // Should process within 50ms
    })

    test('should handle multiple concurrent commands', async () => {
      const commands = Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i}`,
        command: 'help',
        intent: 'help' as VoiceIntent,
        confidence: 0.9,
        timestamp: Date.now()
      }))

      const startTime = performance.now()
      const responses = await Promise.all(
        commands.map(cmd => processor.processCommand(cmd))
      )
      const endTime = performance.now()

      expect(responses).toHaveLength(10)
      expect(responses.every(r => r.text.includes('help'))).toBe(true)
      expect(endTime - startTime).toBeLessThan(200) // Should handle all within 200ms
    })
  })

  describe('Custom Patterns', () => {
    test('should support adding custom command patterns', async () => {
      processor.addCustomPattern('search', /find me (.+)/i)

      const command: VoiceCommand = {
        id: 'test',
        command: 'find me some tutorials',
        intent: 'unknown',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.text).toContain('Searching')
    })
  })

  describe('Command Suggestions', () => {
    test('should generate helpful suggestions for unknown commands', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'sum up this content',
        intent: 'unknown',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.followUp).toContain('summarize')
    })

    test('should suggest search for find-related commands', async () => {
      const command: VoiceCommand = {
        id: 'test',
        command: 'look something up',
        intent: 'unknown',
        confidence: 0.9,
        timestamp: Date.now()
      }

      const response = await processor.processCommand(command)
      expect(response.followUp).toContain('search')
    })
  })
})
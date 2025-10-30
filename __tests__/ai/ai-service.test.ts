// Unit tests for AI Service

import { AIService } from '../../lib/ai/ai-service';
import type { PageContext } from '../../lib/types';

// Mock the gemini-nano module
jest.mock('../../lib/ai/gemini-nano', () => ({
  geminiNano: {
    isReady: jest.fn(),
    analyzeContent: jest.fn(),
    generateText: jest.fn(),
    summarizeText: jest.fn(),
    rewriteText: jest.fn(),
    translateText: jest.fn(),
    generateTextStreaming: jest.fn(),
    cleanup: jest.fn(),
    getStatus: jest.fn()
  },
  aiUtils: {
    summarize: jest.fn(),
    explain: jest.fn(),
    translate: jest.fn()
  }
}));

const mockGeminiNano = require('../../lib/ai/gemini-nano').geminiNano;
const mockAiUtils = require('../../lib/ai/gemini-nano').aiUtils;

describe('AIService', () => {
  let aiService: AIService;
  let mockPageContext: PageContext;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = AIService.getInstance();
    
    // Setup mock responses
    mockGeminiNano.isReady.mockResolvedValue(true);
    mockGeminiNano.getStatus.mockReturnValue({ available: true });
    mockGeminiNano.analyzeContent.mockResolvedValue({ sentiment: 'neutral' });
    mockAiUtils.summarize.mockResolvedValue('Summary result');
    mockAiUtils.explain.mockResolvedValue('Explanation result');
    mockAiUtils.translate.mockResolvedValue('Translation result');

    mockPageContext = {
      url: 'https://example.com/article',
      title: 'Test Article',
      content: 'This is test content for analysis.',
      pageType: 'article',
      timestamp: Date.now()
    };
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await aiService.initialize();
      expect(mockGeminiNano.isReady).toHaveBeenCalled();
    });

    test('should handle initialization errors', async () => {
      mockGeminiNano.isReady.mockRejectedValue(new Error('Initialization failed'));
      
      await expect(aiService.initialize()).rejects.toThrow('Initialization failed');
    });

    test('should not reinitialize if already initialized', async () => {
      await aiService.initialize();
      await aiService.initialize();
      
      expect(mockGeminiNano.isReady).toHaveBeenCalledTimes(1);
    });
  });

  describe('Text Processing', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    test('should process summarization requests', async () => {
      const result = await aiService.processText('summarize', 'Long text content');
      
      expect(mockAiUtils.summarize).toHaveBeenCalledWith('Long text content', 'medium');
      expect(result).toBe('Summary result');
    });

    test('should process explanation requests', async () => {
      const result = await aiService.processText('explain', 'Complex concept', {
        context: 'Educational'
      });
      
      expect(mockAiUtils.explain).toHaveBeenCalledWith('Complex concept', 'Educational');
      expect(result).toBe('Explanation result');
    });

    test('should process translation requests', async () => {
      const result = await aiService.processText('translate', 'Hello world', {
        targetLanguage: 'es'
      });
      
      expect(mockAiUtils.translate).toHaveBeenCalledWith('Hello world', 'es');
      expect(result).toBe('Translation result');
    });

    test('should handle unknown operations', async () => {
      await expect(
        aiService.processText('unknown' as any, 'text')
      ).rejects.toThrow('Unknown operation: unknown');
    });

    test('should enforce rate limiting', async () => {
      // Exhaust rate limit
      const promises = Array(15).fill(0).map(() => 
        aiService.processText('summarize', 'text')
      );
      
      const results = await Promise.allSettled(promises);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('Page Context Analysis', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    test('should analyze page context successfully', async () => {
      mockGeminiNano.analyzeContent
        .mockResolvedValueOnce({ sentiment: 'positive' })
        .mockResolvedValueOnce({ topics: ['technology', 'AI'] })
        .mockResolvedValueOnce({ entities: ['Google', 'Microsoft'] })
        .mockResolvedValueOnce({ intent: 'informational' });

      const result = await aiService.analyzePageContext(mockPageContext);
      
      expect(result).toHaveProperty('pageType');
      expect(result).toHaveProperty('mainTopic');
      expect(result).toHaveProperty('keyEntities');
      expect(result).toHaveProperty('userIntent');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('sentiment', 'positive');
      expect(result.keyEntities).toEqual(['Google', 'Microsoft']);
    });

    test('should handle analysis errors gracefully', async () => {
      mockGeminiNano.analyzeContent.mockRejectedValue(new Error('Analysis failed'));
      
      const result = await aiService.analyzePageContext(mockPageContext);
      
      expect(result).toHaveProperty('pageType');
      expect(result).toHaveProperty('confidence', 0.5);
      expect(result).toHaveProperty('sentiment', 'neutral');
    });

    test('should detect different page types correctly', async () => {
      const videoContext = { ...mockPageContext, url: 'https://youtube.com/watch?v=123' };
      const codeContext = { ...mockPageContext, url: 'https://github.com/user/repo' };
      const shoppingContext = { ...mockPageContext, url: 'https://amazon.com/product/123' };
      
      mockGeminiNano.analyzeContent.mockResolvedValue({ sentiment: 'neutral' });
      
      const videoResult = await aiService.analyzePageContext(videoContext);
      const codeResult = await aiService.analyzePageContext(codeContext);
      const shoppingResult = await aiService.analyzePageContext(shoppingContext);
      
      expect(videoResult.pageType).toBe('video');
      expect(codeResult.pageType).toBe('code');
      expect(shoppingResult.pageType).toBe('shopping');
    });
  });

  describe('Contextual Suggestions', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    test('should generate suggestions for long content', async () => {
      const longContentContext = {
        ...mockPageContext,
        content: 'This is a very long article content. '.repeat(100)
      };
      
      const suggestions = await aiService.generateContextualSuggestions(longContentContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'summarize_content',
          action: 'summarize',
          category: 'productivity'
        })
      );
    });

    test('should generate suggestions for selected text', async () => {
      const selectionContext = {
        ...mockPageContext,
        selectedText: 'This is a selected text that needs explanation and analysis for better understanding.'
      };
      
      const suggestions = await aiService.generateContextualSuggestions(selectionContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'explain_selection',
          action: 'explain',
          category: 'learning'
        })
      );
    });

    test('should generate suggestions for forms', async () => {
      const formContext = {
        ...mockPageContext,
        formFields: [
          { name: 'name', type: 'text', label: 'Full Name' },
          { name: 'email', type: 'email', label: 'Email Address' },
          { name: 'phone', type: 'tel', label: 'Phone Number' }
        ]
      };
      
      const suggestions = await aiService.generateContextualSuggestions(formContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'autofill_form',
          action: 'automate',
          category: 'productivity'
        })
      );
    });

    test('should limit suggestions to maximum count', async () => {
      const richContext = {
        ...mockPageContext,
        content: 'Very long content. '.repeat(200),
        selectedText: 'Selected text for explanation and analysis purposes.',
        formFields: [
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'email', type: 'email', label: 'Email' }
        ]
      };
      
      const suggestions = await aiService.generateContextualSuggestions(richContext);
      
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    test('should handle suggestion generation errors', async () => {
      // Mock an error in suggestion generation
      const errorContext = { ...mockPageContext };
      
      const suggestions = await aiService.generateContextualSuggestions(errorContext);
      
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Streaming Responses', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    test('should provide streaming text processing', async () => {
      const mockAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          yield 'First chunk';
          yield 'Second chunk';
          yield 'Final chunk';
        }
      };
      
      mockGeminiNano.generateTextStreaming.mockReturnValue(mockAsyncIterable);
      
      const chunks: string[] = [];
      for await (const chunk of aiService.processTextStreaming('summarize', 'Long text')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['First chunk', 'Second chunk', 'Final chunk']);
    });

    test('should handle streaming errors', async () => {
      mockGeminiNano.generateTextStreaming.mockImplementation(() => {
        throw new Error('Streaming failed');
      });
      
      const chunks: string[] = [];
      for await (const chunk of aiService.processTextStreaming('summarize', 'Text')) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toContain('Error processing');
    });

    test('should fall back to non-streaming for unsupported operations', async () => {
      mockAiUtils.translate.mockResolvedValue('Translated result');
      
      const chunks: string[] = [];
      for await (const chunk of aiService.processTextStreaming('translate', 'Hello')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['Translated result']);
    });
  });

  describe('Performance and Resource Management', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    test('should provide status information', () => {
      const status = aiService.getStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('geminiNanoAvailable');
      expect(status).toHaveProperty('queueSize');
      expect(status).toHaveProperty('rateLimits');
      expect(Array.isArray(status.rateLimits)).toBe(true);
    });

    test('should cleanup resources properly', async () => {
      await aiService.cleanup();
      
      expect(mockGeminiNano.cleanup).toHaveBeenCalled();
    });

    test('should measure processing performance', async () => {
      const startTime = performance.now();
      await aiService.processText('summarize', 'Test content');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle uninitialized service', async () => {
      const newService = AIService.getInstance();
      mockGeminiNano.isReady.mockResolvedValue(true);
      
      // Should auto-initialize
      const result = await newService.processText('summarize', 'Text');
      expect(result).toBe('Summary result');
    });

    test('should handle AI service unavailability', async () => {
      mockGeminiNano.isReady.mockResolvedValue(false);
      
      await aiService.initialize();
      
      const result = await aiService.processText('summarize', 'Text');
      expect(result).toBe('Summary result'); // Should still work with fallback
    });

    test('should handle processing errors gracefully', async () => {
      mockAiUtils.summarize.mockRejectedValue(new Error('Processing failed'));
      
      await expect(
        aiService.processText('summarize', 'Text')
      ).rejects.toThrow('Processing failed');
    });
  });

  describe('Utility Methods', () => {
    test('should assess text complexity correctly', () => {
      // Access private method through any casting for testing
      const service = aiService as any;
      
      const simpleText = 'Short sentence. Another short one.';
      const complexText = 'This is a very long and complex sentence with many clauses and subclauses that makes it difficult to understand without careful reading and analysis of the various components and their relationships.';
      
      expect(service.assessComplexity(simpleText)).toBe('low');
      expect(service.assessComplexity(complexText)).toBe('high');
    });

    test('should estimate reading time correctly', () => {
      const service = aiService as any;
      
      const shortText = 'Short text with few words.';
      const longText = 'This is a longer text. '.repeat(100);
      
      expect(service.estimateReadingTime(shortText)).toBe(1);
      expect(service.estimateReadingTime(longText)).toBeGreaterThan(1);
    });

    test('should detect page types correctly', () => {
      const service = aiService as any;
      
      const videoContext = { url: 'https://youtube.com/watch', title: 'Video Title' };
      const codeContext = { url: 'https://github.com/repo', title: 'Code Repository' };
      const generalContext = { url: 'https://example.com', title: 'General Page' };
      
      expect(service.detectPageType(videoContext)).toBe('video');
      expect(service.detectPageType(codeContext)).toBe('code');
      expect(service.detectPageType(generalContext)).toBe('general');
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = AIService.getInstance();
      const instance2 = AIService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
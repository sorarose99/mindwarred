// Unit tests for Gemini Nano integration

import { GeminiNanoService, aiUtils } from '../../lib/ai/gemini-nano';

// Mock Chrome AI APIs
const mockAI = {
  createTextSession: jest.fn(),
  createSummarizer: jest.fn(),
  createWriter: jest.fn(),
  createRewriter: jest.fn(),
  createTranslator: jest.fn()
};

const mockSession = {
  prompt: jest.fn(),
  promptStreaming: jest.fn(),
  destroy: jest.fn()
};

const mockSummarizer = {
  summarize: jest.fn(),
  summarizeStreaming: jest.fn(),
  destroy: jest.fn()
};

const mockRewriter = {
  rewrite: jest.fn(),
  rewriteStreaming: jest.fn(),
  destroy: jest.fn()
};

const mockTranslator = {
  translate: jest.fn(),
  translateStreaming: jest.fn(),
  destroy: jest.fn()
};

// Mock window.ai
Object.defineProperty(global, 'window', {
  value: {
    ai: mockAI
  },
  writable: true
});

describe('GeminiNanoService', () => {
  let service: GeminiNanoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeminiNanoService();
    
    // Setup default mock responses
    mockAI.createTextSession.mockResolvedValue(mockSession);
    mockAI.createSummarizer.mockResolvedValue(mockSummarizer);
    mockAI.createRewriter.mockResolvedValue(mockRewriter);
    mockAI.createTranslator.mockResolvedValue(mockTranslator);
    
    mockSession.prompt.mockResolvedValue('Generated text response');
    mockSummarizer.summarize.mockResolvedValue('Summary of the text');
    mockRewriter.rewrite.mockResolvedValue('Rewritten text');
    mockTranslator.translate.mockResolvedValue('Translated text');
  });

  describe('Initialization and Availability', () => {
    test('should detect Gemini Nano availability', async () => {
      const isReady = await service.isReady();
      expect(isReady).toBe(true);
    });

    test('should handle unavailable Gemini Nano gracefully', async () => {
      // Mock unavailable API
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      const newService = new GeminiNanoService();
      const isReady = await newService.isReady();
      expect(isReady).toBe(false);
    });

    test('should provide status information', () => {
      const status = service.getStatus();
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('sessionsActive');
      expect(status).toHaveProperty('fallbackEnabled');
    });
  });

  describe('Text Generation', () => {
    test('should generate text with basic prompt', async () => {
      const result = await service.generateText('Test prompt');
      
      expect(mockAI.createTextSession).toHaveBeenCalled();
      expect(mockSession.prompt).toHaveBeenCalledWith('Test prompt');
      expect(result).toBe('Generated text response');
    });

    test('should generate text with context', async () => {
      const result = await service.generateText('Test prompt', {
        context: 'Test context'
      });
      
      expect(mockSession.prompt).toHaveBeenCalledWith('Context: Test context\n\nPrompt: Test prompt');
      expect(result).toBe('Generated text response');
    });

    test('should reuse existing text session', async () => {
      await service.generateText('First prompt');
      await service.generateText('Second prompt');
      
      expect(mockAI.createTextSession).toHaveBeenCalledTimes(1);
      expect(mockSession.prompt).toHaveBeenCalledTimes(2);
    });

    test('should handle text generation errors with fallback', async () => {
      mockSession.prompt.mockRejectedValue(new Error('API Error'));
      
      const result = await service.generateText('Test prompt');
      
      expect(result).toContain('Gemini Nano is not available');
    });
  });

  describe('Text Summarization', () => {
    test('should summarize text with default options', async () => {
      const text = 'This is a long text that needs to be summarized.';
      const result = await service.summarizeText(text);
      
      expect(mockAI.createSummarizer).toHaveBeenCalledWith({
        type: 'tl;dr',
        format: 'plain-text',
        length: 'medium'
      });
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(text);
      expect(result).toBe('Summary of the text');
    });

    test('should summarize text with custom options', async () => {
      const text = 'Long text content';
      const result = await service.summarizeText(text, {
        type: 'key-points',
        length: 'short',
        format: 'markdown'
      });
      
      expect(mockAI.createSummarizer).toHaveBeenCalledWith({
        type: 'key-points',
        format: 'markdown',
        length: 'short'
      });
      expect(result).toBe('Summary of the text');
    });

    test('should handle summarization errors with fallback', async () => {
      mockSummarizer.summarize.mockRejectedValue(new Error('Summarization failed'));
      
      const text = 'First sentence. Second sentence. Third sentence.';
      const result = await service.summarizeText(text);
      
      expect(result).toContain('First sentence');
    });
  });

  describe('Text Rewriting', () => {
    test('should rewrite text with default options', async () => {
      const text = 'Original text';
      const result = await service.rewriteText(text);
      
      expect(mockAI.createRewriter).toHaveBeenCalledWith({
        tone: 'as-is',
        length: 'as-is',
        format: 'plain-text'
      });
      expect(mockRewriter.rewrite).toHaveBeenCalledWith(text, { context: undefined });
      expect(result).toBe('Rewritten text');
    });

    test('should rewrite text with custom tone', async () => {
      const text = 'Casual text';
      const result = await service.rewriteText(text, {
        tone: 'more-formal',
        purpose: 'Business communication'
      });
      
      expect(mockAI.createRewriter).toHaveBeenCalledWith({
        tone: 'more-formal',
        length: 'as-is',
        format: 'plain-text'
      });
      expect(mockRewriter.rewrite).toHaveBeenCalledWith(text, {
        context: 'Business communication'
      });
    });
  });

  describe('Translation', () => {
    test('should translate text with default options', async () => {
      const text = 'Hello world';
      const result = await service.translateText(text);
      
      expect(mockAI.createTranslator).toHaveBeenCalledWith({
        sourceLanguage: 'auto',
        targetLanguage: 'en'
      });
      expect(mockTranslator.translate).toHaveBeenCalledWith(text);
      expect(result).toBe('Translated text');
    });

    test('should translate text with specific languages', async () => {
      const text = 'Bonjour le monde';
      const result = await service.translateText(text, {
        sourceLanguage: 'fr',
        targetLanguage: 'es'
      });
      
      expect(mockAI.createTranslator).toHaveBeenCalledWith({
        sourceLanguage: 'fr',
        targetLanguage: 'es'
      });
    });
  });

  describe('Content Analysis', () => {
    test('should analyze sentiment', async () => {
      mockSession.prompt.mockResolvedValue('positive');
      
      const result = await service.analyzeContent('This is great!', 'sentiment');
      
      expect(result).toEqual({ sentiment: 'positive' });
    });

    test('should extract entities', async () => {
      mockSession.prompt.mockResolvedValue('Google, Microsoft, Apple');
      
      const result = await service.analyzeContent('Google and Microsoft compete with Apple', 'entities');
      
      expect(result).toEqual({ entities: ['Google', 'Microsoft', 'Apple'] });
    });

    test('should identify topics', async () => {
      mockSession.prompt.mockResolvedValue('technology, artificial intelligence, machine learning');
      
      const result = await service.analyzeContent('AI and ML are transforming technology', 'topics');
      
      expect(result).toEqual({ topics: ['technology', 'artificial intelligence', 'machine learning'] });
    });

    test('should determine user intent', async () => {
      mockSession.prompt.mockResolvedValue('informational');
      
      const result = await service.analyzeContent('What is machine learning?', 'intent');
      
      expect(result).toEqual({ intent: 'informational' });
    });
  });

  describe('Question Answering', () => {
    test('should answer questions without context', async () => {
      const question = 'What is AI?';
      const result = await service.answerQuestion(question);
      
      expect(mockSession.prompt).toHaveBeenCalledWith('Answer this question: What is AI?');
      expect(result).toBe('Generated text response');
    });

    test('should answer questions with context', async () => {
      const question = 'What is the main benefit?';
      const context = 'AI helps automate tasks and improve efficiency.';
      const result = await service.answerQuestion(question, context);
      
      expect(mockSession.prompt).toHaveBeenCalledWith(
        'Based on the following context, answer this question: What is the main benefit?\n\nContext: AI helps automate tasks and improve efficiency.'
      );
    });
  });

  describe('Streaming Responses', () => {
    test('should generate streaming text', async () => {
      const mockAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          yield 'First chunk';
          yield 'Second chunk';
          yield 'Third chunk';
        }
      };
      
      mockSession.promptStreaming.mockReturnValue(mockAsyncIterable);
      
      const chunks: string[] = [];
      for await (const chunk of service.generateTextStreaming('Test prompt')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['First chunk', 'Second chunk', 'Third chunk']);
    });

    test('should handle streaming errors gracefully', async () => {
      mockSession.promptStreaming.mockImplementation(() => {
        throw new Error('Streaming failed');
      });
      
      const chunks: string[] = [];
      for await (const chunk of service.generateTextStreaming('Test prompt')) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toContain('Gemini Nano is not available');
    });
  });

  describe('Resource Management', () => {
    test('should cleanup sessions properly', () => {
      service.cleanup();
      
      expect(mockSession.destroy).toHaveBeenCalled();
      expect(mockSummarizer.destroy).toHaveBeenCalled();
      expect(mockRewriter.destroy).toHaveBeenCalled();
      expect(mockTranslator.destroy).toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', () => {
      mockSession.destroy.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      
      expect(() => service.cleanup()).not.toThrow();
    });
  });

  describe('Fallback Behavior', () => {
    beforeEach(() => {
      // Mock unavailable Gemini Nano
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });
      service = new GeminiNanoService();
    });

    test('should use fallback for text generation', async () => {
      const result = await service.generateText('summarize this text');
      expect(result).toContain('summarization');
    });

    test('should use fallback for summarization', async () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const result = await service.summarizeText(text, { length: 'short' });
      
      expect(result).toContain('First sentence');
      expect(result).toContain('Second sentence');
      expect(result.split('.').length).toBeLessThanOrEqual(3);
    });

    test('should use fallback for content analysis', async () => {
      const result = await service.analyzeContent('This is great and wonderful!', 'sentiment');
      expect(result).toEqual({ sentiment: 'positive' });
    });

    test('should disable fallback when configured', async () => {
      service.setFallbackEnabled(false);
      
      await expect(service.generateText('test')).rejects.toThrow('Gemini Nano not available');
    });
  });

  describe('Configuration', () => {
    test('should enable/disable fallback', () => {
      service.setFallbackEnabled(false);
      expect(service.isFallbackEnabled()).toBe(false);
      
      service.setFallbackEnabled(true);
      expect(service.isFallbackEnabled()).toBe(true);
    });

    test('should provide detailed status', () => {
      const status = service.getStatus();
      
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('sessionsActive');
      expect(status).toHaveProperty('fallbackEnabled');
      expect(typeof status.available).toBe('boolean');
      expect(typeof status.sessionsActive).toBe('number');
      expect(typeof status.fallbackEnabled).toBe('boolean');
    });
  });
});

describe('AI Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSummarizer.summarize.mockResolvedValue('Summary result');
    mockSession.prompt.mockResolvedValue('Generated response');
    mockTranslator.translate.mockResolvedValue('Translated result');
  });

  test('should provide summarize utility', async () => {
    const result = await aiUtils.summarize('Long text content', 'short');
    expect(result).toBe('Summary result');
  });

  test('should provide explain utility', async () => {
    const result = await aiUtils.explain('Complex text', 'Educational context');
    expect(result).toBe('Generated response');
  });

  test('should provide translate utility', async () => {
    const result = await aiUtils.translate('Hello world', 'es');
    expect(result).toBe('Translated result');
  });

  test('should extract key points', async () => {
    mockSession.prompt.mockResolvedValue('1. First point\n2. Second point\n3. Third point');
    
    const result = await aiUtils.extractKeyPoints('Long article content');
    
    expect(result).toEqual(['1. First point', '2. Second point', '3. Third point']);
  });

  test('should get sentiment', async () => {
    // Mock the analyzeContent method
    const mockService = {
      analyzeContent: jest.fn().mockResolvedValue({ sentiment: 'positive' })
    };
    
    // Temporarily replace the service
    const originalGeminiNano = require('../../lib/ai/gemini-nano').geminiNano;
    require('../../lib/ai/gemini-nano').geminiNano = mockService;
    
    const result = await aiUtils.getSentiment('This is amazing!');
    expect(result).toBe('positive');
    
    // Restore original service
    require('../../lib/ai/gemini-nano').geminiNano = originalGeminiNano;
  });

  test('should get topics', async () => {
    const mockService = {
      analyzeContent: jest.fn().mockResolvedValue({ topics: ['AI', 'technology', 'innovation'] })
    };
    
    const originalGeminiNano = require('../../lib/ai/gemini-nano').geminiNano;
    require('../../lib/ai/gemini-nano').geminiNano = mockService;
    
    const result = await aiUtils.getTopics('Article about AI and technology innovation');
    expect(result).toEqual(['AI', 'technology', 'innovation']);
    
    require('../../lib/ai/gemini-nano').geminiNano = originalGeminiNano;
  });
});
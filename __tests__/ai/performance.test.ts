// Performance tests for AI processing components

import { GeminiNanoService } from '../../lib/ai/gemini-nano';
import { AIService } from '../../lib/ai/ai-service';
import { SuggestionEngine } from '../../lib/ai/suggestion-engine';
import type { PageContext, SuggestionContext } from '../../lib/types';

// Mock Chrome AI APIs for performance testing
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

Object.defineProperty(global, 'window', {
  value: { ai: mockAI },
  writable: true
});

describe('AI Performance Tests', () => {
  let geminiService: GeminiNanoService;
  let aiService: AIService;
  let suggestionEngine: SuggestionEngine;
  let mockPageContext: PageContext;
  let mockSuggestionContext: SuggestionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks with realistic delays
    mockAI.createTextSession.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockSession), 10))
    );
    mockAI.createSummarizer.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockSummarizer), 15))
    );
    
    mockSession.prompt.mockImplementation((text: string) => 
      new Promise(resolve => setTimeout(() => resolve(`Response to: ${text.slice(0, 50)}...`), 50))
    );
    mockSummarizer.summarize.mockImplementation((text: string) => 
      new Promise(resolve => setTimeout(() => resolve(`Summary of: ${text.slice(0, 30)}...`), 30))
    );

    geminiService = new GeminiNanoService();
    aiService = AIService.getInstance();
    suggestionEngine = new SuggestionEngine();

    mockPageContext = {
      url: 'https://example.com/article',
      title: 'Performance Test Article',
      content: 'This is test content for performance analysis. '.repeat(100),
      pageType: 'article',
      timestamp: Date.now()
    };

    mockSuggestionContext = {
      pageContext: mockPageContext,
      currentTime: new Date()
    };
  });

  describe('GeminiNano Performance', () => {
    test('should initialize within acceptable time', async () => {
      const startTime = performance.now();
      await geminiService.isReady();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    test('should handle text generation with reasonable latency', async () => {
      const startTime = performance.now();
      const result = await geminiService.generateText('Test prompt for performance');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200); // Including mock delay
      expect(result).toBeDefined();
    });

    test('should handle concurrent requests efficiently', async () => {
      const startTime = performance.now();
      
      const promises = Array(10).fill(0).map((_, i) => 
        geminiService.generateText(`Concurrent request ${i}`)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(500); // Should handle concurrency well
    });

    test('should reuse sessions for better performance', async () => {
      // First request creates session
      const start1 = performance.now();
      await geminiService.generateText('First request');
      const end1 = performance.now();
      
      // Second request reuses session
      const start2 = performance.now();
      await geminiService.generateText('Second request');
      const end2 = performance.now();
      
      const firstRequestTime = end1 - start1;
      const secondRequestTime = end2 - start2;
      
      // Second request should be faster (no session creation)
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
      expect(mockAI.createTextSession).toHaveBeenCalledTimes(1);
    });

    test('should handle large text inputs efficiently', async () => {
      const largeText = 'Large text content for performance testing. '.repeat(1000);
      
      const startTime = performance.now();
      const result = await geminiService.summarizeText(largeText);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(300);
      expect(result).toBeDefined();
    });

    test('should provide streaming responses for better UX', async () => {
      const mockAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          yield 'Chunk 1';
          await new Promise(resolve => setTimeout(resolve, 10));
          yield 'Chunk 2';
          await new Promise(resolve => setTimeout(resolve, 10));
          yield 'Chunk 3';
        }
      };
      
      mockSession.promptStreaming.mockReturnValue(mockAsyncIterable);
      
      const startTime = performance.now();
      const chunks: string[] = [];
      let firstChunkTime = 0;
      
      for await (const chunk of geminiService.generateTextStreaming('Streaming test')) {
        chunks.push(chunk);
        if (chunks.length === 1) {
          firstChunkTime = performance.now() - startTime;
        }
      }
      const endTime = performance.now();
      
      expect(chunks).toHaveLength(3);
      expect(firstChunkTime).toBeLessThan(100); // First chunk should arrive quickly
      expect(endTime - startTime).toBeLessThan(200); // Total time reasonable
    });

    test('should cleanup resources efficiently', () => {
      const startTime = performance.now();
      geminiService.cleanup();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Cleanup should be fast
      expect(mockSession.destroy).toHaveBeenCalled();
    });
  });

  describe('AIService Performance', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    test('should initialize quickly', async () => {
      const newService = AIService.getInstance();
      
      const startTime = performance.now();
      await newService.initialize();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should process text operations within SLA', async () => {
      const operations = ['summarize', 'explain', 'translate'] as const;
      
      for (const operation of operations) {
        const startTime = performance.now();
        await aiService.processText(operation, 'Test content for performance');
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(300); // 300ms SLA
      }
    });

    test('should analyze page context efficiently', async () => {
      const startTime = performance.now();
      const analysis = await aiService.analyzePageContext(mockPageContext);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Complex analysis SLA
      expect(analysis).toHaveProperty('pageType');
      expect(analysis).toHaveProperty('confidence');
    });

    test('should handle concurrent analysis requests', async () => {
      const contexts = Array(5).fill(0).map((_, i) => ({
        ...mockPageContext,
        url: `https://example.com/page${i}`,
        title: `Page ${i}`
      }));
      
      const startTime = performance.now();
      const analyses = await Promise.all(
        contexts.map(context => aiService.analyzePageContext(context))
      );
      const endTime = performance.now();
      
      expect(analyses).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(1000); // Should handle concurrency
    });

    test('should enforce rate limiting effectively', async () => {
      const startTime = performance.now();
      
      // Try to exceed rate limit
      const promises = Array(20).fill(0).map(() => 
        aiService.processText('summarize', 'Rate limit test')
      );
      
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      expect(rejectedCount).toBeGreaterThan(0); // Some should be rate limited
      expect(endTime - startTime).toBeLessThan(2000); // Should fail fast
    });

    test('should provide status information quickly', () => {
      const startTime = performance.now();
      const status = aiService.getStatus();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10); // Status should be instant
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('queueSize');
    });
  });

  describe('SuggestionEngine Performance', () => {
    test('should generate suggestions within acceptable time', async () => {
      const startTime = performance.now();
      const suggestions = await suggestionEngine.generateSuggestions(mockSuggestionContext);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200); // Should be fast
      expect(suggestions).toBeInstanceOf(Array);
    });

    test('should handle complex contexts efficiently', async () => {
      const complexContext = {
        ...mockSuggestionContext,
        pageContext: {
          ...mockPageContext,
          content: 'Complex content with technical terms API JSON HTTP. '.repeat(500),
          selectedText: 'Selected text that needs explanation and analysis.',
          formFields: Array(10).fill(0).map((_, i) => ({
            name: `field${i}`,
            type: 'text',
            label: `Field ${i}`,
            id: `field${i}`
          }))
        },
        recentActivities: Array(50).fill(0).map((_, i) => ({
          id: `${i}`,
          userId: 'user1',
          timestamp: new Date(),
          type: 'text_selection',
          data: { selectedText: `Activity ${i}` },
          context: {} as any
        })),
        knowledgeGraph: Array(20).fill(0).map((_, i) => ({
          id: `${i}`,
          label: `Topic ${i}`,
          type: 'topic' as const,
          connections: [],
          strength: 0.8,
          confidence: 0.9,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            frequency: 5,
            lastAccessed: new Date(),
            importance: 0.8,
            source: 'browsing_history' as const,
            verified: true
          }
        }))
      };
      
      const startTime = performance.now();
      const suggestions = await suggestionEngine.generateSuggestions(complexContext);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Even complex contexts should be fast
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('should detect automation opportunities efficiently', async () => {
      const startTime = performance.now();
      const opportunities = await suggestionEngine.detectAutomationOpportunities(mockSuggestionContext);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      expect(opportunities).toBeInstanceOf(Array);
    });

    test('should cache suggestions for better performance', async () => {
      // First generation
      const start1 = performance.now();
      await suggestionEngine.generateSuggestions(mockSuggestionContext);
      const end1 = performance.now();
      
      // Check cache retrieval
      const start2 = performance.now();
      const cached = suggestionEngine.getSuggestionHistory(mockPageContext.url);
      const end2 = performance.now();
      
      expect(end2 - start2).toBeLessThan(5); // Cache retrieval should be instant
      expect(cached).toBeDefined();
    });

    test('should handle rule execution in parallel', async () => {
      // Add multiple custom rules
      for (let i = 0; i < 10; i++) {
        suggestionEngine.addRule({
          id: `perf_rule_${i}`,
          name: `Performance Rule ${i}`,
          condition: () => true,
          generator: async () => {
            await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
            return [{
              id: `suggestion_${i}`,
              title: `Suggestion ${i}`,
              description: 'Performance test suggestion',
              action: 'summarize',
              confidence: 0.5,
              category: 'productivity'
            }];
          },
          priority: 5,
          enabled: true
        });
      }
      
      const startTime = performance.now();
      const suggestions = await suggestionEngine.generateSuggestions(mockSuggestionContext);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(300); // Should handle multiple rules efficiently
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('should provide status information instantly', () => {
      const startTime = performance.now();
      const status = suggestionEngine.getStatus();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5);
      expect(status).toHaveProperty('rulesCount');
      expect(status).toHaveProperty('suggestionHistorySize');
    });
  });

  describe('Memory Usage and Resource Management', () => {
    test('should not leak memory with repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await aiService.processText('summarize', `Test content ${i}`);
        await suggestionEngine.generateSuggestions({
          ...mockSuggestionContext,
          pageContext: {
            ...mockPageContext,
            url: `https://example.com/page${i}`
          }
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should cleanup resources properly', async () => {
      // Create and use services
      await aiService.initialize();
      await aiService.processText('summarize', 'Test content');
      
      const startTime = performance.now();
      await aiService.cleanup();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Cleanup should be fast
    });

    test('should handle session limits gracefully', async () => {
      // Create many sessions to test limits
      const promises = Array(50).fill(0).map((_, i) => 
        geminiService.generateText(`Session test ${i}`)
      );
      
      const startTime = performance.now();
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // Should handle gracefully
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0); // At least some should succeed
    });
  });

  describe('Fallback Performance', () => {
    beforeEach(() => {
      // Mock unavailable Gemini Nano
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });
    });

    test('should fallback quickly when Gemini Nano unavailable', async () => {
      const fallbackService = new GeminiNanoService();
      
      const startTime = performance.now();
      const result = await fallbackService.generateText('Fallback test');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Fallback should be instant
      expect(result).toContain('Gemini Nano is not available');
    });

    test('should maintain performance with fallback suggestions', async () => {
      const startTime = performance.now();
      const suggestions = await suggestionEngine.generateSuggestions(mockSuggestionContext);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(300); // Should still be fast
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Stress Testing', () => {
    test('should handle high-frequency requests', async () => {
      const requestCount = 100;
      const startTime = performance.now();
      
      const promises = Array(requestCount).fill(0).map(async (_, i) => {
        try {
          return await aiService.processText('summarize', `Stress test ${i}`);
        } catch (error) {
          return null; // Rate limited requests
        }
      });
      
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / requestCount;
      
      expect(avgTimePerRequest).toBeLessThan(100); // Average should be reasonable
      
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value !== null
      ).length;
      
      expect(successCount).toBeGreaterThan(0); // Some should succeed
    });

    test('should maintain responsiveness under load', async () => {
      // Start background load
      const backgroundPromises = Array(20).fill(0).map((_, i) => 
        suggestionEngine.generateSuggestions({
          ...mockSuggestionContext,
          pageContext: {
            ...mockPageContext,
            url: `https://background.com/page${i}`
          }
        })
      );
      
      // Test foreground responsiveness
      const startTime = performance.now();
      const result = await aiService.processText('explain', 'Priority request');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should still be responsive
      expect(result).toBeDefined();
      
      // Wait for background tasks
      await Promise.allSettled(backgroundPromises);
    });
  });
});
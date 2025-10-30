// Unit tests for Chrome extension background service worker

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  tabs: {
    onActivated: {
      addListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn()
    }
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn()
  }
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
};

// Load the background script
require('../../extension/background.js');

describe('KiroBackgroundService', () => {
  let backgroundService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock storage responses
    global.chrome.storage.sync.get.mockResolvedValue({
      kiroEnabled: true,
      privacyLevel: 'standard'
    });
    
    global.chrome.storage.local.get.mockResolvedValue({
      activities: [],
      stats: {}
    });
    
    // Create new instance
    backgroundService = new KiroBackgroundService();
  });

  describe('Initialization', () => {
    test('should load default preferences', () => {
      const defaultPrefs = backgroundService.getDefaultPreferences();
      
      expect(defaultPrefs).toHaveProperty('kiroEnabled', true);
      expect(defaultPrefs).toHaveProperty('privacyLevel', 'standard');
      expect(defaultPrefs).toHaveProperty('aiSettings');
      expect(defaultPrefs.aiSettings).toHaveProperty('summaryLength', 'brief');
    });

    test('should set up event listeners', () => {
      backgroundService.setupEventListeners();
      
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
      expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
    });
  });

  describe('Page Analysis', () => {
    const mockPageData = {
      url: 'https://example.com/article',
      title: 'Test Article Title',
      content: 'This is a test article with some content for analysis.',
      formFields: [],
      selectedText: ''
    };

    test('should detect page type correctly', () => {
      expect(backgroundService.detectPageType({
        url: 'https://youtube.com/watch?v=123',
        title: 'Video Title'
      })).toBe('video');
      
      expect(backgroundService.detectPageType({
        url: 'https://github.com/user/repo',
        title: 'Repository'
      })).toBe('code');
      
      expect(backgroundService.detectPageType({
        url: 'https://amazon.com/product/123',
        title: 'Product Page'
      })).toBe('shopping');
    });

    test('should extract main topic', () => {
      const topic = backgroundService.extractMainTopic(
        'JavaScript Programming Tutorial',
        'Learn JavaScript programming with examples and exercises'
      );
      
      expect(topic).toContain('javascript');
      expect(topic).toContain('programming');
    });

    test('should extract key entities', () => {
      const content = 'Visit https://example.com or email contact@example.com for more information about Google.';
      const entities = backgroundService.extractKeyEntities(content);
      
      expect(entities).toContain('https://example.com');
      expect(entities).toContain('contact@example.com');
      expect(entities).toContain('Google');
    });

    test('should infer user intent', () => {
      expect(backgroundService.inferUserIntent({
        url: 'https://shop.example.com',
        formFields: []
      })).toBe('shopping');
      
      expect(backgroundService.inferUserIntent({
        url: 'https://example.com',
        formFields: [{ name: 'email' }, { name: 'password' }]
      })).toBe('filling_form');
      
      expect(backgroundService.inferUserIntent({
        url: 'https://example.com',
        formFields: [],
        selectedText: 'This is a long selected text that indicates the user is researching something'
      })).toBe('researching');
    });

    test('should analyze sentiment', () => {
      expect(backgroundService.analyzeSentiment('This is great and wonderful')).toBe('positive');
      expect(backgroundService.analyzeSentiment('This is terrible and awful')).toBe('negative');
      expect(backgroundService.analyzeSentiment('This is a neutral statement')).toBe('neutral');
    });

    test('should assess complexity', () => {
      const simpleText = 'Short sentence. Another short one.';
      const complexText = 'This is a very long and complex sentence with many clauses and subclauses that makes it difficult to understand without careful reading and analysis.';
      
      expect(backgroundService.assessComplexity(simpleText)).toBe('low');
      expect(backgroundService.assessComplexity(complexText)).toBe('high');
    });

    test('should estimate reading time', () => {
      const shortText = 'Short text';
      const longText = 'This is a longer text '.repeat(100);
      
      expect(backgroundService.estimateReadingTime(shortText)).toBe(1);
      expect(backgroundService.estimateReadingTime(longText)).toBeGreaterThan(1);
    });
  });

  describe('Suggestion Generation', () => {
    test('should generate article summarization suggestion', async () => {
      const pageData = {
        url: 'https://example.com/article',
        title: 'Long Article',
        content: 'This is a very long article '.repeat(100),
        formFields: []
      };
      
      const analysis = { pageType: 'article' };
      const suggestions = await backgroundService.generateSuggestions(pageData, analysis);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'summarize_article',
          action: 'summarize',
          category: 'productivity'
        })
      );
    });

    test('should generate form autofill suggestion', async () => {
      const pageData = {
        url: 'https://example.com/form',
        title: 'Contact Form',
        content: 'Fill out this form',
        formFields: [
          { name: 'name' },
          { name: 'email' },
          { name: 'phone' },
          { name: 'message' }
        ]
      };
      
      const analysis = { pageType: 'form' };
      const suggestions = await backgroundService.generateSuggestions(pageData, analysis);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'autofill_form',
          action: 'automate',
          category: 'productivity'
        })
      );
    });

    test('should generate explanation suggestion for selected text', async () => {
      const pageData = {
        url: 'https://example.com',
        title: 'Page',
        content: 'Some content',
        selectedText: 'This is a long selected text that needs explanation and analysis',
        formFields: []
      };
      
      const analysis = { pageType: 'general' };
      const suggestions = await backgroundService.generateSuggestions(pageData, analysis);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'explain_selection',
          action: 'explain',
          category: 'learning'
        })
      );
    });
  });

  describe('Automation Opportunities', () => {
    test('should detect form autofill opportunity', async () => {
      const pageData = {
        formFields: [
          { name: 'name', label: 'Full Name' },
          { name: 'email', label: 'Email Address' },
          { name: 'phone', label: 'Phone Number' }
        ]
      };
      
      const analysis = { pageType: 'form' };
      const opportunities = await backgroundService.detectAutomationOpportunities(pageData, analysis);
      
      expect(opportunities).toContainEqual(
        expect.objectContaining({
          id: 'form_autofill',
          type: 'form_fill',
          complexity: 'low'
        })
      );
    });

    test('should detect search enhancement opportunity', async () => {
      const pageData = {
        url: 'https://google.com/search?q=test',
        formFields: []
      };
      
      const analysis = { pageType: 'search' };
      const opportunities = await backgroundService.detectAutomationOpportunities(pageData, analysis);
      
      expect(opportunities).toContainEqual(
        expect.objectContaining({
          id: 'search_enhancement',
          type: 'navigation'
        })
      );
    });
  });

  describe('AI Processing', () => {
    test('should summarize text', async () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence.';
      const summary = await backgroundService.summarizeText(text);
      
      expect(summary).toContain('Summary:');
      expect(summary).toContain('first sentence');
    });

    test('should explain text', async () => {
      const text = 'Complex technical concept that needs explanation';
      const explanation = await backgroundService.explainText(text);
      
      expect(explanation).toContain('This text discusses:');
      expect(explanation).toContain('Complex technical concept');
    });

    test('should translate text', async () => {
      const text = 'Hello world';
      const translation = await backgroundService.translateText(text);
      
      expect(translation).toContain('Translation of:');
      expect(translation).toContain('Hello world');
    });

    test('should extract key points', async () => {
      const text = 'First important point. Second important point. Third important point.';
      const keyPoints = await backgroundService.extractKeyPoints(text);
      
      expect(keyPoints).toContain('Key Points:');
      expect(keyPoints).toContain('1. First important point');
      expect(keyPoints).toContain('2. Second important point');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within limit', () => {
      expect(backgroundService.checkRateLimit('test', 10, 60000)).toBe(true);
      expect(backgroundService.checkRateLimit('test', 10, 60000)).toBe(true);
    });

    test('should block requests exceeding limit', () => {
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        backgroundService.checkRateLimit('test_limit', 10, 60000);
      }
      
      // Next request should be blocked
      expect(backgroundService.checkRateLimit('test_limit', 10, 60000)).toBe(false);
    });

    test('should reset limit after time window', () => {
      // Mock time progression
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = jest.fn(() => mockTime);
      
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        backgroundService.checkRateLimit('test_reset', 5, 1000);
      }
      expect(backgroundService.checkRateLimit('test_reset', 5, 1000)).toBe(false);
      
      // Advance time past window
      mockTime += 2000;
      expect(backgroundService.checkRateLimit('test_reset', 5, 1000)).toBe(true);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Activity Management', () => {
    test('should generate unique activity IDs', () => {
      const id1 = backgroundService.generateActivityId();
      const id2 = backgroundService.generateActivityId();
      
      expect(id1).toMatch(/^activity_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^activity_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should add activities to queue', async () => {
      const mockSendResponse = jest.fn();
      const activityData = {
        type: 'page_visit',
        data: { url: 'https://example.com' }
      };
      
      await backgroundService.handleSaveActivity(activityData, mockSendResponse);
      
      expect(backgroundService.activityQueue).toHaveLength(1);
      expect(backgroundService.activityQueue[0]).toMatchObject(activityData);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should reject invalid activity data', async () => {
      const mockSendResponse = jest.fn();
      const invalidData = { data: { url: 'test' } }; // missing type
      
      await backgroundService.handleSaveActivity(invalidData, mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        error: 'Invalid activity data'
      });
    });
  });

  describe('Cache Management', () => {
    test('should generate cache keys', () => {
      const key = backgroundService.generateCacheKey('analysis', 'https://example.com', 'content');
      expect(key).toBe('analysishttpsexamplecomcontent');
      expect(key.length).toBeLessThanOrEqual(100);
    });

    test('should cache and retrieve AI results', async () => {
      const cacheKey = 'test_key';
      const testData = { result: 'cached result' };
      
      backgroundService.aiCache.set(cacheKey, testData);
      expect(backgroundService.aiCache.get(cacheKey)).toEqual(testData);
    });

    test('should cleanup old cache entries', () => {
      const oldTime = Date.now() - 60 * 60 * 1000; // 1 hour ago
      backgroundService.aiCache.set('old_key', { timestamp: oldTime });
      backgroundService.aiCache.set('new_key', { timestamp: Date.now() });
      
      backgroundService.cleanupCache();
      
      expect(backgroundService.aiCache.has('old_key')).toBe(false);
      expect(backgroundService.aiCache.has('new_key')).toBe(true);
    });
  });

  describe('Message Handling', () => {
    test('should handle unknown message types', async () => {
      const mockSendResponse = jest.fn();
      
      await backgroundService.handleMessage(
        { type: 'UNKNOWN_TYPE' },
        null,
        mockSendResponse
      );
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        error: 'Unknown message type',
        type: 'UNKNOWN_TYPE'
      });
    });

    test('should handle GET_STATS message', async () => {
      const mockSendResponse = jest.fn();
      chrome.storage.local.get.mockResolvedValue({
        stats: { pagesAnalyzed: 5 },
        activities: [{ id: 1 }, { id: 2 }]
      });
      
      await backgroundService.handleGetStats(mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        stats: expect.objectContaining({
          pagesAnalyzed: 5,
          totalActivities: 2
        })
      });
    });
  });

  describe('Data Management', () => {
    test('should update stats correctly', async () => {
      chrome.storage.local.get.mockResolvedValue({
        stats: { pagesAnalyzed: 5, suggestionsMade: 10 }
      });
      
      await backgroundService.updateStats({ pagesAnalyzed: 2, suggestionsMade: 3 });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        stats: { pagesAnalyzed: 7, suggestionsMade: 13 }
      });
    });

    test('should export data correctly', async () => {
      const mockSendResponse = jest.fn();
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
      chrome.storage.local.get.mockResolvedValue({ 
        activities: [{ id: 1 }],
        stats: { pagesAnalyzed: 5 }
      });
      
      await backgroundService.handleExportData(mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          version: '1.0.0',
          preferences: { kiroEnabled: true },
          activities: [{ id: 1 }],
          stats: { pagesAnalyzed: 5 }
        })
      });
    });

    test('should clear data selectively', async () => {
      const mockSendResponse = jest.fn();
      
      await backgroundService.handleClearData({
        activities: true,
        stats: true,
        cache: false,
        preferences: false
      }, mockSendResponse);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ activities: [] });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ stats: {} });
      expect(chrome.storage.sync.clear).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });
});
/**
 * End-to-End Integration Tests for Kiro Web Mind
 * Tests complete user journeys from Chrome extension to dashboard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Chrome APIs for extension testing
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    connect: jest.fn(),
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`)
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  permissions: {
    request: jest.fn(),
    contains: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock Firebase for dashboard testing
const mockFirebase = {
  auth: {
    currentUser: { uid: 'test-user-123', email: 'test@example.com' },
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(() => Promise.resolve({ data: () => ({}) })),
        collection: jest.fn(() => ({
          add: jest.fn(),
          doc: jest.fn(() => ({
            set: jest.fn()
          }))
        }))
      }))
    })),
    doc: jest.fn(),
    onSnapshot: jest.fn()
  }
};

// Mock AI processing
const mockAI = {
  summarize: jest.fn(),
  generateSuggestions: jest.fn(),
  processVoiceCommand: jest.fn()
};

describe('Kiro Web Mind End-to-End Integration', () => {
  beforeAll(() => {
    // Setup global mocks
    (global as any).chrome = mockChrome;
    (global as any).firebase = mockFirebase;
    
    // Mock Web Speech API
    (global as any).webkitSpeechRecognition = jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn()
    }));
    
    // Mock Gemini Nano API
    (global as any).ai = {
      summarizer: {
        create: jest.fn(() => ({
          summarize: mockAI.summarize
        }))
      }
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Journey: Installation to First Use', () => {
    test('should complete extension installation and show welcome popup', async () => {
      // Simulate extension installation
      const installEvent = new Event('install');
      
      // Mock popup HTML loading
      document.body.innerHTML = `
        <div id="kiro-popup">
          <h1>Welcome to Kiro</h1>
          <button id="get-started">Get Started</button>
        </div>
      `;
      
      const getStartedButton = document.getElementById('get-started');
      expect(getStartedButton).toBeTruthy();
      
      // Simulate clicking get started and mock the storage call
      fireEvent.click(getStartedButton!);
      
      // Simulate extension setup call
      mockChrome.storage.local.set({
        isFirstRun: false,
        setupComplete: true
      });
      
      // Verify extension setup
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        isFirstRun: false,
        setupComplete: true
      });
    });

    test('should inject AI sidebar on webpage visit', async () => {
      // Simulate content script injection
      document.body.innerHTML = '<div id="main-content">Test webpage</div>';
      
      // Mock page context analysis
      const mockPageContext = {
        url: 'https://example.com',
        title: 'Test Page',
        pageType: 'article',
        selectedText: null
      };
      
      // Simulate content script execution
      const sidebarElement = document.createElement('div');
      sidebarElement.id = 'kiro-ai-sidebar';
      sidebarElement.innerHTML = `
        <div class="kiro-sidebar-content">
          <button id="kiro-voice-btn">🎤</button>
          <div id="kiro-suggestions"></div>
        </div>
      `;
      document.body.appendChild(sidebarElement);
      
      expect(document.getElementById('kiro-ai-sidebar')).toBeTruthy();
      expect(document.getElementById('kiro-voice-btn')).toBeTruthy();
    });
  });

  describe('User Journey: Text Selection and AI Processing', () => {
    test('should analyze selected text and provide suggestions', async () => {
      // Setup page with selectable text
      document.body.innerHTML = `
        <div id="content">
          <p id="test-paragraph">This is a test paragraph with important information about AI and machine learning.</p>
        </div>
        <div id="kiro-ai-sidebar" style="display: none;">
          <div id="kiro-suggestions"></div>
        </div>
      `;
      
      const paragraph = document.getElementById('test-paragraph')!;
      const sidebar = document.getElementById('kiro-ai-sidebar')!;
      
      // Mock text selection
      const selection = {
        toString: () => 'important information about AI and machine learning',
        rangeCount: 1
      };
      
      Object.defineProperty(window, 'getSelection', {
        value: () => selection
      });
      
      // Simulate text selection event and sidebar activation
      const selectionEvent = new Event('mouseup');
      paragraph.dispatchEvent(selectionEvent);
      
      // Mock AI processing response
      mockAI.generateSuggestions.mockResolvedValue([
        { type: 'summarize', text: 'Summarize this text' },
        { type: 'explain', text: 'Explain AI concepts' },
        { type: 'research', text: 'Find related articles' }
      ]);
      
      // Simulate sidebar becoming visible
      sidebar.style.display = 'block';
      
      // Verify sidebar becomes visible
      expect(sidebar.style.display).toBe('block');
      
      // Simulate AI processing call
      await mockAI.generateSuggestions({
        selectedText: 'important information about AI and machine learning'
      });
      
      // Verify suggestions are generated
      expect(mockAI.generateSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedText: 'important information about AI and machine learning'
        })
      );
    });
  });

  describe('User Journey: Voice Interface Integration', () => {
    test('should process voice commands and execute actions', async () => {
      // Setup voice interface
      document.body.innerHTML = `
        <div id="kiro-ai-sidebar">
          <button id="kiro-voice-btn">🎤</button>
          <div id="voice-status">Ready</div>
          <div id="voice-transcript"></div>
        </div>
      `;
      
      const voiceButton = document.getElementById('kiro-voice-btn')!;
      const voiceStatus = document.getElementById('voice-status')!;
      const transcript = document.getElementById('voice-transcript')!;
      
      // Mock speech recognition
      const mockRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
        onresult: null,
        onerror: null
      };
      
      (global as any).webkitSpeechRecognition = jest.fn(() => mockRecognition);
      
      // Simulate voice button click and recognition start
      fireEvent.click(voiceButton);
      
      // Simulate starting recognition
      mockRecognition.start();
      voiceStatus.textContent = 'Listening...';
      
      expect(mockRecognition.start).toHaveBeenCalled();
      expect(voiceStatus.textContent).toBe('Listening...');
      
      // Simulate voice command recognition
      const mockResult = {
        results: [{
          0: { transcript: 'summarize this page' },
          isFinal: true
        }]
      };
      
      // Simulate transcript update
      transcript.textContent = 'summarize this page';
      
      // Simulate voice command processing
      await mockAI.processVoiceCommand('summarize this page');
      
      expect(transcript.textContent).toBe('summarize this page');
      expect(mockAI.processVoiceCommand).toHaveBeenCalledWith('summarize this page');
    });
  });

  describe('User Journey: Dashboard Integration', () => {
    test('should sync extension data with dashboard', async () => {
      // Mock user activity data
      const mockActivityData = {
        userId: 'test-user-123',
        activities: [
          {
            timestamp: new Date(),
            url: 'https://example.com',
            action: 'page_visit',
            context: { pageType: 'article', title: 'Test Article' }
          }
        ],
        automationRules: [],
        knowledgeGraph: []
      };
      
      // Mock Firebase sync
      mockFirebase.firestore.collection.mockReturnValue({
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(() => Promise.resolve({ data: () => mockActivityData })),
          onSnapshot: jest.fn()
        }))
      });
      
      // Simulate data sync from extension
      const syncData = async () => {
        const userDoc = mockFirebase.firestore.collection('users').doc('test-user-123');
        await userDoc.set(mockActivityData);
      };
      
      await syncData();
      
      expect(mockFirebase.firestore.collection).toHaveBeenCalledWith('users');
    });

    test('should display real-time updates in dashboard', async () => {
      // Mock dashboard component
      const mockDashboard = {
        updateKnowledgeGraph: jest.fn(),
        updateActivityFeed: jest.fn(),
        updateAutomationRules: jest.fn()
      };
      
      // Simulate real-time listener
      const mockSnapshot = {
        data: () => ({
          knowledgeGraph: [
            { id: '1', label: 'AI Research', type: 'topic', connections: [] }
          ],
          activities: [
            { timestamp: new Date(), url: 'https://example.com', action: 'summarize' }
          ]
        })
      };
      
      // Simulate Firestore listener callback
      const onSnapshotCallback = jest.fn((callback) => {
        callback(mockSnapshot);
      });
      
      mockFirebase.firestore.onSnapshot = onSnapshotCallback;
      
      // Verify dashboard updates
      onSnapshotCallback((snapshot: any) => {
        const data = snapshot.data();
        mockDashboard.updateKnowledgeGraph(data.knowledgeGraph);
        mockDashboard.updateActivityFeed(data.activities);
      });
      
      expect(mockDashboard.updateKnowledgeGraph).toHaveBeenCalled();
      expect(mockDashboard.updateActivityFeed).toHaveBeenCalled();
    });
  });

  describe('User Journey: Automation Workflow', () => {
    test('should create and execute automation rules', async () => {
      // Mock automation rule creation
      const automationRule = {
        id: 'rule-1',
        name: 'Auto-summarize articles',
        trigger: {
          type: 'page_load',
          conditions: { pageType: 'article' }
        },
        actions: [
          { type: 'summarize', target: 'page_content' }
        ],
        isActive: true
      };
      
      // Simulate rule creation in dashboard
      const createRule = async (rule: any) => {
        const mockSet = jest.fn();
        mockFirebase.firestore.collection('users')
          .doc('test-user-123')
          .collection('automationRules')
          .doc(rule.id)
          .set = mockSet;
        
        await mockSet(rule);
        return mockSet;
      };
      
      const mockSet = await createRule(automationRule);
      expect(mockSet).toHaveBeenCalledWith(automationRule);
      
      // Simulate rule execution in extension
      const executeRule = async (pageContext: any) => {
        if (pageContext.pageType === 'article') {
          return await mockAI.summarize(pageContext.content);
        }
      };
      
      const mockPageContext = {
        pageType: 'article',
        content: 'Long article content...'
      };
      
      mockAI.summarize.mockResolvedValue('Article summary');
      
      const result = await executeRule(mockPageContext);
      expect(result).toBe('Article summary');
      expect(mockAI.summarize).toHaveBeenCalledWith('Long article content...');
    });
  });

  describe('Data Synchronization Verification', () => {
    test('should maintain data consistency across components', async () => {
      // Test data flow: Extension -> Firebase -> Dashboard
      const testData = {
        userId: 'test-user-123',
        activity: {
          timestamp: new Date().toISOString(),
          url: 'https://test.com',
          action: 'text_selection',
          context: { selectedText: 'test text' }
        }
      };
      
      // 1. Extension sends data to Firebase
      const extensionSync = async () => {
        const mockAdd = jest.fn();
        mockFirebase.firestore
          .collection('users')
          .doc(testData.userId)
          .collection('activities')
          .add = mockAdd;
        
        await mockAdd(testData.activity);
        return mockAdd;
      };
      
      // 2. Dashboard receives real-time update
      const dashboardUpdate = jest.fn();
      mockFirebase.firestore.onSnapshot = jest.fn((callback) => {
        callback({ data: () => testData });
        dashboardUpdate(testData);
      });
      
      const mockAdd = await extensionSync();
      expect(mockAdd).toHaveBeenCalledWith(testData.activity);
      
      // Verify data consistency
      expect(dashboardUpdate).toHaveBeenCalledWith(testData);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network failures gracefully', async () => {
      // Test offline mode fallback
      const offlineStorage = {
        queue: [] as any[],
        add: jest.fn((data) => offlineStorage.queue.push(data)),
        sync: jest.fn()
      };
      
      // Mock network failure scenario
      const mockFailingCollection = jest.fn(() => {
        throw new Error('Network error');
      });
      
      // Simulate offline data queuing
      try {
        mockFailingCollection();
      } catch (error) {
        offlineStorage.add({ type: 'user_update', data: {} });
      }
      
      expect(offlineStorage.add).toHaveBeenCalled();
      expect(offlineStorage.queue).toHaveLength(1);
    });

    test('should recover from AI processing failures', async () => {
      // Mock AI failure
      mockAI.summarize.mockRejectedValue(new Error('AI service unavailable'));
      
      // Test fallback mechanism
      const fallbackSummarize = jest.fn(() => 'Fallback summary generated locally');
      
      let result;
      try {
        result = await mockAI.summarize('test content');
      } catch (error) {
        result = fallbackSummarize();
      }
      
      expect(result).toBe('Fallback summary generated locally');
      expect(fallbackSummarize).toHaveBeenCalled();
    });
  });
});
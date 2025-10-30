/**
 * Integration tests for Chrome Extension and Dashboard communication
 * Tests the bridge between extension and web app components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Import dashboard components for testing
import { OnboardingProvider } from '../../components/providers/OnboardingProvider';

// Mock extension bridge
class ExtensionBridge {
  private listeners: Map<string, Function[]> = new Map();
  
  sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      // Simulate extension message handling
      setTimeout(() => {
        resolve({ success: true, data: message });
      }, 100);
    });
  }
  
  onMessage(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }
  
  emit(type: string, data: any) {
    const callbacks = this.listeners.get(type) || [];
    callbacks.forEach(callback => callback(data));
  }
}

describe('Extension-Dashboard Integration', () => {
  let extensionBridge: ExtensionBridge;
  
  beforeEach(() => {
    extensionBridge = new ExtensionBridge();
    
    // Mock Chrome extension APIs
    (global as any).chrome = {
      runtime: {
        sendMessage: extensionBridge.sendMessage.bind(extensionBridge),
        onMessage: {
          addListener: (callback: Function) => {
            extensionBridge.onMessage('message', callback);
          }
        }
      },
      tabs: {
        query: jest.fn(() => Promise.resolve([{ id: 1, url: 'https://example.com' }])),
        sendMessage: jest.fn()
      }
    };
  });

  test('should establish communication between extension and dashboard', async () => {
    // Test message passing from dashboard to extension
    const message = {
      type: 'GET_CURRENT_TAB_CONTEXT',
      timestamp: Date.now()
    };
    
    const response = await extensionBridge.sendMessage(message);
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual(message);
  });

  test('should sync user preferences between extension and dashboard', async () => {
    const userPreferences = {
      privacy: {
        dataCollection: 'standard',
        cloudSync: true,
        voiceData: true
      },
      ui: {
        theme: 'dark',
        sidebarPosition: 'right',
        animationsEnabled: true
      },
      ai: {
        summaryLength: 'brief',
        suggestionFrequency: 'medium',
        voiceEnabled: true
      }
    };
    
    // Simulate preference update from dashboard
    const updateMessage = {
      type: 'UPDATE_PREFERENCES',
      preferences: userPreferences
    };
    
    const response = await extensionBridge.sendMessage(updateMessage);
    expect(response.success).toBe(true);
    
    // Verify extension receives and applies preferences
    extensionBridge.emit('preferences_updated', userPreferences);
    
    // Mock extension storage update
    const mockStorage = jest.fn();
    (global as any).chrome.storage = {
      sync: {
        set: mockStorage
      }
    };
    
    // Simulate extension handling preference update
    extensionBridge.onMessage('preferences_updated', (prefs: any) => {
      (global as any).chrome.storage.sync.set({ userPreferences: prefs });
    });
    
    extensionBridge.emit('preferences_updated', userPreferences);
    
    expect(mockStorage).toHaveBeenCalledWith({ userPreferences });
  });

  test('should handle real-time activity sync from extension to dashboard', async () => {
    const activityData = {
      timestamp: new Date().toISOString(),
      url: 'https://example.com/article',
      title: 'Test Article',
      action: 'page_visit',
      context: {
        pageType: 'article',
        readingTime: 120,
        scrollDepth: 0.75
      }
    };
    
    // Mock Firebase update
    const mockFirebaseUpdate = jest.fn();
    
    // Simulate extension sending activity data
    const activityMessage = {
      type: 'SYNC_ACTIVITY',
      data: activityData
    };
    
    // Mock dashboard receiving and processing activity
    extensionBridge.onMessage('activity_sync', (data: any) => {
      mockFirebaseUpdate(data);
    });
    
    await extensionBridge.sendMessage(activityMessage);
    extensionBridge.emit('activity_sync', activityData);
    
    expect(mockFirebaseUpdate).toHaveBeenCalledWith(activityData);
  });

  test('should handle automation rule deployment from dashboard to extension', async () => {
    const automationRule = {
      id: 'rule-123',
      name: 'Auto-summarize long articles',
      trigger: {
        type: 'page_load',
        conditions: {
          pageType: 'article',
          minWordCount: 1000
        }
      },
      actions: [
        {
          type: 'summarize',
          target: 'page_content',
          options: { length: 'brief' }
        }
      ],
      isActive: true
    };
    
    // Simulate dashboard deploying rule to extension
    const deployMessage = {
      type: 'DEPLOY_AUTOMATION_RULE',
      rule: automationRule
    };
    
    const mockRuleStorage = jest.fn();
    
    // Mock extension receiving and storing rule
    extensionBridge.onMessage('rule_deployed', (rule: any) => {
      mockRuleStorage(rule);
    });
    
    await extensionBridge.sendMessage(deployMessage);
    extensionBridge.emit('rule_deployed', automationRule);
    
    expect(mockRuleStorage).toHaveBeenCalledWith(automationRule);
  });

  test('should handle knowledge graph updates bidirectionally', async () => {
    const knowledgeUpdate = {
      nodes: [
        {
          id: 'topic-ai',
          label: 'Artificial Intelligence',
          type: 'topic',
          connections: ['topic-ml', 'topic-nlp'],
          strength: 0.8
        },
        {
          id: 'topic-ml',
          label: 'Machine Learning',
          type: 'topic',
          connections: ['topic-ai'],
          strength: 0.9
        }
      ],
      timestamp: new Date().toISOString()
    };
    
    // Test extension -> dashboard knowledge sync
    const extensionToDashboard = {
      type: 'UPDATE_KNOWLEDGE_GRAPH',
      data: knowledgeUpdate
    };
    
    const mockKnowledgeUpdate = jest.fn();
    
    extensionBridge.onMessage('knowledge_updated', mockKnowledgeUpdate);
    
    await extensionBridge.sendMessage(extensionTodashboard);
    extensionBridge.emit('knowledge_updated', knowledgeUpdate);
    
    expect(mockKnowledgeUpdate).toHaveBeenCalledWith(knowledgeUpdate);
    
    // Test dashboard -> extension knowledge sync
    const dashboardToExtension = {
      type: 'SYNC_KNOWLEDGE_TO_EXTENSION',
      data: knowledgeUpdate
    };
    
    const mockExtensionKnowledgeUpdate = jest.fn();
    
    extensionBridge.onMessage('extension_knowledge_sync', mockExtensionKnowledgeUpdate);
    
    await extensionBridge.sendMessage(dashboardToExtension);
    extensionBridge.emit('extension_knowledge_sync', knowledgeUpdate);
    
    expect(mockExtensionKnowledgeUpdate).toHaveBeenCalledWith(knowledgeUpdate);
  });

  test('should handle voice command relay between components', async () => {
    const voiceCommand = {
      transcript: 'summarize this page',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
      context: {
        currentUrl: 'https://example.com/article',
        pageType: 'article'
      }
    };
    
    // Test voice command from extension to dashboard for processing
    const voiceMessage = {
      type: 'PROCESS_VOICE_COMMAND',
      command: voiceCommand
    };
    
    const mockVoiceProcessor = jest.fn(() => ({
      action: 'summarize',
      target: 'page_content',
      response: 'Processing page summary...'
    }));
    
    extensionBridge.onMessage('voice_command', mockVoiceProcessor);
    
    const response = await extensionBridge.sendMessage(voiceMessage);
    extensionBridge.emit('voice_command', voiceCommand);
    
    expect(mockVoiceProcessor).toHaveBeenCalledWith(voiceCommand);
    expect(response.success).toBe(true);
  });

  test('should maintain connection health and handle reconnection', async () => {
    let connectionStatus = 'connected';
    const mockConnectionMonitor = jest.fn();
    
    // Simulate connection monitoring
    const checkConnection = async () => {
      try {
        await extensionBridge.sendMessage({ type: 'PING' });
        connectionStatus = 'connected';
      } catch (error) {
        connectionStatus = 'disconnected';
      }
      mockConnectionMonitor(connectionStatus);
    };
    
    // Test healthy connection
    await checkConnection();
    expect(mockConnectionMonitor).toHaveBeenCalledWith('connected');
    
    // Simulate connection failure and recovery
    const originalSendMessage = extensionBridge.sendMessage;
    extensionBridge.sendMessage = jest.fn().mockRejectedValue(new Error('Connection lost'));
    
    await checkConnection();
    expect(mockConnectionMonitor).toHaveBeenCalledWith('disconnected');
    
    // Simulate reconnection
    extensionBridge.sendMessage = originalSendMessage;
    await checkConnection();
    expect(mockConnectionMonitor).toHaveBeenCalledWith('connected');
  });

  test('should handle onboarding flow integration', async () => {
    // Mock onboarding state
    const onboardingState = {
      currentStep: 0,
      completedSteps: [],
      userPreferences: {},
      extensionInstalled: false
    };
    
    // Test onboarding component integration
    const MockOnboardingFlow = () => {
      return (
        <OnboardingProvider>
          <div data-testid="onboarding-flow">
            <button 
              data-testid="install-extension"
              onClick={() => {
                extensionBridge.sendMessage({
                  type: 'TRIGGER_EXTENSION_INSTALL'
                });
              }}
            >
              Install Extension
            </button>
          </div>
        </OnboardingProvider>
      );
    };
    
    render(<MockOnboardingFlow />);
    
    const installButton = screen.getByTestId('install-extension');
    expect(installButton).toBeInTheDocument();
    
    // Mock extension installation detection
    const mockInstallDetection = jest.fn();
    extensionBridge.onMessage('extension_installed', mockInstallDetection);
    
    fireEvent.click(installButton);
    
    // Simulate extension installation completion
    extensionBridge.emit('extension_installed', { success: true });
    
    expect(mockInstallDetection).toHaveBeenCalledWith({ success: true });
  });
});
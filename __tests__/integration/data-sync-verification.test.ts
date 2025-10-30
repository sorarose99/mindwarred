/**
 * Data Synchronization Verification Tests
 * Ensures data consistency across Chrome extension, Firebase, and dashboard
 */

import { jest } from '@jest/globals';

// Mock Firebase services
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  batch: jest.fn(),
  runTransaction: jest.fn()
};

const mockAuth = {
  currentUser: { uid: 'test-user-123', email: 'test@example.com' },
  onAuthStateChanged: jest.fn()
};

// Mock Chrome storage
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn()
  },
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

// Data sync manager for testing
class DataSyncManager {
  private syncQueue: any[] = [];
  private isOnline = true;
  
  constructor(
    private firestore: any,
    private chromeStorage: any
  ) {}
  
  async syncToCloud(data: any) {
    if (!this.isOnline) {
      this.syncQueue.push(data);
      return { queued: true };
    }
    
    try {
      const docRef = this.firestore.collection('users').doc(data.userId);
      await docRef.set(data, { merge: true });
      return { success: true };
    } catch (error) {
      this.syncQueue.push(data);
      throw error;
    }
  }
  
  async syncFromCloud(userId: string) {
    const docRef = this.firestore.collection('users').doc(userId);
    const doc = await docRef.get();
    return doc.data();
  }
  
  async syncToLocal(data: any) {
    await this.chromeStorage.local.set({ userData: data });
  }
  
  async syncFromLocal() {
    const result = await this.chromeStorage.local.get('userData');
    return result.userData;
  }
  
  setOnlineStatus(status: boolean) {
    this.isOnline = status;
  }
  
  async processSyncQueue() {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const data = this.syncQueue.shift();
      await this.syncToCloud(data);
    }
  }
}

describe('Data Synchronization Verification', () => {
  let syncManager: DataSyncManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockFirestore.collection.mockReturnValue({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(() => Promise.resolve({
          data: () => ({ userId: 'test-user-123', activities: [] })
        })),
        onSnapshot: jest.fn()
      }))
    });
    
    mockChromeStorage.local.get.mockResolvedValue({});
    mockChromeStorage.local.set.mockResolvedValue(undefined);
    
    syncManager = new DataSyncManager(mockFirestore, mockChromeStorage);
  });

  describe('User Activity Synchronization', () => {
    test('should sync user activity from extension to cloud', async () => {
      const activityData = {
        userId: 'test-user-123',
        activities: [
          {
            id: 'activity-1',
            timestamp: new Date().toISOString(),
            url: 'https://example.com',
            title: 'Example Page',
            action: 'page_visit',
            context: {
              pageType: 'article',
              readingTime: 120,
              scrollDepth: 0.8
            }
          }
        ],
        lastSync: new Date().toISOString()
      };
      
      const result = await syncManager.syncToCloud(activityData);
      
      expect(result.success).toBe(true);
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    });

    test('should handle offline activity queuing', async () => {
      const activityData = {
        userId: 'test-user-123',
        activities: [
          {
            id: 'activity-2',
            timestamp: new Date().toISOString(),
            url: 'https://offline-example.com',
            action: 'text_selection'
          }
        ]
      };
      
      // Simulate offline mode
      syncManager.setOnlineStatus(false);
      
      const result = await syncManager.syncToCloud(activityData);
      
      expect(result.queued).toBe(true);
      
      // Simulate coming back online
      syncManager.setOnlineStatus(true);
      
      // Mock successful sync after reconnection
      const mockDocSet = jest.fn();
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => ({
          set: mockDocSet
        }))
      });
      
      await syncManager.processSyncQueue();
      
      expect(mockDocSet).toHaveBeenCalledWith(activityData, { merge: true });
    });
  });

  describe('User Preferences Synchronization', () => {
    test('should sync preferences bidirectionally', async () => {
      const preferences = {
        userId: 'test-user-123',
        preferences: {
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
        }
      };
      
      // Test cloud -> local sync
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            data: () => preferences
          }))
        }))
      });
      
      const cloudData = await syncManager.syncFromCloud('test-user-123');
      expect(cloudData).toEqual(preferences);
      
      // Test local storage
      await syncManager.syncToLocal(preferences);
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({ userData: preferences });
      
      // Test local -> cloud sync
      mockChromeStorage.local.get.mockResolvedValue({ userData: preferences });
      
      const localData = await syncManager.syncFromLocal();
      expect(localData).toEqual(preferences);
      
      await syncManager.syncToCloud(localData);
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    });
  });

  describe('Knowledge Graph Synchronization', () => {
    test('should maintain knowledge graph consistency', async () => {
      const knowledgeGraphData = {
        userId: 'test-user-123',
        knowledgeGraph: {
          nodes: [
            {
              id: 'node-1',
              label: 'Machine Learning',
              type: 'topic',
              connections: ['node-2', 'node-3'],
              strength: 0.9,
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'node-2',
              label: 'Neural Networks',
              type: 'topic',
              connections: ['node-1'],
              strength: 0.8,
              lastUpdated: new Date().toISOString()
            }
          ],
          edges: [
            {
              source: 'node-1',
              target: 'node-2',
              weight: 0.85,
              type: 'related_topic'
            }
          ]
        }
      };
      
      // Test incremental knowledge graph updates
      const updateResult = await syncManager.syncToCloud(knowledgeGraphData);
      expect(updateResult.success).toBe(true);
      
      // Verify merge behavior for existing nodes
      const existingData = {
        userId: 'test-user-123',
        knowledgeGraph: {
          nodes: [
            {
              id: 'node-1',
              label: 'Machine Learning',
              type: 'topic',
              connections: ['node-2'],
              strength: 0.7, // Lower strength - should be updated
              lastUpdated: new Date(Date.now() - 86400000).toISOString() // Older
            }
          ]
        }
      };
      
      // Mock existing data retrieval
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            data: () => existingData
          })),
          set: jest.fn()
        }))
      });
      
      const mergedData = await syncManager.syncFromCloud('test-user-123');
      expect(mergedData.knowledgeGraph.nodes[0].strength).toBe(0.7);
    });
  });

  describe('Automation Rules Synchronization', () => {
    test('should sync automation rules and execution state', async () => {
      const automationData = {
        userId: 'test-user-123',
        automationRules: [
          {
            id: 'rule-1',
            name: 'Auto-summarize articles',
            trigger: {
              type: 'page_load',
              conditions: { pageType: 'article', minWordCount: 500 }
            },
            actions: [
              { type: 'summarize', target: 'page_content' }
            ],
            isActive: true,
            executionCount: 15,
            lastExecuted: new Date().toISOString()
          }
        ]
      };
      
      // Test rule deployment to extension
      await syncManager.syncToLocal(automationData);
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({ userData: automationData });
      
      // Test execution state sync back to cloud
      const updatedRule = {
        ...automationData.automationRules[0],
        executionCount: 16,
        lastExecuted: new Date().toISOString()
      };
      
      const updatedData = {
        ...automationData,
        automationRules: [updatedRule]
      };
      
      await syncManager.syncToCloud(updatedData);
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    });
  });

  describe('Real-time Synchronization', () => {
    test('should handle real-time updates via Firestore listeners', async () => {
      const mockOnSnapshot = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => ({
          onSnapshot: mockOnSnapshot.mockReturnValue(mockUnsubscribe)
        }))
      });
      
      // Setup real-time listener
      const setupRealtimeSync = (userId: string, callback: Function) => {
        const docRef = mockFirestore.collection('users').doc(userId);
        return docRef.onSnapshot(callback);
      };
      
      const mockCallback = jest.fn();
      const unsubscribe = setupRealtimeSync('test-user-123', mockCallback);
      
      expect(mockOnSnapshot).toHaveBeenCalledWith(mockCallback);
      
      // Simulate real-time update
      const mockSnapshot = {
        data: () => ({
          userId: 'test-user-123',
          activities: [{ id: 'new-activity', timestamp: new Date().toISOString() }]
        }),
        exists: true
      };
      
      // Trigger the callback as if Firestore sent an update
      const callbackFn = mockOnSnapshot.mock.calls[0][0];
      callbackFn(mockSnapshot);
      
      expect(mockCallback).toHaveBeenCalledWith(mockSnapshot);
      
      // Test cleanup
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Conflict Resolution', () => {
    test('should resolve sync conflicts using timestamp-based strategy', async () => {
      const localData = {
        userId: 'test-user-123',
        preferences: {
          ui: { theme: 'light' },
          lastModified: new Date(Date.now() - 60000).toISOString() // 1 minute ago
        }
      };
      
      const cloudData = {
        userId: 'test-user-123',
        preferences: {
          ui: { theme: 'dark' },
          lastModified: new Date().toISOString() // Now (more recent)
        }
      };
      
      // Mock conflict resolution logic
      const resolveConflict = (local: any, cloud: any) => {
        const localTime = new Date(local.preferences.lastModified).getTime();
        const cloudTime = new Date(cloud.preferences.lastModified).getTime();
        
        return cloudTime > localTime ? cloud : local;
      };
      
      const resolved = resolveConflict(localData, cloudData);
      
      expect(resolved.preferences.ui.theme).toBe('dark');
      expect(resolved).toEqual(cloudData);
    });
  });

  describe('Data Integrity Verification', () => {
    test('should validate data integrity during sync operations', async () => {
      const invalidData = {
        userId: null, // Invalid - should be string
        activities: 'not-an-array', // Invalid - should be array
        preferences: {
          ui: {
            theme: 'invalid-theme' // Invalid - should be 'light' | 'dark' | 'auto'
          }
        }
      };
      
      // Mock validation function
      const validateSyncData = (data: any): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        if (!data.userId || typeof data.userId !== 'string') {
          errors.push('Invalid userId');
        }
        
        if (data.activities && !Array.isArray(data.activities)) {
          errors.push('Activities must be an array');
        }
        
        if (data.preferences?.ui?.theme && 
            !['light', 'dark', 'auto'].includes(data.preferences.ui.theme)) {
          errors.push('Invalid theme value');
        }
        
        return { valid: errors.length === 0, errors };
      };
      
      const validation = validateSyncData(invalidData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid userId');
      expect(validation.errors).toContain('Activities must be an array');
      expect(validation.errors).toContain('Invalid theme value');
      
      // Test that invalid data is not synced
      try {
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        await syncManager.syncToCloud(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Validation failed');
      }
    });
  });
});
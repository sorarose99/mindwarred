// Tests for real-time synchronization functionality
import { RealTimeSyncService } from '../../lib/sync/real-time-sync'
import { OptimisticUpdateService } from '../../lib/sync/optimistic-updates'
import { OfflineCacheService } from '../../lib/sync/offline-cache'
import { SyncManager } from '../../lib/sync/sync-manager'

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn()
  }))
}))

jest.mock('../../lib/firebase', () => ({
  db: {}
}))

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(),
  transaction: jest.fn(),
  objectStore: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn()
}

global.indexedDB = mockIDB as any

describe('RealTimeSyncService', () => {
  let syncService: RealTimeSyncService
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    syncService = new RealTimeSyncService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    syncService.unsubscribeAll()
  })

  describe('Activity Subscriptions', () => {
    test('should subscribe to activities and handle events', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()
      
      // Mock onSnapshot
      const { onSnapshot } = require('firebase/firestore')
      onSnapshot.mockImplementation((query: any, callback: any) => {
        // Simulate a document change
        setTimeout(() => {
          callback({
            docChanges: () => [{
              type: 'added',
              doc: {
                id: 'activity-1',
                data: () => ({
                  url: 'https://example.com',
                  timestamp: new Date(),
                  type: 'page_visit'
                })
              }
            }]
          })
        }, 100)
        
        return mockUnsubscribe
      })

      const subscriptionId = syncService.subscribeToActivities(mockUserId, mockCallback)

      expect(subscriptionId).toBe(`activities_${mockUserId}`)
      expect(onSnapshot).toHaveBeenCalled()

      // Wait for the callback to be triggered
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledWith({
          type: 'added',
          id: 'activity-1',
          data: expect.objectContaining({
            url: 'https://example.com',
            type: 'page_visit'
          }),
          timestamp: expect.any(Number),
          source: 'server'
        })
      }, 150)
    })

    test('should handle subscription errors gracefully', () => {
      const mockCallback = jest.fn()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { onSnapshot } = require('firebase/firestore')
      onSnapshot.mockImplementation((query: any, successCallback: any, errorCallback: any) => {
        // Simulate an error
        setTimeout(() => {
          errorCallback(new Error('Network error'))
        }, 100)
        
        return jest.fn()
      })

      syncService.subscribeToActivities(mockUserId, mockCallback)

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Activities subscription error:'),
          expect.any(Error)
        )
      }, 150)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Connection Management', () => {
    test('should track online/offline status', () => {
      const initialStatus = syncService.getConnectionStatus()
      expect(initialStatus.isOnline).toBe(navigator.onLine)
      expect(initialStatus.pendingOperations).toBe(0)
    })

    test('should handle offline operations', () => {
      const operationId = 'test-op-1'
      const operation = {
        type: 'create',
        ref: {},
        data: { test: 'data' }
      }

      syncService.addPendingOperation(operationId, operation)
      
      const status = syncService.getConnectionStatus()
      expect(status.pendingOperations).toBe(1)
    })
  })

  describe('Subscription Management', () => {
    test('should unsubscribe from specific subscription', () => {
      const mockUnsubscribe = jest.fn()
      const { onSnapshot } = require('firebase/firestore')
      onSnapshot.mockReturnValue(mockUnsubscribe)

      const subscriptionId = syncService.subscribeToActivities(mockUserId, jest.fn())
      syncService.unsubscribe(subscriptionId)

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    test('should unsubscribe from all subscriptions', () => {
      const mockUnsubscribe1 = jest.fn()
      const mockUnsubscribe2 = jest.fn()
      const { onSnapshot } = require('firebase/firestore')
      onSnapshot
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)

      syncService.subscribeToActivities(mockUserId, jest.fn())
      syncService.subscribeToAutomationRules(mockUserId, jest.fn())
      
      syncService.unsubscribeAll()

      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(mockUnsubscribe2).toHaveBeenCalled()
    })
  })
})

describe('OptimisticUpdateService', () => {
  let optimisticService: OptimisticUpdateService
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    optimisticService = new OptimisticUpdateService()
    jest.clearAllMocks()
  })

  describe('Create Operations', () => {
    test('should perform optimistic create', async () => {
      const { addDoc } = require('firebase/firestore')
      addDoc.mockResolvedValue({ id: 'new-doc-id' })

      const testData = { name: 'Test Automation', isActive: true }
      const { tempId, promise } = await optimisticService.optimisticCreate(
        mockUserId,
        'automations',
        testData
      )

      expect(tempId).toMatch(/^temp_/)
      expect(optimisticService.getPendingOperationsCount()).toBe(1)

      const actualId = await promise
      expect(actualId).toBe('new-doc-id')
      expect(optimisticService.getPendingOperationsCount()).toBe(0)
    })

    test('should handle create failures with retry', async () => {
      const { addDoc } = require('firebase/firestore')
      addDoc.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'retry-success-id' })

      const testData = { name: 'Test Automation', isActive: true }
      const { promise } = await optimisticService.optimisticCreate(
        mockUserId,
        'automations',
        testData
      )

      // Should eventually succeed after retry
      await expect(promise).resolves.toBe('retry-success-id')
    })
  })

  describe('Update Operations', () => {
    test('should perform optimistic update', async () => {
      const { runTransaction } = require('firebase/firestore')
      runTransaction.mockImplementation(async (db: any, updateFunction: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ name: 'Original', updatedAt: { toMillis: () => Date.now() - 1000 } })
          }),
          update: jest.fn()
        }
        await updateFunction(mockTransaction)
      })

      const updates = { name: 'Updated Name' }
      const { promise } = await optimisticService.optimisticUpdate(
        mockUserId,
        'automations',
        'doc-id',
        updates
      )

      await expect(promise).resolves.toBeUndefined()
      expect(optimisticService.getPendingOperationsCount()).toBe(0)
    })
  })

  describe('Conflict Resolution', () => {
    test('should detect and resolve conflicts', async () => {
      const { runTransaction } = require('firebase/firestore')
      
      runTransaction.mockImplementation(async (db: any, updateFunction: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ 
              name: 'Server Version', 
              updatedAt: { toMillis: () => Date.now() } // Newer than client
            })
          }),
          update: jest.fn()
        }
        await updateFunction(mockTransaction)
      })

      const originalData = { 
        name: 'Original', 
        updatedAt: { toMillis: () => Date.now() - 5000 } 
      }
      const updates = { name: 'Client Version' }

      const { promise } = await optimisticService.optimisticUpdate(
        mockUserId,
        'automations',
        'doc-id',
        updates,
        originalData
      )

      await expect(promise).resolves.toBeUndefined()
    })
  })
})

describe('OfflineCacheService', () => {
  let cacheService: OfflineCacheService

  beforeEach(async () => {
    cacheService = new OfflineCacheService()
    
    // Mock IndexedDB operations
    mockIDB.open.mockResolvedValue({
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          put: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          getAll: jest.fn().mockResolvedValue([]),
          index: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([])
          })
        })
      }),
      close: jest.fn()
    })
  })

  afterEach(async () => {
    await cacheService.close()
  })

  describe('Cache Operations', () => {
    test('should cache data successfully', async () => {
      await cacheService.initialize()
      
      const testData = { name: 'Test Activity', url: 'https://example.com' }
      await expect(
        cacheService.cacheData('activities', 'test-id', 'user-123', testData)
      ).resolves.toBeUndefined()
    })

    test('should retrieve cached data', async () => {
      await cacheService.initialize()
      
      const mockEntry = {
        id: 'test-id',
        userId: 'user-123',
        data: { name: 'Test Activity' },
        timestamp: Date.now(),
        synced: true,
        lastModified: Date.now()
      }

      // Mock the get operation
      const mockStore = {
        get: jest.fn().mockResolvedValue(mockEntry)
      }
      mockIDB.open.mockResolvedValue({
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue(mockStore)
        })
      })

      const result = await cacheService.getCachedData('activities', 'test-id')
      expect(result).toEqual(mockEntry)
    })

    test('should handle expired cache entries', async () => {
      await cacheService.initialize()
      
      const expiredEntry = {
        id: 'test-id',
        userId: 'user-123',
        data: { name: 'Test Activity' },
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days old
        synced: true,
        lastModified: Date.now()
      }

      const mockStore = {
        get: jest.fn().mockResolvedValue(expiredEntry),
        delete: jest.fn()
      }
      mockIDB.open.mockResolvedValue({
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue(mockStore)
        })
      })

      const result = await cacheService.getCachedData('activities', 'test-id')
      expect(result).toBeNull()
      expect(mockStore.delete).toHaveBeenCalledWith('test-id')
    })
  })

  describe('Cache Statistics', () => {
    test('should provide accurate cache statistics', async () => {
      await cacheService.initialize()
      
      const stats = await cacheService.getCacheStats('user-123')
      expect(stats).toHaveProperty('totalEntries')
      expect(stats).toHaveProperty('unsyncedEntries')
      expect(stats).toHaveProperty('cacheSize')
      expect(stats).toHaveProperty('collections')
    })
  })
})

describe('SyncManager Integration', () => {
  let syncManager: SyncManager
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    syncManager = new SyncManager({
      userId: mockUserId,
      enableRealTime: true,
      enableOptimistic: true,
      enableOffline: true
    })
  })

  afterEach(async () => {
    await syncManager.destroy()
  })

  test('should initialize successfully', async () => {
    await expect(syncManager.initialize()).resolves.toBeUndefined()
  })

  test('should provide sync status', async () => {
    await syncManager.initialize()
    
    const status = await syncManager.getSyncStatus()
    expect(status).toHaveProperty('isOnline')
    expect(status).toHaveProperty('isRealTimeConnected')
    expect(status).toHaveProperty('pendingOperations')
    expect(status).toHaveProperty('unsyncedItems')
  })

  test('should handle subscription lifecycle', async () => {
    await syncManager.initialize()
    
    const mockCallback = jest.fn()
    const subscriptionId = syncManager.subscribe('activities', mockCallback)
    
    expect(subscriptionId).toBeTruthy()
    
    syncManager.unsubscribe(subscriptionId)
    // Should not throw
  })
})
// Main synchronization manager that coordinates real-time sync, optimistic updates, and offline caching
import { realTimeSyncService, SyncEvent } from './real-time-sync'
import { optimisticUpdateService } from './optimistic-updates'
import { offlineCacheService } from './offline-cache'
import type {
  ActivityRecord,
  AutomationRule,
  KnowledgeNode,
  UserPreferences,
  ServiceIntegration,
  LearningInsight
} from '../types'

export interface SyncManagerOptions {
  enableRealTime?: boolean
  enableOptimistic?: boolean
  enableOffline?: boolean
  userId: string
}

export interface SyncStatus {
  isOnline: boolean
  isRealTimeConnected: boolean
  pendingOperations: number
  unsyncedItems: number
  lastSyncTime?: number
}

export type DataType = 'activities' | 'automations' | 'knowledge' | 'preferences' | 'integrations' | 'insights'

export class SyncManager {
  private options: SyncManagerOptions
  private subscriptions = new Map<string, string>()
  private eventHandlers = new Map<string, Set<(event: SyncEvent) => void>>()
  private isInitialized = false

  constructor(options: SyncManagerOptions) {
    this.options = {
      enableRealTime: true,
      enableOptimistic: true,
      enableOffline: true,
      ...options
    }
  }

  // Initialize the sync manager
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize offline cache
      if (this.options.enableOffline) {
        await offlineCacheService.initialize()
      }

      // Set up real-time subscriptions
      if (this.options.enableRealTime) {
        await this.setupRealTimeSubscriptions()
      }

      // Sync any unsynced offline data
      if (this.options.enableOffline) {
        await this.syncOfflineData()
      }

      this.isInitialized = true
      console.log('Sync manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize sync manager:', error)
      throw error
    }
  }

  // Subscribe to data changes for a specific type
  subscribe<T>(
    dataType: DataType,
    callback: (event: SyncEvent<T>) => void
  ): string {
    const subscriptionId = `${dataType}_${Date.now()}`
    
    // Store the callback
    if (!this.eventHandlers.has(dataType)) {
      this.eventHandlers.set(dataType, new Set())
    }
    this.eventHandlers.get(dataType)!.add(callback)

    // Set up real-time subscription if enabled
    if (this.options.enableRealTime) {
      let realTimeSubId: string
      
      switch (dataType) {
        case 'activities':
          realTimeSubId = realTimeSyncService.subscribeToActivities(
            this.options.userId,
            (event) => this.handleRealTimeEvent(dataType, event, callback)
          )
          break
        case 'automations':
          realTimeSubId = realTimeSyncService.subscribeToAutomationRules(
            this.options.userId,
            (event) => this.handleRealTimeEvent(dataType, event, callback)
          )
          break
        case 'knowledge':
          realTimeSubId = realTimeSyncService.subscribeToKnowledgeNodes(
            this.options.userId,
            (event) => this.handleRealTimeEvent(dataType, event, callback)
          )
          break
        case 'preferences':
          realTimeSubId = realTimeSyncService.subscribeToPreferences(
            this.options.userId,
            (event) => this.handleRealTimeEvent(dataType, event, callback)
          )
          break
        case 'integrations':
          realTimeSubId = realTimeSyncService.subscribeToIntegrations(
            this.options.userId,
            (event) => this.handleRealTimeEvent(dataType, event, callback)
          )
          break
        case 'insights':
          realTimeSubId = realTimeSyncService.subscribeToInsights(
            this.options.userId,
            (event) => this.handleRealTimeEvent(dataType, event, callback)
          )
          break
        default:
          throw new Error(`Unsupported data type: ${dataType}`)
      }
      
      this.subscriptions.set(subscriptionId, realTimeSubId)
    }

    return subscriptionId
  }

  // Unsubscribe from data changes
  unsubscribe(subscriptionId: string): void {
    const realTimeSubId = this.subscriptions.get(subscriptionId)
    if (realTimeSubId) {
      realTimeSyncService.unsubscribe(realTimeSubId)
      this.subscriptions.delete(subscriptionId)
    }
  }

  // Create data with optimistic updates
  async create<T extends { id?: string }>(
    dataType: DataType,
    data: Omit<T, 'id'>,
    tempId?: string
  ): Promise<{ tempId: string; promise: Promise<string> }> {
    if (!this.options.enableOptimistic) {
      throw new Error('Optimistic updates are disabled')
    }

    // Cache optimistically if offline support is enabled
    if (this.options.enableOffline) {
      const cacheId = tempId || `temp_${Date.now()}_${Math.random()}`
      await offlineCacheService.cacheData(
        dataType,
        cacheId,
        this.options.userId,
        data,
        false // Not synced yet
      )
    }

    return optimisticUpdateService.optimisticCreate(
      this.options.userId,
      dataType,
      data,
      tempId
    )
  }

  // Update data with optimistic updates
  async update<T>(
    dataType: DataType,
    documentId: string,
    updates: Partial<T>,
    originalData?: T
  ): Promise<{ promise: Promise<void> }> {
    if (!this.options.enableOptimistic) {
      throw new Error('Optimistic updates are disabled')
    }

    // Update cache optimistically if offline support is enabled
    if (this.options.enableOffline) {
      await offlineCacheService.updateCachedData(
        dataType,
        documentId,
        updates,
        false // Not synced yet
      )
    }

    return optimisticUpdateService.optimisticUpdate(
      this.options.userId,
      dataType,
      documentId,
      updates,
      originalData
    )
  }

  // Delete data with optimistic updates
  async delete(
    dataType: DataType,
    documentId: string,
    originalData?: any
  ): Promise<{ promise: Promise<void> }> {
    if (!this.options.enableOptimistic) {
      throw new Error('Optimistic updates are disabled')
    }

    // Remove from cache if offline support is enabled
    if (this.options.enableOffline) {
      await offlineCacheService.deleteCachedData(dataType, documentId)
    }

    return optimisticUpdateService.optimisticDelete(
      this.options.userId,
      dataType,
      documentId,
      originalData
    )
  }

  // Get cached data (for offline access)
  async getCachedData<T>(dataType: DataType, documentId?: string): Promise<T | T[] | null> {
    if (!this.options.enableOffline) {
      return null
    }

    if (documentId) {
      const entry = await offlineCacheService.getCachedData<T>(dataType, documentId)
      return entry?.data || null
    } else {
      const entries = await offlineCacheService.getAllCachedData<T>(dataType, this.options.userId)
      return entries.map(entry => entry.data)
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const connectionStatus = realTimeSyncService.getConnectionStatus()
    const pendingOperations = optimisticUpdateService.getPendingOperationsCount()
    
    let unsyncedItems = 0
    if (this.options.enableOffline) {
      const stats = await offlineCacheService.getCacheStats(this.options.userId)
      unsyncedItems = stats.unsyncedEntries
    }

    return {
      isOnline: connectionStatus.isOnline,
      isRealTimeConnected: this.subscriptions.size > 0,
      pendingOperations,
      unsyncedItems,
      lastSyncTime: await offlineCacheService.getMetadata('lastSyncTime')
    }
  }

  // Force sync all offline data
  async forceSyncAll(): Promise<void> {
    if (!this.options.enableOffline) {
      return
    }

    await this.syncOfflineData()
    await offlineCacheService.setMetadata('lastSyncTime', Date.now())
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    if (this.options.enableOffline) {
      await offlineCacheService.clearUserCache(this.options.userId)
    }
  }

  // Handle real-time events and update cache
  private async handleRealTimeEvent<T>(
    dataType: DataType,
    event: SyncEvent<T>,
    callback: (event: SyncEvent<T>) => void
  ): Promise<void> {
    // Update cache with server data
    if (this.options.enableOffline && event.source === 'server') {
      if (event.type === 'removed') {
        await offlineCacheService.deleteCachedData(dataType, event.id)
      } else {
        await offlineCacheService.cacheData(
          dataType,
          event.id,
          this.options.userId,
          event.data,
          true // Synced from server
        )
      }
    }

    // Call the original callback
    callback(event)
  }

  // Set up real-time subscriptions
  private async setupRealTimeSubscriptions(): Promise<void> {
    // Real-time subscriptions are set up per data type when subscribe() is called
    // This method can be used for any global setup if needed
  }

  // Sync offline data when coming back online
  private async syncOfflineData(): Promise<void> {
    if (!this.options.enableOffline) {
      return
    }

    const dataTypes: DataType[] = ['activities', 'automations', 'knowledge', 'preferences', 'integrations', 'insights']
    
    for (const dataType of dataTypes) {
      try {
        const unsyncedEntries = await offlineCacheService.getUnsyncedData(
          dataType,
          this.options.userId
        )

        for (const entry of unsyncedEntries) {
          try {
            // Attempt to sync the entry
            if (entry.id.startsWith('temp_')) {
              // This is a create operation
              await optimisticUpdateService.optimisticCreate(
                this.options.userId,
                dataType,
                entry.data,
                entry.id
              )
            } else {
              // This is an update operation
              await optimisticUpdateService.optimisticUpdate(
                this.options.userId,
                dataType,
                entry.id,
                entry.data
              )
            }

            // Mark as synced
            await offlineCacheService.markAsSynced(dataType, entry.id)
          } catch (error) {
            console.error(`Failed to sync ${dataType} entry ${entry.id}:`, error)
          }
        }
      } catch (error) {
        console.error(`Failed to sync offline data for ${dataType}:`, error)
      }
    }
  }

  // Clean up resources
  async destroy(): Promise<void> {
    // Unsubscribe from all real-time subscriptions
    this.subscriptions.forEach((realTimeSubId) => {
      realTimeSyncService.unsubscribe(realTimeSubId)
    })
    this.subscriptions.clear()

    // Clear event handlers
    this.eventHandlers.clear()

    // Close offline cache
    if (this.options.enableOffline) {
      await offlineCacheService.close()
    }

    this.isInitialized = false
  }
}

// Factory function to create sync manager for a user
export function createSyncManager(userId: string, options: Partial<SyncManagerOptions> = {}): SyncManager {
  return new SyncManager({
    userId,
    ...options
  })
}
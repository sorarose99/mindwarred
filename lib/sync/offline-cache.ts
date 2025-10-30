// Offline support with local caching using IndexedDB
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface KiroCacheDB extends DBSchema {
  activities: {
    key: string
    value: {
      id: string
      userId: string
      data: any
      timestamp: number
      synced: boolean
      lastModified: number
    }
  }
  automations: {
    key: string
    value: {
      id: string
      userId: string
      data: any
      timestamp: number
      synced: boolean
      lastModified: number
    }
  }
  knowledge: {
    key: string
    value: {
      id: string
      userId: string
      data: any
      timestamp: number
      synced: boolean
      lastModified: number
    }
  }
  preferences: {
    key: string
    value: {
      id: string
      userId: string
      data: any
      timestamp: number
      synced: boolean
      lastModified: number
    }
  }
  integrations: {
    key: string
    value: {
      id: string
      userId: string
      data: any
      timestamp: number
      synced: boolean
      lastModified: number
    }
  }
  insights: {
    key: string
    value: {
      id: string
      userId: string
      data: any
      timestamp: number
      synced: boolean
      lastModified: number
    }
  }
  metadata: {
    key: string
    value: {
      key: string
      value: any
      timestamp: number
    }
  }
}

export interface CacheEntry<T = any> {
  id: string
  userId: string
  data: T
  timestamp: number
  synced: boolean
  lastModified: number
}

export interface CacheOptions {
  maxAge?: number // Maximum age in milliseconds
  maxEntries?: number // Maximum number of entries per collection
  syncOnReconnect?: boolean
}

export class OfflineCacheService {
  private db: IDBPDatabase<KiroCacheDB> | null = null
  private isInitialized = false
  private options: CacheOptions

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 1000,
      syncOnReconnect: true,
      ...options
    }
  }

  // Initialize IndexedDB
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.db = await openDB<KiroCacheDB>('kiro-cache', 1, {
        upgrade(db) {
          // Create object stores
          const stores = ['activities', 'automations', 'knowledge', 'preferences', 'integrations', 'insights', 'metadata']
          
          stores.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, { keyPath: 'id' })
              store.createIndex('userId', 'userId')
              store.createIndex('timestamp', 'timestamp')
              store.createIndex('synced', 'synced')
              store.createIndex('lastModified', 'lastModified')
            }
          })
        }
      })

      this.isInitialized = true
      console.log('Offline cache initialized successfully')
    } catch (error) {
      console.error('Failed to initialize offline cache:', error)
      throw error
    }
  }

  // Cache data for offline access
  async cacheData<T>(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    id: string,
    userId: string,
    data: T,
    synced: boolean = true
  ): Promise<void> {
    await this.ensureInitialized()

    const entry: CacheEntry<T> = {
      id,
      userId,
      data,
      timestamp: Date.now(),
      synced,
      lastModified: Date.now()
    }

    try {
      await this.db!.put(collection, entry)
      
      // Clean up old entries if needed
      await this.cleanupCollection(collection, userId)
    } catch (error) {
      console.error(`Failed to cache data in ${collection}:`, error)
      throw error
    }
  }

  // Retrieve cached data
  async getCachedData<T>(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    id: string
  ): Promise<CacheEntry<T> | null> {
    await this.ensureInitialized()

    try {
      const entry = await this.db!.get(collection, id)
      
      if (!entry) return null
      
      // Check if entry is expired
      if (this.isExpired(entry)) {
        await this.db!.delete(collection, id)
        return null
      }
      
      return entry as CacheEntry<T>
    } catch (error) {
      console.error(`Failed to get cached data from ${collection}:`, error)
      return null
    }
  }

  // Get all cached data for a user in a collection
  async getAllCachedData<T>(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    userId: string
  ): Promise<CacheEntry<T>[]> {
    await this.ensureInitialized()

    try {
      const tx = this.db!.transaction(collection, 'readonly')
      const index = tx.store.index('userId')
      const entries = await index.getAll(userId)
      
      // Filter out expired entries
      const validEntries = entries.filter(entry => !this.isExpired(entry))
      
      // Remove expired entries
      const expiredEntries = entries.filter(entry => this.isExpired(entry))
      if (expiredEntries.length > 0) {
        const deleteTx = this.db!.transaction(collection, 'readwrite')
        await Promise.all(
          expiredEntries.map(entry => deleteTx.store.delete(entry.id))
        )
      }
      
      return validEntries as CacheEntry<T>[]
    } catch (error) {
      console.error(`Failed to get all cached data from ${collection}:`, error)
      return []
    }
  }

  // Get unsynced data (for offline operations)
  async getUnsyncedData<T>(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    userId: string
  ): Promise<CacheEntry<T>[]> {
    await this.ensureInitialized()

    try {
      const tx = this.db!.transaction(collection, 'readonly')
      const entries = await tx.store.getAll()
      
      return entries.filter(entry => 
        entry.userId === userId && !entry.synced && !this.isExpired(entry)
      ) as CacheEntry<T>[]
    } catch (error) {
      console.error(`Failed to get unsynced data from ${collection}:`, error)
      return []
    }
  }

  // Mark data as synced
  async markAsSynced(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    id: string
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const entry = await this.db!.get(collection, id)
      if (entry) {
        entry.synced = true
        entry.lastModified = Date.now()
        await this.db!.put(collection, entry)
      }
    } catch (error) {
      console.error(`Failed to mark data as synced in ${collection}:`, error)
    }
  }

  // Update cached data
  async updateCachedData<T>(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    id: string,
    updates: Partial<T>,
    synced: boolean = false
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const entry = await this.db!.get(collection, id)
      if (entry) {
        entry.data = { ...entry.data, ...updates }
        entry.synced = synced
        entry.lastModified = Date.now()
        await this.db!.put(collection, entry)
      }
    } catch (error) {
      console.error(`Failed to update cached data in ${collection}:`, error)
      throw error
    }
  }

  // Delete cached data
  async deleteCachedData(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    id: string
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.db!.delete(collection, id)
    } catch (error) {
      console.error(`Failed to delete cached data from ${collection}:`, error)
      throw error
    }
  }

  // Clear all cached data for a user
  async clearUserCache(userId: string): Promise<void> {
    await this.ensureInitialized()

    const collections: (keyof Omit<KiroCacheDB, 'metadata'>)[] = [
      'activities', 'automations', 'knowledge', 'preferences', 'integrations', 'insights'
    ]

    try {
      await Promise.all(
        collections.map(async (collection) => {
          const tx = this.db!.transaction(collection, 'readwrite')
          const index = tx.store.index('userId')
          const entries = await index.getAll(userId)
          
          await Promise.all(
            entries.map(entry => tx.store.delete(entry.id))
          )
        })
      )
    } catch (error) {
      console.error('Failed to clear user cache:', error)
      throw error
    }
  }

  // Get cache statistics
  async getCacheStats(userId: string): Promise<{
    totalEntries: number
    unsyncedEntries: number
    cacheSize: number
    collections: Record<string, number>
  }> {
    await this.ensureInitialized()

    const collections: (keyof Omit<KiroCacheDB, 'metadata'>)[] = [
      'activities', 'automations', 'knowledge', 'preferences', 'integrations', 'insights'
    ]

    let totalEntries = 0
    let unsyncedEntries = 0
    let cacheSize = 0
    const collectionStats: Record<string, number> = {}

    try {
      for (const collection of collections) {
        const entries = await this.getAllCachedData(collection, userId)
        const unsyncedCount = entries.filter(entry => !entry.synced).length
        
        totalEntries += entries.length
        unsyncedEntries += unsyncedCount
        collectionStats[collection] = entries.length
        
        // Estimate cache size (rough calculation)
        cacheSize += entries.reduce((size, entry) => {
          return size + JSON.stringify(entry).length
        }, 0)
      }

      return {
        totalEntries,
        unsyncedEntries,
        cacheSize,
        collections: collectionStats
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        totalEntries: 0,
        unsyncedEntries: 0,
        cacheSize: 0,
        collections: {}
      }
    }
  }

  // Store metadata
  async setMetadata(key: string, value: any): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.db!.put('metadata', {
        key,
        value,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to set metadata:', error)
    }
  }

  // Get metadata
  async getMetadata(key: string): Promise<any> {
    await this.ensureInitialized()

    try {
      const entry = await this.db!.get('metadata', key)
      return entry?.value
    } catch (error) {
      console.error('Failed to get metadata:', error)
      return null
    }
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.options.maxAge!
  }

  // Clean up old entries in a collection
  private async cleanupCollection(
    collection: keyof Omit<KiroCacheDB, 'metadata'>,
    userId: string
  ): Promise<void> {
    try {
      const entries = await this.getAllCachedData(collection, userId)
      
      if (entries.length > this.options.maxEntries!) {
        // Sort by timestamp and remove oldest entries
        entries.sort((a, b) => a.timestamp - b.timestamp)
        const entriesToRemove = entries.slice(0, entries.length - this.options.maxEntries!)
        
        const tx = this.db!.transaction(collection, 'readwrite')
        await Promise.all(
          entriesToRemove.map(entry => tx.store.delete(entry.id))
        )
      }
    } catch (error) {
      console.error(`Failed to cleanup collection ${collection}:`, error)
    }
  }

  // Ensure the service is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  // Close the database connection
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }
}

// Singleton instance
export const offlineCacheService = new OfflineCacheService()
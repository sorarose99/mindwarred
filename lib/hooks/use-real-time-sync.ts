// React hooks for real-time data synchronization
import { useState, useEffect, useCallback, useRef } from 'react'
import { createSyncManager, SyncManager, DataType, SyncStatus } from '../sync/sync-manager'
import { SyncEvent } from '../sync/real-time-sync'
import { useAuth } from './use-auth' // Assuming this exists

export interface UseRealTimeSyncOptions {
  enableRealTime?: boolean
  enableOptimistic?: boolean
  enableOffline?: boolean
  autoSync?: boolean
}

export interface SyncHookResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  syncStatus: SyncStatus | null
  create: (data: Omit<T, 'id'>) => Promise<string>
  update: (id: string, updates: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
  refresh: () => Promise<void>
  clearCache: () => Promise<void>
}

// Main hook for real-time data synchronization
export function useRealTimeSync<T extends { id: string }>(
  dataType: DataType,
  options: UseRealTimeSyncOptions = {}
): SyncHookResult<T> {
  const { user } = useAuth() // Get current user
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  
  const syncManagerRef = useRef<SyncManager | null>(null)
  const subscriptionRef = useRef<string | null>(null)

  const defaultOptions: UseRealTimeSyncOptions = {
    enableRealTime: true,
    enableOptimistic: true,
    enableOffline: true,
    autoSync: true,
    ...options
  }

  // Initialize sync manager
  useEffect(() => {
    if (!user?.uid) return

    const initializeSyncManager = async () => {
      try {
        syncManagerRef.current = createSyncManager(user.uid, {
          enableRealTime: defaultOptions.enableRealTime,
          enableOptimistic: defaultOptions.enableOptimistic,
          enableOffline: defaultOptions.enableOffline
        })

        await syncManagerRef.current.initialize()

        // Subscribe to data changes
        subscriptionRef.current = syncManagerRef.current.subscribe<T>(
          dataType,
          handleDataChange
        )

        // Load cached data first (for offline support)
        if (defaultOptions.enableOffline) {
          const cachedData = await syncManagerRef.current.getCachedData<T>(dataType)
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            setData(cachedData)
          }
        }

        // Update sync status
        const status = await syncManagerRef.current.getSyncStatus()
        setSyncStatus(status)

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize sync manager:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize sync')
        setIsLoading(false)
      }
    }

    initializeSyncManager()

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current && syncManagerRef.current) {
        syncManagerRef.current.unsubscribe(subscriptionRef.current)
      }
      if (syncManagerRef.current) {
        syncManagerRef.current.destroy()
      }
    }
  }, [user?.uid, dataType])

  // Handle real-time data changes
  const handleDataChange = useCallback((event: SyncEvent<T>) => {
    setData(prevData => {
      switch (event.type) {
        case 'added':
          // Check if item already exists (avoid duplicates)
          if (prevData.some(item => item.id === event.id)) {
            return prevData
          }
          return [...prevData, event.data]

        case 'modified':
          return prevData.map(item =>
            item.id === event.id ? { ...item, ...event.data } : item
          )

        case 'removed':
          return prevData.filter(item => item.id !== event.id)

        default:
          return prevData
      }
    })

    // Update sync status
    if (syncManagerRef.current) {
      syncManagerRef.current.getSyncStatus().then(setSyncStatus)
    }
  }, [])

  // Create new item
  const create = useCallback(async (itemData: Omit<T, 'id'>): Promise<string> => {
    if (!syncManagerRef.current) {
      throw new Error('Sync manager not initialized')
    }

    try {
      const { tempId, promise } = await syncManagerRef.current.create<T>(
        dataType,
        itemData
      )

      // Optimistically add to local state
      const optimisticItem = { ...itemData, id: tempId } as T
      setData(prevData => [optimisticItem, ...prevData])

      // Wait for server confirmation
      const actualId = await promise

      // Update with actual ID from server
      setData(prevData =>
        prevData.map(item =>
          item.id === tempId ? { ...item, id: actualId } : item
        )
      )

      return actualId
    } catch (err) {
      console.error('Failed to create item:', err)
      setError(err instanceof Error ? err.message : 'Failed to create item')
      throw err
    }
  }, [dataType])

  // Update existing item
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<void> => {
    if (!syncManagerRef.current) {
      throw new Error('Sync manager not initialized')
    }

    try {
      const originalItem = data.find(item => item.id === id)
      
      // Optimistically update local state
      setData(prevData =>
        prevData.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      )

      const { promise } = await syncManagerRef.current.update<T>(
        dataType,
        id,
        updates,
        originalItem
      )

      // Wait for server confirmation
      await promise
    } catch (err) {
      console.error('Failed to update item:', err)
      setError(err instanceof Error ? err.message : 'Failed to update item')
      
      // Revert optimistic update on error
      if (data.find(item => item.id === id)) {
        setData(prevData => [...prevData]) // Force re-render to revert
      }
      
      throw err
    }
  }, [dataType, data])

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    if (!syncManagerRef.current) {
      throw new Error('Sync manager not initialized')
    }

    try {
      const originalItem = data.find(item => item.id === id)
      
      // Optimistically remove from local state
      setData(prevData => prevData.filter(item => item.id !== id))

      const { promise } = await syncManagerRef.current.delete(
        dataType,
        id,
        originalItem
      )

      // Wait for server confirmation
      await promise
    } catch (err) {
      console.error('Failed to delete item:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete item')
      
      // Revert optimistic delete on error
      const originalItem = data.find(item => item.id === id)
      if (originalItem) {
        setData(prevData => [...prevData, originalItem])
      }
      
      throw err
    }
  }, [dataType, data])

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    if (!syncManagerRef.current) return

    try {
      setIsLoading(true)
      await syncManagerRef.current.forceSyncAll()
      
      // Update sync status
      const status = await syncManagerRef.current.getSyncStatus()
      setSyncStatus(status)
    } catch (err) {
      console.error('Failed to refresh data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    if (!syncManagerRef.current) return

    try {
      await syncManagerRef.current.clearCache()
      setData([])
      
      // Update sync status
      const status = await syncManagerRef.current.getSyncStatus()
      setSyncStatus(status)
    } catch (err) {
      console.error('Failed to clear cache:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear cache')
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    syncStatus,
    create,
    update,
    delete: deleteItem,
    refresh,
    clearCache
  }
}

// Specialized hooks for different data types
export function useActivities(options?: UseRealTimeSyncOptions) {
  return useRealTimeSync<ActivityRecord>('activities', options)
}

export function useAutomationRules(options?: UseRealTimeSyncOptions) {
  return useRealTimeSync<AutomationRule>('automations', options)
}

export function useKnowledgeNodes(options?: UseRealTimeSyncOptions) {
  return useRealTimeSync<KnowledgeNode>('knowledge', options)
}

export function useServiceIntegrations(options?: UseRealTimeSyncOptions) {
  return useRealTimeSync<ServiceIntegration>('integrations', options)
}

export function useLearningInsights(options?: UseRealTimeSyncOptions) {
  return useRealTimeSync<LearningInsight>('insights', options)
}

// Hook for user preferences (single document)
export function useUserPreferences(options?: UseRealTimeSyncOptions) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const syncManagerRef = useRef<SyncManager | null>(null)
  const subscriptionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return

    const initializePreferences = async () => {
      try {
        syncManagerRef.current = createSyncManager(user.uid, options)
        await syncManagerRef.current.initialize()

        subscriptionRef.current = syncManagerRef.current.subscribe<UserPreferences>(
          'preferences',
          (event) => {
            if (event.type === 'modified') {
              setPreferences(event.data)
            }
          }
        )

        // Load cached preferences
        const cachedPrefs = await syncManagerRef.current.getCachedData<UserPreferences>('preferences', user.uid)
        if (cachedPrefs) {
          setPreferences(cachedPrefs)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize preferences sync:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preferences')
        setIsLoading(false)
      }
    }

    initializePreferences()

    return () => {
      if (subscriptionRef.current && syncManagerRef.current) {
        syncManagerRef.current.unsubscribe(subscriptionRef.current)
      }
      if (syncManagerRef.current) {
        syncManagerRef.current.destroy()
      }
    }
  }, [user?.uid])

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<void> => {
    if (!syncManagerRef.current || !user?.uid) {
      throw new Error('Preferences sync not initialized')
    }

    try {
      // Optimistically update local state
      setPreferences(prev => prev ? { ...prev, ...updates } : null)

      const { promise } = await syncManagerRef.current.update<UserPreferences>(
        'preferences',
        user.uid,
        updates,
        preferences || undefined
      )

      await promise
    } catch (err) {
      console.error('Failed to update preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      throw err
    }
  }, [preferences, user?.uid])

  return {
    preferences,
    isLoading,
    error,
    updatePreferences
  }
}

// Import types for the hooks
import type { ActivityRecord, AutomationRule, KnowledgeNode, ServiceIntegration, LearningInsight, UserPreferences } from '../types'
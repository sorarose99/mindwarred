// Real-time data synchronization service with Firebase
import { 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore'
import { db } from '../firebase'
import { getUserCollections } from '../firebase/collections'
import type {
  ActivityRecord,
  AutomationRule,
  KnowledgeNode,
  UserPreferences,
  ServiceIntegration,
  LearningInsight
} from '../types'

export interface SyncEvent<T = any> {
  type: 'added' | 'modified' | 'removed'
  id: string
  data: T
  timestamp: number
  source: 'server' | 'local' | 'cache'
}

export interface SyncOptions {
  enableOffline?: boolean
  conflictResolution?: 'server' | 'client' | 'merge'
  maxRetries?: number
  retryDelay?: number
}

export class RealTimeSyncService {
  private subscriptions = new Map<string, Unsubscribe>()
  private eventListeners = new Map<string, Set<(event: SyncEvent) => void>>()
  private isOnline = navigator.onLine
  private pendingOperations: Map<string, any> = new Map()
  private options: SyncOptions

  constructor(options: SyncOptions = {}) {
    this.options = {
      enableOffline: true,
      conflictResolution: 'merge',
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processPendingOperations()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Subscribe to real-time updates for user activities
  subscribeToActivities(
    userId: string, 
    callback: (event: SyncEvent<ActivityRecord>) => void,
    limitCount: number = 50
  ): string {
    const subscriptionId = `activities_${userId}`
    
    const q = query(
      getUserCollections(userId).activities,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = {
            id: change.doc.id,
            ...change.doc.data()
          } as ActivityRecord

          callback({
            type: change.type,
            id: change.doc.id,
            data,
            timestamp: Date.now(),
            source: 'server'
          })
        })
      },
      (error) => {
        console.error('Activities subscription error:', error)
        this.handleSubscriptionError(subscriptionId, error)
      }
    )

    this.subscriptions.set(subscriptionId, unsubscribe)
    return subscriptionId
  }

  // Subscribe to automation rules changes
  subscribeToAutomationRules(
    userId: string,
    callback: (event: SyncEvent<AutomationRule>) => void
  ): string {
    const subscriptionId = `automations_${userId}`
    
    const q = query(
      getUserCollections(userId).automationRules,
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = {
            id: change.doc.id,
            ...change.doc.data()
          } as AutomationRule

          callback({
            type: change.type,
            id: change.doc.id,
            data,
            timestamp: Date.now(),
            source: 'server'
          })
        })
      },
      (error) => {
        console.error('Automation rules subscription error:', error)
        this.handleSubscriptionError(subscriptionId, error)
      }
    )

    this.subscriptions.set(subscriptionId, unsubscribe)
    return subscriptionId
  }

  // Subscribe to knowledge graph updates
  subscribeToKnowledgeNodes(
    userId: string,
    callback: (event: SyncEvent<KnowledgeNode>) => void
  ): string {
    const subscriptionId = `knowledge_${userId}`
    
    const q = query(
      getUserCollections(userId).knowledgeNodes,
      orderBy('strength', 'desc')
    )

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = {
            id: change.doc.id,
            ...change.doc.data()
          } as KnowledgeNode

          callback({
            type: change.type,
            id: change.doc.id,
            data,
            timestamp: Date.now(),
            source: 'server'
          })
        })
      },
      (error) => {
        console.error('Knowledge nodes subscription error:', error)
        this.handleSubscriptionError(subscriptionId, error)
      }
    )

    this.subscriptions.set(subscriptionId, unsubscribe)
    return subscriptionId
  }

  // Subscribe to user preferences changes
  subscribeToPreferences(
    userId: string,
    callback: (event: SyncEvent<UserPreferences>) => void
  ): string {
    const subscriptionId = `preferences_${userId}`
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserPreferences

          callback({
            type: 'modified',
            id: snapshot.id,
            data,
            timestamp: Date.now(),
            source: 'server'
          })
        }
      },
      (error) => {
        console.error('Preferences subscription error:', error)
        this.handleSubscriptionError(subscriptionId, error)
      }
    )

    this.subscriptions.set(subscriptionId, unsubscribe)
    return subscriptionId
  }

  // Subscribe to service integrations
  subscribeToIntegrations(
    userId: string,
    callback: (event: SyncEvent<ServiceIntegration>) => void
  ): string {
    const subscriptionId = `integrations_${userId}`
    
    const q = query(
      getUserCollections(userId).integrations,
      orderBy('lastSync', 'desc')
    )

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = {
            id: change.doc.id,
            ...change.doc.data()
          } as ServiceIntegration

          callback({
            type: change.type,
            id: change.doc.id,
            data,
            timestamp: Date.now(),
            source: 'server'
          })
        })
      },
      (error) => {
        console.error('Integrations subscription error:', error)
        this.handleSubscriptionError(subscriptionId, error)
      }
    )

    this.subscriptions.set(subscriptionId, unsubscribe)
    return subscriptionId
  }

  // Subscribe to learning insights
  subscribeToInsights(
    userId: string,
    callback: (event: SyncEvent<LearningInsight>) => void
  ): string {
    const subscriptionId = `insights_${userId}`
    
    const q = query(
      getUserCollections(userId).insights,
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = {
            id: change.doc.id,
            ...change.doc.data()
          } as LearningInsight

          callback({
            type: change.type,
            id: change.doc.id,
            data,
            timestamp: Date.now(),
            source: 'server'
          })
        })
      },
      (error) => {
        console.error('Insights subscription error:', error)
        this.handleSubscriptionError(subscriptionId, error)
      }
    )

    this.subscriptions.set(subscriptionId, unsubscribe)
    return subscriptionId
  }

  // Unsubscribe from a specific subscription
  unsubscribe(subscriptionId: string): void {
    const unsubscribe = this.subscriptions.get(subscriptionId)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(subscriptionId)
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.subscriptions.clear()
  }

  // Handle subscription errors with retry logic
  private handleSubscriptionError(subscriptionId: string, error: any): void {
    console.error(`Subscription error for ${subscriptionId}:`, error)
    
    // Implement retry logic for transient errors
    if (this.isRetriableError(error)) {
      setTimeout(() => {
        // Retry subscription logic would go here
        console.log(`Retrying subscription: ${subscriptionId}`)
      }, this.options.retryDelay)
    }
  }

  // Check if error is retriable
  private isRetriableError(error: any): boolean {
    // Check for network errors, temporary Firebase errors, etc.
    return error.code === 'unavailable' || 
           error.code === 'deadline-exceeded' ||
           error.message?.includes('network')
  }

  // Process pending operations when coming back online
  private async processPendingOperations(): Promise<void> {
    if (!this.isOnline || this.pendingOperations.size === 0) {
      return
    }

    console.log(`Processing ${this.pendingOperations.size} pending operations`)

    const batch = writeBatch(db)
    const operations = Array.from(this.pendingOperations.entries())

    try {
      for (const [operationId, operation] of operations) {
        // Apply pending operations to batch
        if (operation.type === 'create') {
          batch.set(operation.ref, operation.data)
        } else if (operation.type === 'update') {
          batch.update(operation.ref, operation.data)
        } else if (operation.type === 'delete') {
          batch.delete(operation.ref)
        }
      }

      await batch.commit()
      
      // Clear processed operations
      operations.forEach(([operationId]) => {
        this.pendingOperations.delete(operationId)
      })

      console.log('Successfully processed pending operations')
    } catch (error) {
      console.error('Error processing pending operations:', error)
    }
  }

  // Add operation to pending queue for offline support
  addPendingOperation(operationId: string, operation: any): void {
    if (this.options.enableOffline) {
      this.pendingOperations.set(operationId, {
        ...operation,
        timestamp: Date.now()
      })
    }
  }

  // Get connection status
  getConnectionStatus(): { isOnline: boolean; pendingOperations: number } {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.pendingOperations.size
    }
  }

  // Clean up resources
  destroy(): void {
    this.unsubscribeAll()
    this.eventListeners.clear()
    this.pendingOperations.clear()
    
    window.removeEventListener('online', this.processPendingOperations)
    window.removeEventListener('offline', () => {})
  }
}

// Singleton instance
export const realTimeSyncService = new RealTimeSyncService()
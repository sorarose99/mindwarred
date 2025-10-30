// Optimistic UI updates with conflict resolution
import { 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  getDoc, 
  serverTimestamp,
  runTransaction,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase'
import { getUserCollections } from '../firebase/collections'

export interface OptimisticOperation<T = any> {
  id: string
  type: 'create' | 'update' | 'delete'
  collection: string
  data?: T
  originalData?: T
  timestamp: number
  userId: string
  retryCount: number
  maxRetries: number
}

export interface ConflictResolution<T = any> {
  strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual'
  serverData: T
  clientData: T
  resolvedData?: T
}

export class OptimisticUpdateService {
  private pendingOperations = new Map<string, OptimisticOperation>()
  private conflictHandlers = new Map<string, (conflict: ConflictResolution) => any>()

  // Optimistically create a new document
  async optimisticCreate<T extends { id?: string }>(
    userId: string,
    collectionName: keyof ReturnType<typeof getUserCollections>,
    data: Omit<T, 'id'>,
    tempId?: string
  ): Promise<{ tempId: string; promise: Promise<string> }> {
    const operationId = tempId || `temp_${Date.now()}_${Math.random()}`
    
    // Store optimistic operation
    const operation: OptimisticOperation<T> = {
      id: operationId,
      type: 'create',
      collection: collectionName,
      data: { ...data, id: operationId } as T,
      timestamp: Date.now(),
      userId,
      retryCount: 0,
      maxRetries: 3
    }

    this.pendingOperations.set(operationId, operation)

    // Perform actual Firebase operation
    const promise = this.executeCreate(userId, collectionName, data, operationId)

    return { tempId: operationId, promise }
  }

  // Optimistically update a document
  async optimisticUpdate<T>(
    userId: string,
    collectionName: keyof ReturnType<typeof getUserCollections>,
    documentId: string,
    updates: Partial<T>,
    originalData?: T
  ): Promise<{ promise: Promise<void> }> {
    const operationId = `update_${documentId}_${Date.now()}`
    
    // Store optimistic operation
    const operation: OptimisticOperation<T> = {
      id: operationId,
      type: 'update',
      collection: collectionName,
      data: updates,
      originalData,
      timestamp: Date.now(),
      userId,
      retryCount: 0,
      maxRetries: 3
    }

    this.pendingOperations.set(operationId, operation)

    // Perform actual Firebase operation
    const promise = this.executeUpdate(userId, collectionName, documentId, updates, operationId)

    return { promise }
  }

  // Optimistically delete a document
  async optimisticDelete(
    userId: string,
    collectionName: keyof ReturnType<typeof getUserCollections>,
    documentId: string,
    originalData?: any
  ): Promise<{ promise: Promise<void> }> {
    const operationId = `delete_${documentId}_${Date.now()}`
    
    // Store optimistic operation
    const operation: OptimisticOperation = {
      id: operationId,
      type: 'delete',
      collection: collectionName,
      originalData,
      timestamp: Date.now(),
      userId,
      retryCount: 0,
      maxRetries: 3
    }

    this.pendingOperations.set(operationId, operation)

    // Perform actual Firebase operation
    const promise = this.executeDelete(userId, collectionName, documentId, operationId)

    return { promise }
  }

  // Execute create operation with conflict resolution
  private async executeCreate<T>(
    userId: string,
    collectionName: keyof ReturnType<typeof getUserCollections>,
    data: Omit<T, 'id'>,
    operationId: string
  ): Promise<string> {
    try {
      const collections = getUserCollections(userId)
      const collectionRef = collections[collectionName]
      
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collectionRef, docData)
      
      // Remove from pending operations on success
      this.pendingOperations.delete(operationId)
      
      return docRef.id
    } catch (error) {
      console.error('Create operation failed:', error)
      await this.handleOperationFailure(operationId, error)
      throw error
    }
  }

  // Execute update operation with conflict resolution
  private async executeUpdate<T>(
    userId: string,
    collectionName: keyof ReturnType<typeof getUserCollections>,
    documentId: string,
    updates: Partial<T>,
    operationId: string
  ): Promise<void> {
    try {
      const collections = getUserCollections(userId)
      const docRef = doc(collections[collectionName], documentId)
      
      // Use transaction for conflict detection
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef)
        
        if (!docSnap.exists()) {
          throw new Error('Document does not exist')
        }

        const serverData = docSnap.data()
        const operation = this.pendingOperations.get(operationId)
        
        // Check for conflicts
        if (this.hasConflict(serverData, operation?.originalData, updates)) {
          const resolution = await this.resolveConflict({
            strategy: 'merge',
            serverData,
            clientData: { ...operation?.originalData, ...updates }
          })
          
          transaction.update(docRef, {
            ...resolution.resolvedData,
            updatedAt: serverTimestamp()
          })
        } else {
          transaction.update(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
          })
        }
      })
      
      // Remove from pending operations on success
      this.pendingOperations.delete(operationId)
    } catch (error) {
      console.error('Update operation failed:', error)
      await this.handleOperationFailure(operationId, error)
      throw error
    }
  }

  // Execute delete operation
  private async executeDelete(
    userId: string,
    collectionName: keyof ReturnType<typeof getUserCollections>,
    documentId: string,
    operationId: string
  ): Promise<void> {
    try {
      const collections = getUserCollections(userId)
      const docRef = doc(collections[collectionName], documentId)
      
      await deleteDoc(docRef)
      
      // Remove from pending operations on success
      this.pendingOperations.delete(operationId)
    } catch (error) {
      console.error('Delete operation failed:', error)
      await this.handleOperationFailure(operationId, error)
      throw error
    }
  }

  // Check if there's a conflict between server and client data
  private hasConflict(serverData: any, originalData: any, updates: any): boolean {
    if (!originalData) return false
    
    // Check if server data has been modified since we last saw it
    const serverUpdatedAt = serverData.updatedAt?.toMillis?.() || 0
    const originalUpdatedAt = originalData.updatedAt?.toMillis?.() || 0
    
    return serverUpdatedAt > originalUpdatedAt
  }

  // Resolve conflicts between server and client data
  private async resolveConflict<T>(conflict: ConflictResolution<T>): Promise<ConflictResolution<T>> {
    const { strategy, serverData, clientData } = conflict
    
    switch (strategy) {
      case 'server-wins':
        return { ...conflict, resolvedData: serverData }
      
      case 'client-wins':
        return { ...conflict, resolvedData: clientData }
      
      case 'merge':
        // Intelligent merge strategy
        const mergedData = this.mergeData(serverData, clientData)
        return { ...conflict, resolvedData: mergedData }
      
      case 'manual':
        // Let user decide through registered conflict handler
        const handler = this.conflictHandlers.get('manual')
        if (handler) {
          const resolvedData = await handler(conflict)
          return { ...conflict, resolvedData }
        }
        // Fallback to merge if no handler
        return this.resolveConflict({ ...conflict, strategy: 'merge' })
      
      default:
        return this.resolveConflict({ ...conflict, strategy: 'merge' })
    }
  }

  // Intelligent data merging
  private mergeData<T>(serverData: T, clientData: T): T {
    if (!serverData || !clientData) {
      return clientData || serverData
    }

    const merged = { ...serverData }
    
    // Merge non-conflicting fields
    Object.keys(clientData as any).forEach(key => {
      const serverValue = (serverData as any)[key]
      const clientValue = (clientData as any)[key]
      
      // Skip system fields
      if (['createdAt', 'updatedAt', 'id'].includes(key)) {
        return
      }
      
      // Use client value if server doesn't have it or if it's newer
      if (serverValue === undefined || serverValue === null) {
        (merged as any)[key] = clientValue
      } else if (typeof clientValue === 'object' && typeof serverValue === 'object') {
        // Recursively merge objects
        (merged as any)[key] = this.mergeData(serverValue, clientValue)
      } else if (clientValue !== serverValue) {
        // For conflicting primitive values, prefer client (user's latest intent)
        (merged as any)[key] = clientValue
      }
    })
    
    return merged
  }

  // Handle operation failures with retry logic
  private async handleOperationFailure(operationId: string, error: any): Promise<void> {
    const operation = this.pendingOperations.get(operationId)
    if (!operation) return

    operation.retryCount++
    
    if (operation.retryCount < operation.maxRetries && this.isRetriableError(error)) {
      // Exponential backoff
      const delay = Math.pow(2, operation.retryCount) * 1000
      
      setTimeout(async () => {
        try {
          await this.retryOperation(operation)
        } catch (retryError) {
          console.error('Retry failed:', retryError)
          await this.handleOperationFailure(operationId, retryError)
        }
      }, delay)
    } else {
      // Max retries reached or non-retriable error
      console.error(`Operation ${operationId} failed permanently:`, error)
      this.pendingOperations.delete(operationId)
      
      // Emit failure event for UI to handle
      this.emitOperationFailure(operation, error)
    }
  }

  // Retry a failed operation
  private async retryOperation(operation: OptimisticOperation): Promise<void> {
    const { userId, collection, type, data, id } = operation
    
    switch (type) {
      case 'create':
        await this.executeCreate(userId, collection as any, data, id)
        break
      case 'update':
        const documentId = id.split('_')[1] // Extract document ID from operation ID
        await this.executeUpdate(userId, collection as any, documentId, data, id)
        break
      case 'delete':
        const deleteDocId = id.split('_')[1] // Extract document ID from operation ID
        await this.executeDelete(userId, collection as any, deleteDocId, id)
        break
    }
  }

  // Check if error is retriable
  private isRetriableError(error: any): boolean {
    const retriableCodes = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'aborted'
    ]
    
    return retriableCodes.includes(error.code) || 
           error.message?.includes('network') ||
           error.message?.includes('timeout')
  }

  // Emit operation failure event
  private emitOperationFailure(operation: OptimisticOperation, error: any): void {
    // This could be connected to a global event system or state management
    console.warn('Operation failed permanently:', {
      operation: operation.id,
      type: operation.type,
      error: error.message
    })
  }

  // Register conflict resolution handler
  registerConflictHandler(strategy: string, handler: (conflict: ConflictResolution) => any): void {
    this.conflictHandlers.set(strategy, handler)
  }

  // Get pending operations count
  getPendingOperationsCount(): number {
    return this.pendingOperations.size
  }

  // Get pending operations for debugging
  getPendingOperations(): OptimisticOperation[] {
    return Array.from(this.pendingOperations.values())
  }

  // Clear all pending operations (use with caution)
  clearPendingOperations(): void {
    this.pendingOperations.clear()
  }
}

// Singleton instance
export const optimisticUpdateService = new OptimisticUpdateService()
// Database migration utilities for Kiro Web Mind

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase'
import { UserDocumentService } from './collections'

export interface Migration {
  version: number
  name: string
  description: string
  up: (userId: string) => Promise<void>
  down?: (userId: string) => Promise<void>
}

// Migration registry
const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    description: 'Initial database schema setup',
    up: async (userId: string) => {
      // This migration is handled by user creation
      console.log(`Migration 1 (initial_schema) completed for user ${userId}`)
    }
  },
  {
    version: 2,
    name: 'add_analytics_metadata',
    description: 'Add analytics metadata to user documents',
    up: async (userId: string) => {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (!userData.metadata?.analytics) {
          await updateDoc(userRef, {
            'metadata.analytics': {
              enabled: true,
              lastCalculated: null,
              version: '1.0'
            },
            updatedAt: Timestamp.now()
          })
        }
      }
    },
    down: async (userId: string) => {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        'metadata.analytics': null,
        updatedAt: Timestamp.now()
      })
    }
  },
  {
    version: 3,
    name: 'add_privacy_settings',
    description: 'Add enhanced privacy settings',
    up: async (userId: string) => {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (!userData.preferences?.privacy?.retentionPeriod) {
          await updateDoc(userRef, {
            'preferences.privacy.retentionPeriod': 365,
            'preferences.privacy.shareUsageData': false,
            'preferences.privacy.analyticsEnabled': true,
            updatedAt: Timestamp.now()
          })
        }
      }
    }
  },
  {
    version: 4,
    name: 'add_knowledge_graph_settings',
    description: 'Add knowledge graph configuration',
    up: async (userId: string) => {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (!userData.preferences?.knowledgeGraph) {
          await updateDoc(userRef, {
            'preferences.knowledgeGraph': {
              maxNodes: 10000,
              connectionThreshold: 0.3,
              decayRate: 0.1,
              learningRate: 0.5,
              autoCleanup: true,
              retentionPeriod: 365
            },
            updatedAt: Timestamp.now()
          })
        }
      }
    }
  }
]

// Migration manager
export class MigrationManager {
  static async getCurrentVersion(userId: string): Promise<number> {
    const userDoc = await UserDocumentService.get(userId)
    return userDoc?.metadata?.migrationVersion || 0
  }

  static async setVersion(userId: string, version: number): Promise<void> {
    await UserDocumentService.update(userId, {
      metadata: {
        migrationVersion: version,
        lastMigration: Timestamp.now()
      } as any
    })
  }

  static async runMigrations(userId: string): Promise<void> {
    const currentVersion = await this.getCurrentVersion(userId)
    const targetVersion = Math.max(...migrations.map(m => m.version))

    console.log(`Running migrations for user ${userId}: ${currentVersion} -> ${targetVersion}`)

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        try {
          console.log(`Running migration ${migration.version}: ${migration.name}`)
          await migration.up(userId)
          await this.setVersion(userId, migration.version)
          console.log(`Migration ${migration.version} completed successfully`)
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error)
          throw new Error(`Migration ${migration.version} (${migration.name}) failed: ${error}`)
        }
      }
    }
  }

  static async rollbackMigration(userId: string, targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion(userId)

    if (targetVersion >= currentVersion) {
      throw new Error('Target version must be lower than current version')
    }

    // Run down migrations in reverse order
    const migrationsToRollback = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version)

    for (const migration of migrationsToRollback) {
      if (migration.down) {
        try {
          console.log(`Rolling back migration ${migration.version}: ${migration.name}`)
          await migration.down(userId)
          console.log(`Migration ${migration.version} rolled back successfully`)
        } catch (error) {
          console.error(`Rollback of migration ${migration.version} failed:`, error)
          throw new Error(`Rollback of migration ${migration.version} failed: ${error}`)
        }
      } else {
        console.warn(`Migration ${migration.version} has no rollback function`)
      }
    }

    await this.setVersion(userId, targetVersion)
  }

  static async getMigrationStatus(userId: string): Promise<{
    currentVersion: number
    targetVersion: number
    pendingMigrations: Migration[]
    isUpToDate: boolean
  }> {
    const currentVersion = await this.getCurrentVersion(userId)
    const targetVersion = Math.max(...migrations.map(m => m.version))
    const pendingMigrations = migrations.filter(m => m.version > currentVersion)

    return {
      currentVersion,
      targetVersion,
      pendingMigrations,
      isUpToDate: currentVersion === targetVersion
    }
  }

  static async validateMigrations(): Promise<boolean> {
    // Check for duplicate version numbers
    const versions = migrations.map(m => m.version)
    const uniqueVersions = new Set(versions)
    
    if (versions.length !== uniqueVersions.size) {
      throw new Error('Duplicate migration version numbers detected')
    }

    // Check for sequential version numbers
    const sortedVersions = [...versions].sort((a, b) => a - b)
    for (let i = 1; i < sortedVersions.length; i++) {
      if (sortedVersions[i] !== sortedVersions[i - 1] + 1) {
        console.warn(`Non-sequential migration versions: ${sortedVersions[i - 1]} -> ${sortedVersions[i]}`)
      }
    }

    return true
  }
}

// Data cleanup utilities
export class DataCleanup {
  static async cleanupOldActivities(userId: string, retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    const activitiesRef = collection(db, 'users', userId, 'activities')
    const oldActivitiesQuery = getDocs(activitiesRef) // Would need proper query with where clause
    
    const snapshot = await oldActivitiesQuery
    const batch = writeBatch(db)
    let deleteCount = 0

    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const activityDate = data.timestamp?.toDate()
      
      if (activityDate && activityDate < cutoffDate) {
        batch.delete(doc.ref)
        deleteCount++
      }
    })

    if (deleteCount > 0) {
      await batch.commit()
    }

    return deleteCount
  }

  static async cleanupOrphanedKnowledgeNodes(userId: string): Promise<number> {
    const knowledgeRef = collection(db, 'users', userId, 'knowledge')
    const snapshot = await getDocs(knowledgeRef)
    
    const batch = writeBatch(db)
    let deleteCount = 0

    // Find nodes with no connections and low weight
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const hasConnections = data.connections && data.connections.length > 0
      const hasWeight = data.properties?.weight > 0.1
      
      if (!hasConnections && !hasWeight) {
        batch.delete(doc.ref)
        deleteCount++
      }
    })

    if (deleteCount > 0) {
      await batch.commit()
    }

    return deleteCount
  }

  static async optimizeKnowledgeGraph(userId: string): Promise<{
    nodesOptimized: number
    connectionsOptimized: number
  }> {
    const knowledgeRef = collection(db, 'users', userId, 'knowledge')
    const snapshot = await getDocs(knowledgeRef)
    
    const batch = writeBatch(db)
    let nodesOptimized = 0
    let connectionsOptimized = 0

    snapshot.docs.forEach(doc => {
      const data = doc.data()
      let needsUpdate = false
      const updates: any = {}

      // Optimize connections - remove weak connections
      if (data.connections && Array.isArray(data.connections)) {
        const strongConnections = data.connections.filter((conn: any) => conn.strength > 0.2)
        if (strongConnections.length !== data.connections.length) {
          updates.connections = strongConnections
          connectionsOptimized += data.connections.length - strongConnections.length
          needsUpdate = true
        }
      }

      // Decay node weights over time
      if (data.properties?.weight > 0) {
        const lastAccessed = data.lastAccessed?.toDate() || new Date(0)
        const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceAccess > 30) {
          const decayFactor = Math.exp(-daysSinceAccess / 365) // Exponential decay over a year
          const newWeight = data.properties.weight * decayFactor
          
          if (Math.abs(newWeight - data.properties.weight) > 0.01) {
            updates['properties.weight'] = Math.max(0.01, newWeight)
            needsUpdate = true
          }
        }
      }

      if (needsUpdate) {
        updates.updatedAt = Timestamp.now()
        batch.update(doc.ref, updates)
        nodesOptimized++
      }
    })

    if (nodesOptimized > 0) {
      await batch.commit()
    }

    return { nodesOptimized, connectionsOptimized }
  }
}

// Schema validation
export class SchemaValidator {
  static async validateUserDocument(userId: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const userDoc = await UserDocumentService.get(userId)
      
      if (!userDoc) {
        errors.push('User document does not exist')
        return { isValid: false, errors, warnings }
      }

      // Validate required fields
      if (!userDoc.email) errors.push('Missing email field')
      if (!userDoc.createdAt) errors.push('Missing createdAt field')
      if (!userDoc.preferences) errors.push('Missing preferences field')

      // Validate preferences structure
      if (userDoc.preferences) {
        if (!userDoc.preferences.privacy) errors.push('Missing privacy preferences')
        if (!userDoc.preferences.ui) errors.push('Missing UI preferences')
        if (!userDoc.preferences.ai) errors.push('Missing AI preferences')
      }

      // Check for deprecated fields
      if ((userDoc as any).oldField) {
        warnings.push('Document contains deprecated fields')
      }

      // Validate metadata
      if (!userDoc.metadata?.version) {
        warnings.push('Missing version in metadata')
      }

    } catch (error) {
      errors.push(`Validation error: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export default MigrationManager
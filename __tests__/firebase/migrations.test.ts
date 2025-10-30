// Unit tests for Firebase migrations

import {
  MigrationManager,
  DataCleanup,
  SchemaValidator
} from '../../lib/firebase/migrations'
import { UserDocumentService } from '../../lib/firebase/collections'

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
  db: {}
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  writeBatch: jest.fn(() => ({
    delete: jest.fn(),
    update: jest.fn(),
    commit: jest.fn()
  })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}))

jest.mock('../../lib/firebase/collections')

describe('Firebase Migrations', () => {
  
  describe('MigrationManager', () => {
    const mockUserId = 'test-user-123'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('should get current migration version', async () => {
      const mockUserDoc = {
        metadata: { migrationVersion: 3 }
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const version = await MigrationManager.getCurrentVersion(mockUserId)

      expect(version).toBe(3)
      expect(UserDocumentService.get).toHaveBeenCalledWith(mockUserId)
    })

    test('should return 0 for user without migration version', async () => {
      const mockUserDoc = {
        metadata: {}
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const version = await MigrationManager.getCurrentVersion(mockUserId)

      expect(version).toBe(0)
    })

    test('should return 0 for non-existent user', async () => {
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(null)

      const version = await MigrationManager.getCurrentVersion(mockUserId)

      expect(version).toBe(0)
    })

    test('should set migration version', async () => {
      ;(UserDocumentService.update as jest.Mock).mockResolvedValue(undefined)

      await MigrationManager.setVersion(mockUserId, 5)

      expect(UserDocumentService.update).toHaveBeenCalledWith(mockUserId, {
        metadata: {
          migrationVersion: 5,
          lastMigration: expect.anything()
        }
      })
    })

    test('should run pending migrations', async () => {
      // Mock current version as 1, so migrations 2, 3, 4 should run
      jest.spyOn(MigrationManager, 'getCurrentVersion').mockResolvedValue(1)
      jest.spyOn(MigrationManager, 'setVersion').mockResolvedValue(undefined)

      // Mock console.log to avoid test output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await MigrationManager.runMigrations(mockUserId)

      expect(MigrationManager.setVersion).toHaveBeenCalledTimes(3) // migrations 2, 3, 4
      expect(MigrationManager.setVersion).toHaveBeenCalledWith(mockUserId, 2)
      expect(MigrationManager.setVersion).toHaveBeenCalledWith(mockUserId, 3)
      expect(MigrationManager.setVersion).toHaveBeenCalledWith(mockUserId, 4)

      consoleSpy.mockRestore()
    })

    test('should handle migration errors', async () => {
      jest.spyOn(MigrationManager, 'getCurrentVersion').mockResolvedValue(0)
      jest.spyOn(MigrationManager, 'setVersion').mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(MigrationManager.runMigrations(mockUserId)).rejects.toThrow('Migration 1')

      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    test('should get migration status', async () => {
      jest.spyOn(MigrationManager, 'getCurrentVersion').mockResolvedValue(2)

      const status = await MigrationManager.getMigrationStatus(mockUserId)

      expect(status.currentVersion).toBe(2)
      expect(status.targetVersion).toBeGreaterThanOrEqual(2)
      expect(status.pendingMigrations).toBeInstanceOf(Array)
      expect(typeof status.isUpToDate).toBe('boolean')
    })

    test('should validate migrations for duplicate versions', async () => {
      // This test would need to be adjusted based on actual migration definitions
      await expect(MigrationManager.validateMigrations()).resolves.toBe(true)
    })

    test('should rollback migrations', async () => {
      jest.spyOn(MigrationManager, 'getCurrentVersion').mockResolvedValue(4)
      jest.spyOn(MigrationManager, 'setVersion').mockResolvedValue(undefined)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      await MigrationManager.rollbackMigration(mockUserId, 2)

      expect(MigrationManager.setVersion).toHaveBeenCalledWith(mockUserId, 2)

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    test('should throw error for invalid rollback target', async () => {
      jest.spyOn(MigrationManager, 'getCurrentVersion').mockResolvedValue(2)

      await expect(MigrationManager.rollbackMigration(mockUserId, 3))
        .rejects.toThrow('Target version must be lower than current version')
    })
  })

  describe('DataCleanup', () => {
    const mockUserId = 'test-user-123'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('should cleanup old activities', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      }
      const mockWriteBatch = require('firebase/firestore').writeBatch
      mockWriteBatch.mockReturnValue(mockBatch)

      const mockSnapshot = {
        docs: [
          {
            ref: 'activity-1-ref',
            data: () => ({
              timestamp: { toDate: () => new Date('2020-01-01') }
            })
          },
          {
            ref: 'activity-2-ref',
            data: () => ({
              timestamp: { toDate: () => new Date() }
            })
          }
        ]
      }
      const mockGetDocs = require('firebase/firestore').getDocs
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const deleteCount = await DataCleanup.cleanupOldActivities(mockUserId, 365)

      expect(deleteCount).toBe(1) // Only the old activity should be deleted
      expect(mockBatch.delete).toHaveBeenCalledWith('activity-1-ref')
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    test('should cleanup orphaned knowledge nodes', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      }
      const mockWriteBatch = require('firebase/firestore').writeBatch
      mockWriteBatch.mockReturnValue(mockBatch)

      const mockSnapshot = {
        docs: [
          {
            ref: 'node-1-ref',
            data: () => ({
              connections: [],
              properties: { weight: 0.05 }
            })
          },
          {
            ref: 'node-2-ref',
            data: () => ({
              connections: [{ targetNodeId: 'node-3' }],
              properties: { weight: 0.05 }
            })
          }
        ]
      }
      const mockGetDocs = require('firebase/firestore').getDocs
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const deleteCount = await DataCleanup.cleanupOrphanedKnowledgeNodes(mockUserId)

      expect(deleteCount).toBe(1) // Only node-1 should be deleted (no connections, low weight)
      expect(mockBatch.delete).toHaveBeenCalledWith('node-1-ref')
    })

    test('should optimize knowledge graph', async () => {
      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      }
      const mockWriteBatch = require('firebase/firestore').writeBatch
      mockWriteBatch.mockReturnValue(mockBatch)

      const mockSnapshot = {
        docs: [
          {
            ref: 'node-1-ref',
            data: () => ({
              connections: [
                { strength: 0.1 }, // Weak connection, should be removed
                { strength: 0.5 }  // Strong connection, should be kept
              ],
              properties: { weight: 0.8 },
              lastAccessed: { toDate: () => new Date('2020-01-01') }
            })
          }
        ]
      }
      const mockGetDocs = require('firebase/firestore').getDocs
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const result = await DataCleanup.optimizeKnowledgeGraph(mockUserId)

      expect(result.nodesOptimized).toBe(1)
      expect(result.connectionsOptimized).toBe(1)
      expect(mockBatch.update).toHaveBeenCalled()
    })
  })

  describe('SchemaValidator', () => {
    const mockUserId = 'test-user-123'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('should validate correct user document', async () => {
      const mockUserDoc = {
        email: 'test@example.com',
        createdAt: new Date(),
        preferences: {
          privacy: { dataCollection: 'standard' },
          ui: { theme: 'dark' },
          ai: { summaryLength: 'brief' }
        },
        metadata: { version: '1.0.0' }
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect missing user document', async () => {
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(null)

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User document does not exist')
    })

    test('should detect missing required fields', async () => {
      const mockUserDoc = {
        // Missing email, createdAt, preferences
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing email field')
      expect(result.errors).toContain('Missing createdAt field')
      expect(result.errors).toContain('Missing preferences field')
    })

    test('should detect missing preference sections', async () => {
      const mockUserDoc = {
        email: 'test@example.com',
        createdAt: new Date(),
        preferences: {
          // Missing privacy, ui, ai sections
        }
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing privacy preferences')
      expect(result.errors).toContain('Missing UI preferences')
      expect(result.errors).toContain('Missing AI preferences')
    })

    test('should detect deprecated fields as warnings', async () => {
      const mockUserDoc = {
        email: 'test@example.com',
        createdAt: new Date(),
        preferences: {
          privacy: { dataCollection: 'standard' },
          ui: { theme: 'dark' },
          ai: { summaryLength: 'brief' }
        },
        oldField: 'deprecated value' // Deprecated field
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Document contains deprecated fields')
    })

    test('should detect missing version in metadata', async () => {
      const mockUserDoc = {
        email: 'test@example.com',
        createdAt: new Date(),
        preferences: {
          privacy: { dataCollection: 'standard' },
          ui: { theme: 'dark' },
          ai: { summaryLength: 'brief' }
        },
        metadata: {} // Missing version
      }
      ;(UserDocumentService.get as jest.Mock).mockResolvedValue(mockUserDoc)

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Missing version in metadata')
    })

    test('should handle validation errors', async () => {
      ;(UserDocumentService.get as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await SchemaValidator.validateUserDocument(mockUserId)

      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Validation error: Error: Database error')
    })
  })
})
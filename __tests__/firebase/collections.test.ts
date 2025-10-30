// Unit tests for Firebase collections and services

import {
  FirestoreService,
  UserPreferencesService,
  ActivityService,
  AutomationRuleService,
  KnowledgeNodeService,
  IntegrationService,
  createUserServices
} from '../../lib/firebase/collections'

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}))

jest.mock('../../lib/firebase', () => ({
  db: {}
}))

describe('Firebase Collections', () => {
  const mockCollectionRef = { id: 'mock-collection' }
  const mockDocRef = { id: 'mock-doc' }
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('FirestoreService', () => {
    let service: FirestoreService<any>

    beforeEach(() => {
      service = new FirestoreService(mockCollectionRef as any)
    })

    describe('create', () => {
      it('should add document with timestamps', async () => {
        const mockAddDoc = require('firebase/firestore').addDoc
        mockAddDoc.mockResolvedValue({ id: 'new-doc-id' })

        const testData = { name: 'Test Item' }
        const result = await service.create(testData)

        expect(mockAddDoc).toHaveBeenCalledWith(
          mockCollectionRef,
          expect.objectContaining({
            name: 'Test Item',
            createdAt: expect.any(Object),
            updatedAt: expect.any(Object)
          })
        )
        expect(result).toBe('new-doc-id')
      })
    })

    describe('update', () => {
      it('should update document with timestamp', async () => {
        const mockUpdateDoc = require('firebase/firestore').updateDoc
        const mockDoc = require('firebase/firestore').doc
        mockDoc.mockReturnValue(mockDocRef)

        const testData = { name: 'Updated Item' }
        await service.update('doc-id', testData)

        expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, 'doc-id')
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          mockDocRef,
          expect.objectContaining({
            name: 'Updated Item',
            updatedAt: expect.any(Object)
          })
        )
      })
    })

    describe('delete', () => {
      it('should delete document', async () => {
        const mockDeleteDoc = require('firebase/firestore').deleteDoc
        const mockDoc = require('firebase/firestore').doc
        mockDoc.mockReturnValue(mockDocRef)

        await service.delete('doc-id')

        expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, 'doc-id')
        expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocRef)
      })
    })

    describe('get', () => {
      it('should return document if exists', async () => {
        const mockGetDoc = require('firebase/firestore').getDoc
        const mockDoc = require('firebase/firestore').doc
        mockDoc.mockReturnValue(mockDocRef)
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: 'doc-id',
          data: () => ({ name: 'Test Item' })
        })

        const result = await service.get('doc-id')

        expect(result).toEqual({
          id: 'doc-id',
          name: 'Test Item'
        })
      })

      it('should return null if document does not exist', async () => {
        const mockGetDoc = require('firebase/firestore').getDoc
        const mockDoc = require('firebase/firestore').doc
        mockDoc.mockReturnValue(mockDocRef)
        mockGetDoc.mockResolvedValue({
          exists: () => false
        })

        const result = await service.get('doc-id')

        expect(result).toBeNull()
      })
    })

    describe('list', () => {
      it('should return array of documents', async () => {
        const mockGetDocs = require('firebase/firestore').getDocs
        const mockQuery = require('firebase/firestore').query
        mockQuery.mockReturnValue('mock-query')
        mockGetDocs.mockResolvedValue({
          docs: [
            { id: 'doc1', data: () => ({ name: 'Item 1' }) },
            { id: 'doc2', data: () => ({ name: 'Item 2' }) }
          ]
        })

        const result = await service.list()

        expect(result).toEqual([
          { id: 'doc1', name: 'Item 1' },
          { id: 'doc2', name: 'Item 2' }
        ])
      })
    })

    describe('paginate', () => {
      it('should return paginated results', async () => {
        const mockGetDocs = require('firebase/firestore').getDocs
        const mockQuery = require('firebase/firestore').query
        const mockLimit = require('firebase/firestore').limit
        
        mockQuery.mockReturnValue('mock-query')
        mockLimit.mockReturnValue('mock-limit')
        mockGetDocs.mockResolvedValue({
          docs: [
            { id: 'doc1', data: () => ({ name: 'Item 1' }) },
            { id: 'doc2', data: () => ({ name: 'Item 2' }) }
          ]
        })

        const result = await service.paginate(2)

        expect(result.items).toHaveLength(2)
        expect(result.hasMore).toBe(false)
        expect(mockLimit).toHaveBeenCalledWith(3) // pageSize + 1
      })
    })
  })

  describe('UserPreferencesService', () => {
    let service: UserPreferencesService

    beforeEach(() => {
      service = new UserPreferencesService(mockUserId)
    })

    describe('getOrCreateDefault', () => {
      it('should return existing preferences if found', async () => {
        const mockList = jest.spyOn(service, 'list')
        mockList.mockResolvedValue([
          {
            id: 'pref-1',
            privacy: { dataCollection: 'standard', cloudSync: true, voiceData: false, activityTracking: true, crossSiteTracking: false, dataRetentionDays: 365 },
            ui: { theme: 'dark', sidebarPosition: 'right', animationsEnabled: true, compactMode: false, fontSize: 'medium', language: 'en' },
            ai: { summaryLength: 'brief', suggestionFrequency: 'medium', voiceEnabled: false, autoSummarize: true, contextAwareness: true, learningEnabled: true },
            notifications: { browserNotifications: true, emailDigest: false, insightAlerts: true, automationUpdates: true, securityAlerts: true }
          }
        ])

        const result = await service.getOrCreateDefault()

        expect(result.id).toBe('pref-1')
        expect(mockList).toHaveBeenCalled()
      })

      it('should create default preferences if none exist', async () => {
        const mockList = jest.spyOn(service, 'list')
        const mockCreate = jest.spyOn(service, 'create')
        mockList.mockResolvedValue([])
        mockCreate.mockResolvedValue('new-pref-id')

        const result = await service.getOrCreateDefault()

        expect(result.id).toBe('new-pref-id')
        expect(result.privacy.dataCollection).toBe('standard')
        expect(result.ui.theme).toBe('dark')
        expect(mockCreate).toHaveBeenCalled()
      })
    })
  })

  describe('ActivityService', () => {
    let service: ActivityService

    beforeEach(() => {
      service = new ActivityService(mockUserId)
    })

    describe('getRecentActivities', () => {
      it('should call list with correct constraints', async () => {
        const mockList = jest.spyOn(service, 'list')
        const mockOrderBy = require('firebase/firestore').orderBy
        const mockLimit = require('firebase/firestore').limit
        
        mockList.mockResolvedValue([])
        mockOrderBy.mockReturnValue('order-constraint')
        mockLimit.mockReturnValue('limit-constraint')

        await service.getRecentActivities(25)

        expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc')
        expect(mockLimit).toHaveBeenCalledWith(25)
        expect(mockList).toHaveBeenCalledWith(['order-constraint', 'limit-constraint'])
      })
    })

    describe('getActivitiesByType', () => {
      it('should filter by activity type', async () => {
        const mockList = jest.spyOn(service, 'list')
        const mockWhere = require('firebase/firestore').where
        const mockOrderBy = require('firebase/firestore').orderBy
        const mockLimit = require('firebase/firestore').limit
        
        mockList.mockResolvedValue([])
        mockWhere.mockReturnValue('where-constraint')
        mockOrderBy.mockReturnValue('order-constraint')
        mockLimit.mockReturnValue('limit-constraint')

        await service.getActivitiesByType('page_visit', 10)

        expect(mockWhere).toHaveBeenCalledWith('type', '==', 'page_visit')
        expect(mockLimit).toHaveBeenCalledWith(10)
      })
    })
  })

  describe('AutomationRuleService', () => {
    let service: AutomationRuleService

    beforeEach(() => {
      service = new AutomationRuleService(mockUserId)
    })

    describe('getActiveRules', () => {
      it('should filter by active status', async () => {
        const mockList = jest.spyOn(service, 'list')
        const mockWhere = require('firebase/firestore').where
        
        mockList.mockResolvedValue([])
        mockWhere.mockReturnValue('where-constraint')

        await service.getActiveRules()

        expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true)
      })
    })

    describe('toggleRule', () => {
      it('should update rule active status', async () => {
        const mockUpdate = jest.spyOn(service, 'update')
        mockUpdate.mockResolvedValue()

        await service.toggleRule('rule-id', false)

        expect(mockUpdate).toHaveBeenCalledWith('rule-id', { isActive: false })
      })
    })
  })

  describe('KnowledgeNodeService', () => {
    let service: KnowledgeNodeService

    beforeEach(() => {
      service = new KnowledgeNodeService(mockUserId)
    })

    describe('searchNodes', () => {
      it('should filter nodes by search term', async () => {
        const mockList = jest.spyOn(service, 'list')
        mockList.mockResolvedValue([
          { id: '1', label: 'JavaScript Programming', tags: ['coding', 'web'] },
          { id: '2', label: 'Python Data Science', tags: ['data', 'analysis'] },
          { id: '3', label: 'Web Development', tags: ['javascript', 'html'] }
        ])

        const result = await service.searchNodes('javascript')

        expect(result).toHaveLength(2) // Should match both JavaScript Programming and Web Development (via tag)
        expect(result[0].label).toBe('JavaScript Programming')
        expect(result[1].label).toBe('Web Development')
      })
    })
  })

  describe('createUserServices', () => {
    it('should create all services for a user', () => {
      const services = createUserServices(mockUserId)

      expect(services.preferences).toBeInstanceOf(UserPreferencesService)
      expect(services.activities).toBeInstanceOf(ActivityService)
      expect(services.automationRules).toBeInstanceOf(AutomationRuleService)
      expect(services.knowledgeNodes).toBeInstanceOf(KnowledgeNodeService)
      expect(services.integrations).toBeInstanceOf(IntegrationService)
      expect(services.insights).toBeInstanceOf(InsightService)
      expect(services.sessions).toBeInstanceOf(SessionService)
      expect(services.analytics).toBeInstanceOf(AnalyticsService)
    })
  })
})
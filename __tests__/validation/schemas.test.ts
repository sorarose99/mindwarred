// Unit tests for data validation schemas

import {
  validatePageContext,
  validateUserPreferences,
  validateAutomationRule,
  validateKnowledgeNode,
  validateActivityRecord,
  validateServiceIntegration,
  validateData,
  sanitizeString,
  sanitizeUrl,
  sanitizeObject
} from '../../lib/validation/schemas'

describe('Data Validation Schemas', () => {
  
  describe('validatePageContext', () => {
    it('should validate a valid PageContext', () => {
      const validPageContext = {
        url: 'https://example.com',
        title: 'Example Page',
        pageType: 'article',
        timestamp: Date.now(),
        content: 'Some content',
        selectedText: 'Selected text',
        formFields: []
      }
      
      const result = validatePageContext(validPageContext)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject PageContext with missing required fields', () => {
      const invalidPageContext = {
        title: 'Example Page'
      }
      
      const result = validatePageContext(invalidPageContext)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing required field: url')
      expect(result.errors).toContain('Missing required field: pageType')
      expect(result.errors).toContain('Missing required field: timestamp')
    })
    
    it('should reject PageContext with invalid URL', () => {
      const invalidPageContext = {
        url: 'not-a-valid-url',
        title: 'Example Page',
        pageType: 'article',
        timestamp: Date.now()
      }
      
      const result = validatePageContext(invalidPageContext)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('url must be a valid URL')
    })
    
    it('should reject PageContext with invalid pageType', () => {
      const invalidPageContext = {
        url: 'https://example.com',
        title: 'Example Page',
        pageType: 'invalid-type',
        timestamp: Date.now()
      }
      
      const result = validatePageContext(invalidPageContext)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('pageType must be a valid page type')
    })
  })
  
  describe('validateUserPreferences', () => {
    it('should validate valid UserPreferences', () => {
      const validPreferences = {
        privacy: {
          dataCollection: 'standard',
          cloudSync: true,
          voiceData: false,
          activityTracking: true,
          crossSiteTracking: false,
          dataRetentionDays: 365
        },
        ui: {
          theme: 'dark',
          sidebarPosition: 'right',
          animationsEnabled: true,
          compactMode: false,
          fontSize: 'medium',
          language: 'en'
        },
        ai: {
          summaryLength: 'brief',
          suggestionFrequency: 'medium',
          voiceEnabled: false,
          autoSummarize: true,
          contextAwareness: true,
          learningEnabled: true
        },
        notifications: {
          browserNotifications: true,
          emailDigest: false,
          insightAlerts: true,
          automationUpdates: true,
          securityAlerts: true
        }
      }
      
      const result = validateUserPreferences(validPreferences)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject UserPreferences with missing sections', () => {
      const invalidPreferences = {
        privacy: {
          dataCollection: 'standard',
          cloudSync: true,
          voiceData: false,
          activityTracking: true,
          crossSiteTracking: false,
          dataRetentionDays: 365
        }
      }
      
      const result = validateUserPreferences(invalidPreferences)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing required field: ui')
      expect(result.errors).toContain('Missing required field: ai')
      expect(result.errors).toContain('Missing required field: notifications')
    })
    
    it('should reject UserPreferences with invalid privacy settings', () => {
      const invalidPreferences = {
        privacy: {
          dataCollection: 'invalid-level',
          cloudSync: true,
          voiceData: false,
          activityTracking: true,
          crossSiteTracking: false,
          dataRetentionDays: -1
        },
        ui: { theme: 'dark', sidebarPosition: 'right', animationsEnabled: true, compactMode: false, fontSize: 'medium', language: 'en' },
        ai: { summaryLength: 'brief', suggestionFrequency: 'medium', voiceEnabled: false, autoSummarize: true, contextAwareness: true, learningEnabled: true },
        notifications: { browserNotifications: true, emailDigest: false, insightAlerts: true, automationUpdates: true, securityAlerts: true }
      }
      
      const result = validateUserPreferences(invalidPreferences)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('privacy.dataCollection must be minimal, standard, or comprehensive')
      expect(result.errors).toContain('privacy.dataRetentionDays must be a positive number')
    })
  })
  
  describe('validateAutomationRule', () => {
    it('should validate a valid AutomationRule', () => {
      const validRule = {
        name: 'Test Rule',
        isActive: true,
        trigger: {
          type: 'page_load',
          conditions: [
            { field: 'url', operator: 'contains', value: 'example.com' }
          ],
          operator: 'AND'
        },
        actions: [
          { id: '1', type: 'click_element', parameters: { selector: '.button' } }
        ]
      }
      
      const result = validateAutomationRule(validRule)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject AutomationRule with empty name', () => {
      const invalidRule = {
        name: '',
        isActive: true,
        trigger: {
          type: 'page_load',
          conditions: [],
          operator: 'AND'
        },
        actions: [
          { id: '1', type: 'click_element', parameters: { selector: '.button' } }
        ]
      }
      
      const result = validateAutomationRule(invalidRule)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('name must be a non-empty string')
    })
    
    it('should reject AutomationRule with empty actions', () => {
      const invalidRule = {
        name: 'Test Rule',
        isActive: true,
        trigger: {
          type: 'page_load',
          conditions: [],
          operator: 'AND'
        },
        actions: []
      }
      
      const result = validateAutomationRule(invalidRule)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('actions array cannot be empty')
    })
  })
  
  describe('validateKnowledgeNode', () => {
    it('should validate a valid KnowledgeNode', () => {
      const validNode = {
        label: 'JavaScript',
        type: 'topic',
        strength: 0.8,
        confidence: 0.9,
        connections: [
          { targetNodeId: 'node2', relationshipType: 'related_to', strength: 0.7, confidence: 0.8, createdAt: new Date() }
        ],
        metadata: {
          description: 'Programming language',
          frequency: 10,
          lastAccessed: new Date(),
          importance: 0.9,
          source: 'browsing_history',
          verified: true
        }
      }
      
      const result = validateKnowledgeNode(validNode)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject KnowledgeNode with invalid strength', () => {
      const invalidNode = {
        label: 'JavaScript',
        type: 'topic',
        strength: 1.5, // Invalid: > 1
        confidence: 0.9,
        connections: [],
        metadata: {}
      }
      
      const result = validateKnowledgeNode(invalidNode)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('strength must be a number between 0 and 1')
    })
    
    it('should reject KnowledgeNode with invalid type', () => {
      const invalidNode = {
        label: 'JavaScript',
        type: 'invalid-type',
        strength: 0.8,
        confidence: 0.9,
        connections: [],
        metadata: {}
      }
      
      const result = validateKnowledgeNode(invalidNode)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('type must be a valid node type')
    })
  })
  
  describe('validateActivityRecord', () => {
    it('should validate a valid ActivityRecord', () => {
      const validActivity = {
        userId: 'user123',
        timestamp: Date.now(),
        type: 'page_visit',
        data: {
          url: 'https://example.com',
          timeSpent: 30000
        },
        context: {
          pageContext: {
            url: 'https://example.com',
            title: 'Example',
            pageType: 'article',
            timestamp: Date.now()
          },
          deviceInfo: {
            type: 'desktop',
            os: 'macOS',
            browser: 'Chrome',
            screenResolution: '1920x1080',
            timezone: 'UTC',
            language: 'en'
          },
          sessionId: 'session123',
          userAgent: 'Mozilla/5.0...'
        }
      }
      
      const result = validateActivityRecord(validActivity)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject ActivityRecord with invalid type', () => {
      const invalidActivity = {
        userId: 'user123',
        timestamp: Date.now(),
        type: 'invalid-type',
        data: {},
        context: {}
      }
      
      const result = validateActivityRecord(invalidActivity)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('type must be a valid activity type')
    })
  })
  
  describe('validateServiceIntegration', () => {
    it('should validate a valid ServiceIntegration', () => {
      const validIntegration = {
        service: 'gmail',
        isConnected: true,
        isActive: true,
        permissions: [
          { scope: 'read', granted: true, grantedAt: new Date(), description: 'Read emails', required: true }
        ],
        syncedData: {
          emails: [],
          lastSyncTimestamp: new Date(),
          itemCount: 0
        },
        configuration: {
          syncFrequency: 'hourly',
          dataTypes: ['emails'],
          maxItems: 1000
        }
      }
      
      const result = validateServiceIntegration(validIntegration)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject ServiceIntegration with invalid service', () => {
      const invalidIntegration = {
        service: 'invalid-service',
        isConnected: true,
        isActive: true,
        permissions: [],
        syncedData: {},
        configuration: {}
      }
      
      const result = validateServiceIntegration(invalidIntegration)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('service must be a valid service type')
    })
  })
  
  describe('validateData generic function', () => {
    it('should route to correct validator based on type', () => {
      const pageContext = {
        url: 'https://example.com',
        title: 'Test',
        pageType: 'article',
        timestamp: Date.now()
      }
      
      const result = validateData(pageContext, 'PageContext')
      expect(result.isValid).toBe(true)
    })
    
    it('should handle unknown validation type', () => {
      const result = validateData({}, 'UnknownType')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Unknown validation type: UnknownType')
    })
  })
  
  describe('Sanitization functions', () => {
    describe('sanitizeString', () => {
      it('should trim whitespace and remove dangerous characters', () => {
        expect(sanitizeString('  hello world  ')).toBe('hello world')
        expect(sanitizeString('hello<script>alert("xss")</script>world')).toBe('helloscriptalert("xss")/scriptworld')
      })
    })
    
    describe('sanitizeUrl', () => {
      it('should return valid URL as string', () => {
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
      })
      
      it('should return empty string for invalid URL', () => {
        expect(sanitizeUrl('not-a-url')).toBe('')
      })
    })
    
    describe('sanitizeObject', () => {
      it('should only keep allowed fields', () => {
        const obj = {
          allowed1: 'value1',
          allowed2: 'value2',
          notAllowed: 'value3'
        }
        
        const result = sanitizeObject(obj, ['allowed1', 'allowed2'])
        expect(result).toEqual({
          allowed1: 'value1',
          allowed2: 'value2'
        })
        expect(result.notAllowed).toBeUndefined()
      })
    })
  })
})
// Unit tests for Firebase Security Rules
// Note: These are conceptual tests - actual security rule testing requires Firebase emulator

import { 
  RulesTestEnvironment, 
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing'

describe('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    // Initialize test environment with security rules
    testEnv = await initializeTestEnvironment({
      projectId: 'kiro-test-project',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              function isAuthenticated() {
                return request.auth != null;
              }
              
              function isOwner(userId) {
                return request.auth.uid == userId;
              }
              
              match /users/{userId} {
                allow read, write: if isOwner(userId);
                
                match /activities/{activityId} {
                  allow read, write: if isOwner(userId);
                }
                
                match /knowledge/{nodeId} {
                  allow read, write: if isOwner(userId);
                }
                
                match /automations/{ruleId} {
                  allow read, write: if isOwner(userId);
                }
              }
              
              match /system/{document} {
                allow read: if isAuthenticated();
                allow write: if false;
              }
            }
          }
        `
      }
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  afterEach(async () => {
    await testEnv.clearFirestore()
  })

  describe('User Document Access', () => {
    test('should allow user to read their own document', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const aliceDoc = alice.firestore().doc('users/alice')
      
      await assertSucceeds(aliceDoc.get())
    })

    test('should deny user from reading another user\'s document', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const bobDoc = alice.firestore().doc('users/bob')
      
      await assertFails(bobDoc.get())
    })

    test('should allow user to write to their own document', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const aliceDoc = alice.firestore().doc('users/alice')
      
      await assertSucceeds(aliceDoc.set({
        email: 'alice@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          privacy: { dataCollection: 'standard' },
          ui: { theme: 'dark' },
          ai: { summaryLength: 'brief' },
          notifications: { enabled: true }
        }
      }))
    })

    test('should deny unauthenticated access to user documents', async () => {
      const unauthed = testEnv.unauthenticatedContext()
      const userDoc = unauthed.firestore().doc('users/alice')
      
      await assertFails(userDoc.get())
      await assertFails(userDoc.set({ email: 'test@example.com' }))
    })
  })

  describe('User Subcollections Access', () => {
    test('should allow user to read their own activities', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const activityDoc = alice.firestore().doc('users/alice/activities/activity1')
      
      await assertSucceeds(activityDoc.get())
    })

    test('should allow user to create activities with valid data', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const activityDoc = alice.firestore().doc('users/alice/activities/activity1')
      
      await assertSucceeds(activityDoc.set({
        type: 'page_visit',
        context: {
          url: 'https://example.com',
          title: 'Test Page',
          pageType: 'article',
          timestamp: 1234567890
        },
        timestamp: new Date(),
        userId: 'alice'
      }))
    })

    test('should deny user from accessing another user\'s activities', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const bobActivity = alice.firestore().doc('users/bob/activities/activity1')
      
      await assertFails(bobActivity.get())
      await assertFails(bobActivity.set({ type: 'page_visit' }))
    })

    test('should allow user to manage their knowledge nodes', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const knowledgeDoc = alice.firestore().doc('users/alice/knowledge/node1')
      
      await assertSucceeds(knowledgeDoc.set({
        type: 'topic',
        label: 'Machine Learning',
        properties: { weight: 0.8 },
        connections: [],
        metadata: { source: 'browsing' },
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      await assertSucceeds(knowledgeDoc.get())
      await assertSucceeds(knowledgeDoc.update({ 'properties.weight': 0.9 }))
      await assertSucceeds(knowledgeDoc.delete())
    })

    test('should allow user to manage their automation rules', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const automationDoc = alice.firestore().doc('users/alice/automations/rule1')
      
      await assertSucceeds(automationDoc.set({
        name: 'Test Rule',
        isActive: true,
        trigger: { type: 'page_load' },
        actions: [{ type: 'click', config: {} }],
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    })
  })

  describe('System Collections Access', () => {
    test('should allow authenticated users to read system documents', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const systemDoc = alice.firestore().doc('system/config')
      
      await assertSucceeds(systemDoc.get())
    })

    test('should deny authenticated users from writing to system documents', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const systemDoc = alice.firestore().doc('system/config')
      
      await assertFails(systemDoc.set({ version: '1.0' }))
    })

    test('should deny unauthenticated access to system documents', async () => {
      const unauthed = testEnv.unauthenticatedContext()
      const systemDoc = unauthed.firestore().doc('system/config')
      
      await assertFails(systemDoc.get())
    })
  })

  describe('Data Validation Rules', () => {
    test('should enforce required fields for activities', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const activityDoc = alice.firestore().doc('users/alice/activities/activity1')
      
      // Missing required fields should fail
      await assertFails(activityDoc.set({
        type: 'page_visit'
        // Missing context and timestamp
      }))
      
      // Invalid context should fail
      await assertFails(activityDoc.set({
        type: 'page_visit',
        context: {
          url: 'invalid-url'
          // Missing title, pageType, timestamp
        },
        timestamp: new Date()
      }))
    })

    test('should enforce valid page types', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const activityDoc = alice.firestore().doc('users/alice/activities/activity1')
      
      // Invalid page type should fail
      await assertFails(activityDoc.set({
        type: 'page_visit',
        context: {
          url: 'https://example.com',
          title: 'Test',
          pageType: 'invalid_type',
          timestamp: 1234567890
        },
        timestamp: new Date()
      }))
      
      // Valid page type should succeed
      await assertSucceeds(activityDoc.set({
        type: 'page_visit',
        context: {
          url: 'https://example.com',
          title: 'Test',
          pageType: 'article',
          timestamp: 1234567890
        },
        timestamp: new Date()
      }))
    })

    test('should enforce valid knowledge node types', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const knowledgeDoc = alice.firestore().doc('users/alice/knowledge/node1')
      
      // Invalid node type should fail
      await assertFails(knowledgeDoc.set({
        type: 'invalid_type',
        label: 'Test Node',
        properties: { weight: 0.5 }
      }))
      
      // Valid node type should succeed
      await assertSucceeds(knowledgeDoc.set({
        type: 'topic',
        label: 'Test Node',
        properties: { weight: 0.5 },
        connections: [],
        metadata: { source: 'test' },
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    })

    test('should enforce automation rule structure', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const automationDoc = alice.firestore().doc('users/alice/automations/rule1')
      
      // Missing required fields should fail
      await assertFails(automationDoc.set({
        name: 'Test Rule'
        // Missing isActive, trigger, actions
      }))
      
      // Empty actions array should fail
      await assertFails(automationDoc.set({
        name: 'Test Rule',
        isActive: true,
        trigger: { type: 'page_load' },
        actions: []
      }))
      
      // Valid structure should succeed
      await assertSucceeds(automationDoc.set({
        name: 'Test Rule',
        isActive: true,
        trigger: { type: 'page_load' },
        actions: [{ type: 'click' }],
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    })
  })

  describe('Error Logging Access', () => {
    test('should allow authenticated users to create error logs', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const errorDoc = alice.firestore().doc('error_logs/error1')
      
      await assertSucceeds(errorDoc.set({
        userId: 'alice',
        error: 'Test error message',
        timestamp: new Date()
      }))
    })

    test('should deny users from reading error logs', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const errorDoc = alice.firestore().doc('error_logs/error1')
      
      await assertFails(errorDoc.get())
    })

    test('should enforce error log structure', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const errorDoc = alice.firestore().doc('error_logs/error1')
      
      // Wrong userId should fail
      await assertFails(errorDoc.set({
        userId: 'bob',
        error: 'Test error',
        timestamp: new Date()
      }))
      
      // Missing required fields should fail
      await assertFails(errorDoc.set({
        userId: 'alice'
        // Missing error and timestamp
      }))
    })
  })

  describe('Feedback Collection Access', () => {
    test('should allow authenticated users to submit feedback', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const feedbackDoc = alice.firestore().doc('feedback/feedback1')
      
      await assertSucceeds(feedbackDoc.set({
        userId: 'alice',
        type: 'bug',
        content: 'Found a bug in the interface',
        timestamp: new Date()
      }))
    })

    test('should enforce valid feedback types', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const feedbackDoc = alice.firestore().doc('feedback/feedback1')
      
      // Invalid feedback type should fail
      await assertFails(feedbackDoc.set({
        userId: 'alice',
        type: 'invalid_type',
        content: 'Test feedback',
        timestamp: new Date()
      }))
      
      // Valid feedback types should succeed
      const validTypes = ['bug', 'feature', 'improvement', 'general']
      for (const type of validTypes) {
        const doc = alice.firestore().doc(`feedback/feedback_${type}`)
        await assertSucceeds(doc.set({
          userId: 'alice',
          type: type,
          content: `Test ${type} feedback`,
          timestamp: new Date()
        }))
      }
    })

    test('should deny users from reading feedback', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const feedbackDoc = alice.firestore().doc('feedback/feedback1')
      
      await assertFails(feedbackDoc.get())
    })
  })
})
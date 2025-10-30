// Firebase collection helpers and data access layer

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '../firebase'
import type {
  UserPreferences,
  ActivityRecord,
  AutomationRule,
  KnowledgeNode,
  ServiceIntegration,
  LearningInsight,
  UserSession,
  ActivityAnalytics,
  UserDocument
} from '../types'

// Collection references
export const getCollectionRef = (path: string): CollectionReference => {
  return collection(db, path)
}

export const getDocRef = (path: string): DocumentReference => {
  return doc(db, path)
}

// User collections
export const getUserCollections = (userId: string) => ({
  user: getDocRef(`users/${userId}`),
  preferences: getCollectionRef(`users/${userId}/preferences`),
  activities: getCollectionRef(`users/${userId}/activities`),
  sessions: getCollectionRef(`users/${userId}/sessions`),
  automationRules: getCollectionRef(`users/${userId}/automationRules`),
  knowledgeNodes: getCollectionRef(`users/${userId}/knowledgeNodes`),
  integrations: getCollectionRef(`users/${userId}/integrations`),
  insights: getCollectionRef(`users/${userId}/insights`),
  analytics: getCollectionRef(`users/${userId}/analytics`)
})

// Generic CRUD operations
export class FirestoreService<T extends { id?: string }> {
  constructor(private collectionRef: CollectionReference) {}

  async create(data: Omit<T, 'id'>): Promise<string> {
    const docData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    const docRef = await addDoc(this.collectionRef, docData)
    return docRef.id
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.collectionRef, id)
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    }
    await updateDoc(docRef, updateData)
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id)
    await deleteDoc(docRef)
  }

  async get(id: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as T
    }
    return null
  }

  async list(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.collectionRef, ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T))
  }

  async paginate(
    pageSize: number = 20,
    lastDoc?: any,
    constraints: QueryConstraint[] = []
  ): Promise<{ items: T[], hasMore: boolean, lastDoc: any }> {
    const queryConstraints = [
      ...constraints,
      limit(pageSize + 1)
    ]
    
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc))
    }
    
    const q = query(this.collectionRef, ...queryConstraints)
    const querySnapshot = await getDocs(q)
    
    const items = querySnapshot.docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T))
    
    const hasMore = querySnapshot.docs.length > pageSize
    const newLastDoc = hasMore ? querySnapshot.docs[pageSize - 1] : null
    
    return { items, hasMore, lastDoc: newLastDoc }
  }
}

// Specific service classes
export class UserPreferencesService extends FirestoreService<UserPreferences & { id?: string }> {
  constructor(userId: string) {
    super(getUserCollections(userId).preferences)
  }

  async getOrCreateDefault(): Promise<UserPreferences> {
    const preferences = await this.list()
    if (preferences.length > 0) {
      return preferences[0]
    }

    // Create default preferences
    const defaultPreferences: Omit<UserPreferences, 'id'> = {
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

    const id = await this.create(defaultPreferences)
    return { id, ...defaultPreferences } as UserPreferences & { id: string }
  }
}

export class ActivityService extends FirestoreService<ActivityRecord> {
  constructor(userId: string) {
    super(getUserCollections(userId).activities)
  }

  async getRecentActivities(limitCount: number = 50): Promise<ActivityRecord[]> {
    return this.list([
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ])
  }

  async getActivitiesByType(type: string, limitCount: number = 20): Promise<ActivityRecord[]> {
    return this.list([
      where('type', '==', type),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ])
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<ActivityRecord[]> {
    return this.list([
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    ])
  }
}

export class AutomationRuleService extends FirestoreService<AutomationRule> {
  constructor(userId: string) {
    super(getUserCollections(userId).automationRules)
  }

  async getActiveRules(): Promise<AutomationRule[]> {
    return this.list([
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc')
    ])
  }

  async toggleRule(id: string, isActive: boolean): Promise<void> {
    await this.update(id, { isActive })
  }
}

export class KnowledgeNodeService extends FirestoreService<KnowledgeNode> {
  constructor(userId: string) {
    super(getUserCollections(userId).knowledgeNodes)
  }

  async getNodesByType(type: string): Promise<KnowledgeNode[]> {
    return this.list([
      where('type', '==', type),
      orderBy('strength', 'desc')
    ])
  }

  async getTopNodes(limitCount: number = 20): Promise<KnowledgeNode[]> {
    return this.list([
      orderBy('strength', 'desc'),
      limit(limitCount)
    ])
  }

  async searchNodes(searchTerm: string): Promise<KnowledgeNode[]> {
    // Note: This is a simple implementation. For production, consider using
    // Algolia or similar for full-text search
    const nodes = await this.list()
    return nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }
}

export class IntegrationService extends FirestoreService<ServiceIntegration> {
  constructor(userId: string) {
    super(getUserCollections(userId).integrations)
  }

  async getConnectedIntegrations(): Promise<ServiceIntegration[]> {
    return this.list([
      where('isConnected', '==', true),
      orderBy('lastSync', 'desc')
    ])
  }

  async getIntegrationByService(service: string): Promise<ServiceIntegration | null> {
    const integrations = await this.list([
      where('service', '==', service),
      limit(1)
    ])
    return integrations.length > 0 ? integrations[0] : null
  }
}

export class InsightService extends FirestoreService<LearningInsight> {
  constructor(userId: string) {
    super(getUserCollections(userId).insights)
  }

  async getRecentInsights(limitCount: number = 10): Promise<LearningInsight[]> {
    return this.list([
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ])
  }

  async getInsightsByType(type: string): Promise<LearningInsight[]> {
    return this.list([
      where('type', '==', type),
      orderBy('relevance', 'desc')
    ])
  }

  async getActionableInsights(): Promise<LearningInsight[]> {
    return this.list([
      where('actionable', '==', true),
      orderBy('relevance', 'desc')
    ])
  }
}

export class SessionService extends FirestoreService<UserSession> {
  constructor(userId: string) {
    super(getUserCollections(userId).sessions)
  }

  async getRecentSessions(limitCount: number = 20): Promise<UserSession[]> {
    return this.list([
      orderBy('startTime', 'desc'),
      limit(limitCount)
    ])
  }

  async getCurrentSession(): Promise<UserSession | null> {
    const sessions = await this.list([
      where('endTime', '==', null),
      orderBy('startTime', 'desc'),
      limit(1)
    ])
    return sessions.length > 0 ? sessions[0] : null
  }
}

export class AnalyticsService extends FirestoreService<ActivityAnalytics & { id?: string }> {
  constructor(userId: string) {
    super(getUserCollections(userId).analytics)
  }

  async getAnalyticsByPeriod(period: string): Promise<ActivityAnalytics[]> {
    return this.list([
      where('period', '==', period),
      orderBy('startDate', 'desc')
    ])
  }
}

// Factory function to create services for a user
export const createUserServices = (userId: string) => ({
  preferences: new UserPreferencesService(userId),
  activities: new ActivityService(userId),
  automationRules: new AutomationRuleService(userId),
  knowledgeNodes: new KnowledgeNodeService(userId),
  integrations: new IntegrationService(userId),
  insights: new InsightService(userId),
  sessions: new SessionService(userId),
  analytics: new AnalyticsService(userId)
})

// User Document Service
export class UserDocumentService {
  static async get(userId: string): Promise<UserDocument | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserDocument
      }
      return null
    } catch (error) {
      console.error('Error fetching user document:', error)
      return null
    }
  }
}
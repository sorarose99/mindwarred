// Activity tracking and user behavior interfaces

import { Timestamp } from 'firebase/firestore'
import { PageContext } from './core'

// Activity Record Interface
export interface ActivityRecord {
  id: string
  userId: string
  timestamp: Timestamp
  type: ActivityType
  data: ActivityData
  context: ActivityContext
  duration?: number
  outcome?: ActivityOutcome
  metadata?: Record<string, any>
}

export type ActivityType = 
  | 'page_visit'
  | 'text_selection'
  | 'form_interaction'
  | 'search_query'
  | 'click_action'
  | 'scroll_behavior'
  | 'voice_command'
  | 'ai_interaction'
  | 'automation_trigger'
  | 'content_save'
  | 'share_action'
  | 'bookmark_action'

export interface ActivityData {
  [key: string]: any
}

// Specific activity data interfaces
export interface PageVisitData extends ActivityData {
  url: string
  title: string
  referrer?: string
  timeSpent: number
  scrollDepth: number
  exitType: 'navigation' | 'close' | 'back' | 'refresh'
}

export interface TextSelectionData extends ActivityData {
  selectedText: string
  selectionLength: number
  pageUrl: string
  contextBefore?: string
  contextAfter?: string
  action?: 'copy' | 'highlight' | 'search' | 'translate'
}

export interface FormInteractionData extends ActivityData {
  formId?: string
  fieldName: string
  fieldType: string
  action: 'focus' | 'input' | 'submit' | 'abandon'
  value?: string
  completionTime?: number
}

export interface SearchQueryData extends ActivityData {
  query: string
  searchEngine: string
  resultsClicked: number
  timeToFirstClick?: number
  refinements?: string[]
}

export interface VoiceCommandData extends ActivityData {
  command: string
  confidence: number
  language: string
  duration: number
  successful: boolean
  response?: string
}

export interface AIInteractionData extends ActivityData {
  operation: string
  input: string
  output?: string
  processingTime: number
  confidence?: number
  model?: string
}

export interface ActivityContext {
  pageContext: PageContext
  deviceInfo: DeviceInfo
  sessionId: string
  userAgent: string
  location?: GeolocationInfo
  networkInfo?: NetworkInfo
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  screenResolution: string
  timezone: string
  language: string
}

export interface GeolocationInfo {
  latitude?: number
  longitude?: number
  city?: string
  country?: string
  timezone?: string
}

export interface NetworkInfo {
  connectionType: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export interface ActivityOutcome {
  success: boolean
  value?: number
  impact?: 'low' | 'medium' | 'high'
  userSatisfaction?: number
  followUpActions?: string[]
}

// Session tracking
export interface UserSession {
  id: string
  userId: string
  startTime: Timestamp
  endTime?: Timestamp
  duration?: number
  activities: ActivityRecord[]
  pageViews: number
  interactions: number
  goals?: SessionGoal[]
  summary?: SessionSummary
}

export interface SessionGoal {
  id: string
  description: string
  type: 'research' | 'work' | 'entertainment' | 'shopping' | 'learning'
  completed: boolean
  progress: number
}

export interface SessionSummary {
  topDomains: string[]
  topActivities: ActivityType[]
  totalTimeSpent: number
  productivityScore?: number
  focusScore?: number
  achievements?: string[]
}

// Analytics and insights
export interface ActivityAnalytics {
  userId: string
  period: AnalyticsPeriod
  startDate: Timestamp
  endDate: Timestamp
  metrics: ActivityMetrics
  trends: ActivityTrend[]
  insights: ActivityInsight[]
}

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface ActivityMetrics {
  totalActivities: number
  totalTimeSpent: number
  averageSessionDuration: number
  topDomains: DomainMetric[]
  topActivities: ActivityMetric[]
  productivityScore: number
  focusScore: number
  engagementScore: number
}

export interface DomainMetric {
  domain: string
  visits: number
  timeSpent: number
  percentage: number
}

export interface ActivityMetric {
  type: ActivityType
  count: number
  averageDuration: number
  percentage: number
}

export interface ActivityTrend {
  metric: string
  direction: 'up' | 'down' | 'stable'
  change: number
  period: string
  significance: 'low' | 'medium' | 'high'
}

export interface ActivityInsight {
  id: string
  type: 'pattern' | 'anomaly' | 'opportunity' | 'achievement'
  title: string
  description: string
  confidence: number
  actionable: boolean
  recommendations?: string[]
  relatedActivities: string[]
}
// Learnin
g Insights Interface
export interface LearningInsight {
  id: string
  userId: string
  type: 'pattern' | 'preference' | 'productivity' | 'behavior' | 'recommendation'
  title: string
  description: string
  confidence: number
  actionable: boolean
  data: Record<string, any>
  createdAt: Timestamp
  updatedAt: Timestamp
  tags?: string[]
  category?: string
}
// Service integration interfaces

import { Timestamp } from 'firebase/firestore'

// Service Integration Interface (for data storage)
export interface ServiceIntegrationData {
  id: string
  service: ServiceType
  isConnected: boolean
  isActive: boolean
  permissions: Permission[]
  lastSync: Timestamp
  syncedData: SyncedData
  configuration: ServiceConfiguration
  credentials?: ServiceCredentials
  rateLimits?: RateLimitInfo
  errorCount: number
  lastError?: string
}

// Service Integration Interface (for service classes)
export interface ServiceIntegration {
  authenticate(): Promise<boolean>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>
  getConnectionStatus(): Promise<'connected' | 'disconnected' | 'error'>
  getServiceName(): string
  getServiceIcon(): string
}

// Email Context for real-time processing
export interface EmailContext {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: string
  body: string
  snippet: string
  labels: string[]
  isRead: boolean
  isImportant: boolean
  timestamp: number
}

// Document Context for real-time processing
export interface DocumentContext {
  id: string
  title: string
  content: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'note'
  source: 'drive' | 'notion' | 'local'
  url?: string
  lastModified: string
  author: string
  tags: string[]
  metadata: Record<string, any>
}

// Video Context for real-time processing
export interface VideoContext {
  id: string
  title: string
  description: string
  duration: number
  url: string
  thumbnail: string
  channel: string
  publishedAt: string
  viewCount: number
  tags: string[]
  transcript?: string
}

// Message Context for real-time processing
export interface MessageContext {
  id: string
  channelId: string
  channelName: string
  author: string
  content: string
  timestamp: string
  reactions: Array<{ emoji: string; count: number }>
  mentions: string[]
  attachments: Array<{ name: string; url: string; type: string }>
  isDirectMessage: boolean
  threadId?: string
}

export type ServiceType = 'gmail' | 'youtube' | 'notion' | 'drive' | 'slack' | 'github' | 'twitter' | 'linkedin' | 'calendar' | 'docs'

export interface Permission {
  scope: string
  granted: boolean
  grantedAt: Timestamp
  description: string
  required: boolean
}

export interface SyncedData {
  emails?: EmailSummary[]
  documents?: DocumentReference[]
  messages?: MessageThread[]
  videos?: VideoReference[]
  repositories?: RepositoryReference[]
  events?: CalendarEvent[]
  lastSyncTimestamp: Timestamp
  itemCount: number
}

export interface ServiceConfiguration {
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual'
  dataTypes: string[]
  filters?: SyncFilter[]
  maxItems?: number
  retentionDays?: number
}

export interface ServiceCredentials {
  accessToken?: string
  refreshToken?: string
  expiresAt?: Timestamp
  tokenType?: string
  scope?: string[]
}

export interface RateLimitInfo {
  requestsPerHour: number
  requestsRemaining: number
  resetTime: Timestamp
  dailyQuota?: number
  dailyUsed?: number
}

export interface SyncFilter {
  field: string
  operator: 'equals' | 'contains' | 'after' | 'before'
  value: any
}

// Gmail Integration
export interface EmailSummary {
  id: string
  threadId: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  snippet: string
  timestamp: Timestamp
  isRead: boolean
  isImportant: boolean
  labels: string[]
  attachments?: AttachmentInfo[]
  aiSummary?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  category?: EmailCategory
}

export interface EmailAddress {
  email: string
  name?: string
}

export interface AttachmentInfo {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export type EmailCategory = 'work' | 'personal' | 'promotional' | 'social' | 'updates' | 'forums' | 'spam'

// Document References (Drive, Notion, etc.)
export interface DocumentReference {
  id: string
  title: string
  type: DocumentType
  url: string
  lastModified: Timestamp
  owner: string
  permissions: DocumentPermission[]
  summary?: string
  tags?: string[]
  wordCount?: number
  language?: string
}

export type DocumentType = 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'image' | 'video' | 'note' | 'database'

export interface DocumentPermission {
  email: string
  role: 'owner' | 'editor' | 'commenter' | 'viewer'
}

// Slack/Teams Messages
export interface MessageThread {
  id: string
  channelId: string
  channelName: string
  timestamp: Timestamp
  author: MessageAuthor
  content: string
  messageType: 'text' | 'file' | 'image' | 'link' | 'code'
  reactions?: MessageReaction[]
  replies?: MessageReply[]
  mentions?: string[]
  isDirectMessage: boolean
}

export interface MessageAuthor {
  id: string
  name: string
  email?: string
  avatar?: string
}

export interface MessageReaction {
  emoji: string
  count: number
  users: string[]
}

export interface MessageReply {
  id: string
  author: MessageAuthor
  content: string
  timestamp: Timestamp
}

// YouTube/Video References
export interface VideoReference {
  id: string
  title: string
  channelName: string
  duration: number
  viewCount: number
  publishedAt: Timestamp
  description: string
  tags?: string[]
  category: string
  watchTime?: number
  watchPercentage?: number
  bookmarks?: VideoBookmark[]
}

export interface VideoBookmark {
  timestamp: number
  note?: string
  createdAt: Timestamp
}

// Repository References (GitHub, etc.)
export interface RepositoryReference {
  id: string
  name: string
  fullName: string
  description?: string
  language: string
  stars: number
  forks: number
  lastCommit: Timestamp
  topics?: string[]
  isPrivate: boolean
  url: string
}

// Calendar Events
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Timestamp
  endTime: Timestamp
  location?: string
  attendees?: EventAttendee[]
  isAllDay: boolean
  recurrence?: RecurrenceRule
  status: 'confirmed' | 'tentative' | 'cancelled'
}

export interface EventAttendee {
  email: string
  name?: string
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction'
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endDate?: Timestamp
  count?: number
}
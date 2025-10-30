// Core data structures for Kiro Web Mind

import { Timestamp } from 'firebase/firestore'

// Page Context Interface
export interface PageContext {
  url: string
  title: string
  content?: string
  selectedText?: string
  formFields?: FormField[]
  pageType: PageType
  timestamp: number
  metadata?: PageMetadata
}

export interface PageMetadata {
  description?: string
  keywords?: string[]
  author?: string
  publishedDate?: string
  language?: string
  readingTime?: number
}

export interface FormField {
  type: string
  name: string
  id: string
  placeholder?: string
  label?: string
  value?: string
  required?: boolean
}

export type PageType = 'article' | 'form' | 'search' | 'social' | 'video' | 'code' | 'qa' | 'reference' | 'shopping' | 'general'

// User Preferences Interface
export interface UserPreferences {
  privacy: PrivacySettings
  ui: UISettings
  ai: AISettings
  notifications: NotificationSettings
}

export interface PrivacySettings {
  dataCollection: 'minimal' | 'standard' | 'comprehensive'
  cloudSync: boolean
  voiceData: boolean
  activityTracking: boolean
  crossSiteTracking: boolean
  dataRetentionDays: number
}

export interface UISettings {
  theme: 'dark' | 'light' | 'auto'
  sidebarPosition: 'left' | 'right'
  animationsEnabled: boolean
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
  language: string
}

export interface AISettings {
  summaryLength: 'brief' | 'detailed'
  suggestionFrequency: 'low' | 'medium' | 'high'
  voiceEnabled: boolean
  autoSummarize: boolean
  contextAwareness: boolean
  learningEnabled: boolean
}

// Voice Interface Types
export interface VoiceSettings {
  enabled: boolean
  wakeWordEnabled: boolean
  wakeWord: string
  language: string
  voiceSpeed: number
  voicePitch: number
  noiseReduction: boolean
  confidenceThreshold: number
  continuousListening: boolean
}

export interface VoiceCommand {
  id: string
  command: string
  intent: VoiceIntent
  parameters?: Record<string, any>
  confidence: number
  timestamp: number
}

export type VoiceIntent = 
  | 'summarize'
  | 'explain'
  | 'translate'
  | 'search'
  | 'navigate'
  | 'automate'
  | 'save'
  | 'help'
  | 'settings'
  | 'unknown'

export interface VoiceResponse {
  text: string
  audioUrl?: string
  actions?: VoiceAction[]
  followUp?: string
}

export interface VoiceAction {
  type: 'navigate' | 'execute' | 'display' | 'save'
  target: string
  data?: any
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: SpeechAlternative[]
}

export interface SpeechAlternative {
  transcript: string
  confidence: number
}

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  currentCommand?: VoiceCommand
  lastResult?: SpeechRecognitionResult
  error?: string
}

export interface NotificationSettings {
  browserNotifications: boolean
  emailDigest: boolean
  insightAlerts: boolean
  automationUpdates: boolean
  securityAlerts: boolean
}

// Context Analysis Interface
export interface ContextAnalysis {
  pageType: PageType
  mainTopic: string
  keyEntities: string[]
  userIntent: UserIntent
  confidence: number
  relevantSuggestions: Suggestion[]
  automationOpportunities: AutomationOpportunity[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  complexity?: 'low' | 'medium' | 'high'
  readingTime?: number
}

export type UserIntent = 'reading' | 'researching' | 'shopping' | 'working' | 'learning' | 'entertainment' | 'social' | 'filling_form' | 'browsing'

export interface Suggestion {
  id: string
  title: string
  description: string
  action: SuggestionAction
  confidence: number
  category: SuggestionCategory
  metadata?: Record<string, any>
}

export type SuggestionAction = 'summarize' | 'extract' | 'translate' | 'explain' | 'automate' | 'save' | 'share' | 'research'
export type SuggestionCategory = 'productivity' | 'learning' | 'automation' | 'research' | 'social' | 'entertainment'

export interface AutomationOpportunity {
  id: string
  type: AutomationType
  description: string
  confidence: number
  estimatedTimeSaved: number
  complexity: 'low' | 'medium' | 'high'
  suggestedRule?: Partial<AutomationRule>
}

export type AutomationType = 'form_fill' | 'navigation' | 'data_extraction' | 'notification' | 'content_organization' | 'research_assistance'

// User Document Interface
export interface UserDocument {
  id: string
  email: string
  preferences?: UserPreferences
  permissions?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt?: Timestamp
}
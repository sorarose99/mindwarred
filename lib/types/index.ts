// Main types export file for Kiro Web Mind

// Core types
export * from './core'
export * from './automation'
export * from './knowledge'
export * from './integrations'
export * from './activity'

// Additional utility types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SearchResult<T = any> {
  items: T[]
  query: string
  total: number
  took: number
  facets?: SearchFacet[]
}

export interface SearchFacet {
  field: string
  values: SearchFacetValue[]
}

export interface SearchFacetValue {
  value: string
  count: number
  selected: boolean
}

// Error types
export interface KiroError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: number
  userId?: string
  context?: string
}

export type ErrorCode = 
  | 'PERMISSION_DENIED'
  | 'INVALID_INPUT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'AI_PROCESSING_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

// Configuration types
export interface KiroConfig {
  version: string
  environment: 'development' | 'staging' | 'production'
  features: FeatureFlags
  limits: SystemLimits
  endpoints: APIEndpoints
}

export interface FeatureFlags {
  voiceInterface: boolean
  knowledgeGraph: boolean
  automations: boolean
  integrations: boolean
  analytics: boolean
  aiProcessing: boolean
}

export interface SystemLimits {
  maxActivitiesPerDay: number
  maxAutomationRules: number
  maxKnowledgeNodes: number
  maxIntegrations: number
  maxFileSize: number
  rateLimitPerMinute: number
}

export interface APIEndpoints {
  dashboard: string
  api: string
  auth: string
  storage: string
  functions: string
}

// Event types for real-time updates
export interface KiroEvent {
  id: string
  type: EventType
  data: any
  timestamp: number
  userId?: string
  sessionId?: string
}

export type EventType = 
  | 'activity_created'
  | 'automation_triggered'
  | 'insight_generated'
  | 'integration_synced'
  | 'knowledge_updated'
  | 'preference_changed'
  | 'error_occurred'
  | 'session_started'
  | 'session_ended'

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  testId?: string
}

export interface LoadingState {
  isLoading: boolean
  error?: string
  progress?: number
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: string
}

// Form types
export interface FormField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  label: string
  placeholder?: string
  required?: boolean
  validation?: ValidationRule[]
  options?: SelectOption[]
  defaultValue?: any
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}
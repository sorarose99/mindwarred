// Data validation schemas for Kiro Web Mind

import type {
  PageContext,
  UserPreferences,
  ContextAnalysis,
  AutomationRule,
  KnowledgeNode,
  ServiceIntegration,
  ActivityRecord,
  LearningInsight,
  UserSession
} from '../types'

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Base validation functions
export const isString = (value: any): boolean => typeof value === 'string'
export const isNumber = (value: any): boolean => typeof value === 'number' && !isNaN(value)
export const isBoolean = (value: any): boolean => typeof value === 'boolean'
export const isArray = (value: any): boolean => Array.isArray(value)
export const isObject = (value: any): boolean => typeof value === 'object' && value !== null && !Array.isArray(value)
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Required field validation
export const hasRequiredFields = (obj: any, fields: string[]): string[] => {
  const missing: string[] = []
  for (const field of fields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      missing.push(field)
    }
  }
  return missing
}

// PageContext validation
export const validatePageContext = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['url', 'title', 'pageType', 'timestamp']
  const missing = hasRequiredFields(data, requiredFields)
  errors.push(...missing.map(field => `Missing required field: ${field}`))
  
  // Validate field types
  if (data.url && !isString(data.url)) {
    errors.push('url must be a string')
  }
  if (data.url && !isValidUrl(data.url)) {
    errors.push('url must be a valid URL')
  }
  if (data.title && !isString(data.title)) {
    errors.push('title must be a string')
  }
  if (data.pageType && !['article', 'form', 'search', 'social', 'video', 'code', 'qa', 'reference', 'shopping', 'general'].includes(data.pageType)) {
    errors.push('pageType must be a valid page type')
  }
  if (data.timestamp && !isNumber(data.timestamp)) {
    errors.push('timestamp must be a number')
  }
  if (data.formFields && !isArray(data.formFields)) {
    errors.push('formFields must be an array')
  }
  
  return { isValid: errors.length === 0, errors }
}

// UserPreferences validation
export const validateUserPreferences = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['privacy', 'ui', 'ai', 'notifications']
  const missing = hasRequiredFields(data, requiredFields)
  errors.push(...missing.map(field => `Missing required field: ${field}`))
  
  // Validate privacy settings
  if (data.privacy) {
    if (!isObject(data.privacy)) {
      errors.push('privacy must be an object')
    } else {
      const privacyRequired = ['dataCollection', 'cloudSync', 'voiceData', 'activityTracking', 'dataRetentionDays']
      const privacyMissing = hasRequiredFields(data.privacy, privacyRequired)
      errors.push(...privacyMissing.map(field => `Missing privacy field: ${field}`))
      
      if (data.privacy.dataCollection && !['minimal', 'standard', 'comprehensive'].includes(data.privacy.dataCollection)) {
        errors.push('privacy.dataCollection must be minimal, standard, or comprehensive')
      }
      if (data.privacy.dataRetentionDays && (!isNumber(data.privacy.dataRetentionDays) || data.privacy.dataRetentionDays < 1)) {
        errors.push('privacy.dataRetentionDays must be a positive number')
      }
    }
  }
  
  // Validate UI settings
  if (data.ui) {
    if (!isObject(data.ui)) {
      errors.push('ui must be an object')
    } else {
      if (data.ui.theme && !['dark', 'light', 'auto'].includes(data.ui.theme)) {
        errors.push('ui.theme must be dark, light, or auto')
      }
      if (data.ui.sidebarPosition && !['left', 'right'].includes(data.ui.sidebarPosition)) {
        errors.push('ui.sidebarPosition must be left or right')
      }
      if (data.ui.fontSize && !['small', 'medium', 'large'].includes(data.ui.fontSize)) {
        errors.push('ui.fontSize must be small, medium, or large')
      }
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

// AutomationRule validation
export const validateAutomationRule = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['name', 'isActive', 'trigger', 'actions']
  const missing = hasRequiredFields(data, requiredFields)
  errors.push(...missing.map(field => `Missing required field: ${field}`))
  
  // Validate name
  if (data.name && (!isString(data.name) || data.name.trim().length === 0)) {
    errors.push('name must be a non-empty string')
  }
  
  // Validate isActive
  if (data.isActive !== undefined && !isBoolean(data.isActive)) {
    errors.push('isActive must be a boolean')
  }
  
  // Validate trigger
  if (data.trigger) {
    if (!isObject(data.trigger)) {
      errors.push('trigger must be an object')
    } else {
      const triggerRequired = ['type', 'conditions', 'operator']
      const triggerMissing = hasRequiredFields(data.trigger, triggerRequired)
      errors.push(...triggerMissing.map(field => `Missing trigger field: ${field}`))
      
      if (data.trigger.operator && !['AND', 'OR'].includes(data.trigger.operator)) {
        errors.push('trigger.operator must be AND or OR')
      }
      if (data.trigger.conditions && !isArray(data.trigger.conditions)) {
        errors.push('trigger.conditions must be an array')
      }
    }
  }
  
  // Validate actions
  if (data.actions) {
    if (!isArray(data.actions)) {
      errors.push('actions must be an array')
    } else if (data.actions.length === 0) {
      errors.push('actions array cannot be empty')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

// KnowledgeNode validation
export const validateKnowledgeNode = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['label', 'type', 'strength', 'confidence', 'connections', 'metadata']
  const missing = hasRequiredFields(data, requiredFields)
  errors.push(...missing.map(field => `Missing required field: ${field}`))
  
  // Validate label
  if (data.label && (!isString(data.label) || data.label.trim().length === 0)) {
    errors.push('label must be a non-empty string')
  }
  
  // Validate type
  if (data.type && !['topic', 'website', 'action', 'preference', 'skill', 'interest', 'pattern', 'entity', 'concept'].includes(data.type)) {
    errors.push('type must be a valid node type')
  }
  
  // Validate strength and confidence
  if (data.strength !== undefined && (!isNumber(data.strength) || data.strength < 0 || data.strength > 1)) {
    errors.push('strength must be a number between 0 and 1')
  }
  if (data.confidence !== undefined && (!isNumber(data.confidence) || data.confidence < 0 || data.confidence > 1)) {
    errors.push('confidence must be a number between 0 and 1')
  }
  
  // Validate connections
  if (data.connections && !isArray(data.connections)) {
    errors.push('connections must be an array')
  }
  
  // Validate metadata
  if (data.metadata && !isObject(data.metadata)) {
    errors.push('metadata must be an object')
  }
  
  return { isValid: errors.length === 0, errors }
}

// ActivityRecord validation
export const validateActivityRecord = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['userId', 'timestamp', 'type', 'data', 'context']
  const missing = hasRequiredFields(data, requiredFields)
  errors.push(...missing.map(field => `Missing required field: ${field}`))
  
  // Validate userId
  if (data.userId && (!isString(data.userId) || data.userId.trim().length === 0)) {
    errors.push('userId must be a non-empty string')
  }
  
  // Validate timestamp
  if (data.timestamp && !isNumber(data.timestamp)) {
    errors.push('timestamp must be a number')
  }
  
  // Validate type
  const validTypes = [
    'page_visit', 'text_selection', 'form_interaction', 'search_query',
    'click_action', 'scroll_behavior', 'voice_command', 'ai_interaction',
    'automation_trigger', 'content_save', 'share_action', 'bookmark_action'
  ]
  if (data.type && !validTypes.includes(data.type)) {
    errors.push('type must be a valid activity type')
  }
  
  // Validate data and context
  if (data.data && !isObject(data.data)) {
    errors.push('data must be an object')
  }
  if (data.context && !isObject(data.context)) {
    errors.push('context must be an object')
  }
  
  return { isValid: errors.length === 0, errors }
}

// ServiceIntegration validation
export const validateServiceIntegration = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // Check required fields
  const requiredFields = ['service', 'isConnected', 'isActive', 'permissions', 'syncedData', 'configuration']
  const missing = hasRequiredFields(data, requiredFields)
  errors.push(...missing.map(field => `Missing required field: ${field}`))
  
  // Validate service
  const validServices = ['gmail', 'youtube', 'notion', 'drive', 'slack', 'github', 'twitter', 'linkedin', 'calendar', 'docs']
  if (data.service && !validServices.includes(data.service)) {
    errors.push('service must be a valid service type')
  }
  
  // Validate boolean fields
  if (data.isConnected !== undefined && !isBoolean(data.isConnected)) {
    errors.push('isConnected must be a boolean')
  }
  if (data.isActive !== undefined && !isBoolean(data.isActive)) {
    errors.push('isActive must be a boolean')
  }
  
  // Validate permissions
  if (data.permissions && !isArray(data.permissions)) {
    errors.push('permissions must be an array')
  }
  
  // Validate syncedData and configuration
  if (data.syncedData && !isObject(data.syncedData)) {
    errors.push('syncedData must be an object')
  }
  if (data.configuration && !isObject(data.configuration)) {
    errors.push('configuration must be an object')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Generic validation function
export const validateData = (data: any, type: string): ValidationResult => {
  switch (type) {
    case 'PageContext':
      return validatePageContext(data)
    case 'UserPreferences':
      return validateUserPreferences(data)
    case 'AutomationRule':
      return validateAutomationRule(data)
    case 'KnowledgeNode':
      return validateKnowledgeNode(data)
    case 'ActivityRecord':
      return validateActivityRecord(data)
    case 'ServiceIntegration':
      return validateServiceIntegration(data)
    default:
      return { isValid: false, errors: [`Unknown validation type: ${type}`] }
  }
}

// Sanitization functions
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '')
}

export const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.toString()
  } catch {
    return ''
  }
}

export const sanitizeObject = (obj: any, allowedFields: string[]): any => {
  const sanitized: any = {}
  for (const field of allowedFields) {
    if (field in obj) {
      sanitized[field] = obj[field]
    }
  }
  return sanitized
}
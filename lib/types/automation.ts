// Automation and rule-related interfaces

import { Timestamp } from 'firebase/firestore'

// Automation Rule Interface
export interface AutomationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: TriggerCondition
  actions: Action[]
  createdAt: Date
  updatedAt: Date
  lastExecuted?: Date
  executionCount?: number
  successRate?: number
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
}

// Trigger Conditions
export interface TriggerCondition {
  type: TriggerType
  conditions: Condition[]
  logic?: 'AND' | 'OR'
}

export type TriggerType = 'page_load' | 'text_selection' | 'form_interaction' | 'time_based' | 'url_pattern' | 'content_change' | 'user_action'

export interface Condition {
  field: string
  operator: ConditionOperator
  value: any
  caseSensitive?: boolean
}

export type ConditionOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'greaterThan' | 'lessThan'

// Actions
export interface Action {
  type: ActionType
  config: Record<string, any>
  delay?: number
  retryCount?: number
  continueOnError?: boolean
}

export type ActionType = 'form_fill' | 'click_element' | 'navigate_to' | 'data_extraction' | 'notification' | 'save_content' | 'custom_script' | 'ai_summarize'

export interface ActionParameters {
  [key: string]: any
}

// Specific action parameter interfaces
export interface FillFormParameters extends ActionParameters {
  selector: string
  value: string
  fieldType?: string
  waitForElement?: boolean
}

export interface ClickElementParameters extends ActionParameters {
  selector: string
  waitForElement?: boolean
  scrollIntoView?: boolean
}

export interface NavigateParameters extends ActionParameters {
  url: string
  newTab?: boolean
  waitForLoad?: boolean
}

export interface ExtractDataParameters extends ActionParameters {
  selectors: Record<string, string>
  outputFormat?: 'json' | 'csv' | 'text'
  saveLocation?: string
}

export interface SendNotificationParameters extends ActionParameters {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  persistent?: boolean
}

export interface SaveContentParameters extends ActionParameters {
  content: string
  filename?: string
  format?: 'text' | 'html' | 'markdown' | 'json'
  location?: 'local' | 'cloud'
}

export interface AIProcessParameters extends ActionParameters {
  operation: 'summarize' | 'analyze' | 'translate' | 'extract_entities'
  input: string
  options?: Record<string, any>
}

// Execution tracking
export interface AutomationExecution {
  id: string
  ruleId: string
  startTime: Timestamp
  endTime?: Timestamp
  status: ExecutionStatus
  result?: ExecutionResult
  error?: string
  context: ExecutionContext
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface ExecutionResult {
  success: boolean
  data?: any
  message?: string
  actionsExecuted: number
  timeTaken: number
}

export interface ExecutionContext {
  url: string
  userAgent: string
  timestamp: Timestamp
  triggeredBy: string
  pageContext?: any
}
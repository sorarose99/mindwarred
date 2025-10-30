// Automation Engine for Kiro Web Mind

import { AutomationRule, AutomationTrigger, AutomationAction, PageContext, ContextAnalysis } from '../types/core'

export interface AutomationExecution {
  id: string
  ruleId: string
  triggeredAt: number
  completedAt?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  context: PageContext
  actions: ActionExecution[]
  error?: string
  duration?: number
}

export interface ActionExecution {
  id: string
  actionId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: number
  completedAt?: number
  result?: any
  error?: string
}

export interface AutomationStats {
  totalRules: number
  activeRules: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  timeSaved: number // in minutes
}

export interface TriggerCondition {
  type: 'url' | 'domain' | 'pageType' | 'element' | 'time' | 'userAction' | 'contextChange'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'exists' | 'not_exists'
  value: string | number | boolean
  caseSensitive?: boolean
}

export interface ActionDefinition {
  type: 'click' | 'fill' | 'navigate' | 'extract' | 'ai_process' | 'notify' | 'save' | 'wait'
  target?: string
  value?: any
  options?: Record<string, any>
  delay?: number
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map()
  private executions: Map<string, AutomationExecution> = new Map()
  private isRunning: boolean = false
  private observers: MutationObserver[] = []
  private intervalHandlers: number[] = []
  private eventListeners: Array<{ element: Element | Document, event: string, handler: EventListener }> = []

  constructor() {
    this.initializeEngine()
  }

  private async initializeEngine(): Promise<void> {
    await this.loadRules()
    this.setupGlobalTriggers()
    this.isRunning = true
  }

  async createRule(ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecuted'>): Promise<AutomationRule> {
    const rule: AutomationRule = {
      ...ruleData,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
      lastExecuted: undefined
    }

    this.rules.set(rule.id, rule)
    await this.saveRules()

    if (rule.isActive) {
      this.setupRuleTriggers(rule)
    }

    return rule
  }

  async updateRule(ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const rule = this.rules.get(ruleId)
    if (!rule) {
      throw new Error('Rule not found')
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: Date.now()
    }

    this.rules.set(ruleId, updatedRule)
    await this.saveRules()

    // Restart triggers if rule was modified
    this.removeRuleTriggers(rule)
    if (updatedRule.isActive) {
      this.setupRuleTriggers(updatedRule)
    }

    return updatedRule
  }

  async deleteRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId)
    if (!rule) {
      throw new Error('Rule not found')
    }

    this.removeRuleTriggers(rule)
    this.rules.delete(ruleId)
    await this.saveRules()
  }

  async executeRule(ruleId: string, context: PageContext): Promise<AutomationExecution> {
    const rule = this.rules.get(ruleId)
    if (!rule) {
      throw new Error('Rule not found')
    }

    if (!rule.isActive) {
      throw new Error('Rule is not active')
    }

    const execution: AutomationExecution = {
      id: this.generateId(),
      ruleId,
      triggeredAt: Date.now(),
      status: 'pending',
      context,
      actions: rule.actions.map(action => ({
        id: this.generateId(),
        actionId: action.id,
        status: 'pending'
      }))
    }

    this.executions.set(execution.id, execution)

    try {
      execution.status = 'running'
      await this.runExecution(execution, rule)
      execution.status = 'completed'
      execution.completedAt = Date.now()
      execution.duration = execution.completedAt - execution.triggeredAt

      // Update rule statistics
      rule.executionCount++
      rule.lastExecuted = execution.completedAt
      this.rules.set(ruleId, rule)
      await this.saveRules()

    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : String(error)
      execution.completedAt = Date.now()
    }

    return execution
  }

  private async runExecution(execution: AutomationExecution, rule: AutomationRule): Promise<void> {
    for (const actionExecution of execution.actions) {
      const action = rule.actions.find(a => a.id === actionExecution.actionId)
      if (!action) {
        actionExecution.status = 'skipped'
        continue
      }

      try {
        actionExecution.status = 'running'
        actionExecution.startedAt = Date.now()

        const result = await this.executeAction(action, execution.context)
        
        actionExecution.result = result
        actionExecution.status = 'completed'
        actionExecution.completedAt = Date.now()

        // Add delay if specified
        if (action.delay && action.delay > 0) {
          await this.wait(action.delay)
        }

      } catch (error) {
        actionExecution.status = 'failed'
        actionExecution.error = error instanceof Error ? error.message : String(error)
        actionExecution.completedAt = Date.now()

        // Stop execution on critical errors
        if (rule.stopOnError) {
          throw error
        }
      }
    }
  }

  private async executeAction(action: AutomationAction, context: PageContext): Promise<any> {
    switch (action.type) {
      case 'click':
        return await this.executeClickAction(action)
      
      case 'fill':
        return await this.executeFillAction(action)
      
      case 'navigate':
        return await this.executeNavigateAction(action)
      
      case 'extract':
        return await this.executeExtractAction(action)
      
      case 'ai_process':
        return await this.executeAIProcessAction(action, context)
      
      case 'notify':
        return await this.executeNotifyAction(action)
      
      case 'save':
        return await this.executeSaveAction(action, context)
      
      case 'wait':
        return await this.executeWaitAction(action)
      
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async executeClickAction(action: AutomationAction): Promise<void> {
    const element = this.findElement(action.selector!)
    if (!element) {
      throw new Error(`Element not found: ${action.selector}`)
    }

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await this.wait(500)

    // Click the element
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    element.dispatchEvent(clickEvent)
  }

  private async executeFillAction(action: AutomationAction): Promise<void> {
    const element = this.findElement(action.selector!) as HTMLInputElement
    if (!element) {
      throw new Error(`Input element not found: ${action.selector}`)
    }

    // Set the value
    element.value = String(action.value || '')

    // Trigger events
    const events = ['input', 'change', 'blur']
    for (const eventType of events) {
      const event = new Event(eventType, { bubbles: true })
      element.dispatchEvent(event)
    }
  }

  private async executeNavigateAction(action: AutomationAction): Promise<void> {
    const url = String(action.value)
    if (action.options?.newTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  }

  private async executeExtractAction(action: AutomationAction): Promise<string[]> {
    const elements = document.querySelectorAll(action.selector!)
    const results: string[] = []

    elements.forEach(element => {
      const text = element.textContent?.trim()
      if (text) {
        results.push(text)
      }
    })

    return results
  }

  private async executeAIProcessAction(action: AutomationAction, context: PageContext): Promise<any> {
    // This would integrate with the AI service
    switch (action.value) {
      case 'summarize':
        return await this.aiSummarize(context.content || '')
      
      case 'extract_entities':
        return await this.aiExtractEntities(context.content || '')
      
      case 'analyze_sentiment':
        return await this.aiAnalyzeSentiment(context.content || '')
      
      default:
        throw new Error(`Unknown AI process: ${action.value}`)
    }
  }

  private async executeNotifyAction(action: AutomationAction): Promise<void> {
    const message = String(action.value)
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Kiro Automation', {
        body: message,
        icon: '/icon-48.png'
      })
    } else {
      // Fallback to console or custom notification
      console.log('Kiro Notification:', message)
    }
  }

  private async executeSaveAction(action: AutomationAction, context: PageContext): Promise<void> {
    const data = {
      url: context.url,
      title: context.title,
      content: action.value || context.content,
      timestamp: Date.now(),
      tags: action.options?.tags || []
    }

    // Save to storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const key = `saved_${Date.now()}`
      await chrome.storage.local.set({ [key]: data })
    } else {
      const key = `kiro_saved_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  private async executeWaitAction(action: AutomationAction): Promise<void> {
    const duration = Number(action.value) || 1000
    await this.wait(duration)
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private findElement(selector: string): Element | null {
    try {
      return document.querySelector(selector)
    } catch (error) {
      console.error('Invalid selector:', selector, error)
      return null
    }
  }

  async checkTriggers(context: PageContext): Promise<void> {
    if (!this.isRunning) {
      return
    }

    const activeRules = Array.from(this.rules.values()).filter(rule => rule.isActive)

    for (const rule of activeRules) {
      try {
        if (await this.evaluateTrigger(rule.trigger, context)) {
          // Check conditions
          if (rule.conditions && rule.conditions.length > 0) {
            const conditionsMet = await this.evaluateConditions(rule.conditions, context)
            if (!conditionsMet) {
              continue
            }
          }

          // Execute the rule
          await this.executeRule(rule.id, context)
        }
      } catch (error) {
        console.error(`Error checking trigger for rule ${rule.id}:`, error)
      }
    }
  }

  private async evaluateTrigger(trigger: AutomationTrigger, context: PageContext): Promise<boolean> {
    switch (trigger.type) {
      case 'page_load':
        return true // Already triggered by page load
      
      case 'url_change':
        return this.matchesPattern(context.url, trigger.pattern || '')
      
      case 'element_appears':
        return !!document.querySelector(trigger.selector || '')
      
      case 'time_based':
        return this.checkTimeCondition(trigger)
      
      case 'user_action':
        // This would be triggered by event listeners
        return false
      
      default:
        return false
    }
  }

  private async evaluateConditions(conditions: TriggerCondition[], context: PageContext): Promise<boolean> {
    for (const condition of conditions) {
      if (!await this.evaluateCondition(condition, context)) {
        return false
      }
    }
    return true
  }

  private async evaluateCondition(condition: TriggerCondition, context: PageContext): Promise<boolean> {
    let actualValue: any

    switch (condition.type) {
      case 'url':
        actualValue = context.url
        break
      case 'domain':
        actualValue = new URL(context.url).hostname
        break
      case 'pageType':
        actualValue = context.pageType
        break
      case 'element':
        actualValue = !!document.querySelector(String(condition.value))
        return actualValue
      default:
        return false
    }

    return this.compareValues(actualValue, condition.operator, condition.value, condition.caseSensitive)
  }

  private compareValues(actual: any, operator: string, expected: any, caseSensitive: boolean = true): boolean {
    if (!caseSensitive && typeof actual === 'string' && typeof expected === 'string') {
      actual = actual.toLowerCase()
      expected = expected.toLowerCase()
    }

    switch (operator) {
      case 'equals':
        return actual === expected
      case 'contains':
        return String(actual).includes(String(expected))
      case 'startsWith':
        return String(actual).startsWith(String(expected))
      case 'endsWith':
        return String(actual).endsWith(String(expected))
      case 'matches':
        return new RegExp(String(expected)).test(String(actual))
      case 'exists':
        return actual != null
      case 'not_exists':
        return actual == null
      default:
        return false
    }
  }

  private matchesPattern(text: string, pattern: string): boolean {
    if (!pattern) return false
    
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    return new RegExp(regexPattern).test(text)
  }

  private checkTimeCondition(trigger: AutomationTrigger): boolean {
    if (!trigger.schedule) return false

    const now = new Date()
    const schedule = trigger.schedule

    // Check day of week
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      if (!schedule.daysOfWeek.includes(now.getDay())) {
        return false
      }
    }

    // Check time range
    if (schedule.startTime && schedule.endTime) {
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const [startHour, startMin] = schedule.startTime.split(':').map(Number)
      const [endHour, endMin] = schedule.endTime.split(':').map(Number)
      const startTime = startHour * 60 + startMin
      const endTime = endHour * 60 + endMin

      if (currentTime < startTime || currentTime > endTime) {
        return false
      }
    }

    return true
  }

  private setupGlobalTriggers(): void {
    // Page load trigger
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.handlePageLoad()
      })
    } else {
      this.handlePageLoad()
    }

    // URL change trigger (for SPAs)
    let currentUrl = window.location.href
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href
        this.handleUrlChange()
      }
    })
    urlObserver.observe(document.body, { childList: true, subtree: true })
    this.observers.push(urlObserver)

    // Element appearance trigger
    const elementObserver = new MutationObserver(() => {
      this.handleElementChanges()
    })
    elementObserver.observe(document.body, { childList: true, subtree: true })
    this.observers.push(elementObserver)
  }

  private setupRuleTriggers(rule: AutomationRule): void {
    // Set up specific triggers for this rule
    if (rule.trigger.type === 'time_based' && rule.trigger.schedule) {
      const interval = setInterval(() => {
        this.checkTimeBasedRule(rule)
      }, 60000) // Check every minute
      this.intervalHandlers.push(interval)
    }

    if (rule.trigger.type === 'user_action') {
      this.setupUserActionTrigger(rule)
    }
  }

  private removeRuleTriggers(rule: AutomationRule): void {
    // Remove specific triggers for this rule
    // This is a simplified implementation
    // In practice, you'd need to track which handlers belong to which rules
  }

  private async handlePageLoad(): Promise<void> {
    const context = await this.getCurrentContext()
    await this.checkTriggers(context)
  }

  private async handleUrlChange(): Promise<void> {
    const context = await this.getCurrentContext()
    await this.checkTriggers(context)
  }

  private async handleElementChanges(): Promise<void> {
    // Debounce element changes
    clearTimeout(this.elementChangeTimeout)
    this.elementChangeTimeout = setTimeout(async () => {
      const context = await this.getCurrentContext()
      await this.checkTriggers(context)
    }, 1000)
  }

  private elementChangeTimeout: number = 0

  private async checkTimeBasedRule(rule: AutomationRule): Promise<void> {
    if (this.checkTimeCondition(rule.trigger)) {
      const context = await this.getCurrentContext()
      await this.executeRule(rule.id, context)
    }
  }

  private setupUserActionTrigger(rule: AutomationRule): void {
    const eventType = rule.trigger.event || 'click'
    const selector = rule.trigger.selector

    const handler = (event: Event) => {
      if (!selector || (event.target as Element).matches(selector)) {
        this.getCurrentContext().then(context => {
          this.executeRule(rule.id, context)
        })
      }
    }

    if (selector) {
      document.addEventListener(eventType, handler)
    } else {
      document.addEventListener(eventType, handler)
    }

    this.eventListeners.push({
      element: document,
      event: eventType,
      handler
    })
  }

  private async getCurrentContext(): Promise<PageContext> {
    return {
      url: window.location.href,
      title: document.title,
      content: document.body.innerText,
      pageType: 'general', // Would be determined by analysis
      timestamp: Date.now(),
      formFields: this.extractFormFields()
    }
  }

  private extractFormFields(): any[] {
    const fields: any[] = []
    const inputs = document.querySelectorAll('input, select, textarea')
    
    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement
      fields.push({
        type: element.type || 'text',
        name: element.name || `field_${index}`,
        id: element.id || `field_${index}`,
        value: element.value,
        placeholder: element.placeholder,
        required: element.required
      })
    })

    return fields
  }

  // AI processing methods (placeholders)
  private async aiSummarize(content: string): Promise<string> {
    // Placeholder - would integrate with AI service
    return `Summary of: ${content.substring(0, 100)}...`
  }

  private async aiExtractEntities(content: string): Promise<string[]> {
    // Placeholder - would integrate with AI service
    const words = content.split(/\s+/)
    return words.filter(word => word.length > 5).slice(0, 10)
  }

  private async aiAnalyzeSentiment(content: string): Promise<string> {
    // Placeholder - would integrate with AI service
    const positiveWords = ['good', 'great', 'excellent', 'amazing']
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible']
    
    const words = content.toLowerCase().split(/\s+/)
    const positive = words.filter(w => positiveWords.includes(w)).length
    const negative = words.filter(w => negativeWords.includes(w)).length
    
    if (positive > negative) return 'positive'
    if (negative > positive) return 'negative'
    return 'neutral'
  }

  private generateId(): string {
    return `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async saveRules(): Promise<void> {
    const rulesData = Array.from(this.rules.values())
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ automation_rules: rulesData })
    } else {
      localStorage.setItem('automation_rules', JSON.stringify(rulesData))
    }
  }

  private async loadRules(): Promise<void> {
    try {
      let rulesData: AutomationRule[] = []

      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['automation_rules'])
        rulesData = result.automation_rules || []
      } else {
        const stored = localStorage.getItem('automation_rules')
        if (stored) {
          rulesData = JSON.parse(stored)
        }
      }

      this.rules.clear()
      for (const rule of rulesData) {
        this.rules.set(rule.id, rule)
        if (rule.isActive) {
          this.setupRuleTriggers(rule)
        }
      }
    } catch (error) {
      console.error('Failed to load automation rules:', error)
    }
  }

  // Public API methods
  getRules(): AutomationRule[] {
    return Array.from(this.rules.values())
  }

  getRule(ruleId: string): AutomationRule | null {
    return this.rules.get(ruleId) || null
  }

  getExecutions(): AutomationExecution[] {
    return Array.from(this.executions.values())
  }

  getExecution(executionId: string): AutomationExecution | null {
    return this.executions.get(executionId) || null
  }

  getStats(): AutomationStats {
    const rules = Array.from(this.rules.values())
    const executions = Array.from(this.executions.values())
    
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.status === 'completed').length
    const failedExecutions = executions.filter(e => e.status === 'failed').length
    
    const completedExecutions = executions.filter(e => e.duration)
    const averageExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : 0

    // Estimate time saved (very rough calculation)
    const timeSaved = successfulExecutions * 2 // Assume each automation saves 2 minutes

    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.isActive).length,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      timeSaved
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []

    // Clean up intervals
    this.intervalHandlers.forEach(handle => clearInterval(handle))
    this.intervalHandlers = []

    // Clean up event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []
  }
}
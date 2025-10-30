'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { AutomationRule, ActionType } from '../../lib/types'

interface RuleTesterProps {
  trigger: AutomationRule['trigger']
  actions: AutomationRule['actions']
}

interface TestResult {
  success: boolean
  message: string
  details?: string
}

export default function RuleTester({ trigger, actions }: RuleTesterProps) {
  const [testData, setTestData] = useState({
    url: 'https://example.com/login',
    title: 'Login - Example Site',
    pageType: 'form',
    selectedText: 'Important information',
    domain: 'example.com'
  })
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async () => {
    setIsRunning(true)
    setTestResults([])

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1000))

    const results: TestResult[] = []

    // Test trigger conditions
    let triggerMatched = true
    const triggerResult = testTriggerConditions()
    results.push(triggerResult)
    
    if (!triggerResult.success) {
      triggerMatched = false
    }

    // Test actions if trigger matched
    if (triggerMatched) {
      for (let i = 0; i < actions.length; i++) {
        const actionResult = testAction(actions[i], i)
        results.push(actionResult)
        
        // Simulate action execution delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setTestResults([...results])
      }
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const testTriggerConditions = (): TestResult => {
    if (trigger.conditions.length === 0) {
      return {
        success: false,
        message: 'Trigger Test: No conditions defined',
        details: 'Add at least one condition to test the trigger'
      }
    }

    let matchedConditions = 0
    const conditionResults: string[] = []

    for (const condition of trigger.conditions) {
      const testValue = testData[condition.field as keyof typeof testData] || ''
      let matches = false

      switch (condition.operator) {
        case 'equals':
          matches = testValue === condition.value
          break
        case 'contains':
          matches = testValue.toLowerCase().includes(condition.value.toLowerCase())
          break
        case 'startsWith':
          matches = testValue.toLowerCase().startsWith(condition.value.toLowerCase())
          break
        case 'endsWith':
          matches = testValue.toLowerCase().endsWith(condition.value.toLowerCase())
          break
        case 'matches':
          try {
            const regex = new RegExp(condition.value, 'i')
            matches = regex.test(testValue)
          } catch {
            matches = false
          }
          break
        default:
          matches = false
      }

      if (matches) {
        matchedConditions++
        conditionResults.push(`✓ ${condition.field} ${condition.operator} "${condition.value}"`)
      } else {
        conditionResults.push(`✗ ${condition.field} ${condition.operator} "${condition.value}" (got: "${testValue}")`)
      }
    }

    const logic = trigger.logic || 'AND'
    const success = logic === 'AND' 
      ? matchedConditions === trigger.conditions.length
      : matchedConditions > 0

    return {
      success,
      message: `Trigger Test: ${success ? 'PASSED' : 'FAILED'}`,
      details: `Logic: ${logic}\n${conditionResults.join('\n')}`
    }
  }

  const testAction = (action: AutomationRule['actions'][0], index: number): TestResult => {
    const actionName = getActionName(action.type)
    
    // Simulate different action outcomes
    const outcomes = [
      { success: true, message: `${actionName}: Executed successfully` },
      { success: false, message: `${actionName}: Configuration error`, details: 'Missing required configuration' },
      { success: true, message: `${actionName}: Completed with warnings`, details: 'Some fields could not be filled' }
    ]

    // Use action type to determine likely outcome
    let outcomeIndex = 0
    switch (action.type) {
      case 'form_fill':
        outcomeIndex = Object.keys(action.config.fields || {}).length > 0 ? 0 : 1
        break
      case 'click_element':
        outcomeIndex = action.config.selector ? 0 : 1
        break
      case 'navigate_to':
        outcomeIndex = action.config.url ? 0 : 1
        break
      case 'notification':
        outcomeIndex = action.config.message ? 0 : 1
        break
      default:
        outcomeIndex = 0
    }

    return {
      ...outcomes[outcomeIndex],
      message: `Action ${index + 1} - ${outcomes[outcomeIndex].message}`
    }
  }

  const getActionName = (type: ActionType): string => {
    const names = {
      form_fill: 'Form Fill',
      click_element: 'Click Element',
      navigate_to: 'Navigate To',
      ai_summarize: 'AI Summarize',
      data_extraction: 'Data Extraction',
      notification: 'Notification',
      save_content: 'Save Content',
      custom_script: 'Custom Script'
    }
    return names[type] || type
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Rule Tester</h4>
        <button
          onClick={runTest}
          disabled={isRunning}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${isRunning
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          <PlayIcon className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Test...' : 'Run Test'}
        </button>
      </div>

      {/* Test Data Configuration */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <h5 className="text-sm font-medium text-gray-300 mb-3">Test Data</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">URL</label>
            <input
              type="text"
              value={testData.url}
              onChange={(e) => setTestData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Page Title</label>
            <input
              type="text"
              value={testData.title}
              onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Page Type</label>
            <select
              value={testData.pageType}
              onChange={(e) => setTestData(prev => ({ ...prev, pageType: e.target.value }))}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="article">Article</option>
              <option value="form">Form</option>
              <option value="search">Search</option>
              <option value="social">Social</option>
              <option value="shopping">Shopping</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Selected Text</label>
            <input
              type="text"
              value={testData.selectedText}
              onChange={(e) => setTestData(prev => ({ ...prev, selectedText: e.target.value }))}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h5 className="text-sm font-medium text-gray-300 mb-3">Test Results</h5>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border
                  ${result.success
                    ? 'bg-green-900/20 border-green-700/50 text-green-300'
                    : 'bg-red-900/20 border-red-700/50 text-red-300'
                  }
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {result.success ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <XCircleIcon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{result.message}</p>
                  {result.details && (
                    <pre className="text-xs mt-1 whitespace-pre-wrap opacity-80">
                      {result.details}
                    </pre>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-gray-800/30 rounded p-3">
        <p className="mb-1">
          <strong>How to use:</strong> Configure test data above to simulate different page contexts.
        </p>
        <p>
          The tester will evaluate your trigger conditions and simulate action execution to help you debug your automation rules.
        </p>
      </div>
    </div>
  )
}
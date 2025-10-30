// Voice Command Processor for Natural Language Processing and AI Operations

import { 
  VoiceCommand, 
  VoiceResponse, 
  VoiceIntent, 
  VoiceAction,
  PageContext,
  ContextAnalysis 
} from '../types/core'

export interface CommandProcessorOptions {
  aiServiceUrl?: string
  contextProvider?: () => Promise<PageContext>
  analysisProvider?: () => Promise<ContextAnalysis>
}

export class VoiceCommandProcessor {
  private options: CommandProcessorOptions
  private commandPatterns: Map<VoiceIntent, RegExp[]> = new Map()
  private contextCache: { context?: PageContext, analysis?: ContextAnalysis, timestamp: number } = { timestamp: 0 }

  constructor(options: CommandProcessorOptions = {}) {
    this.options = options
    this.initializeCommandPatterns()
  }

  private initializeCommandPatterns(): void {
    // Define regex patterns for different command intents
    this.commandPatterns.set('summarize', [
      /(?:summarize|summary|sum up|give me a summary of|tell me about)\s*(this page|this|the page|current page)?/i,
      /(?:what is|what's)\s*(this page|this|the content)\s*about/i,
      /(?:brief|overview|main points)/i
    ])

    this.commandPatterns.set('explain', [
      /(?:explain|tell me about|what is|what's|define|describe)\s+(.+)/i,
      /(?:how does|how do)\s+(.+)\s*work/i,
      /(?:what does)\s+(.+)\s*mean/i
    ])

    this.commandPatterns.set('search', [
      /(?:search|find|look up|look for)\s+(?:for\s+)?(.+)/i,
      /(?:google|bing)\s+(.+)/i,
      /(?:what is|what's|who is|who's|where is|where's|when is|when's|why is|why's|how is|how's)\s+(.+)/i
    ])

    this.commandPatterns.set('translate', [
      /(?:translate|translation)\s+(?:this\s+)?(?:to\s+)?(\w+)/i,
      /(?:what does this say in|how do you say this in)\s+(\w+)/i
    ])

    this.commandPatterns.set('navigate', [
      /(?:go to|navigate to|open|visit)\s+(.+)/i,
      /(?:take me to|show me)\s+(.+)/i,
      /(?:back|forward|home|dashboard)/i
    ])

    this.commandPatterns.set('automate', [
      /(?:automate|create automation|create rule|set up automation)\s*(.*)/i,
      /(?:remember this|save this pattern|learn this)/i,
      /(?:do this automatically|make this automatic)/i
    ])

    this.commandPatterns.set('save', [
      /(?:save|bookmark|remember)\s*(this page|this|current page)?/i,
      /(?:add to|put in)\s*(bookmarks|favorites|reading list)/i
    ])

    this.commandPatterns.set('help', [
      /(?:help|what can you do|commands|instructions)/i,
      /(?:how do i|how to)\s*(.*)/i
    ])

    this.commandPatterns.set('settings', [
      /(?:settings|preferences|options|configuration)/i,
      /(?:change|modify|update)\s*(?:settings|preferences)/i
    ])
  }

  public async processCommand(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      // Enhanced intent recognition with context
      const enhancedCommand = await this.enhanceCommandWithContext(command)
      
      // Process based on intent
      switch (enhancedCommand.intent) {
        case 'summarize':
          return await this.handleSummarizeCommand(enhancedCommand)
        
        case 'explain':
          return await this.handleExplainCommand(enhancedCommand)
        
        case 'search':
          return await this.handleSearchCommand(enhancedCommand)
        
        case 'translate':
          return await this.handleTranslateCommand(enhancedCommand)
        
        case 'navigate':
          return await this.handleNavigateCommand(enhancedCommand)
        
        case 'automate':
          return await this.handleAutomateCommand(enhancedCommand)
        
        case 'save':
          return await this.handleSaveCommand(enhancedCommand)
        
        case 'help':
          return await this.handleHelpCommand(enhancedCommand)
        
        case 'settings':
          return await this.handleSettingsCommand(enhancedCommand)
        
        default:
          return await this.handleUnknownCommand(enhancedCommand)
      }
    } catch (error) {
      return {
        text: `Sorry, I encountered an error processing your command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: []
      }
    }
  }

  private async enhanceCommandWithContext(command: VoiceCommand): Promise<VoiceCommand> {
    // Get current page context if available
    const context = await this.getCurrentContext()
    
    // Re-analyze intent with context
    const enhancedIntent = this.analyzeIntentWithContext(command.command, context)
    
    // Extract parameters with better context awareness
    const enhancedParameters = this.extractParametersWithContext(command.command, enhancedIntent, context)

    return {
      ...command,
      intent: enhancedIntent,
      parameters: { ...command.parameters, ...enhancedParameters }
    }
  }

  private analyzeIntentWithContext(transcript: string, context?: PageContext): VoiceIntent {
    const normalizedText = transcript.toLowerCase().trim()
    
    // Check each intent pattern
    for (const [intent, patterns] of this.commandPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          return intent
        }
      }
    }

    // Context-based intent inference
    if (context) {
      if (normalizedText.includes('this') || normalizedText.includes('page')) {
        if (normalizedText.includes('what') || normalizedText.includes('about')) {
          return 'summarize'
        }
      }
    }

    return 'unknown'
  }

  private extractParametersWithContext(
    transcript: string, 
    intent: VoiceIntent, 
    context?: PageContext
  ): Record<string, any> {
    const parameters: Record<string, any> = {}
    const normalizedText = transcript.toLowerCase().trim()

    switch (intent) {
      case 'explain':
        const explainMatch = normalizedText.match(/(?:explain|tell me about|what is|define|describe)\s+(.+)/i)
        if (explainMatch) {
          parameters.topic = explainMatch[1].trim()
        }
        break

      case 'search':
        const searchMatch = normalizedText.match(/(?:search|find|look up|look for)\s+(?:for\s+)?(.+)/i) ||
                           normalizedText.match(/(?:what is|who is|where is|when is|why is|how is)\s+(.+)/i)
        if (searchMatch) {
          parameters.query = searchMatch[1].trim()
        }
        break

      case 'translate':
        const translateMatch = normalizedText.match(/(?:translate|translation)\s+(?:this\s+)?(?:to\s+)?(\w+)/i)
        if (translateMatch) {
          parameters.targetLanguage = translateMatch[1].trim()
          parameters.sourceText = context?.selectedText || context?.content
        }
        break

      case 'navigate':
        const navMatch = normalizedText.match(/(?:go to|navigate to|open|visit|take me to|show me)\s+(.+)/i)
        if (navMatch) {
          parameters.destination = navMatch[1].trim()
        } else if (normalizedText.includes('back')) {
          parameters.action = 'back'
        } else if (normalizedText.includes('forward')) {
          parameters.action = 'forward'
        } else if (normalizedText.includes('home') || normalizedText.includes('dashboard')) {
          parameters.action = 'home'
        }
        break

      case 'automate':
        parameters.context = context
        parameters.selectedText = context?.selectedText
        break

      case 'save':
        parameters.url = context?.url
        parameters.title = context?.title
        parameters.selectedText = context?.selectedText
        break
    }

    return parameters
  }

  private async getCurrentContext(): Promise<PageContext | undefined> {
    const now = Date.now()
    
    // Use cached context if recent (within 5 seconds)
    if (this.contextCache.timestamp > now - 5000 && this.contextCache.context) {
      return this.contextCache.context
    }

    // Fetch fresh context
    if (this.options.contextProvider) {
      try {
        const context = await this.options.contextProvider()
        this.contextCache = { context, timestamp: now }
        return context
      } catch (error) {
        console.warn('Failed to get page context:', error)
      }
    }

    return undefined
  }

  private async handleSummarizeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const context = await this.getCurrentContext()
    
    if (!context) {
      return {
        text: "I need access to the current page to provide a summary. Please make sure Kiro has permission to read the page content.",
        actions: []
      }
    }

    return {
      text: "I'll summarize this page for you.",
      actions: [
        {
          type: 'execute',
          target: 'ai-summarize',
          data: { 
            content: context.content,
            url: context.url,
            title: context.title
          }
        },
        {
          type: 'display',
          target: 'summary-panel',
          data: { context }
        }
      ],
      followUp: "The summary will appear in the sidebar shortly."
    }
  }

  private async handleExplainCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const topic = command.parameters?.topic
    
    if (!topic) {
      return {
        text: "What would you like me to explain?",
        actions: []
      }
    }

    return {
      text: `I'll explain ${topic} for you.`,
      actions: [
        {
          type: 'execute',
          target: 'ai-explain',
          data: { 
            topic,
            context: await this.getCurrentContext()
          }
        }
      ]
    }
  }

  private async handleSearchCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const query = command.parameters?.query
    
    if (!query) {
      return {
        text: "What would you like me to search for?",
        actions: []
      }
    }

    return {
      text: `Searching for "${query}".`,
      actions: [
        {
          type: 'execute',
          target: 'search',
          data: { query }
        },
        {
          type: 'display',
          target: 'search-results',
          data: { query }
        }
      ]
    }
  }

  private async handleTranslateCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const targetLanguage = command.parameters?.targetLanguage
    const sourceText = command.parameters?.sourceText
    
    if (!targetLanguage) {
      return {
        text: "Which language would you like me to translate to?",
        actions: []
      }
    }

    if (!sourceText) {
      return {
        text: `I need some text to translate to ${targetLanguage}. Please select some text on the page first.`,
        actions: []
      }
    }

    return {
      text: `I'll translate the selected text to ${targetLanguage}.`,
      actions: [
        {
          type: 'execute',
          target: 'ai-translate',
          data: { 
            text: sourceText,
            targetLanguage,
            sourceLanguage: 'auto'
          }
        }
      ]
    }
  }

  private async handleNavigateCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const destination = command.parameters?.destination
    const action = command.parameters?.action

    if (action) {
      return {
        text: `Going ${action}.`,
        actions: [
          {
            type: 'navigate',
            target: action,
            data: {}
          }
        ]
      }
    }

    if (destination) {
      return {
        text: `Navigating to ${destination}.`,
        actions: [
          {
            type: 'navigate',
            target: 'url',
            data: { destination }
          }
        ]
      }
    }

    return {
      text: "Where would you like me to navigate?",
      actions: []
    }
  }

  private async handleAutomateCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const context = command.parameters?.context
    
    return {
      text: "I'll help you create an automation rule based on the current context.",
      actions: [
        {
          type: 'execute',
          target: 'automation-builder',
          data: { 
            context,
            trigger: 'voice-command',
            command: command.command
          }
        },
        {
          type: 'display',
          target: 'automation-panel',
          data: { context }
        }
      ],
      followUp: "The automation builder will open to help you set up the rule."
    }
  }

  private async handleSaveCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const url = command.parameters?.url
    const title = command.parameters?.title
    
    if (!url) {
      return {
        text: "I need access to the current page to save it.",
        actions: []
      }
    }

    return {
      text: `Saving "${title || 'this page'}" to your bookmarks.`,
      actions: [
        {
          type: 'save',
          target: 'bookmark',
          data: { 
            url,
            title,
            selectedText: command.parameters?.selectedText,
            timestamp: Date.now()
          }
        }
      ]
    }
  }

  private async handleHelpCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      text: "I can help you with various tasks using voice commands.",
      actions: [
        {
          type: 'display',
          target: 'help-panel',
          data: {}
        }
      ],
      followUp: "Try saying 'summarize this page', 'search for artificial intelligence', or 'explain machine learning'. You can also say 'settings' to configure voice options."
    }
  }

  private async handleSettingsCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      text: "Opening voice settings for you.",
      actions: [
        {
          type: 'navigate',
          target: 'settings',
          data: { section: 'voice' }
        }
      ]
    }
  }

  private async handleUnknownCommand(command: VoiceCommand): Promise<VoiceResponse> {
    // Try to provide helpful suggestions based on the command
    const suggestions = this.generateCommandSuggestions(command.command)
    
    return {
      text: "I didn't understand that command. Here are some things you can try:",
      actions: [],
      followUp: suggestions.length > 0 
        ? `Did you mean: ${suggestions.join(', ')}?`
        : "Try saying 'help' to see available commands, or 'summarize this page' to get started."
    }
  }

  private generateCommandSuggestions(command: string): string[] {
    const suggestions: string[] = []
    const normalizedCommand = command.toLowerCase()

    // Simple fuzzy matching for suggestions
    if (normalizedCommand.includes('sum') || normalizedCommand.includes('brief')) {
      suggestions.push('summarize this page')
    }
    
    if (normalizedCommand.includes('find') || normalizedCommand.includes('look')) {
      suggestions.push('search for [topic]')
    }
    
    if (normalizedCommand.includes('what') || normalizedCommand.includes('how')) {
      suggestions.push('explain [topic]')
    }
    
    if (normalizedCommand.includes('go') || normalizedCommand.includes('open')) {
      suggestions.push('navigate to [page]')
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  public addCustomPattern(intent: VoiceIntent, pattern: RegExp): void {
    if (!this.commandPatterns.has(intent)) {
      this.commandPatterns.set(intent, [])
    }
    this.commandPatterns.get(intent)!.push(pattern)
  }

  public updateOptions(options: Partial<CommandProcessorOptions>): void {
    this.options = { ...this.options, ...options }
  }
}
// Smart Summarization System for Kiro Web Mind

import { PageContext, ContextAnalysis } from '../types/core'

export interface SummaryRequest {
  id: string
  content: string
  type: SummaryType
  length: SummaryLength
  focus?: string[]
  language?: string
  context?: PageContext
  createdAt: number
}

export interface Summary {
  id: string
  requestId: string
  content: string
  keyPoints: string[]
  entities: Entity[]
  topics: Topic[]
  sentiment: SentimentAnalysis
  readingTime: number
  confidence: number
  sources?: Source[]
  tags: string[]
  createdAt: number
}

export interface Entity {
  text: string
  type: EntityType
  confidence: number
  startIndex: number
  endIndex: number
  metadata?: Record<string, any>
}

export interface Topic {
  name: string
  relevance: number
  keywords: string[]
  category: TopicCategory
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral'
  confidence: number
  emotions: Emotion[]
  subjectivity: number // 0-1, objective to subjective
}

export interface Emotion {
  type: 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'disgust'
  intensity: number // 0-1
}

export interface Source {
  url: string
  title: string
  domain: string
  credibility: number
  lastAccessed: number
}

export interface ResearchSession {
  id: string
  topic: string
  sources: Source[]
  summaries: Summary[]
  synthesis: string
  timeline: ResearchEvent[]
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface ResearchEvent {
  type: 'source_added' | 'summary_created' | 'synthesis_updated' | 'insight_generated'
  timestamp: number
  data: any
  description: string
}

export type SummaryType = 'extractive' | 'abstractive' | 'bullet_points' | 'key_insights' | 'research_synthesis'
export type SummaryLength = 'brief' | 'medium' | 'detailed' | 'comprehensive'
export type EntityType = 'person' | 'organization' | 'location' | 'date' | 'money' | 'product' | 'concept' | 'other'
export type TopicCategory = 'technology' | 'business' | 'science' | 'politics' | 'entertainment' | 'sports' | 'health' | 'education' | 'other'

export class SmartSummarizationSystem {
  private summaries: Map<string, Summary> = new Map()
  private researchSessions: Map<string, ResearchSession> = new Map()
  private summaryHistory: Summary[] = []

  constructor() {
    this.loadSummaryHistory()
  }

  async createSummary(request: SummaryRequest): Promise<Summary> {
    try {
      // Preprocess content
      const processedContent = this.preprocessContent(request.content)
      
      // Generate summary based on type
      let summaryContent: string
      switch (request.type) {
        case 'extractive':
          summaryContent = await this.generateExtractiveSummary(processedContent, request.length)
          break
        case 'abstractive':
          summaryContent = await this.generateAbstractiveSummary(processedContent, request.length)
          break
        case 'bullet_points':
          summaryContent = await this.generateBulletPointSummary(processedContent, request.length)
          break
        case 'key_insights':
          summaryContent = await this.generateKeyInsights(processedContent, request.length)
          break
        case 'research_synthesis':
          summaryContent = await this.generateResearchSynthesis(processedContent, request.length)
          break
        default:
          summaryContent = await this.generateExtractiveSummary(processedContent, request.length)
      }

      // Extract additional information
      const keyPoints = await this.extractKeyPoints(processedContent)
      const entities = await this.extractEntities(processedContent)
      const topics = await this.extractTopics(processedContent)
      const sentiment = await this.analyzeSentiment(processedContent)
      const tags = await this.generateTags(processedContent, request.context)

      // Calculate reading time
      const readingTime = this.calculateReadingTime(summaryContent)

      const summary: Summary = {
        id: this.generateId(),
        requestId: request.id,
        content: summaryContent,
        keyPoints,
        entities,
        topics,
        sentiment,
        readingTime,
        confidence: 0.85, // Would be calculated based on AI model confidence
        tags,
        createdAt: Date.now()
      }

      this.summaries.set(summary.id, summary)
      this.summaryHistory.push(summary)
      await this.saveSummaryHistory()

      return summary
    } catch (error) {
      console.error('Failed to create summary:', error)
      throw error
    }
  }

  async createMultiSourceSummary(sources: Source[], topic: string): Promise<ResearchSession> {
    const session: ResearchSession = {
      id: this.generateId(),
      topic,
      sources,
      summaries: [],
      synthesis: '',
      timeline: [{
        type: 'source_added',
        timestamp: Date.now(),
        data: { count: sources.length },
        description: `Added ${sources.length} sources for research on "${topic}"`
      }],
      tags: [topic.toLowerCase().replace(/\s+/g, '-')],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Create summaries for each source
    for (const source of sources) {
      try {
        const content = await this.fetchSourceContent(source.url)
        const request: SummaryRequest = {
          id: this.generateId(),
          content,
          type: 'key_insights',
          length: 'medium',
          focus: [topic],
          createdAt: Date.now()
        }

        const summary = await this.createSummary(request)
        summary.sources = [source]
        session.summaries.push(summary)

        session.timeline.push({
          type: 'summary_created',
          timestamp: Date.now(),
          data: { sourceUrl: source.url, summaryId: summary.id },
          description: `Created summary for ${source.title}`
        })
      } catch (error) {
        console.error(`Failed to summarize source ${source.url}:`, error)
      }
    }

    // Generate synthesis
    session.synthesis = await this.synthesizeResearch(session.summaries, topic)
    session.updatedAt = Date.now()

    session.timeline.push({
      type: 'synthesis_updated',
      timestamp: Date.now(),
      data: { summaryCount: session.summaries.length },
      description: `Generated research synthesis from ${session.summaries.length} summaries`
    })

    this.researchSessions.set(session.id, session)
    await this.saveResearchSessions()

    return session
  }

  async searchSummaries(query: string, filters?: {
    type?: SummaryType
    dateRange?: { start: number, end: number }
    tags?: string[]
    minConfidence?: number
  }): Promise<Summary[]> {
    let results = Array.from(this.summaries.values())

    // Text search
    if (query) {
      const queryLower = query.toLowerCase()
      results = results.filter(summary => 
        summary.content.toLowerCase().includes(queryLower) ||
        summary.keyPoints.some(point => point.toLowerCase().includes(queryLower)) ||
        summary.tags.some(tag => tag.toLowerCase().includes(queryLower))
      )
    }

    // Apply filters
    if (filters) {
      if (filters.dateRange) {
        results = results.filter(summary => 
          summary.createdAt >= filters.dateRange!.start &&
          summary.createdAt <= filters.dateRange!.end
        )
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(summary =>
          filters.tags!.some(tag => summary.tags.includes(tag))
        )
      }

      if (filters.minConfidence) {
        results = results.filter(summary => summary.confidence >= filters.minConfidence!)
      }
    }

    // Sort by relevance and recency
    return results.sort((a, b) => {
      // Simple relevance scoring
      const aRelevance = this.calculateRelevance(a, query)
      const bRelevance = this.calculateRelevance(b, query)
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance
      }
      
      return b.createdAt - a.createdAt
    })
  }

  private calculateRelevance(summary: Summary, query: string): number {
    if (!query) return 0

    const queryLower = query.toLowerCase()
    let score = 0

    // Content match
    if (summary.content.toLowerCase().includes(queryLower)) {
      score += 3
    }

    // Key points match
    summary.keyPoints.forEach(point => {
      if (point.toLowerCase().includes(queryLower)) {
        score += 2
      }
    })

    // Tags match
    summary.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 1
      }
    })

    // Entity match
    summary.entities.forEach(entity => {
      if (entity.text.toLowerCase().includes(queryLower)) {
        score += entity.confidence
      }
    })

    return score
  }

  private async generateExtractiveSummary(content: string, length: SummaryLength): Promise<string> {
    // Simple extractive summarization
    const sentences = this.splitIntoSentences(content)
    const sentenceScores = this.scoreSentences(sentences, content)
    
    const targetSentences = this.getTargetSentenceCount(length)
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, targetSentences)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence)

    return topSentences.join(' ')
  }

  private async generateAbstractiveSummary(content: string, length: SummaryLength): Promise<string> {
    // Placeholder for abstractive summarization
    // In a real implementation, this would use a transformer model
    const keyPoints = await this.extractKeyPoints(content)
    const targetLength = this.getTargetWordCount(length)
    
    let summary = keyPoints.slice(0, 3).join('. ') + '.'
    
    // Trim to target length
    const words = summary.split(' ')
    if (words.length > targetLength) {
      summary = words.slice(0, targetLength).join(' ') + '...'
    }
    
    return summary
  }

  private async generateBulletPointSummary(content: string, length: SummaryLength): Promise<string> {
    const keyPoints = await this.extractKeyPoints(content)
    const targetPoints = Math.min(keyPoints.length, this.getTargetSentenceCount(length))
    
    return keyPoints
      .slice(0, targetPoints)
      .map(point => `• ${point}`)
      .join('\n')
  }

  private async generateKeyInsights(content: string, length: SummaryLength): Promise<string> {
    const insights = await this.extractInsights(content)
    const targetInsights = Math.min(insights.length, this.getTargetSentenceCount(length))
    
    return insights
      .slice(0, targetInsights)
      .map((insight, index) => `${index + 1}. ${insight}`)
      .join('\n\n')
  }

  private async generateResearchSynthesis(content: string, length: SummaryLength): Promise<string> {
    // Generate a synthesis that connects different pieces of information
    const topics = await this.extractTopics(content)
    const entities = await this.extractEntities(content)
    
    let synthesis = `This research covers ${topics.length} main topics: ${topics.map(t => t.name).join(', ')}. `
    
    if (entities.length > 0) {
      const keyEntities = entities
        .filter(e => e.confidence > 0.7)
        .slice(0, 5)
        .map(e => e.text)
      
      synthesis += `Key entities mentioned include: ${keyEntities.join(', ')}. `
    }
    
    const keyPoints = await this.extractKeyPoints(content)
    synthesis += keyPoints.slice(0, 3).join(' ')
    
    return synthesis
  }

  private async synthesizeResearch(summaries: Summary[], topic: string): Promise<string> {
    if (summaries.length === 0) {
      return `No summaries available for research on "${topic}".`
    }

    // Combine key points from all summaries
    const allKeyPoints = summaries.flatMap(s => s.keyPoints)
    const allEntities = summaries.flatMap(s => s.entities)
    const allTopics = summaries.flatMap(s => s.topics)

    // Find common themes
    const entityCounts = this.countOccurrences(allEntities.map(e => e.text))
    const topicCounts = this.countOccurrences(allTopics.map(t => t.name))

    let synthesis = `Research synthesis on "${topic}" based on ${summaries.length} sources:\n\n`

    // Add common entities
    const commonEntities = Object.entries(entityCounts)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([entity, _]) => entity)

    if (commonEntities.length > 0) {
      synthesis += `Key entities across sources: ${commonEntities.join(', ')}.\n\n`
    }

    // Add key insights
    synthesis += 'Key insights:\n'
    const topKeyPoints = allKeyPoints
      .slice(0, 5)
      .map((point, index) => `${index + 1}. ${point}`)
      .join('\n')
    
    synthesis += topKeyPoints

    // Add sentiment analysis
    const sentiments = summaries.map(s => s.sentiment.overall)
    const sentimentCounts = this.countOccurrences(sentiments)
    const dominantSentiment = Object.entries(sentimentCounts)
      .sort(([_, a], [__, b]) => b - a)[0]?.[0]

    if (dominantSentiment) {
      synthesis += `\n\nOverall sentiment across sources: ${dominantSentiment}.`
    }

    return synthesis
  }

  private countOccurrences<T>(items: T[]): Record<string, number> {
    const counts: Record<string, number> = {}
    items.forEach(item => {
      const key = String(item)
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
  }

  private scoreSentences(sentences: string[], fullText: string): Array<{ sentence: string, score: number, index: number }> {
    const wordFreq = this.calculateWordFrequency(fullText)
    
    return sentences.map((sentence, index) => {
      let score = 0
      const words = sentence.toLowerCase().split(/\s+/)
      
      // Score based on word frequency
      words.forEach(word => {
        if (wordFreq[word]) {
          score += wordFreq[word]
        }
      })
      
      // Boost score for sentences with numbers, proper nouns, etc.
      if (/\d/.test(sentence)) score += 1
      if (/[A-Z][a-z]+/.test(sentence)) score += 1
      if (sentence.length > 50 && sentence.length < 200) score += 1
      
      return { sentence, score: score / words.length, index }
    })
  }

  private calculateWordFrequency(text: string): Record<string, number> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    const freq: Record<string, number> = {}
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1
    })

    return freq
  }

  private async extractKeyPoints(content: string): Promise<string[]> {
    // Simple key point extraction
    const sentences = this.splitIntoSentences(content)
    const scored = this.scoreSentences(sentences, content)
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.sentence)
  }

  private async extractEntities(content: string): Promise<Entity[]> {
    // Simple entity extraction
    const entities: Entity[] = []
    
    // Extract potential person names (capitalized words)
    const personRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
    let match
    while ((match = personRegex.exec(content)) !== null) {
      entities.push({
        text: match[0],
        type: 'person',
        confidence: 0.7,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }

    // Extract dates
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g
    while ((match = dateRegex.exec(content)) !== null) {
      entities.push({
        text: match[0],
        type: 'date',
        confidence: 0.9,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }

    // Extract money amounts
    const moneyRegex = /\$[\d,]+(?:\.\d{2})?/g
    while ((match = moneyRegex.exec(content)) !== null) {
      entities.push({
        text: match[0],
        type: 'money',
        confidence: 0.8,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }

    return entities
  }

  private async extractTopics(content: string): Promise<Topic[]> {
    const wordFreq = this.calculateWordFrequency(content)
    const topWords = Object.entries(wordFreq)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)

    return topWords.map(([word, freq]) => ({
      name: word,
      relevance: freq / content.split(/\s+/).length,
      keywords: [word],
      category: this.categorizeWord(word)
    }))
  }

  private categorizeWord(word: string): TopicCategory {
    const categories: Record<TopicCategory, string[]> = {
      technology: ['software', 'computer', 'digital', 'ai', 'machine', 'data', 'algorithm'],
      business: ['company', 'market', 'revenue', 'profit', 'customer', 'sales', 'strategy'],
      science: ['research', 'study', 'experiment', 'theory', 'analysis', 'discovery'],
      politics: ['government', 'policy', 'election', 'political', 'democracy', 'vote'],
      entertainment: ['movie', 'music', 'game', 'show', 'entertainment', 'celebrity'],
      sports: ['team', 'player', 'game', 'sport', 'championship', 'tournament'],
      health: ['health', 'medical', 'doctor', 'treatment', 'disease', 'medicine'],
      education: ['school', 'student', 'teacher', 'education', 'learning', 'university'],
      other: []
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.includes(word.toLowerCase())) {
        return category as TopicCategory
      }
    }

    return 'other'
  }

  private async extractInsights(content: string): Promise<string[]> {
    // Extract sentences that contain insight indicators
    const sentences = this.splitIntoSentences(content)
    const insightIndicators = [
      'therefore', 'thus', 'consequently', 'as a result', 'this means',
      'importantly', 'significantly', 'notably', 'interestingly',
      'the key finding', 'the main point', 'in conclusion'
    ]

    return sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return insightIndicators.some(indicator => lowerSentence.includes(indicator))
    }).slice(0, 5)
  }

  private async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'positive', 'success', 'achievement']
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'failure', 'problem', 'issue', 'concern']
    
    const words = content.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(w => positiveWords.includes(w)).length
    const negativeCount = words.filter(w => negativeWords.includes(w)).length
    
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral'
    let confidence = 0.5

    if (positiveCount > negativeCount) {
      overall = 'positive'
      confidence = Math.min(0.9, 0.5 + (positiveCount - negativeCount) / words.length * 10)
    } else if (negativeCount > positiveCount) {
      overall = 'negative'
      confidence = Math.min(0.9, 0.5 + (negativeCount - positiveCount) / words.length * 10)
    }

    return {
      overall,
      confidence,
      emotions: [], // Would be populated by more sophisticated analysis
      subjectivity: 0.5 // Placeholder
    }
  }

  private async generateTags(content: string, context?: PageContext): Promise<string[]> {
    const tags: string[] = []
    
    // Add tags based on content
    const topics = await this.extractTopics(content)
    tags.push(...topics.slice(0, 3).map(t => t.name))
    
    // Add tags based on context
    if (context) {
      tags.push(context.pageType)
      if (context.url) {
        const domain = new URL(context.url).hostname.replace('www.', '')
        tags.push(domain)
      }
    }
    
    return [...new Set(tags)] // Remove duplicates
  }

  private preprocessContent(content: string): string {
    // Clean up content
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()-]/g, '') // Remove special characters
      .trim()
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200
    const wordCount = text.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  private getTargetSentenceCount(length: SummaryLength): number {
    switch (length) {
      case 'brief': return 2
      case 'medium': return 4
      case 'detailed': return 6
      case 'comprehensive': return 10
      default: return 4
    }
  }

  private getTargetWordCount(length: SummaryLength): number {
    switch (length) {
      case 'brief': return 50
      case 'medium': return 150
      case 'detailed': return 300
      case 'comprehensive': return 500
      default: return 150
    }
  }

  private async fetchSourceContent(url: string): Promise<string> {
    // Placeholder - would fetch and extract content from URL
    return `Content from ${url}`
  }

  private generateId(): string {
    return `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async saveSummaryHistory(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ summary_history: this.summaryHistory })
    } else {
      localStorage.setItem('summary_history', JSON.stringify(this.summaryHistory))
    }
  }

  private async loadSummaryHistory(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['summary_history'])
        this.summaryHistory = result.summary_history || []
      } else {
        const stored = localStorage.getItem('summary_history')
        if (stored) {
          this.summaryHistory = JSON.parse(stored)
        }
      }

      // Rebuild summaries map
      this.summaryHistory.forEach(summary => {
        this.summaries.set(summary.id, summary)
      })
    } catch (error) {
      console.error('Failed to load summary history:', error)
    }
  }

  private async saveResearchSessions(): Promise<void> {
    const sessionsData = Array.from(this.researchSessions.values())
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ research_sessions: sessionsData })
    } else {
      localStorage.setItem('research_sessions', JSON.stringify(sessionsData))
    }
  }

  // Public API methods
  getSummary(summaryId: string): Summary | null {
    return this.summaries.get(summaryId) || null
  }

  getSummaryHistory(): Summary[] {
    return [...this.summaryHistory].sort((a, b) => b.createdAt - a.createdAt)
  }

  getResearchSession(sessionId: string): ResearchSession | null {
    return this.researchSessions.get(sessionId) || null
  }

  getResearchSessions(): ResearchSession[] {
    return Array.from(this.researchSessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async deleteSummary(summaryId: string): Promise<void> {
    this.summaries.delete(summaryId)
    this.summaryHistory = this.summaryHistory.filter(s => s.id !== summaryId)
    await this.saveSummaryHistory()
  }

  async deleteResearchSession(sessionId: string): Promise<void> {
    this.researchSessions.delete(sessionId)
    await this.saveResearchSessions()
  }
}
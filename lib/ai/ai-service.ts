// AI Service abstraction layer for Kiro Web Mind

import { geminiNano, aiUtils } from './gemini-nano';
import type { PageContext, ContextAnalysis, Suggestion, AutomationOpportunity, PageType } from '../types';

export interface AIProcessingOptions {
  maxTokens?: number;
  temperature?: number;
  context?: string;
  streaming?: boolean;
}

export interface AIAnalysisResult {
  summary?: string;
  keyPoints?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  entities?: string[];
  intent?: string;
  complexity?: 'low' | 'medium' | 'high';
  readingTime?: number;
}

export class AIService {
  private static instance: AIService;
  private isInitialized: boolean = false;
  private processingQueue: Array<() => Promise<any>> = [];
  private isProcessing: boolean = false;
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if Gemini Nano is available
      const isReady = await geminiNano.isReady();
      console.log('AI Service initialized. Gemini Nano available:', isReady);
      
      this.isInitialized = true;
      this.startProcessingQueue();
    } catch (error) {
      console.error('AI Service initialization error:', error);
      throw error;
    }
  }

  // Core AI operations
  public async processText(
    operation: 'summarize' | 'explain' | 'translate' | 'rewrite' | 'analyze',
    text: string,
    options?: AIProcessingOptions & {
      targetLanguage?: string;
      tone?: 'formal' | 'casual' | 'neutral';
      analysisType?: 'sentiment' | 'entities' | 'topics' | 'intent';
    }
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check rate limiting
    if (!this.checkRateLimit(operation, 10, 60000)) { // 10 per minute per operation
      throw new Error(`Rate limit exceeded for ${operation} operation`);
    }

    try {
      switch (operation) {
        case 'summarize':
          return await this.summarizeText(text, options);
        case 'explain':
          return await this.explainText(text, options);
        case 'translate':
          return await this.translateText(text, options?.targetLanguage || 'en');
        case 'rewrite':
          return await this.rewriteText(text, options);
        case 'analyze':
          return await this.analyzeText(text, options?.analysisType || 'sentiment');
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error(`AI processing error for ${operation}:`, error);
      throw error;
    }
  }

  // Page context analysis
  public async analyzePageContext(pageContext: PageContext): Promise<ContextAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const content = pageContext.content || '';
      const title = pageContext.title || '';
      
      // Parallel analysis for better performance
      const [
        sentimentResult,
        topicsResult,
        entitiesResult,
        intentResult
      ] = await Promise.allSettled([
        geminiNano.analyzeContent(content, 'sentiment'),
        geminiNano.analyzeContent(content, 'topics'),
        geminiNano.analyzeContent(content, 'entities'),
        geminiNano.analyzeContent(content, 'intent')
      ]);

      // Extract results safely
      const sentiment = sentimentResult.status === 'fulfilled' ? sentimentResult.value.sentiment : 'neutral';
      const topics = topicsResult.status === 'fulfilled' ? topicsResult.value.topics : [];
      const entities = entitiesResult.status === 'fulfilled' ? entitiesResult.value.entities : [];
      const intent = intentResult.status === 'fulfilled' ? intentResult.value.intent : 'browsing';

      // Generate analysis
      const analysis: ContextAnalysis = {
        pageType: this.detectPageType(pageContext),
        mainTopic: this.extractMainTopic(title, content, topics),
        keyEntities: entities.slice(0, 10),
        userIntent: intent as any,
        confidence: this.calculateConfidence(content, sentiment, topics, entities),
        relevantSuggestions: await this.generateSuggestions(pageContext, sentiment, topics, entities),
        automationOpportunities: await this.detectAutomationOpportunities(pageContext),
        sentiment: sentiment as any,
        complexity: this.assessComplexity(content),
        readingTime: this.estimateReadingTime(content)
      };

      return analysis;
    } catch (error) {
      console.error('Page context analysis error:', error);
      
      // Return fallback analysis
      return {
        pageType: this.detectPageType(pageContext),
        mainTopic: pageContext.title || 'Unknown',
        keyEntities: [],
        userIntent: 'browsing',
        confidence: 0.5,
        relevantSuggestions: [],
        automationOpportunities: [],
        sentiment: 'neutral',
        complexity: 'medium',
        readingTime: this.estimateReadingTime(pageContext.content || '')
      };
    }
  }

  // Suggestion generation
  public async generateContextualSuggestions(
    pageContext: PageContext,
    userBehavior?: {
      recentActions: string[];
      preferences: any;
      history: any[];
    }
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    try {
      const content = pageContext.content || '';
      const hasSelectedText = pageContext.selectedText && pageContext.selectedText.length > 50;
      const hasFormFields = pageContext.formFields && pageContext.formFields.length > 0;

      // Content-based suggestions
      if (content.length > 1000) {
        suggestions.push({
          id: 'summarize_content',
          title: 'Summarize this content',
          description: 'Get a concise summary of the main points',
          action: 'summarize',
          confidence: 0.9,
          category: 'productivity',
          metadata: { contentLength: content.length }
        });
      }

      if (hasSelectedText) {
        suggestions.push({
          id: 'explain_selection',
          title: 'Explain selected text',
          description: 'Get a detailed explanation of the selected content',
          action: 'explain',
          confidence: 0.85,
          category: 'learning',
          metadata: { selectionLength: pageContext.selectedText!.length }
        });

        suggestions.push({
          id: 'translate_selection',
          title: 'Translate selected text',
          description: 'Translate the selected text to another language',
          action: 'translate',
          confidence: 0.7,
          category: 'productivity'
        });
      }

      // Form-based suggestions
      if (hasFormFields) {
        const commonFields = pageContext.formFields!.filter(field =>
          ['name', 'email', 'phone', 'address'].some(common =>
            field.name?.toLowerCase().includes(common) ||
            field.label?.toLowerCase().includes(common)
          )
        );

        if (commonFields.length > 0) {
          suggestions.push({
            id: 'autofill_form',
            title: 'Auto-fill form fields',
            description: 'Fill common form fields with your saved information',
            action: 'automate',
            confidence: 0.8,
            category: 'productivity',
            metadata: { fieldCount: commonFields.length }
          });
        }
      }

      // Page type specific suggestions
      const pageType = this.detectPageType(pageContext);
      switch (pageType) {
        case 'article':
          suggestions.push({
            id: 'extract_key_points',
            title: 'Extract key points',
            description: 'Get the main takeaways from this article',
            action: 'extract',
            confidence: 0.8,
            category: 'learning'
          });
          break;

        case 'shopping':
          suggestions.push({
            id: 'price_comparison',
            title: 'Compare prices',
            description: 'Find better deals for this product',
            action: 'research',
            confidence: 0.6,
            category: 'productivity'
          });
          break;

        case 'video':
          suggestions.push({
            id: 'video_summary',
            title: 'Summarize video content',
            description: 'Get a summary of the video transcript',
            action: 'summarize',
            confidence: 0.7,
            category: 'productivity'
          });
          break;
      }

      // Behavior-based suggestions
      if (userBehavior?.recentActions.includes('research')) {
        suggestions.push({
          id: 'research_assistant',
          title: 'Research assistance',
          description: 'Get help with research and fact-checking',
          action: 'research',
          confidence: 0.75,
          category: 'research'
        });
      }

      return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    } catch (error) {
      console.error('Suggestion generation error:', error);
      return [];
    }
  }

  // Streaming responses for real-time feedback
  public async *processTextStreaming(
    operation: 'summarize' | 'explain' | 'translate' | 'rewrite',
    text: string,
    options?: AIProcessingOptions
  ): AsyncIterable<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      switch (operation) {
        case 'summarize':
          for await (const chunk of geminiNano.generateTextStreaming(
            `Summarize this text: ${text}`,
            { context: options?.context }
          )) {
            yield chunk;
          }
          break;

        case 'explain':
          for await (const chunk of geminiNano.generateTextStreaming(
            `Explain this text in simple terms: ${text}`,
            { context: options?.context }
          )) {
            yield chunk;
          }
          break;

        default:
          // For non-streaming operations, yield the complete result
          const result = await this.processText(operation, text, options);
          yield result;
      }
    } catch (error) {
      console.error(`Streaming AI processing error for ${operation}:`, error);
      yield `Error processing ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Private helper methods
  private async summarizeText(text: string, options?: AIProcessingOptions): Promise<string> {
    const length = options?.context?.includes('brief') ? 'short' : 
                  options?.context?.includes('detailed') ? 'long' : 'medium';
    
    return await aiUtils.summarize(text, length);
  }

  private async explainText(text: string, options?: AIProcessingOptions): Promise<string> {
    return await aiUtils.explain(text, options?.context);
  }

  private async translateText(text: string, targetLanguage: string): Promise<string> {
    return await aiUtils.translate(text, targetLanguage);
  }

  private async rewriteText(text: string, options?: AIProcessingOptions & { tone?: string }): Promise<string> {
    const tone = options?.tone as 'more-formal' | 'more-casual' | 'as-is' || 'as-is';
    return await geminiNano.rewriteText(text, { tone });
  }

  private async analyzeText(text: string, analysisType: string): Promise<string> {
    const result = await geminiNano.analyzeContent(text, analysisType as any);
    return JSON.stringify(result, null, 2);
  }

  private detectPageType(pageContext: PageContext): PageType {
    const url = pageContext.url.toLowerCase();
    const title = pageContext.title.toLowerCase();
    
    // URL-based detection
    if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video';
    if (url.includes('github.com') || url.includes('stackoverflow.com')) return 'code';
    if (url.includes('shop') || url.includes('store') || url.includes('buy')) return 'shopping';
    if (url.includes('news') || url.includes('blog')) return 'article';
    if (url.includes('social') || url.includes('twitter') || url.includes('facebook')) return 'social';
    
    // Content-based detection
    if (pageContext.formFields && pageContext.formFields.length > 3) return 'form';
    if (title.includes('article') || title.includes('blog')) return 'article';
    
    return 'general';
  }

  private extractMainTopic(title: string, content: string, topics: string[]): string {
    if (topics.length > 0) {
      return topics.slice(0, 3).join(', ');
    }
    
    // Fallback to title-based extraction
    const words = title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    return words.slice(0, 3).join(' ');
  }

  private calculateConfidence(content: string, sentiment: string, topics: string[], entities: string[]): number {
    let confidence = 0.5;
    
    // Increase confidence based on content richness
    if (content.length > 500) confidence += 0.1;
    if (content.length > 1500) confidence += 0.1;
    
    // Increase confidence based on analysis results
    if (sentiment !== 'neutral') confidence += 0.1;
    if (topics.length > 2) confidence += 0.1;
    if (entities.length > 3) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private async generateSuggestions(
    pageContext: PageContext,
    sentiment: string,
    topics: string[],
    entities: string[]
  ): Promise<Suggestion[]> {
    // This will be implemented in the next task
    return [];
  }

  private async detectAutomationOpportunities(pageContext: PageContext): Promise<AutomationOpportunity[]> {
    // This will be implemented in the next task
    return [];
  }

  private assessComplexity(content: string): 'low' | 'medium' | 'high' {
    if (!content) return 'low';
    
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence > 20) return 'high';
    if (avgWordsPerSentence > 12) return 'medium';
    return 'low';
  }

  private estimateReadingTime(content: string): number {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private checkRateLimit(operation: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = operation;
    
    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    const limiter = this.rateLimiter.get(key)!;
    
    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + windowMs;
      return true;
    }
    
    if (limiter.count >= limit) {
      return false;
    }
    
    limiter.count++;
    return true;
  }

  private startProcessingQueue(): void {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) return;
      
      this.isProcessing = true;
      const task = this.processingQueue.shift();
      
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
      
      this.isProcessing = false;
    }, 100);
  }

  // Public utility methods
  public getStatus(): {
    initialized: boolean;
    geminiNanoAvailable: boolean;
    queueSize: number;
    rateLimits: Array<{ operation: string; count: number; resetTime: number }>;
  } {
    return {
      initialized: this.isInitialized,
      geminiNanoAvailable: geminiNano.getStatus().available,
      queueSize: this.processingQueue.length,
      rateLimits: Array.from(this.rateLimiter.entries()).map(([operation, data]) => ({
        operation,
        count: data.count,
        resetTime: data.resetTime
      }))
    };
  }

  public async cleanup(): Promise<void> {
    this.processingQueue = [];
    this.rateLimiter.clear();
    geminiNano.cleanup();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
// Gemini Nano integration for local AI processing

interface GeminiNanoAPI {
  createTextSession(): Promise<AITextSession>;
  createSummarizer(options?: SummarizerOptions): Promise<AISummarizer>;
  createWriter(options?: WriterOptions): Promise<AIWriter>;
  createRewriter(options?: RewriterOptions): Promise<AIRewriter>;
  createTranslator(options?: TranslatorOptions): Promise<AITranslator>;
}

interface AITextSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): AsyncIterable<string>;
  destroy(): void;
}

interface AISummarizer {
  summarize(input: string, options?: SummarizeOptions): Promise<string>;
  summarizeStreaming(input: string, options?: SummarizeOptions): AsyncIterable<string>;
  destroy(): void;
}

interface AIWriter {
  write(input: string, options?: WriteOptions): Promise<string>;
  writeStreaming(input: string, options?: WriteOptions): AsyncIterable<string>;
  destroy(): void;
}

interface AIRewriter {
  rewrite(input: string, options?: RewriteOptions): Promise<string>;
  rewriteStreaming(input: string, options?: RewriteOptions): AsyncIterable<string>;
  destroy(): void;
}

interface AITranslator {
  translate(input: string, options?: TranslateOptions): Promise<string>;
  translateStreaming(input: string, options?: TranslateOptions): AsyncIterable<string>;
  destroy(): void;
}

interface SummarizerOptions {
  type?: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
}

interface SummarizeOptions {
  context?: string;
}

interface WriterOptions {
  tone?: 'formal' | 'casual' | 'neutral';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
}

interface WriteOptions {
  context?: string;
}

interface RewriterOptions {
  tone?: 'more-formal' | 'more-casual' | 'as-is';
  format?: 'markdown' | 'plain-text';
  length?: 'shorter' | 'longer' | 'as-is';
}

interface RewriteOptions {
  context?: string;
}

interface TranslatorOptions {
  sourceLanguage?: string;
  targetLanguage?: string;
}

interface TranslateOptions {
  context?: string;
}

// Gemini Nano service class
export class GeminiNanoService {
  private api: GeminiNanoAPI | null = null;
  private isAvailable: boolean = false;
  private sessions: Map<string, any> = new Map();
  private fallbackEnabled: boolean = true;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Check if Chrome AI APIs are available
      if ('ai' in window && 'createTextSession' in (window as any).ai) {
        this.api = (window as any).ai as GeminiNanoAPI;
        this.isAvailable = true;
        console.log('Gemini Nano is available');
      } else {
        console.log('Gemini Nano is not available, using fallback');
        this.isAvailable = false;
      }
    } catch (error) {
      console.error('Error checking Gemini Nano availability:', error);
      this.isAvailable = false;
    }
  }

  public async isReady(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }
    return this.isAvailable;
  }

  // Text generation and completion
  public async generateText(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    context?: string;
  }): Promise<string> {
    try {
      if (!await this.isReady()) {
        return this.fallbackGenerateText(prompt, options);
      }

      const sessionId = 'text-generation';
      let session = this.sessions.get(sessionId);

      if (!session) {
        session = await this.api!.createTextSession();
        this.sessions.set(sessionId, session);
      }

      const fullPrompt = options?.context 
        ? `Context: ${options.context}\n\nPrompt: ${prompt}`
        : prompt;

      const result = await session.prompt(fullPrompt);
      return result;

    } catch (error) {
      console.error('Text generation error:', error);
      return this.fallbackGenerateText(prompt, options);
    }
  }

  // Text summarization
  public async summarizeText(text: string, options?: {
    type?: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
    length?: 'short' | 'medium' | 'long';
    format?: 'markdown' | 'plain-text';
  }): Promise<string> {
    try {
      if (!await this.isReady()) {
        return this.fallbackSummarizeText(text, options);
      }

      const sessionId = 'summarizer';
      let summarizer = this.sessions.get(sessionId);

      if (!summarizer) {
        summarizer = await this.api!.createSummarizer({
          type: options?.type || 'tl;dr',
          format: options?.format || 'plain-text',
          length: options?.length || 'medium'
        });
        this.sessions.set(sessionId, summarizer);
      }

      const result = await summarizer.summarize(text);
      return result;

    } catch (error) {
      console.error('Summarization error:', error);
      return this.fallbackSummarizeText(text, options);
    }
  }

  // Text rewriting and improvement
  public async rewriteText(text: string, options?: {
    tone?: 'more-formal' | 'more-casual' | 'as-is';
    length?: 'shorter' | 'longer' | 'as-is';
    purpose?: string;
  }): Promise<string> {
    try {
      if (!await this.isReady()) {
        return this.fallbackRewriteText(text, options);
      }

      const sessionId = 'rewriter';
      let rewriter = this.sessions.get(sessionId);

      if (!rewriter) {
        rewriter = await this.api!.createRewriter({
          tone: options?.tone || 'as-is',
          length: options?.length || 'as-is',
          format: 'plain-text'
        });
        this.sessions.set(sessionId, rewriter);
      }

      const result = await rewriter.rewrite(text, {
        context: options?.purpose
      });
      return result;

    } catch (error) {
      console.error('Rewriting error:', error);
      return this.fallbackRewriteText(text, options);
    }
  }

  // Translation
  public async translateText(text: string, options?: {
    sourceLanguage?: string;
    targetLanguage?: string;
  }): Promise<string> {
    try {
      if (!await this.isReady()) {
        return this.fallbackTranslateText(text, options);
      }

      const sessionId = `translator-${options?.sourceLanguage || 'auto'}-${options?.targetLanguage || 'en'}`;
      let translator = this.sessions.get(sessionId);

      if (!translator) {
        translator = await this.api!.createTranslator({
          sourceLanguage: options?.sourceLanguage || 'auto',
          targetLanguage: options?.targetLanguage || 'en'
        });
        this.sessions.set(sessionId, translator);
      }

      const result = await translator.translate(text);
      return result;

    } catch (error) {
      console.error('Translation error:', error);
      return this.fallbackTranslateText(text, options);
    }
  }

  // Content analysis and extraction
  public async analyzeContent(content: string, analysisType: 'sentiment' | 'entities' | 'topics' | 'intent'): Promise<any> {
    try {
      if (!await this.isReady()) {
        return this.fallbackAnalyzeContent(content, analysisType);
      }

      const prompts = {
        sentiment: `Analyze the sentiment of this text and respond with just one word: positive, negative, or neutral.\n\nText: ${content}`,
        entities: `Extract key entities (people, places, organizations, concepts) from this text. List them separated by commas.\n\nText: ${content}`,
        topics: `Identify the main topics discussed in this text. List up to 5 topics separated by commas.\n\nText: ${content}`,
        intent: `Determine the user's intent from this text. Choose from: informational, transactional, navigational, commercial, or entertainment.\n\nText: ${content}`
      };

      const result = await this.generateText(prompts[analysisType]);
      
      // Parse the result based on analysis type
      switch (analysisType) {
        case 'sentiment':
          return { sentiment: result.trim().toLowerCase() };
        case 'entities':
          return { entities: result.split(',').map(e => e.trim()).filter(e => e.length > 0) };
        case 'topics':
          return { topics: result.split(',').map(t => t.trim()).filter(t => t.length > 0) };
        case 'intent':
          return { intent: result.trim().toLowerCase() };
        default:
          return { result };
      }

    } catch (error) {
      console.error('Content analysis error:', error);
      return this.fallbackAnalyzeContent(content, analysisType);
    }
  }

  // Question answering
  public async answerQuestion(question: string, context?: string): Promise<string> {
    try {
      if (!await this.isReady()) {
        return this.fallbackAnswerQuestion(question, context);
      }

      const prompt = context 
        ? `Based on the following context, answer this question: ${question}\n\nContext: ${context}`
        : `Answer this question: ${question}`;

      return await this.generateText(prompt);

    } catch (error) {
      console.error('Question answering error:', error);
      return this.fallbackAnswerQuestion(question, context);
    }
  }

  // Streaming responses for real-time feedback
  public async *generateTextStreaming(prompt: string, options?: {
    context?: string;
  }): AsyncIterable<string> {
    try {
      if (!await this.isReady()) {
        yield this.fallbackGenerateText(prompt, options);
        return;
      }

      const sessionId = 'text-generation-streaming';
      let session = this.sessions.get(sessionId);

      if (!session) {
        session = await this.api!.createTextSession();
        this.sessions.set(sessionId, session);
      }

      const fullPrompt = options?.context 
        ? `Context: ${options.context}\n\nPrompt: ${prompt}`
        : prompt;

      for await (const chunk of session.promptStreaming(fullPrompt)) {
        yield chunk;
      }

    } catch (error) {
      console.error('Streaming text generation error:', error);
      yield this.fallbackGenerateText(prompt, options);
    }
  }

  // Cleanup and resource management
  public cleanup(): void {
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      try {
        if (session && typeof session.destroy === 'function') {
          session.destroy();
        }
      } catch (error) {
        console.error(`Error destroying session ${sessionId}:`, error);
      }
    }
    this.sessions.clear();
  }

  // Fallback implementations for when Gemini Nano is not available
  private fallbackGenerateText(prompt: string, options?: any): string {
    if (!this.fallbackEnabled) {
      throw new Error('Gemini Nano not available and fallback disabled');
    }

    // Simple rule-based responses
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
      return 'This appears to be a request for summarization. Gemini Nano is not available, so I cannot provide an AI-generated summary.';
    }
    
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('what is')) {
      return 'This appears to be a request for explanation. Gemini Nano is not available, so I cannot provide an AI-generated explanation.';
    }
    
    if (lowerPrompt.includes('translate')) {
      return 'This appears to be a translation request. Gemini Nano is not available, so I cannot provide AI translation.';
    }
    
    return 'Gemini Nano is not available. Please try again later or check if Chrome AI features are enabled.';
  }

  private fallbackSummarizeText(text: string, options?: any): string {
    if (!this.fallbackEnabled) {
      throw new Error('Gemini Nano not available and fallback disabled');
    }

    // Simple extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const maxSentences = options?.length === 'short' ? 2 : options?.length === 'long' ? 5 : 3;
    const summary = sentences.slice(0, Math.min(maxSentences, sentences.length)).join('. ');
    
    return summary + (summary.endsWith('.') ? '' : '.');
  }

  private fallbackRewriteText(text: string, options?: any): string {
    if (!this.fallbackEnabled) {
      throw new Error('Gemini Nano not available and fallback disabled');
    }

    // Simple text transformations
    if (options?.tone === 'more-formal') {
      return text.replace(/\b(don't|won't|can't|isn't|aren't)\b/g, (match) => {
        const expansions: { [key: string]: string } = {
          "don't": "do not",
          "won't": "will not",
          "can't": "cannot",
          "isn't": "is not",
          "aren't": "are not"
        };
        return expansions[match] || match;
      });
    }
    
    if (options?.length === 'shorter') {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
    }
    
    return text;
  }

  private fallbackTranslateText(text: string, options?: any): string {
    if (!this.fallbackEnabled) {
      throw new Error('Gemini Nano not available and fallback disabled');
    }

    return `[Translation not available - Gemini Nano required for translation features]`;
  }

  private fallbackAnalyzeContent(content: string, analysisType: string): any {
    if (!this.fallbackEnabled) {
      throw new Error('Gemini Nano not available and fallback disabled');
    }

    // Simple rule-based analysis
    switch (analysisType) {
      case 'sentiment':
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
        const words = content.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(w => positiveWords.includes(w)).length;
        const negativeCount = words.filter(w => negativeWords.includes(w)).length;
        
        if (positiveCount > negativeCount) return { sentiment: 'positive' };
        if (negativeCount > positiveCount) return { sentiment: 'negative' };
        return { sentiment: 'neutral' };
        
      case 'entities':
        // Extract capitalized words as potential entities
        const entities = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
        return { entities: Array.from(new Set(entities)).slice(0, 5) };
        
      case 'topics':
        // Extract common nouns as topics
        const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        const topics = content.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3 && !commonWords.includes(word))
          .slice(0, 5);
        return { topics };
        
      case 'intent':
        if (content.includes('?')) return { intent: 'informational' };
        if (content.includes('buy') || content.includes('purchase')) return { intent: 'transactional' };
        if (content.includes('find') || content.includes('search')) return { intent: 'navigational' };
        return { intent: 'informational' };
        
      default:
        return { result: 'Analysis not available without Gemini Nano' };
    }
  }

  private fallbackAnswerQuestion(question: string, context?: string): string {
    if (!this.fallbackEnabled) {
      throw new Error('Gemini Nano not available and fallback disabled');
    }

    return 'I cannot answer questions without Gemini Nano. Please enable Chrome AI features or try again later.';
  }

  // Configuration methods
  public setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }

  public isFallbackEnabled(): boolean {
    return this.fallbackEnabled;
  }

  public getStatus(): {
    available: boolean;
    sessionsActive: number;
    fallbackEnabled: boolean;
  } {
    return {
      available: this.isAvailable,
      sessionsActive: this.sessions.size,
      fallbackEnabled: this.fallbackEnabled
    };
  }
}

// Singleton instance
export const geminiNano = new GeminiNanoService();

// Utility functions for common operations
export const aiUtils = {
  async summarize(text: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
    return geminiNano.summarizeText(text, { length, type: 'tl;dr' });
  },

  async explain(text: string, context?: string): Promise<string> {
    const prompt = `Explain this text in simple terms: ${text}`;
    return geminiNano.generateText(prompt, { context });
  },

  async translate(text: string, targetLanguage: string = 'en'): Promise<string> {
    return geminiNano.translateText(text, { targetLanguage });
  },

  async extractKeyPoints(text: string): Promise<string[]> {
    const result = await geminiNano.generateText(
      `Extract the key points from this text as a numbered list:\n\n${text}`
    );
    return result.split('\n').filter(line => line.trim().length > 0);
  },

  async getSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    const result = await geminiNano.analyzeContent(text, 'sentiment');
    return result.sentiment;
  },

  async getTopics(text: string): Promise<string[]> {
    const result = await geminiNano.analyzeContent(text, 'topics');
    return result.topics;
  }
};
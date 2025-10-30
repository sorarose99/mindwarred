export interface ModerationResult {
  approved: boolean;
  confidence: number;
  flags: string[];
  suggestedAction: 'approve' | 'review' | 'reject';
  explanation: string;
}

export interface ContentFilter {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
}

export class ContentModerationSystem {
  private filters: Map<string, ContentFilter> = new Map();
  private bannedWords: Set<string> = new Set();
  private suspiciousPatterns: RegExp[] = [];

  constructor() {
    this.initializeFilters();
    this.initializeBannedWords();
    this.initializeSuspiciousPatterns();
  }

  private initializeFilters(): void {
    const filters: ContentFilter[] = [
      {
        id: 'profanity',
        name: 'Profanity Filter',
        description: 'Detects and filters inappropriate language',
        enabled: true,
        severity: 'medium'
      },
      {
        id: 'spam',
        name: 'Spam Detection',
        description: 'Identifies repetitive or promotional content',
        enabled: true,
        severity: 'high'
      },
      {
        id: 'toxicity',
        name: 'Toxicity Detection',
        description: 'Detects hostile or harmful content',
        enabled: true,
        severity: 'high'
      },
      {
        id: 'off-topic',
        name: 'Off-Topic Filter',
        description: 'Identifies content unrelated to the game',
        enabled: true,
        severity: 'low'
      },
      {
        id: 'personal-info',
        name: 'Personal Information',
        description: 'Detects potential personal information sharing',
        enabled: true,
        severity: 'high'
      },
      {
        id: 'length',
        name: 'Content Length',
        description: 'Filters content that is too short or too long',
        enabled: true,
        severity: 'low'
      }
    ];

    filters.forEach(filter => {
      this.filters.set(filter.id, filter);
    });
  }

  private initializeBannedWords(): void {
    // Basic profanity filter (in production, this would be more comprehensive)
    const bannedWords = [
      'spam', 'scam', 'hack', 'cheat', 'exploit',
      'stupid', 'idiot', 'moron', 'dumb',
      // Add more as needed, but keep it reasonable for a game context
    ];

    bannedWords.forEach(word => {
      this.bannedWords.add(word.toLowerCase());
    });
  }

  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      /(.)\1{4,}/g, // Repeated characters (aaaaa)
      /[A-Z]{5,}/g, // Excessive caps
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /https?:\/\/[^\s]+/g, // URLs
      /(.{1,10})\1{3,}/g, // Repeated phrases
    ];
  }

  moderateContent(content: string, context?: { type: string; userId?: string }): ModerationResult {
    const flags: string[] = [];
    let confidence = 1.0;
    let approved = true;

    // Basic validation
    if (!content || content.trim().length === 0) {
      return {
        approved: false,
        confidence: 1.0,
        flags: ['empty-content'],
        suggestedAction: 'reject',
        explanation: 'Content cannot be empty'
      };
    }

    // Length check
    if (this.filters.get('length')?.enabled) {
      const lengthResult = this.checkContentLength(content);
      if (!lengthResult.passed) {
        flags.push('length-violation');
        confidence *= 0.8;
        if (lengthResult.severity === 'high') {
          approved = false;
        }
      }
    }

    // Profanity check
    if (this.filters.get('profanity')?.enabled) {
      const profanityResult = this.checkProfanity(content);
      if (profanityResult.detected) {
        flags.push('profanity');
        confidence *= 0.6;
        if (profanityResult.severity === 'high') {
          approved = false;
        }
      }
    }

    // Spam detection
    if (this.filters.get('spam')?.enabled) {
      const spamResult = this.checkSpam(content);
      if (spamResult.detected) {
        flags.push('spam');
        confidence *= 0.4;
        approved = false;
      }
    }

    // Toxicity detection
    if (this.filters.get('toxicity')?.enabled) {
      const toxicityResult = this.checkToxicity(content);
      if (toxicityResult.detected) {
        flags.push('toxicity');
        confidence *= 0.3;
        approved = false;
      }
    }

    // Personal information check
    if (this.filters.get('personal-info')?.enabled) {
      const personalInfoResult = this.checkPersonalInfo(content);
      if (personalInfoResult.detected) {
        flags.push('personal-info');
        confidence *= 0.2;
        approved = false;
      }
    }

    // Off-topic check (for game context)
    if (this.filters.get('off-topic')?.enabled && context?.type === 'challenge') {
      const topicResult = this.checkGameRelevance(content);
      if (!topicResult.relevant) {
        flags.push('off-topic');
        confidence *= 0.9;
      }
    }

    // Determine suggested action
    let suggestedAction: 'approve' | 'review' | 'reject';
    if (approved && confidence > 0.8) {
      suggestedAction = 'approve';
    } else if (approved && confidence > 0.5) {
      suggestedAction = 'review';
    } else {
      suggestedAction = 'reject';
    }

    return {
      approved,
      confidence,
      flags,
      suggestedAction,
      explanation: this.generateExplanation(flags, approved)
    };
  }

  private checkContentLength(content: string): { passed: boolean; severity: 'low' | 'medium' | 'high' } {
    const length = content.trim().length;
    
    if (length < 3) {
      return { passed: false, severity: 'high' };
    }
    
    if (length > 1000) {
      return { passed: false, severity: 'medium' };
    }
    
    return { passed: true, severity: 'low' };
  }

  private checkProfanity(content: string): { detected: boolean; severity: 'low' | 'medium' | 'high' } {
    const words = content.toLowerCase().split(/\s+/);
    let profanityCount = 0;
    
    words.forEach(word => {
      // Remove punctuation for checking
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.bannedWords.has(cleanWord)) {
        profanityCount++;
      }
    });

    if (profanityCount === 0) {
      return { detected: false, severity: 'low' };
    }

    const severity = profanityCount > 2 ? 'high' : profanityCount > 1 ? 'medium' : 'low';
    return { detected: true, severity };
  }

  private checkSpam(content: string): { detected: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) {
      reasons.push('repeated-characters');
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 10) {
      reasons.push('excessive-caps');
    }

    // Check for URLs
    if (/https?:\/\/[^\s]+/.test(content)) {
      reasons.push('contains-url');
    }

    // Check for repeated phrases
    if (/(.{5,})\1{2,}/.test(content)) {
      reasons.push('repeated-phrases');
    }

    return {
      detected: reasons.length > 0,
      reasons
    };
  }

  private checkToxicity(content: string): { detected: boolean; score: number } {
    // Simple toxicity detection based on patterns
    const toxicPatterns = [
      /\b(hate|kill|die|stupid|idiot|moron|dumb)\b/gi,
      /\b(shut up|go away|get lost)\b/gi,
      /[!]{3,}/g, // Excessive exclamation
    ];

    let toxicityScore = 0;
    toxicPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        toxicityScore += matches.length * 0.3;
      }
    });

    return {
      detected: toxicityScore > 0.5,
      score: Math.min(toxicityScore, 1.0)
    };
  }

  private checkPersonalInfo(content: string): { detected: boolean; types: string[] } {
    const types: string[] = [];

    // Check for phone numbers
    if (/\b\d{3}-\d{3}-\d{4}\b/.test(content)) {
      types.push('phone-number');
    }

    // Check for email addresses
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
      types.push('email-address');
    }

    // Check for potential addresses
    if (/\b\d+\s+[A-Za-z\s]+\s+(street|st|avenue|ave|road|rd|drive|dr)\b/i.test(content)) {
      types.push('address');
    }

    return {
      detected: types.length > 0,
      types
    };
  }

  private checkGameRelevance(content: string): { relevant: boolean; score: number } {
    const gameKeywords = [
      'planet', 'energy', 'community', 'battle', 'evolution', 'reddit',
      'challenge', 'puzzle', 'creative', 'strategy', 'mind', 'war',
      'thought', 'intelligence', 'transcendent', 'nascent', 'developing'
    ];

    const words = content.toLowerCase().split(/\s+/);
    let relevanceScore = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (gameKeywords.some(keyword => cleanWord.includes(keyword) || keyword.includes(cleanWord))) {
        relevanceScore += 0.1;
      }
    });

    // If content is very short, be more lenient
    if (content.length < 20) {
      relevanceScore += 0.3;
    }

    return {
      relevant: relevanceScore > 0.2,
      score: Math.min(relevanceScore, 1.0)
    };
  }

  private generateExplanation(flags: string[], approved: boolean): string {
    if (flags.length === 0) {
      return 'Content passed all moderation checks.';
    }

    const explanations: Record<string, string> = {
      'empty-content': 'Content cannot be empty.',
      'length-violation': 'Content length is outside acceptable limits.',
      'profanity': 'Content contains inappropriate language.',
      'spam': 'Content appears to be spam or repetitive.',
      'toxicity': 'Content may be hostile or harmful.',
      'personal-info': 'Content may contain personal information.',
      'off-topic': 'Content may not be relevant to the game.'
    };

    const flagExplanations = flags.map(flag => explanations[flag] || `Issue detected: ${flag}`);
    
    if (approved) {
      return `Content approved with minor issues: ${flagExplanations.join(' ')}`;
    } else {
      return `Content rejected due to: ${flagExplanations.join(' ')}`;
    }
  }

  // Auto-moderation for different content types
  moderateChallenge(answer: string, challengeType: string): ModerationResult {
    return this.moderateContent(answer, { type: 'challenge' });
  }

  moderateCreativeContent(content: string): ModerationResult {
    // More lenient for creative content
    const result = this.moderateContent(content, { type: 'creative' });
    
    // Adjust confidence for creative content
    if (result.flags.includes('off-topic')) {
      result.confidence = Math.max(result.confidence, 0.7);
      result.approved = true;
    }

    return result;
  }

  moderateCommunityMessage(message: string, userId?: string): ModerationResult {
    return this.moderateContent(message, { type: 'community', userId });
  }

  // Filter management
  enableFilter(filterId: string): boolean {
    const filter = this.filters.get(filterId);
    if (filter) {
      filter.enabled = true;
      return true;
    }
    return false;
  }

  disableFilter(filterId: string): boolean {
    const filter = this.filters.get(filterId);
    if (filter) {
      filter.enabled = false;
      return true;
    }
    return false;
  }

  getFilters(): ContentFilter[] {
    return Array.from(this.filters.values());
  }

  // Statistics and reporting
  getModerationStats(): {
    totalChecked: number;
    approved: number;
    rejected: number;
    flaggedForReview: number;
    commonFlags: Record<string, number>;
  } {
    // In a real implementation, this would track actual statistics
    return {
      totalChecked: 1250,
      approved: 1100,
      rejected: 75,
      flaggedForReview: 75,
      commonFlags: {
        'length-violation': 45,
        'profanity': 20,
        'spam': 15,
        'off-topic': 30,
        'toxicity': 10
      }
    };
  }
}

export const contentModerator = new ContentModerationSystem();
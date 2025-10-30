// Intelligent suggestion system for Kiro Web Mind

import { aiService } from './ai-service';
import type { 
  PageContext, 
  Suggestion, 
  AutomationOpportunity, 
  UserPreferences,
  ActivityRecord,
  KnowledgeNode
} from '../types';

export interface SuggestionContext {
  pageContext: PageContext;
  userPreferences?: UserPreferences;
  recentActivities?: ActivityRecord[];
  knowledgeGraph?: KnowledgeNode[];
  currentTime?: Date;
  userBehaviorPatterns?: BehaviorPattern[];
}

export interface BehaviorPattern {
  id: string;
  type: 'temporal' | 'contextual' | 'sequential';
  pattern: string;
  frequency: number;
  confidence: number;
  lastObserved: Date;
}

export interface SuggestionRule {
  id: string;
  name: string;
  condition: (context: SuggestionContext) => boolean;
  generator: (context: SuggestionContext) => Promise<Suggestion[]>;
  priority: number;
  enabled: boolean;
}

export class SuggestionEngine {
  private rules: Map<string, SuggestionRule> = new Map();
  private suggestionHistory: Map<string, Suggestion[]> = new Map();
  private userFeedback: Map<string, { rating: number; used: boolean }> = new Map();
  private learningEnabled: boolean = true;

  constructor() {
    this.initializeDefaultRules();
  }

  // Main suggestion generation method
  public async generateSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
    const allSuggestions: Suggestion[] = [];
    
    try {
      // Apply all enabled rules
      for (const rule of Array.from(this.rules.values())) {
        if (rule.enabled && rule.condition(context)) {
          try {
            const suggestions = await rule.generator(context);
            allSuggestions.push(...suggestions);
          } catch (error) {
            console.error(`Error in suggestion rule ${rule.id}:`, error);
          }
        }
      }

      // Score and rank suggestions
      const scoredSuggestions = await this.scoreSuggestions(allSuggestions, context);
      
      // Filter and deduplicate
      const filteredSuggestions = this.filterSuggestions(scoredSuggestions, context);
      
      // Learn from user patterns
      if (this.learningEnabled) {
        this.updateLearningModel(filteredSuggestions, context);
      }
      
      // Cache suggestions
      this.cacheSuggestions(context.pageContext.url, filteredSuggestions);
      
      return filteredSuggestions.slice(0, 5); // Return top 5 suggestions
      
    } catch (error) {
      console.error('Suggestion generation error:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  // Initialize default suggestion rules
  private initializeDefaultRules(): void {
    // Content summarization rule
    this.addRule({
      id: 'content_summarization',
      name: 'Content Summarization',
      condition: (context) => {
        const content = context.pageContext.content || '';
        return content.length > 1000 && 
               ['article', 'reference', 'general'].includes(context.pageContext.pageType || 'general');
      },
      generator: async (context) => {
        const content = context.pageContext.content || '';
        const readingTime = Math.ceil(content.split(/\s+/).length / 200);
        
        return [{
          id: 'summarize_content',
          title: 'Summarize this content',
          description: `Get a concise summary of this ${readingTime}-minute read`,
          action: 'summarize',
          confidence: 0.9,
          category: 'productivity',
          metadata: { 
            contentLength: content.length,
            estimatedTimeSaved: Math.max(1, readingTime - 2)
          }
        }];
      },
      priority: 10,
      enabled: true
    });

    // Text explanation rule
    this.addRule({
      id: 'text_explanation',
      name: 'Text Explanation',
      condition: (context) => {
        const selectedText = context.pageContext.selectedText || '';
        return selectedText.length > 50 && selectedText.length < 1000;
      },
      generator: async (context) => {
        const selectedText = context.pageContext.selectedText || '';
        const complexity = this.assessTextComplexity(selectedText);
        
        const suggestions: Suggestion[] = [{
          id: 'explain_selection',
          title: 'Explain selected text',
          description: `Get a ${complexity === 'high' ? 'simplified' : 'detailed'} explanation`,
          action: 'explain',
          confidence: 0.85,
          category: 'learning',
          metadata: { 
            selectionLength: selectedText.length,
            complexity
          }
        }];

        // Add translation suggestion for non-English content
        if (this.detectNonEnglishText(selectedText)) {
          suggestions.push({
            id: 'translate_selection',
            title: 'Translate selected text',
            description: 'Translate to your preferred language',
            action: 'translate',
            confidence: 0.8,
            category: 'productivity',
            metadata: { 
              detectedLanguage: this.detectLanguage(selectedText)
            }
          });
        }

        return suggestions;
      },
      priority: 9,
      enabled: true
    });

    // Form automation rule
    this.addRule({
      id: 'form_automation',
      name: 'Form Automation',
      condition: (context) => {
        const formFields = context.pageContext.formFields || [];
        return formFields.length > 0;
      },
      generator: async (context) => {
        const formFields = context.pageContext.formFields || [];
        const autoFillableFields = this.identifyAutoFillableFields(formFields);
        
        if (autoFillableFields.length === 0) return [];

        return [{
          id: 'autofill_form',
          title: `Auto-fill ${autoFillableFields.length} form fields`,
          description: 'Fill common fields with your saved information',
          action: 'automate',
          confidence: 0.8,
          category: 'productivity',
          metadata: { 
            fieldCount: autoFillableFields.length,
            fieldTypes: autoFillableFields.map(f => f.type),
            estimatedTimeSaved: autoFillableFields.length * 5 // 5 seconds per field
          }
        }];
      },
      priority: 8,
      enabled: true
    });

    // Research assistance rule
    this.addRule({
      id: 'research_assistance',
      name: 'Research Assistance',
      condition: (context) => {
        const recentActivities = context.recentActivities || [];
        const hasResearchPattern = recentActivities.some(activity => 
          activity.type === 'text_selection' || 
          activity.type === 'search_query'
        );
        
        return hasResearchPattern && 
               ['article', 'reference', 'code'].includes(context.pageContext.pageType || 'general');
      },
      generator: async (context) => {
        const suggestions: Suggestion[] = [];
        
        // Key points extraction
        suggestions.push({
          id: 'extract_key_points',
          title: 'Extract key points',
          description: 'Get the main takeaways and important facts',
          action: 'extract',
          confidence: 0.8,
          category: 'research',
          metadata: { 
            pageType: context.pageContext.pageType
          }
        });

        // Related content suggestion
        if (context.knowledgeGraph && context.knowledgeGraph.length > 0) {
          suggestions.push({
            id: 'find_related_content',
            title: 'Find related content',
            description: 'Discover similar articles and resources',
            action: 'research',
            confidence: 0.7,
            category: 'research',
            metadata: { 
              relatedTopics: context.knowledgeGraph.slice(0, 3).map(node => node.label)
            }
          });
        }

        return suggestions;
      },
      priority: 7,
      enabled: true
    });

    // Learning enhancement rule
    this.addRule({
      id: 'learning_enhancement',
      name: 'Learning Enhancement',
      condition: (context) => {
        const pageType = context.pageContext.pageType || 'general';
        const userIntent = this.inferUserIntent(context);
        
        return ['article', 'reference', 'code'].includes(pageType) && 
               ['learning', 'researching'].includes(userIntent);
      },
      generator: async (context) => {
        const suggestions: Suggestion[] = [];
        const content = context.pageContext.content || '';
        
        // Concept explanation
        if (this.containsTechnicalTerms(content)) {
          suggestions.push({
            id: 'explain_concepts',
            title: 'Explain technical concepts',
            description: 'Get simple explanations of complex terms',
            action: 'explain',
            confidence: 0.75,
            category: 'learning',
            metadata: { 
              technicalTermsCount: this.countTechnicalTerms(content)
            }
          });
        }

        // Create study notes
        if (content.length > 2000) {
          suggestions.push({
            id: 'create_study_notes',
            title: 'Create study notes',
            description: 'Generate structured notes for learning',
            action: 'save',
            confidence: 0.7,
            category: 'learning',
            metadata: { 
              contentLength: content.length
            }
          });
        }

        return suggestions;
      },
      priority: 6,
      enabled: true
    });

    // Productivity optimization rule
    this.addRule({
      id: 'productivity_optimization',
      name: 'Productivity Optimization',
      condition: (context) => {
        const userBehavior = context.userBehaviorPatterns || [];
        const hasProductivityPattern = userBehavior.some(pattern => 
          pattern.type === 'temporal' && pattern.pattern.includes('work')
        );
        
        return hasProductivityPattern || 
               ['form', 'shopping', 'work'].includes(context.pageContext.pageType || 'general');
      },
      generator: async (context) => {
        const suggestions: Suggestion[] = [];
        const pageType = context.pageContext.pageType || 'general';
        
        // Quick actions based on page type
        switch (pageType) {
          case 'shopping':
            suggestions.push({
              id: 'price_comparison',
              title: 'Compare prices',
              description: 'Find better deals and save money',
              action: 'research',
              confidence: 0.6,
              category: 'productivity',
              metadata: { 
                pageType: 'shopping'
              }
            });
            break;
            
          case 'form':
            suggestions.push({
              id: 'form_validation',
              title: 'Validate form data',
              description: 'Check for errors before submitting',
              action: 'automate',
              confidence: 0.7,
              category: 'productivity'
            });
            break;
        }

        // Time-based suggestions
        const currentHour = new Date().getHours();
        if (currentHour >= 9 && currentHour <= 17) { // Work hours
          suggestions.push({
            id: 'focus_mode',
            title: 'Enable focus mode',
            description: 'Minimize distractions for better productivity',
            action: 'automate',
            confidence: 0.5,
            category: 'productivity',
            metadata: { 
              timeOfDay: 'work_hours'
            }
          });
        }

        return suggestions;
      },
      priority: 5,
      enabled: true
    });

    // Personalization rule
    this.addRule({
      id: 'personalization',
      name: 'Personalized Suggestions',
      condition: (context) => {
        return Boolean(context.userPreferences !== undefined || 
               (context.recentActivities && context.recentActivities.length > 0));
      },
      generator: async (context) => {
        const suggestions: Suggestion[] = [];
        const preferences = context.userPreferences;
        const recentActivities = context.recentActivities || [];
        
        // Preference-based suggestions
        if (preferences?.ai.summaryLength === 'brief') {
          suggestions.push({
            id: 'quick_summary',
            title: 'Quick summary',
            description: 'Get a brief overview in 2-3 sentences',
            action: 'summarize',
            confidence: 0.8,
            category: 'productivity',
            metadata: { 
              summaryType: 'brief',
              personalizedFor: 'brief_preference'
            }
          });
        }

        // Activity pattern-based suggestions
        const frequentActions = this.analyzeFrequentActions(recentActivities);
        for (const action of frequentActions) {
          if (action.frequency > 3) { // Used more than 3 times recently
            suggestions.push({
              id: `frequent_${action.type}`,
              title: `Quick ${action.type}`,
              description: `You use this action frequently`,
              action: action.type as any,
              confidence: 0.6 + (action.frequency * 0.05),
              category: 'productivity',
              metadata: { 
                frequency: action.frequency,
                personalizedFor: 'frequent_use'
              }
            });
          }
        }

        return suggestions;
      },
      priority: 4,
      enabled: true
    });
  }

  // Score suggestions based on context and user behavior
  private async scoreSuggestions(suggestions: Suggestion[], context: SuggestionContext): Promise<Suggestion[]> {
    return suggestions.map(suggestion => {
      let score = suggestion.confidence;
      
      // Boost score based on user preferences
      if (context.userPreferences) {
        const prefBoost = this.calculatePreferenceBoost(suggestion, context.userPreferences);
        score += prefBoost;
      }
      
      // Boost score based on recent usage
      const usageBoost = this.calculateUsageBoost(suggestion, context.recentActivities || []);
      score += usageBoost;
      
      // Boost score based on time of day
      const timeBoost = this.calculateTimeBoost(suggestion, context.currentTime || new Date());
      score += timeBoost;
      
      // Apply feedback learning
      const feedbackBoost = this.calculateFeedbackBoost(suggestion);
      score += feedbackBoost;
      
      return {
        ...suggestion,
        confidence: Math.min(Math.max(score, 0), 1) // Clamp between 0 and 1
      };
    });
  }

  // Filter and deduplicate suggestions
  private filterSuggestions(suggestions: Suggestion[], context: SuggestionContext): Suggestion[] {
    // Remove duplicates by action type
    const seen = new Set<string>();
    const filtered = suggestions.filter(suggestion => {
      const key = `${suggestion.action}_${suggestion.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sort by confidence
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    // Apply user preference filters
    if (context.userPreferences?.ai.suggestionFrequency === 'low') {
      return filtered.slice(0, 2);
    } else if (context.userPreferences?.ai.suggestionFrequency === 'high') {
      return filtered.slice(0, 8);
    }
    
    return filtered.slice(0, 5);
  }

  // Helper methods for suggestion scoring
  private calculatePreferenceBoost(suggestion: Suggestion, preferences: UserPreferences): number {
    let boost = 0;
    
    // Boost based on AI settings
    if (preferences.ai.contextAwareness && suggestion.metadata?.personalizedFor) {
      boost += 0.1;
    }
    
    // Boost based on category preferences (inferred from usage)
    if (suggestion.category === 'productivity' && preferences.ai.suggestionFrequency === 'high') {
      boost += 0.05;
    }
    
    return boost;
  }

  private calculateUsageBoost(suggestion: Suggestion, recentActivities: ActivityRecord[]): number {
    const recentUsage = recentActivities.filter(activity => 
      activity.type === 'ai_interaction' && 
      activity.data.operation === suggestion.action
    ).length;
    
    return Math.min(recentUsage * 0.02, 0.1); // Max boost of 0.1
  }

  private calculateTimeBoost(suggestion: Suggestion, currentTime: Date): number {
    const hour = currentTime.getHours();
    
    // Boost productivity suggestions during work hours
    if (suggestion.category === 'productivity' && hour >= 9 && hour <= 17) {
      return 0.05;
    }
    
    // Boost learning suggestions during evening hours
    if (suggestion.category === 'learning' && hour >= 18 && hour <= 22) {
      return 0.05;
    }
    
    return 0;
  }

  private calculateFeedbackBoost(suggestion: Suggestion): number {
    const feedback = this.userFeedback.get(suggestion.id);
    if (!feedback) return 0;
    
    // Boost based on user rating and usage
    let boost = (feedback.rating - 3) * 0.02; // Rating scale 1-5, neutral is 3
    if (feedback.used) boost += 0.03;
    
    return boost;
  }

  // Automation opportunity detection
  public async detectAutomationOpportunities(context: SuggestionContext): Promise<AutomationOpportunity[]> {
    const opportunities: AutomationOpportunity[] = [];
    
    try {
      // Form automation opportunities
      const formFields = context.pageContext.formFields || [];
      if (formFields.length > 0) {
        const autoFillable = this.identifyAutoFillableFields(formFields);
        if (autoFillable.length > 0) {
          opportunities.push({
            id: 'form_autofill',
            type: 'form_fill',
            description: `Auto-fill ${autoFillable.length} common form fields`,
            confidence: 0.8,
            estimatedTimeSaved: autoFillable.length * 5,
            complexity: 'low',
            suggestedRule: {
              trigger: {
                type: 'page_load',
                conditions: [{
                  field: 'url',
                  operator: 'contains',
                  value: new URL(context.pageContext.url).hostname
                }],
                operator: 'AND'
              },
              actions: autoFillable.map(field => ({
                id: `fill_${field.name}`,
                type: 'fill_form',
                parameters: {
                  selector: `[name="${field.name}"], #${field.id}`,
                  value: `{{user.${field.name}}}`,
                  fieldType: field.type
                }
              }))
            }
          });
        }
      }

      // Navigation automation opportunities
      const recentActivities = context.recentActivities || [];
      const navigationPattern = this.detectNavigationPattern(recentActivities);
      if (navigationPattern) {
        opportunities.push({
          id: 'navigation_automation',
          type: 'navigation',
          description: 'Automate common navigation sequence',
          confidence: 0.6,
          estimatedTimeSaved: 30,
          complexity: 'medium',
          suggestedRule: navigationPattern
        });
      }

      // Content processing automation
      const hasRepeatedContentActions = this.detectRepeatedContentActions(recentActivities);
      if (hasRepeatedContentActions) {
        opportunities.push({
          id: 'content_processing',
          type: 'data_extraction',
          description: 'Automatically process similar content',
          confidence: 0.7,
          estimatedTimeSaved: 60,
          complexity: 'medium'
        });
      }

      return opportunities.sort((a, b) => b.confidence - a.confidence);
      
    } catch (error) {
      console.error('Automation opportunity detection error:', error);
      return [];
    }
  }

  // Learning and adaptation methods
  public recordSuggestionFeedback(suggestionId: string, rating: number, used: boolean): void {
    this.userFeedback.set(suggestionId, { rating, used });
    
    // Update learning model based on feedback
    if (this.learningEnabled) {
      this.updateLearningFromFeedback(suggestionId, rating, used);
    }
  }

  private updateLearningModel(suggestions: Suggestion[], context: SuggestionContext): void {
    // Store suggestion patterns for learning
    const patterns = {
      pageType: context.pageContext.pageType,
      timeOfDay: new Date().getHours(),
      suggestions: suggestions.map(s => ({ id: s.id, action: s.action, confidence: s.confidence }))
    };
    
    // This would typically update a machine learning model
    // For now, we'll store patterns for future analysis
    console.log('Learning from suggestion patterns:', patterns);
  }

  private updateLearningFromFeedback(suggestionId: string, rating: number, used: boolean): void {
    // Adjust rule priorities based on feedback
    for (const rule of Array.from(this.rules.values())) {
      // This is a simplified learning mechanism
      // In production, this would use more sophisticated ML techniques
      if (rating > 3 && used) {
        rule.priority += 0.1;
      } else if (rating < 3) {
        rule.priority -= 0.1;
      }
    }
  }

  // Utility methods
  private assessTextComplexity(text: string): 'low' | 'medium' | 'high' {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence > 20) return 'high';
    if (avgWordsPerSentence > 12) return 'medium';
    return 'low';
  }

  private detectNonEnglishText(text: string): boolean {
    // Simple heuristic - check for non-ASCII characters
    return /[^\x00-\x7F]/.test(text);
  }

  private detectLanguage(text: string): string {
    // Simplified language detection
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text)) return 'romance';
    if (/[αβγδεζηθικλμνξοπρστυφχψω]/.test(text)) return 'greek';
    if (/[а-я]/.test(text)) return 'cyrillic';
    if (/[一-龯]/.test(text)) return 'chinese';
    if (/[ひらがなカタカナ]/.test(text)) return 'japanese';
    return 'unknown';
  }

  private identifyAutoFillableFields(formFields: any[]): any[] {
    const autoFillableTypes = ['name', 'email', 'phone', 'address', 'city', 'zip', 'country'];
    return formFields.filter(field => 
      autoFillableTypes.some(type => 
        field.name?.toLowerCase().includes(type) || 
        field.label?.toLowerCase().includes(type) ||
        field.placeholder?.toLowerCase().includes(type)
      )
    );
  }

  private inferUserIntent(context: SuggestionContext): string {
    const recentActivities = context.recentActivities || [];
    const pageType = context.pageContext.pageType || 'general';
    
    // Analyze recent activities to infer intent
    const hasTextSelection = recentActivities.some(a => a.type === 'text_selection');
    const hasFormInteraction = recentActivities.some(a => a.type === 'form_interaction');
    const hasSearchQuery = recentActivities.some(a => a.type === 'search_query');
    
    if (hasTextSelection && ['article', 'reference'].includes(pageType)) return 'researching';
    if (hasFormInteraction) return 'filling_form';
    if (hasSearchQuery) return 'searching';
    if (pageType === 'video') return 'entertainment';
    if (pageType === 'shopping') return 'shopping';
    
    return 'browsing';
  }

  private containsTechnicalTerms(content: string): boolean {
    const technicalPatterns = [
      /\b(API|SDK|HTTP|JSON|XML|SQL|CSS|HTML|JavaScript|Python|Java|React|Angular|Vue)\b/gi,
      /\b(algorithm|function|variable|parameter|array|object|class|method)\b/gi,
      /\b(database|server|client|framework|library|module|component)\b/gi
    ];
    
    return technicalPatterns.some(pattern => pattern.test(content));
  }

  private countTechnicalTerms(content: string): number {
    const technicalPattern = /\b(API|SDK|HTTP|JSON|XML|SQL|CSS|HTML|JavaScript|Python|Java|React|Angular|Vue|algorithm|function|variable|parameter|array|object|class|method|database|server|client|framework|library|module|component)\b/gi;
    const matches = content.match(technicalPattern);
    return matches ? matches.length : 0;
  }

  private analyzeFrequentActions(activities: ActivityRecord[]): Array<{ type: string; frequency: number }> {
    const actionCounts = new Map<string, number>();
    
    activities.forEach(activity => {
      if (activity.type === 'ai_interaction') {
        const operation = activity.data.operation;
        actionCounts.set(operation, (actionCounts.get(operation) || 0) + 1);
      }
    });
    
    return Array.from(actionCounts.entries()).map(([type, frequency]) => ({ type, frequency }));
  }

  private detectNavigationPattern(activities: ActivityRecord[]): any | null {
    // Simplified navigation pattern detection
    const pageVisits = activities.filter(a => a.type === 'page_visit');
    if (pageVisits.length < 3) return null;
    
    // Look for repeated URL patterns
    const urlPattern = pageVisits.slice(-3).map(visit => new URL(visit.data.url).pathname);
    const hasPattern = urlPattern.every((path, index) => 
      index === 0 || path === urlPattern[index - 1]
    );
    
    return hasPattern ? {
      trigger: { type: 'page_load', conditions: [], operator: 'AND' },
      actions: [{ id: 'navigate', type: 'navigate', parameters: { url: urlPattern[0] } }]
    } : null;
  }

  private detectRepeatedContentActions(activities: ActivityRecord[]): boolean {
    const contentActions = activities.filter(a => 
      a.type === 'ai_interaction' && 
      ['summarize', 'extract', 'analyze'].includes(a.data.operation)
    );
    
    return contentActions.length >= 3;
  }

  private getFallbackSuggestions(context: SuggestionContext): Suggestion[] {
    return [
      {
        id: 'fallback_summarize',
        title: 'Summarize content',
        description: 'Get a quick summary of this page',
        action: 'summarize',
        confidence: 0.5,
        category: 'productivity'
      }
    ];
  }

  private cacheSuggestions(url: string, suggestions: Suggestion[]): void {
    this.suggestionHistory.set(url, suggestions);
    
    // Keep only last 100 entries
    if (this.suggestionHistory.size > 100) {
      const firstKey = this.suggestionHistory.keys().next().value;
      if (firstKey !== undefined) {
        this.suggestionHistory.delete(firstKey);
      }
    }
  }

  // Public API methods
  public addRule(rule: SuggestionRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  public enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) rule.enabled = true;
  }

  public disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) rule.enabled = false;
  }

  public setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
  }

  public getSuggestionHistory(url: string): Suggestion[] | undefined {
    return this.suggestionHistory.get(url);
  }

  public getStatus(): {
    rulesCount: number;
    enabledRulesCount: number;
    suggestionHistorySize: number;
    feedbackCount: number;
    learningEnabled: boolean;
  } {
    return {
      rulesCount: this.rules.size,
      enabledRulesCount: Array.from(this.rules.values()).filter(r => r.enabled).length,
      suggestionHistorySize: this.suggestionHistory.size,
      feedbackCount: this.userFeedback.size,
      learningEnabled: this.learningEnabled
    };
  }
}

// Export singleton instance
export const suggestionEngine = new SuggestionEngine();
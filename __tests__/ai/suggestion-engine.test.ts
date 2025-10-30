// Unit tests for Suggestion Engine

import { SuggestionEngine, suggestionEngine } from '../../lib/ai/suggestion-engine';
import type { SuggestionContext, PageContext, UserPreferences, ActivityRecord } from '../../lib/types';

describe('SuggestionEngine', () => {
  let engine: SuggestionEngine;
  let mockContext: SuggestionContext;

  beforeEach(() => {
    engine = new SuggestionEngine();
    
    mockContext = {
      pageContext: {
        url: 'https://example.com/article',
        title: 'Test Article',
        content: 'This is test content for the article. '.repeat(50),
        pageType: 'article',
        timestamp: Date.now()
      },
      userPreferences: {
        privacy: {
          dataCollection: 'standard',
          cloudSync: true,
          voiceData: false,
          activityTracking: true,
          crossSiteTracking: false,
          dataRetentionDays: 365
        },
        ui: {
          theme: 'dark',
          sidebarPosition: 'right',
          animationsEnabled: true,
          compactMode: false,
          fontSize: 'medium',
          language: 'en'
        },
        ai: {
          summaryLength: 'brief',
          suggestionFrequency: 'medium',
          voiceEnabled: false,
          autoSummarize: true,
          contextAwareness: true,
          learningEnabled: true
        },
        notifications: {
          browserNotifications: true,
          emailDigest: false,
          insightAlerts: true,
          automationUpdates: true,
          securityAlerts: true
        }
      },
      recentActivities: [],
      currentTime: new Date()
    };
  });

  describe('Initialization', () => {
    test('should initialize with default rules', () => {
      const status = engine.getStatus();
      
      expect(status.rulesCount).toBeGreaterThan(0);
      expect(status.enabledRulesCount).toBeGreaterThan(0);
      expect(status.learningEnabled).toBe(true);
    });

    test('should have content summarization rule', async () => {
      const suggestions = await engine.generateSuggestions(mockContext);
      
      const summarizeSuggestion = suggestions.find(s => s.id === 'summarize_content');
      expect(summarizeSuggestion).toBeDefined();
      expect(summarizeSuggestion?.action).toBe('summarize');
    });
  });

  describe('Content-Based Suggestions', () => {
    test('should suggest summarization for long content', async () => {
      const longContentContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          content: 'This is a very long article content. '.repeat(200)
        }
      };
      
      const suggestions = await engine.generateSuggestions(longContentContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'summarize_content',
          action: 'summarize',
          category: 'productivity'
        })
      );
    });

    test('should not suggest summarization for short content', async () => {
      const shortContentContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          content: 'Short content.'
        }
      };
      
      const suggestions = await engine.generateSuggestions(shortContentContext);
      
      const summarizeSuggestion = suggestions.find(s => s.id === 'summarize_content');
      expect(summarizeSuggestion).toBeUndefined();
    });

    test('should suggest explanation for selected text', async () => {
      const selectionContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          selectedText: 'This is a complex technical concept that needs detailed explanation for better understanding.'
        }
      };
      
      const suggestions = await engine.generateSuggestions(selectionContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'explain_selection',
          action: 'explain',
          category: 'learning'
        })
      );
    });

    test('should suggest translation for non-English text', async () => {
      const nonEnglishContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          selectedText: 'Bonjour, comment allez-vous? Ceci est un texte en français qui nécessite une traduction.'
        }
      };
      
      const suggestions = await engine.generateSuggestions(nonEnglishContext);
      
      const translateSuggestion = suggestions.find(s => s.id === 'translate_selection');
      expect(translateSuggestion).toBeDefined();
      expect(translateSuggestion?.action).toBe('translate');
    });
  });

  describe('Form-Based Suggestions', () => {
    test('should suggest form autofill for common fields', async () => {
      const formContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          formFields: [
            { name: 'name', type: 'text', label: 'Full Name', id: 'name' },
            { name: 'email', type: 'email', label: 'Email Address', id: 'email' },
            { name: 'phone', type: 'tel', label: 'Phone Number', id: 'phone' }
          ]
        }
      };
      
      const suggestions = await engine.generateSuggestions(formContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'autofill_form',
          action: 'automate',
          category: 'productivity'
        })
      );
    });

    test('should not suggest autofill for uncommon fields', async () => {
      const formContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          formFields: [
            { name: 'custom_field_1', type: 'text', label: 'Custom Field', id: 'custom1' },
            { name: 'special_code', type: 'text', label: 'Special Code', id: 'code' }
          ]
        }
      };
      
      const suggestions = await engine.generateSuggestions(formContext);
      
      const autofillSuggestion = suggestions.find(s => s.id === 'autofill_form');
      expect(autofillSuggestion).toBeUndefined();
    });
  });

  describe('Research-Based Suggestions', () => {
    test('should suggest research assistance for research patterns', async () => {
      const researchContext = {
        ...mockContext,
        recentActivities: [
          {
            id: '1',
            userId: 'user1',
            timestamp: new Date(),
            type: 'text_selection',
            data: { selectedText: 'research topic' },
            context: {} as any
          },
          {
            id: '2',
            userId: 'user1',
            timestamp: new Date(),
            type: 'search_query',
            data: { query: 'machine learning' },
            context: {} as any
          }
        ] as ActivityRecord[]
      };
      
      const suggestions = await engine.generateSuggestions(researchContext);
      
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          id: 'extract_key_points',
          action: 'extract',
          category: 'research'
        })
      );
    });

    test('should suggest related content with knowledge graph', async () => {
      const knowledgeContext = {
        ...mockContext,
        recentActivities: [
          {
            id: '1',
            userId: 'user1',
            timestamp: new Date(),
            type: 'text_selection',
            data: {},
            context: {} as any
          }
        ] as ActivityRecord[],
        knowledgeGraph: [
          {
            id: '1',
            label: 'Machine Learning',
            type: 'topic',
            connections: [],
            strength: 0.8,
            confidence: 0.9,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              frequency: 5,
              lastAccessed: new Date(),
              importance: 0.8,
              source: 'browsing_history',
              verified: true
            }
          }
        ]
      };
      
      const suggestions = await engine.generateSuggestions(knowledgeContext);
      
      const relatedSuggestion = suggestions.find(s => s.id === 'find_related_content');
      expect(relatedSuggestion).toBeDefined();
    });
  });

  describe('Learning Enhancement Suggestions', () => {
    test('should suggest concept explanation for technical content', async () => {
      const technicalContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          content: 'This article discusses API endpoints, JSON responses, HTTP methods, and database queries in detail.',
          pageType: 'article' as const
        }
      };
      
      const suggestions = await engine.generateSuggestions(technicalContext);
      
      const explainSuggestion = suggestions.find(s => s.id === 'explain_concepts');
      expect(explainSuggestion).toBeDefined();
      expect(explainSuggestion?.category).toBe('learning');
    });

    test('should suggest study notes for long educational content', async () => {
      const educationalContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          content: 'Educational content about machine learning algorithms. '.repeat(300),
          pageType: 'article' as const
        }
      };
      
      const suggestions = await engine.generateSuggestions(educationalContext);
      
      const notesSuggestion = suggestions.find(s => s.id === 'create_study_notes');
      expect(notesSuggestion).toBeDefined();
    });
  });

  describe('Personalized Suggestions', () => {
    test('should suggest brief summaries for brief preference', async () => {
      const briefPreferenceContext = {
        ...mockContext,
        userPreferences: {
          ...mockContext.userPreferences!,
          ai: {
            ...mockContext.userPreferences!.ai,
            summaryLength: 'brief'
          }
        }
      };
      
      const suggestions = await engine.generateSuggestions(briefPreferenceContext);
      
      const quickSummary = suggestions.find(s => s.id === 'quick_summary');
      expect(quickSummary).toBeDefined();
      expect(quickSummary?.metadata?.summaryType).toBe('brief');
    });

    test('should suggest frequent actions based on usage patterns', async () => {
      const frequentUsageContext = {
        ...mockContext,
        recentActivities: Array(5).fill(0).map((_, i) => ({
          id: `${i}`,
          userId: 'user1',
          timestamp: new Date(),
          type: 'ai_interaction',
          data: { operation: 'summarize' },
          context: {} as any
        })) as ActivityRecord[]
      };
      
      const suggestions = await engine.generateSuggestions(frequentUsageContext);
      
      const frequentSuggestion = suggestions.find(s => s.id === 'frequent_summarize');
      expect(frequentSuggestion).toBeDefined();
    });
  });

  describe('Suggestion Scoring and Filtering', () => {
    test('should score suggestions based on confidence', async () => {
      const suggestions = await engine.generateSuggestions(mockContext);
      
      // Suggestions should be sorted by confidence (descending)
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });

    test('should limit suggestions based on user preference', async () => {
      const lowFrequencyContext = {
        ...mockContext,
        userPreferences: {
          ...mockContext.userPreferences!,
          ai: {
            ...mockContext.userPreferences!.ai,
            suggestionFrequency: 'low'
          }
        }
      };
      
      const suggestions = await engine.generateSuggestions(lowFrequencyContext);
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    test('should allow more suggestions for high frequency preference', async () => {
      const highFrequencyContext = {
        ...mockContext,
        userPreferences: {
          ...mockContext.userPreferences!,
          ai: {
            ...mockContext.userPreferences!.ai,
            suggestionFrequency: 'high'
          }
        }
      };
      
      const suggestions = await engine.generateSuggestions(highFrequencyContext);
      
      expect(suggestions.length).toBeGreaterThan(2);
    });

    test('should deduplicate similar suggestions', async () => {
      const suggestions = await engine.generateSuggestions(mockContext);
      
      const actionTypes = suggestions.map(s => `${s.action}_${s.category}`);
      const uniqueActionTypes = Array.from(new Set(actionTypes));
      
      expect(actionTypes.length).toBe(uniqueActionTypes.length);
    });
  });

  describe('Automation Opportunity Detection', () => {
    test('should detect form autofill opportunities', async () => {
      const formContext = {
        ...mockContext,
        pageContext: {
          ...mockContext.pageContext,
          formFields: [
            { name: 'name', type: 'text', label: 'Name', id: 'name' },
            { name: 'email', type: 'email', label: 'Email', id: 'email' }
          ]
        }
      };
      
      const opportunities = await engine.detectAutomationOpportunities(formContext);
      
      expect(opportunities).toContainEqual(
        expect.objectContaining({
          id: 'form_autofill',
          type: 'form_fill',
          complexity: 'low'
        })
      );
    });

    test('should detect navigation automation opportunities', async () => {
      const navigationContext = {
        ...mockContext,
        recentActivities: Array(3).fill(0).map((_, i) => ({
          id: `${i}`,
          userId: 'user1',
          timestamp: new Date(),
          type: 'page_visit',
          data: { url: 'https://example.com/same-path' },
          context: {} as any
        })) as ActivityRecord[]
      };
      
      const opportunities = await engine.detectAutomationOpportunities(navigationContext);
      
      const navOpportunity = opportunities.find(o => o.id === 'navigation_automation');
      expect(navOpportunity).toBeDefined();
    });

    test('should detect content processing automation', async () => {
      const contentProcessingContext = {
        ...mockContext,
        recentActivities: Array(4).fill(0).map((_, i) => ({
          id: `${i}`,
          userId: 'user1',
          timestamp: new Date(),
          type: 'ai_interaction',
          data: { operation: 'summarize' },
          context: {} as any
        })) as ActivityRecord[]
      };
      
      const opportunities = await engine.detectAutomationOpportunities(contentProcessingContext);
      
      const contentOpportunity = opportunities.find(o => o.id === 'content_processing');
      expect(contentOpportunity).toBeDefined();
    });
  });

  describe('Learning and Feedback', () => {
    test('should record suggestion feedback', () => {
      engine.recordSuggestionFeedback('test_suggestion', 5, true);
      
      // Feedback should be stored (private method, so we test indirectly)
      expect(() => engine.recordSuggestionFeedback('test_suggestion', 5, true)).not.toThrow();
    });

    test('should adjust suggestions based on feedback', async () => {
      // Record positive feedback
      engine.recordSuggestionFeedback('summarize_content', 5, true);
      
      const suggestions = await engine.generateSuggestions(mockContext);
      
      // The suggestion with positive feedback should have higher confidence
      const summarizeSuggestion = suggestions.find(s => s.id === 'summarize_content');
      expect(summarizeSuggestion?.confidence).toBeGreaterThan(0.8);
    });

    test('should enable/disable learning', () => {
      engine.setLearningEnabled(false);
      expect(engine.getStatus().learningEnabled).toBe(false);
      
      engine.setLearningEnabled(true);
      expect(engine.getStatus().learningEnabled).toBe(true);
    });
  });

  describe('Rule Management', () => {
    test('should add custom rules', () => {
      const customRule = {
        id: 'custom_rule',
        name: 'Custom Rule',
        condition: () => true,
        generator: async () => [{
          id: 'custom_suggestion',
          title: 'Custom Suggestion',
          description: 'Custom description',
          action: 'summarize' as const,
          confidence: 0.8,
          category: 'productivity' as const
        }],
        priority: 5,
        enabled: true
      };
      
      engine.addRule(customRule);
      
      const status = engine.getStatus();
      expect(status.rulesCount).toBeGreaterThan(0);
    });

    test('should remove rules', () => {
      const initialCount = engine.getStatus().rulesCount;
      
      engine.removeRule('content_summarization');
      
      const newCount = engine.getStatus().rulesCount;
      expect(newCount).toBe(initialCount - 1);
    });

    test('should enable/disable rules', () => {
      engine.disableRule('content_summarization');
      
      const status = engine.getStatus();
      expect(status.enabledRulesCount).toBeLessThan(status.rulesCount);
      
      engine.enableRule('content_summarization');
      
      const newStatus = engine.getStatus();
      expect(newStatus.enabledRulesCount).toBe(newStatus.rulesCount);
    });
  });

  describe('Suggestion History', () => {
    test('should cache suggestions by URL', async () => {
      const suggestions = await engine.generateSuggestions(mockContext);
      
      const cached = engine.getSuggestionHistory(mockContext.pageContext.url);
      expect(cached).toEqual(suggestions);
    });

    test('should limit suggestion history size', async () => {
      // Generate suggestions for many URLs
      for (let i = 0; i < 150; i++) {
        const context = {
          ...mockContext,
          pageContext: {
            ...mockContext.pageContext,
            url: `https://example.com/page${i}`
          }
        };
        await engine.generateSuggestions(context);
      }
      
      const status = engine.getStatus();
      expect(status.suggestionHistorySize).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle rule execution errors gracefully', async () => {
      const errorRule = {
        id: 'error_rule',
        name: 'Error Rule',
        condition: () => true,
        generator: async () => {
          throw new Error('Rule execution failed');
        },
        priority: 10,
        enabled: true
      };
      
      engine.addRule(errorRule);
      
      const suggestions = await engine.generateSuggestions(mockContext);
      
      // Should still return other suggestions despite the error
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should provide fallback suggestions on complete failure', async () => {
      // Create a context that might cause issues
      const problematicContext = {
        pageContext: {
          url: '',
          title: '',
          pageType: 'general' as const,
          timestamp: Date.now()
        }
      };
      
      const suggestions = await engine.generateSuggestions(problematicContext);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Status and Monitoring', () => {
    test('should provide comprehensive status', () => {
      const status = engine.getStatus();
      
      expect(status).toHaveProperty('rulesCount');
      expect(status).toHaveProperty('enabledRulesCount');
      expect(status).toHaveProperty('suggestionHistorySize');
      expect(status).toHaveProperty('feedbackCount');
      expect(status).toHaveProperty('learningEnabled');
      
      expect(typeof status.rulesCount).toBe('number');
      expect(typeof status.enabledRulesCount).toBe('number');
      expect(typeof status.suggestionHistorySize).toBe('number');
      expect(typeof status.feedbackCount).toBe('number');
      expect(typeof status.learningEnabled).toBe('boolean');
    });
  });

  describe('Singleton Instance', () => {
    test('should provide singleton instance', () => {
      expect(suggestionEngine).toBeInstanceOf(SuggestionEngine);
    });
  });
});
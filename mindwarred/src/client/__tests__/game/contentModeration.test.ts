import { contentModerator } from '../../game/contentModeration';

describe('Content Moderation System', () => {
  describe('Basic Content Validation', () => {
    test('should approve clean content', () => {
      const result = contentModerator.moderateContent('This is a great game!');
      
      expect(result.approved).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.flags).toHaveLength(0);
      expect(result.suggestedAction).toBe('approve');
    });

    test('should reject empty content', () => {
      const result = contentModerator.moderateContent('');
      
      expect(result.approved).toBe(false);
      expect(result.confidence).toBe(1.0);
      expect(result.flags).toContain('empty-content');
      expect(result.suggestedAction).toBe('reject');
    });

    test('should reject very short content', () => {
      const result = contentModerator.moderateContent('hi');
      
      expect(result.approved).toBe(false);
      expect(result.flags).toContain('length-violation');
    });

    test('should flag very long content', () => {
      const longContent = 'a'.repeat(1001);
      const result = contentModerator.moderateContent(longContent);
      
      expect(result.flags).toContain('length-violation');
    });
  });

  describe('Profanity Detection', () => {
    test('should detect basic profanity', () => {
      const result = contentModerator.moderateContent('This is stupid and dumb');
      
      expect(result.flags).toContain('profanity');
      expect(result.confidence).toBeLessThan(0.8);
    });

    test('should handle clean content with similar words', () => {
      const result = contentModerator.moderateContent('This is a smart solution');
      
      expect(result.flags).not.toContain('profanity');
      expect(result.approved).toBe(true);
    });
  });

  describe('Spam Detection', () => {
    test('should detect repeated characters', () => {
      const result = contentModerator.moderateContent('Hellooooooo everyone!');
      
      expect(result.flags).toContain('spam');
      expect(result.approved).toBe(false);
    });

    test('should detect excessive caps', () => {
      const result = contentModerator.moderateContent('THIS IS ALL CAPS AND ANNOYING');
      
      expect(result.flags).toContain('spam');
    });

    test('should detect URLs', () => {
      const result = contentModerator.moderateContent('Check out https://example.com for more info');
      
      expect(result.flags).toContain('spam');
    });

    test('should allow normal text with some caps', () => {
      const result = contentModerator.moderateContent('This is GREAT content!');
      
      expect(result.flags).not.toContain('spam');
    });
  });

  describe('Personal Information Detection', () => {
    test('should detect phone numbers', () => {
      const result = contentModerator.moderateContent('Call me at 555-123-4567');
      
      expect(result.flags).toContain('personal-info');
      expect(result.approved).toBe(false);
    });

    test('should detect email addresses', () => {
      const result = contentModerator.moderateContent('Contact me at user@example.com');
      
      expect(result.flags).toContain('personal-info');
      expect(result.approved).toBe(false);
    });

    test('should allow content without personal info', () => {
      const result = contentModerator.moderateContent('This is just regular game content');
      
      expect(result.flags).not.toContain('personal-info');
    });
  });

  describe('Toxicity Detection', () => {
    test('should detect toxic language', () => {
      const result = contentModerator.moderateContent('I hate this stupid game!!!');
      
      expect(result.flags).toContain('toxicity');
      expect(result.approved).toBe(false);
    });

    test('should allow passionate but not toxic content', () => {
      const result = contentModerator.moderateContent('I love this amazing game!');
      
      expect(result.flags).not.toContain('toxicity');
      expect(result.approved).toBe(true);
    });
  });

  describe('Game Relevance Detection', () => {
    test('should detect game-relevant content', () => {
      const result = contentModerator.moderateContent('This planet evolution system is amazing!', { type: 'challenge' });
      
      expect(result.flags).not.toContain('off-topic');
    });

    test('should flag completely off-topic content', () => {
      const result = contentModerator.moderateContent('I had pizza for lunch today', { type: 'challenge' });
      
      expect(result.flags).toContain('off-topic');
    });

    test('should be lenient with short content', () => {
      const result = contentModerator.moderateContent('Great!', { type: 'challenge' });
      
      expect(result.flags).not.toContain('off-topic');
    });
  });

  describe('Challenge-Specific Moderation', () => {
    test('should moderate challenge answers appropriately', () => {
      const result = contentModerator.moderateChallenge('The answer is 42', 'puzzle');
      
      expect(result.approved).toBe(true);
      expect(result.flags).not.toContain('off-topic');
    });

    test('should be more lenient with creative content', () => {
      const result = contentModerator.moderateCreativeContent('Once upon a time in a magical land far away...');
      
      expect(result.approved).toBe(true);
      // Even if flagged as off-topic, creative content should be approved
      if (result.flags.includes('off-topic')) {
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      }
    });
  });

  describe('Filter Management', () => {
    test('should enable and disable filters', () => {
      const initialFilters = contentModerator.getFilters();
      const profanityFilter = initialFilters.find(f => f.id === 'profanity');
      
      expect(profanityFilter?.enabled).toBe(true);
      
      contentModerator.disableFilter('profanity');
      const updatedFilters = contentModerator.getFilters();
      const disabledFilter = updatedFilters.find(f => f.id === 'profanity');
      
      expect(disabledFilter?.enabled).toBe(false);
      
      contentModerator.enableFilter('profanity');
      const reenabledFilters = contentModerator.getFilters();
      const reenabledFilter = reenabledFilters.find(f => f.id === 'profanity');
      
      expect(reenabledFilter?.enabled).toBe(true);
    });
  });

  describe('Statistics and Reporting', () => {
    test('should provide moderation statistics', () => {
      const stats = contentModerator.getModerationStats();
      
      expect(stats.totalChecked).toBeGreaterThan(0);
      expect(stats.approved).toBeGreaterThan(0);
      expect(stats.rejected).toBeGreaterThanOrEqual(0);
      expect(stats.flaggedForReview).toBeGreaterThanOrEqual(0);
      expect(typeof stats.commonFlags).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined input', () => {
      const nullResult = contentModerator.moderateContent(null as any);
      const undefinedResult = contentModerator.moderateContent(undefined as any);
      
      expect(nullResult.approved).toBe(false);
      expect(undefinedResult.approved).toBe(false);
    });

    test('should handle special characters', () => {
      const result = contentModerator.moderateContent('This has émojis 🎮 and spëcial chars!');
      
      expect(result.approved).toBe(true);
    });

    test('should handle mixed language content', () => {
      const result = contentModerator.moderateContent('This is English and también español');
      
      expect(result.approved).toBe(true);
    });
  });
});
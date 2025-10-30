/**
 * Integration tests for the complete game flow
 * Tests the interaction between different game systems
 */

import { challengeGenerator } from '../../game/challenges';
import { getEvolutionStage } from '../../game/evolution';
import { contentModerator } from '../../game/contentModeration';
import { performanceMonitor } from '../../game/performanceMonitor';

describe('Game Flow Integration', () => {
  describe('Challenge to Evolution Flow', () => {
    test('should progress planet evolution through challenges', () => {
      // Start with a nascent planet
      let planetEnergy = 100;
      expect(getEvolutionStage(planetEnergy)).toBe(0); // NASCENT
      
      // Complete several challenges
      for (let i = 0; i < 10; i++) {
        const challenge = challengeGenerator.generateChallenge();
        const result = challengeGenerator.evaluateChallenge(challenge, challenge.content.correctAnswer || 'good answer');
        
        if (result.success) {
          planetEnergy += result.energyAwarded;
        }
      }
      
      // Should have progressed
      expect(planetEnergy).toBeGreaterThan(100);
      
      // Continue until evolution
      while (getEvolutionStage(planetEnergy) === 0) {
        const challenge = challengeGenerator.generateChallenge();
        const result = challengeGenerator.evaluateChallenge(challenge, challenge.content.correctAnswer || 'excellent creative response that meets all requirements and demonstrates deep understanding');
        planetEnergy += result.energyAwarded;
      }
      
      expect(getEvolutionStage(planetEnergy)).toBeGreaterThan(0);
    });
  });

  describe('Content Moderation in Challenges', () => {
    test('should moderate challenge responses appropriately', () => {
      const challenge = challengeGenerator.generateChallenge();
      
      // Test clean response
      const cleanResponse = 'This is a thoughtful and appropriate response';
      const cleanModeration = contentModerator.moderateChallenge(cleanResponse, challenge.type);
      expect(cleanModeration.approved).toBe(true);
      
      // Test inappropriate response
      const inappropriateResponse = 'This is stupid spam spam spam';
      const badModeration = contentModerator.moderateChallenge(inappropriateResponse, challenge.type);
      expect(badModeration.approved).toBe(false);
      
      // Only evaluate clean responses
      if (cleanModeration.approved) {
        const result = challengeGenerator.evaluateChallenge(challenge, cleanResponse);
        expect(result).toBeDefined();
      }
    });

    test('should handle creative content with appropriate leniency', () => {
      const creativeResponse = 'Once upon a time in a magical kingdom far away from our world...';
      
      // Creative content should be more lenient
      const moderationResult = contentModerator.moderateCreativeContent(creativeResponse);
      expect(moderationResult.approved).toBe(true);
      
      // Even if flagged as off-topic, should still be approved for creative challenges
      if (moderationResult.flags.includes('off-topic')) {
        expect(moderationResult.confidence).toBeGreaterThanOrEqual(0.7);
      }
    });
  });

  describe('Performance Impact of Game Systems', () => {
    test('should maintain performance with multiple game systems active', () => {
      const initialMetrics = performanceMonitor.getMetrics();
      
      // Simulate game activity
      for (let i = 0; i < 5; i++) {
        // Generate challenges
        const challenge = challengeGenerator.generateChallenge();
        
        // Moderate content
        const response = `Response ${i} with some content`;
        contentModerator.moderateContent(response);
        
        // Evaluate challenge
        challengeGenerator.evaluateChallenge(challenge, response);
        
        // Update performance metrics
        performanceMonitor.updateRenderMetrics(1000 * (i + 1), 10 + i, 16.67);
      }
      
      const finalMetrics = performanceMonitor.getMetrics();
      
      // Performance should still be reasonable
      expect(finalMetrics.triangleCount).toBeLessThan(100000);
      expect(finalMetrics.drawCalls).toBeLessThan(100);
      
      // Should not generate critical warnings
      const warnings = performanceMonitor.getPerformanceWarnings();
      const criticalWarnings = warnings.filter(w => w.includes('critical') || w.includes('severe'));
      expect(criticalWarnings.length).toBe(0);
    });
  });

  describe('System Interaction Edge Cases', () => {
    test('should handle rapid challenge generation and evaluation', () => {
      const results = [];
      
      // Generate and evaluate many challenges rapidly
      for (let i = 0; i < 20; i++) {
        const challenge = challengeGenerator.generateChallenge();
        const response = `Test response ${i}`;
        
        // Moderate first
        const moderation = contentModerator.moderateContent(response);
        
        if (moderation.approved) {
          const result = challengeGenerator.evaluateChallenge(challenge, response);
          results.push(result);
        }
      }
      
      // Should have processed multiple challenges
      expect(results.length).toBeGreaterThan(0);
      
      // All results should be valid
      results.forEach(result => {
        expect(result.success).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.energyAwarded).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle evolution stage changes during gameplay', () => {
      let energy = 450; // Near evolution threshold
      
      // Should be nascent
      expect(getEvolutionStage(energy)).toBe(0);
      
      // Add energy to trigger evolution
      energy += 100;
      
      // Should now be developing
      expect(getEvolutionStage(energy)).toBe(1);
      
      // Continue to next evolution
      energy += 600;
      expect(getEvolutionStage(energy)).toBe(2); // THRIVING
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid challenge responses gracefully', () => {
      const challenge = challengeGenerator.generateChallenge();
      
      // Test various invalid inputs
      const invalidInputs = [null, undefined, '', '   ', 123, {}, []];
      
      invalidInputs.forEach(input => {
        expect(() => {
          challengeGenerator.evaluateChallenge(challenge, input as any);
        }).not.toThrow();
      });
    });

    test('should handle content moderation failures gracefully', () => {
      const invalidInputs = [null, undefined, {}, [], 123];
      
      invalidInputs.forEach(input => {
        expect(() => {
          contentModerator.moderateContent(input as any);
        }).not.toThrow();
      });
    });

    test('should handle performance monitoring edge cases', () => {
      // Test with extreme values
      expect(() => {
        performanceMonitor.updateRenderMetrics(-1, -1, -1);
      }).not.toThrow();
      
      expect(() => {
        performanceMonitor.updateRenderMetrics(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      }).not.toThrow();
      
      expect(() => {
        performanceMonitor.updateCanvasSize(0, 0);
      }).not.toThrow();
    });
  });

  describe('Data Consistency', () => {
    test('should maintain consistent state across systems', () => {
      // Generate a challenge
      const challenge = challengeGenerator.generateChallenge();
      expect(challenge.energyReward).toBeGreaterThan(0);
      
      // Moderate a response
      const response = 'This is a valid game response';
      const moderation = contentModerator.moderateContent(response);
      
      if (moderation.approved) {
        // Evaluate the challenge
        const evaluation = challengeGenerator.evaluateChallenge(challenge, response);
        
        // Energy awarded should not exceed the challenge reward
        expect(evaluation.energyAwarded).toBeLessThanOrEqual(challenge.energyReward);
        
        // Success should correlate with energy awarded
        if (evaluation.success) {
          expect(evaluation.energyAwarded).toBeGreaterThan(0);
        }
      }
    });

    test('should handle concurrent system operations', async () => {
      // Simulate concurrent operations
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const challenge = challengeGenerator.generateChallenge();
        const response = `Concurrent response ${i}`;
        
        const moderation = contentModerator.moderateContent(response);
        
        if (moderation.approved) {
          return challengeGenerator.evaluateChallenge(challenge, response);
        }
        
        return null;
      });
      
      const results = await Promise.all(promises);
      const validResults = results.filter(r => r !== null);
      
      // Should have processed some results
      expect(validResults.length).toBeGreaterThan(0);
      
      // All results should be consistent
      validResults.forEach(result => {
        expect(result!.score).toBeGreaterThanOrEqual(0);
        expect(result!.score).toBeLessThanOrEqual(100);
      });
    });
  });
});
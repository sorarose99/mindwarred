import { challengeGenerator, ChallengeType, DifficultyLevel } from '../../game/challenges';

describe('Challenge System', () => {
  beforeEach(() => {
    // Reset challenge generator state
    (challengeGenerator as any).usedChallenges.clear();
  });

  describe('Challenge Generation', () => {
    test('should generate a valid challenge', () => {
      const challenge = challengeGenerator.generateChallenge();
      
      expect(challenge).toBeDefined();
      expect(challenge.id).toBeTruthy();
      expect(challenge.type).toBeDefined();
      expect(challenge.title).toBeTruthy();
      expect(challenge.description).toBeTruthy();
      expect(challenge.energyReward).toBeGreaterThan(0);
    });

    test('should generate different challenge types', () => {
      const challenges = Array.from({ length: 10 }, () => 
        challengeGenerator.generateChallenge()
      );
      
      const types = new Set(challenges.map(c => c.type));
      expect(types.size).toBeGreaterThan(1);
    });

    test('should respect community bonuses', () => {
      const programmingChallenge = challengeGenerator.generateChallenge('programming', ChallengeType.KNOWLEDGE);
      const regularChallenge = challengeGenerator.generateChallenge('other', ChallengeType.KNOWLEDGE);
      
      // Programming community might get bonus for knowledge challenges
      expect(programmingChallenge.energyReward).toBeGreaterThanOrEqual(regularChallenge.energyReward);
    });

    test('should avoid repeating challenges', () => {
      const challenge1 = challengeGenerator.generateChallenge();
      const challenge2 = challengeGenerator.generateChallenge();
      
      expect(challenge1.id).not.toBe(challenge2.id);
    });
  });

  describe('Challenge Evaluation', () => {
    test('should correctly evaluate puzzle challenges', () => {
      const challenge = {
        id: 'test-puzzle',
        type: ChallengeType.PUZZLE,
        difficulty: DifficultyLevel.MEDIUM,
        title: 'Test Puzzle',
        description: 'Test',
        content: {
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1
        },
        energyReward: 20
      };

      const correctResult = challengeGenerator.evaluateChallenge(challenge, 1);
      expect(correctResult.success).toBe(true);
      expect(correctResult.score).toBe(100);
      expect(correctResult.energyAwarded).toBe(20);

      const incorrectResult = challengeGenerator.evaluateChallenge(challenge, 0);
      expect(incorrectResult.success).toBe(false);
      expect(incorrectResult.score).toBe(0);
      expect(incorrectResult.energyAwarded).toBe(0);
    });

    test('should evaluate creative challenges based on length and keywords', () => {
      const challenge = {
        id: 'test-creative',
        type: ChallengeType.CREATIVE,
        difficulty: DifficultyLevel.EASY,
        title: 'Test Creative',
        description: 'Test',
        content: {
          prompt: 'Write something creative',
          targetLength: 100,
          keywords: ['creative', 'imagination']
        },
        energyReward: 30
      };

      const goodResponse = 'This is a very creative and imaginative response that meets the target length requirements and includes the specified keywords to demonstrate creativity and imagination in the content.';
      const result = challengeGenerator.evaluateChallenge(challenge, goodResponse);
      
      expect(result.success).toBe(true);
      expect(result.score).toBeGreaterThan(50);
      expect(result.energyAwarded).toBeGreaterThan(15);
    });

    test('should handle collaborative challenges', () => {
      const challenge = {
        id: 'test-collaborative',
        type: ChallengeType.COLLABORATIVE,
        difficulty: DifficultyLevel.EASY,
        title: 'Test Collaborative',
        description: 'Test',
        content: {
          question: 'Vote for your favorite option',
          options: ['Option A', 'Option B', 'Option C']
        },
        energyReward: 10
      };

      const result = challengeGenerator.evaluateChallenge(challenge, 1);
      expect(result.success).toBe(true);
      expect(result.score).toBe(75);
    });
  });

  describe('Challenge Content Validation', () => {
    test('should have valid content for all challenge types', () => {
      Object.values(ChallengeType).forEach(type => {
        const challenge = challengeGenerator.generateChallenge(undefined, type);
        
        expect(challenge.content).toBeDefined();
        
        if (type === ChallengeType.PUZZLE || type === ChallengeType.KNOWLEDGE) {
          expect(challenge.content.question).toBeTruthy();
          expect(challenge.content.options).toBeDefined();
          expect(challenge.content.correctAnswer).toBeDefined();
        }
        
        if (type === ChallengeType.CREATIVE || type === ChallengeType.STRATEGIC) {
          expect(challenge.content.prompt).toBeTruthy();
        }
      });
    });
  });
});
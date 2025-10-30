// Challenge System for Reddit Mind Wars
export enum ChallengeType {
  PUZZLE = 'puzzle',           // Logic and problem-solving
  CREATIVE = 'creative',       // Art, writing, memes
  KNOWLEDGE = 'knowledge',     // Trivia and facts
  COLLABORATIVE = 'collaborative', // Multi-user tasks
  STRATEGIC = 'strategic'      // Planning and decision-making
}

export enum DifficultyLevel {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  EXPERT = 4
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  difficulty: DifficultyLevel;
  title: string;
  description: string;
  content: ChallengeContent;
  timeLimit?: number; // in seconds
  energyReward: number;
  communityBonus?: number; // extra energy for specific communities
}

export interface ChallengeContent {
  question?: string;
  options?: string[];
  correctAnswer?: string | number;
  prompt?: string;
  targetLength?: number;
  keywords?: string[];
}

export interface ChallengeResult {
  success: boolean;
  score: number;
  energyAwarded: number;
  feedback: string;
}

// Challenge Templates
export const CHALLENGE_TEMPLATES: Record<ChallengeType, Challenge[]> = {
  [ChallengeType.PUZZLE]: [
    {
      id: 'logic-sequence',
      type: ChallengeType.PUZZLE,
      difficulty: DifficultyLevel.MEDIUM,
      title: 'Number Sequence',
      description: 'Complete the sequence',
      content: {
        question: 'What comes next in the sequence: 2, 4, 8, 16, ?',
        options: ['24', '32', '30', '20'],
        correctAnswer: 1
      },
      energyReward: 15
    },
    {
      id: 'riddle-classic',
      type: ChallengeType.PUZZLE,
      difficulty: DifficultyLevel.HARD,
      title: 'Classic Riddle',
      description: 'Solve this brain teaser',
      content: {
        question: 'I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?',
        options: ['Echo', 'Shadow', 'Reflection', 'Sound'],
        correctAnswer: 0
      },
      energyReward: 25
    }
  ],
  
  [ChallengeType.CREATIVE]: [
    {
      id: 'meme-caption',
      type: ChallengeType.CREATIVE,
      difficulty: DifficultyLevel.EASY,
      title: 'Meme Master',
      description: 'Create a funny caption',
      content: {
        prompt: 'Write a witty caption for a confused cat looking at a computer screen',
        targetLength: 50
      },
      energyReward: 20,
      communityBonus: 10 // Extra for r/memes
    },
    {
      id: 'story-prompt',
      type: ChallengeType.CREATIVE,
      difficulty: DifficultyLevel.MEDIUM,
      title: 'Story Starter',
      description: 'Continue this story',
      content: {
        prompt: 'The last person on Earth sits alone in a room. There is a knock at the door...',
        targetLength: 200,
        keywords: ['suspense', 'mystery']
      },
      energyReward: 30
    }
  ],
  
  [ChallengeType.KNOWLEDGE]: [
    {
      id: 'reddit-trivia',
      type: ChallengeType.KNOWLEDGE,
      difficulty: DifficultyLevel.EASY,
      title: 'Reddit History',
      description: 'Test your Reddit knowledge',
      content: {
        question: 'What year was Reddit founded?',
        options: ['2003', '2005', '2007', '2009'],
        correctAnswer: 1
      },
      energyReward: 10
    },
    {
      id: 'programming-quiz',
      type: ChallengeType.KNOWLEDGE,
      difficulty: DifficultyLevel.MEDIUM,
      title: 'Code Knowledge',
      description: 'Programming fundamentals',
      content: {
        question: 'Which of these is NOT a programming paradigm?',
        options: ['Object-Oriented', 'Functional', 'Procedural', 'Alphabetical'],
        correctAnswer: 3
      },
      energyReward: 20,
      communityBonus: 15 // Extra for r/programming
    }
  ],
  
  [ChallengeType.COLLABORATIVE]: [
    {
      id: 'community-vote',
      type: ChallengeType.COLLABORATIVE,
      difficulty: DifficultyLevel.EASY,
      title: 'Community Decision',
      description: 'Vote on the best option',
      content: {
        question: 'Which feature should be added to Reddit Mind Wars next?',
        options: ['Planet Customization', 'Team Battles', 'Achievement System', 'Trading Cards']
      },
      energyReward: 5,
      timeLimit: 300 // 5 minutes
    }
  ],
  
  [ChallengeType.STRATEGIC]: [
    {
      id: 'resource-allocation',
      type: ChallengeType.STRATEGIC,
      difficulty: DifficultyLevel.HARD,
      title: 'Strategic Planning',
      description: 'Optimize resource distribution',
      content: {
        question: 'You have 100 energy points to distribute among 4 planets. How would you allocate them for maximum growth?',
        prompt: 'Explain your strategy in 100 words'
      },
      energyReward: 35
    }
  ]
};

export class ChallengeGenerator {
  private usedChallenges: Set<string> = new Set();
  
  generateChallenge(communityId?: string, preferredType?: ChallengeType): Challenge {
    // Get available challenge types
    const availableTypes = preferredType ? [preferredType] : Object.keys(CHALLENGE_TEMPLATES) as ChallengeType[];
    
    // Select random type
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const templates = CHALLENGE_TEMPLATES[selectedType];
    
    // Filter out recently used challenges
    const availableTemplates = templates.filter(template => !this.usedChallenges.has(template.id));
    
    if (availableTemplates.length === 0) {
      // Reset if all challenges have been used
      this.usedChallenges.clear();
      return this.generateChallenge(communityId, preferredType);
    }
    
    // Select random challenge
    const selectedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    this.usedChallenges.add(selectedTemplate.id);
    
    // Create challenge instance with unique ID
    const challenge: Challenge = {
      ...selectedTemplate,
      id: `${selectedTemplate.id}-${Date.now()}`
    };
    
    // Apply community-specific bonuses
    if (communityId && this.shouldApplyCommunityBonus(communityId, selectedTemplate.type)) {
      challenge.energyReward += challenge.communityBonus || 0;
    }
    
    return challenge;
  }
  
  private shouldApplyCommunityBonus(communityId: string, challengeType: ChallengeType): boolean {
    const communityBonuses: Record<string, ChallengeType[]> = {
      'programming': [ChallengeType.KNOWLEDGE, ChallengeType.PUZZLE],
      'memes': [ChallengeType.CREATIVE],
      'askreddit': [ChallengeType.COLLABORATIVE, ChallengeType.STRATEGIC],
      'gaming': [ChallengeType.STRATEGIC, ChallengeType.PUZZLE],
      'funny': [ChallengeType.CREATIVE]
    };
    
    return communityBonuses[communityId]?.includes(challengeType) || false;
  }
  
  evaluateChallenge(challenge: Challenge, userAnswer: string | number): ChallengeResult {
    let success = false;
    let score = 0;
    let feedback = '';
    
    switch (challenge.type) {
      case ChallengeType.PUZZLE:
      case ChallengeType.KNOWLEDGE:
        if (challenge.content.correctAnswer !== undefined) {
          success = userAnswer === challenge.content.correctAnswer;
          score = success ? 100 : 0;
          feedback = success ? 'Correct! Well done!' : `Incorrect. The answer was: ${challenge.content.options?.[challenge.content.correctAnswer as number] || challenge.content.correctAnswer}`;
        }
        break;
        
      case ChallengeType.CREATIVE:
        // Simple evaluation based on length and keywords
        const text = userAnswer as string;
        const targetLength = challenge.content.targetLength || 100;
        const lengthScore = Math.min(100, (text.length / targetLength) * 100);
        
        let keywordScore = 0;
        if (challenge.content.keywords) {
          const foundKeywords = challenge.content.keywords.filter(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
          );
          keywordScore = (foundKeywords.length / challenge.content.keywords.length) * 50;
        }
        
        score = Math.min(100, lengthScore + keywordScore);
        success = score >= 50;
        feedback = success ? 'Creative and engaging!' : 'Good effort! Try to be more detailed or creative.';
        break;
        
      case ChallengeType.COLLABORATIVE:
        // For collaborative challenges, participation is success
        success = true;
        score = 75;
        feedback = 'Thanks for participating in the community decision!';
        break;
        
      case ChallengeType.STRATEGIC:
        // Strategic challenges get partial credit for thoughtful responses
        const strategicText = userAnswer as string;
        score = Math.min(100, strategicText.length / 2); // Simple scoring
        success = score >= 40;
        feedback = success ? 'Solid strategic thinking!' : 'Consider elaborating on your strategy.';
        break;
    }
    
    const energyAwarded = Math.floor((score / 100) * challenge.energyReward);
    
    return {
      success,
      score,
      energyAwarded,
      feedback
    };
  }
}

export const challengeGenerator = new ChallengeGenerator();
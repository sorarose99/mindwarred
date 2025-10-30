import { getEvolutionStage, getEvolutionStageName } from '../../game/evolution';
import { EvolutionStage } from '../../game/types';

describe('Evolution System', () => {
  describe('Evolution Stage Calculation', () => {
    test('should return correct stage for energy levels', () => {
      expect(getEvolutionStage(0)).toBe(EvolutionStage.NASCENT);
      expect(getEvolutionStage(250)).toBe(EvolutionStage.NASCENT);
      expect(getEvolutionStage(499)).toBe(EvolutionStage.NASCENT);
      
      expect(getEvolutionStage(500)).toBe(EvolutionStage.DEVELOPING);
      expect(getEvolutionStage(750)).toBe(EvolutionStage.DEVELOPING);
      expect(getEvolutionStage(999)).toBe(EvolutionStage.DEVELOPING);
      
      expect(getEvolutionStage(1000)).toBe(EvolutionStage.THRIVING);
      expect(getEvolutionStage(1500)).toBe(EvolutionStage.THRIVING);
      expect(getEvolutionStage(1999)).toBe(EvolutionStage.THRIVING);
      
      expect(getEvolutionStage(2000)).toBe(EvolutionStage.ADVANCED);
      expect(getEvolutionStage(2500)).toBe(EvolutionStage.ADVANCED);
      expect(getEvolutionStage(2999)).toBe(EvolutionStage.ADVANCED);
      
      expect(getEvolutionStage(3000)).toBe(EvolutionStage.TRANSCENDENT);
      expect(getEvolutionStage(5000)).toBe(EvolutionStage.TRANSCENDENT);
    });

    test('should handle edge cases', () => {
      expect(getEvolutionStage(-100)).toBe(EvolutionStage.NASCENT);
      expect(getEvolutionStage(0)).toBe(EvolutionStage.NASCENT);
      expect(getEvolutionStage(Number.MAX_SAFE_INTEGER)).toBe(EvolutionStage.TRANSCENDENT);
    });
  });

  describe('Evolution Stage Names', () => {
    test('should return correct names for all stages', () => {
      expect(getEvolutionStageName(EvolutionStage.NASCENT)).toBe('Nascent');
      expect(getEvolutionStageName(EvolutionStage.DEVELOPING)).toBe('Developing');
      expect(getEvolutionStageName(EvolutionStage.THRIVING)).toBe('Thriving');
      expect(getEvolutionStageName(EvolutionStage.ADVANCED)).toBe('Advanced');
      expect(getEvolutionStageName(EvolutionStage.TRANSCENDENT)).toBe('Transcendent');
    });

    test('should handle invalid stages', () => {
      expect(getEvolutionStageName(-1 as EvolutionStage)).toBe('Unknown');
      expect(getEvolutionStageName(999 as EvolutionStage)).toBe('Unknown');
    });
  });

  describe('Evolution Progression', () => {
    test('should progress through stages in order', () => {
      const energyLevels = [0, 500, 1000, 2000, 3000];
      const expectedStages = [
        EvolutionStage.NASCENT,
        EvolutionStage.DEVELOPING,
        EvolutionStage.THRIVING,
        EvolutionStage.ADVANCED,
        EvolutionStage.TRANSCENDENT
      ];

      energyLevels.forEach((energy, index) => {
        expect(getEvolutionStage(energy)).toBe(expectedStages[index]);
      });
    });

    test('should calculate progress within stage', () => {
      // Test progress calculation for different stages
      const testCases = [
        { energy: 250, stage: EvolutionStage.NASCENT, expectedProgress: 0.5 },
        { energy: 750, stage: EvolutionStage.DEVELOPING, expectedProgress: 0.5 },
        { energy: 1500, stage: EvolutionStage.THRIVING, expectedProgress: 0.5 },
        { energy: 2500, stage: EvolutionStage.ADVANCED, expectedProgress: 0.5 }
      ];

      testCases.forEach(({ energy, stage, expectedProgress }) => {
        expect(getEvolutionStage(energy)).toBe(stage);
        
        // Calculate progress within stage
        const stageThresholds = [0, 500, 1000, 2000, 3000];
        const stageStart = stageThresholds[stage];
        const stageEnd = stageThresholds[stage + 1] || Infinity;
        const progress = (energy - stageStart) / (stageEnd - stageStart);
        
        expect(progress).toBeCloseTo(expectedProgress, 1);
      });
    });
  });
});
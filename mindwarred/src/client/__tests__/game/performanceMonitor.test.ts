import { performanceMonitor } from '../../game/performanceMonitor';

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Reset performance monitor state
    performanceMonitor.stopMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('Metrics Collection', () => {
    test('should initialize with default metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.fps).toBeDefined();
      expect(metrics.frameTime).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.renderTime).toBeDefined();
      expect(metrics.triangleCount).toBeDefined();
      expect(metrics.drawCalls).toBeDefined();
      expect(metrics.devicePixelRatio).toBeDefined();
      expect(metrics.canvasSize).toBeDefined();
    });

    test('should update render metrics', () => {
      const initialMetrics = performanceMonitor.getMetrics();
      
      performanceMonitor.updateRenderMetrics(50000, 25, 16.67);
      
      const updatedMetrics = performanceMonitor.getMetrics();
      expect(updatedMetrics.triangleCount).toBe(50000);
      expect(updatedMetrics.drawCalls).toBe(25);
      expect(updatedMetrics.renderTime).toBe(16.67);
    });

    test('should update canvas size', () => {
      performanceMonitor.updateCanvasSize(1920, 1080);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.canvasSize.width).toBe(1920);
      expect(metrics.canvasSize.height).toBe(1080);
    });
  });

  describe('Settings Management', () => {
    test('should initialize with default settings', () => {
      const settings = performanceMonitor.getSettings();
      
      expect(settings.targetFPS).toBeDefined();
      expect(settings.maxTriangles).toBeDefined();
      expect(settings.maxDrawCalls).toBeDefined();
      expect(settings.adaptiveQuality).toBeDefined();
      expect(settings.autoOptimize).toBeDefined();
      expect(settings.qualityLevel).toBeDefined();
    });

    test('should update settings', () => {
      const newSettings = {
        targetFPS: 30,
        qualityLevel: 'low' as const,
        autoOptimize: false
      };
      
      performanceMonitor.updateSettings(newSettings);
      
      const updatedSettings = performanceMonitor.getSettings();
      expect(updatedSettings.targetFPS).toBe(30);
      expect(updatedSettings.qualityLevel).toBe('low');
      expect(updatedSettings.autoOptimize).toBe(false);
    });
  });

  describe('Quality Recommendations', () => {
    test('should provide quality recommendations for each level', () => {
      const levels = ['low', 'medium', 'high', 'ultra'] as const;
      
      levels.forEach(level => {
        performanceMonitor.updateSettings({ qualityLevel: level });
        const recommendations = performanceMonitor.getQualityRecommendations();
        
        expect(recommendations.particleCount).toBeGreaterThan(0);
        expect(recommendations.shadowQuality).toBeDefined();
        expect(typeof recommendations.antialiasing).toBe('boolean');
        expect(recommendations.textureQuality).toBeGreaterThan(0);
        expect(recommendations.renderDistance).toBeGreaterThan(0);
        expect(typeof recommendations.effectsEnabled).toBe('boolean');
      });
    });

    test('should scale recommendations with quality level', () => {
      performanceMonitor.updateSettings({ qualityLevel: 'low' });
      const lowRec = performanceMonitor.getQualityRecommendations();
      
      performanceMonitor.updateSettings({ qualityLevel: 'ultra' });
      const ultraRec = performanceMonitor.getQualityRecommendations();
      
      expect(ultraRec.particleCount).toBeGreaterThan(lowRec.particleCount);
      expect(ultraRec.textureQuality).toBeGreaterThanOrEqual(lowRec.textureQuality);
      expect(ultraRec.renderDistance).toBeGreaterThanOrEqual(lowRec.renderDistance);
    });
  });

  describe('Performance Warnings', () => {
    test('should generate warnings for poor performance', () => {
      // Simulate poor performance conditions
      performanceMonitor.updateRenderMetrics(200000, 150, 50); // High triangle count and draw calls
      
      const warnings = performanceMonitor.getPerformanceWarnings();
      
      expect(Array.isArray(warnings)).toBe(true);
      
      // Should warn about high triangle count
      const triangleWarning = warnings.find(w => w.includes('triangle'));
      expect(triangleWarning).toBeDefined();
      
      // Should warn about high draw calls
      const drawCallWarning = warnings.find(w => w.includes('draw call'));
      expect(drawCallWarning).toBeDefined();
    });

    test('should not generate warnings for good performance', () => {
      // Simulate good performance conditions
      performanceMonitor.updateRenderMetrics(10000, 20, 16.67);
      
      const warnings = performanceMonitor.getPerformanceWarnings();
      
      // Should have fewer or no warnings
      expect(warnings.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Adaptive Settings', () => {
    test('should provide adaptive settings', () => {
      const adaptiveSettings = performanceMonitor.getAdaptiveSettings();
      
      expect(adaptiveSettings.targetFPS).toBeDefined();
      expect(adaptiveSettings.qualityLevel).toBeDefined();
      expect(adaptiveSettings.maxTriangles).toBeDefined();
      expect(typeof adaptiveSettings.adaptiveQuality).toBe('boolean');
    });
  });

  describe('Profiling', () => {
    test('should provide profiling functionality', (done) => {
      const endProfiling = performanceMonitor.startProfiling('test-operation');
      
      // Simulate some work
      setTimeout(() => {
        const duration = endProfiling();
        
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });

  describe('Debug Information', () => {
    test('should provide debug information', () => {
      const debugInfo = performanceMonitor.getDebugInfo();
      
      expect(typeof debugInfo).toBe('string');
      expect(debugInfo).toContain('FPS:');
      expect(debugInfo).toContain('Frame Time:');
      expect(debugInfo).toContain('Memory:');
      expect(debugInfo).toContain('Quality Level:');
    });

    test('should include warnings in debug info when present', () => {
      // Create conditions that generate warnings
      performanceMonitor.updateRenderMetrics(200000, 150, 50);
      
      const debugInfo = performanceMonitor.getDebugInfo();
      
      expect(debugInfo).toContain('Warnings:');
    });
  });

  describe('Monitoring Control', () => {
    test('should start and stop monitoring', () => {
      // Monitoring should be controllable
      performanceMonitor.startMonitoring();
      expect(performanceMonitor['isMonitoring']).toBe(true);
      
      performanceMonitor.stopMonitoring();
      expect(performanceMonitor['isMonitoring']).toBe(false);
    });
  });

  describe('FPS Calculation', () => {
    test('should calculate average FPS', () => {
      const avgFPS = performanceMonitor.getAverageFPS();
      
      expect(typeof avgFPS).toBe('number');
      expect(avgFPS).toBeGreaterThan(0);
    });

    test('should calculate average frame time', () => {
      const avgFrameTime = performanceMonitor.getAverageFrameTime();
      
      expect(typeof avgFrameTime).toBe('number');
      expect(avgFrameTime).toBeGreaterThan(0);
    });
  });

  describe('Optimization Callbacks', () => {
    test('should register optimization callbacks', () => {
      let callbackCalled = false;
      let receivedLevel = '';
      
      performanceMonitor.onOptimization((level) => {
        callbackCalled = true;
        receivedLevel = level;
      });
      
      // Trigger optimization by calling the private method
      (performanceMonitor as any).notifyOptimization('medium');
      
      expect(callbackCalled).toBe(true);
      expect(receivedLevel).toBe('medium');
    });
  });
});
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  triangleCount: number;
  drawCalls: number;
  textureMemory: number;
  devicePixelRatio: number;
  canvasSize: { width: number; height: number };
}

export interface PerformanceSettings {
  targetFPS: number;
  maxTriangles: number;
  maxDrawCalls: number;
  adaptiveQuality: boolean;
  autoOptimize: boolean;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private settings: PerformanceSettings;
  private frameCount = 0;
  private lastTime = 0;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private isMonitoring = false;
  private optimizationCallbacks: Array<(level: string) => void> = [];

  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      renderTime: 0,
      triangleCount: 0,
      drawCalls: 0,
      textureMemory: 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      canvasSize: { width: 0, height: 0 }
    };

    this.settings = {
      targetFPS: 60,
      maxTriangles: 100000,
      maxDrawCalls: 100,
      adaptiveQuality: true,
      autoOptimize: true,
      qualityLevel: this.detectOptimalQuality()
    };

    this.startMonitoring();
  }

  private detectOptimalQuality(): 'low' | 'medium' | 'high' | 'ultra' {
    // Detect device capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 'low';

    // Check for high-end features
    const hasFloatTextures = gl.getExtension('OES_texture_float');
    const hasInstancedArrays = gl.getExtension('ANGLE_instanced_arrays');
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);

    // Estimate based on device capabilities
    const memoryEstimate = (navigator as any).deviceMemory || 4; // GB
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    let score = 0;
    if (hasFloatTextures) score += 1;
    if (hasInstancedArrays) score += 1;
    if (maxTextureSize >= 4096) score += 1;
    if (maxVertexUniforms >= 256) score += 1;
    if (memoryEstimate >= 8) score += 2;
    if (hardwareConcurrency >= 8) score += 1;
    if (this.metrics.devicePixelRatio <= 1) score += 1;

    if (score >= 7) return 'ultra';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  startMonitoring(): void {
    this.isMonitoring = true;
    this.monitorLoop();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private monitorLoop(): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    
    if (this.lastTime > 0) {
      const deltaTime = now - this.lastTime;
      const fps = 1000 / deltaTime;
      
      this.updateFPS(fps);
      this.updateFrameTime(deltaTime);
      this.updateMemoryUsage();
      
      // Check if optimization is needed
      if (this.settings.autoOptimize) {
        this.checkOptimization();
      }
    }
    
    this.lastTime = now;
    this.frameCount++;
    
    requestAnimationFrame(() => this.monitorLoop());
  }

  private updateFPS(fps: number): void {
    this.metrics.fps = fps;
    this.fpsHistory.push(fps);
    
    // Keep only last 60 frames for averaging
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
  }

  private updateFrameTime(frameTime: number): void {
    this.metrics.frameTime = frameTime;
    this.frameTimeHistory.push(frameTime);
    
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
  }

  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  private checkOptimization(): void {
    const avgFPS = this.getAverageFPS();
    const targetFPS = this.settings.targetFPS;
    
    // If FPS is consistently below target, reduce quality
    if (avgFPS < targetFPS * 0.8 && this.settings.qualityLevel !== 'low') {
      this.reduceQuality();
    }
    // If FPS is consistently above target, increase quality
    else if (avgFPS > targetFPS * 1.1 && this.settings.qualityLevel !== 'ultra') {
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    const currentLevel = this.settings.qualityLevel;
    let newLevel: 'low' | 'medium' | 'high' | 'ultra';

    switch (currentLevel) {
      case 'ultra': newLevel = 'high'; break;
      case 'high': newLevel = 'medium'; break;
      case 'medium': newLevel = 'low'; break;
      default: return; // Already at lowest
    }

    this.settings.qualityLevel = newLevel;
    this.notifyOptimization(newLevel);
  }

  private increaseQuality(): void {
    const currentLevel = this.settings.qualityLevel;
    let newLevel: 'low' | 'medium' | 'high' | 'ultra';

    switch (currentLevel) {
      case 'low': newLevel = 'medium'; break;
      case 'medium': newLevel = 'high'; break;
      case 'high': newLevel = 'ultra'; break;
      default: return; // Already at highest
    }

    this.settings.qualityLevel = newLevel;
    this.notifyOptimization(newLevel);
  }

  private notifyOptimization(level: string): void {
    this.optimizationCallbacks.forEach(callback => callback(level));
  }

  // Public methods
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 16.67;
    return this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
  }

  updateRenderMetrics(triangles: number, drawCalls: number, renderTime: number): void {
    this.metrics.triangleCount = triangles;
    this.metrics.drawCalls = drawCalls;
    this.metrics.renderTime = renderTime;
  }

  updateCanvasSize(width: number, height: number): void {
    this.metrics.canvasSize = { width, height };
  }

  // Quality level recommendations
  getQualityRecommendations(): {
    particleCount: number;
    shadowQuality: 'none' | 'low' | 'medium' | 'high';
    antialiasing: boolean;
    textureQuality: number;
    renderDistance: number;
    effectsEnabled: boolean;
  } {
    const level = this.settings.qualityLevel;
    
    switch (level) {
      case 'low':
        return {
          particleCount: 50,
          shadowQuality: 'none',
          antialiasing: false,
          textureQuality: 0.5,
          renderDistance: 0.7,
          effectsEnabled: false
        };
      case 'medium':
        return {
          particleCount: 100,
          shadowQuality: 'low',
          antialiasing: false,
          textureQuality: 0.75,
          renderDistance: 0.85,
          effectsEnabled: true
        };
      case 'high':
        return {
          particleCount: 200,
          shadowQuality: 'medium',
          antialiasing: true,
          textureQuality: 1.0,
          renderDistance: 1.0,
          effectsEnabled: true
        };
      case 'ultra':
        return {
          particleCount: 400,
          shadowQuality: 'high',
          antialiasing: true,
          textureQuality: 1.0,
          renderDistance: 1.2,
          effectsEnabled: true
        };
    }
  }

  // Performance warnings
  getPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    const avgFPS = this.getAverageFPS();
    
    if (avgFPS < 30) {
      warnings.push('Low FPS detected. Consider reducing graphics quality.');
    }
    
    if (this.metrics.memoryUsage > 500) {
      warnings.push('High memory usage detected. Consider closing other applications.');
    }
    
    if (this.metrics.triangleCount > this.settings.maxTriangles) {
      warnings.push('High triangle count may impact performance.');
    }
    
    if (this.metrics.drawCalls > this.settings.maxDrawCalls) {
      warnings.push('High draw call count detected. Consider optimizing rendering.');
    }
    
    return warnings;
  }

  // Optimization callbacks
  onOptimization(callback: (level: string) => void): void {
    this.optimizationCallbacks.push(callback);
  }

  // Performance profiling
  startProfiling(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  // Adaptive quality based on device
  getAdaptiveSettings(): PerformanceSettings {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = this.metrics.devicePixelRatio > 2 || (navigator as any).deviceMemory < 4;
    
    if (isMobile || isLowEnd) {
      return {
        ...this.settings,
        qualityLevel: 'low',
        targetFPS: 30,
        maxTriangles: 50000,
        adaptiveQuality: true
      };
    }
    
    return this.settings;
  }

  // Debug information
  getDebugInfo(): string {
    const metrics = this.getMetrics();
    const warnings = this.getPerformanceWarnings();
    
    return `
Performance Debug Info:
- FPS: ${metrics.fps.toFixed(1)} (avg: ${this.getAverageFPS().toFixed(1)})
- Frame Time: ${metrics.frameTime.toFixed(2)}ms
- Memory: ${metrics.memoryUsage.toFixed(1)}MB
- Triangles: ${metrics.triangleCount.toLocaleString()}
- Draw Calls: ${metrics.drawCalls}
- Quality Level: ${this.settings.qualityLevel}
- Canvas: ${metrics.canvasSize.width}x${metrics.canvasSize.height}
- Device Pixel Ratio: ${metrics.devicePixelRatio}
${warnings.length > 0 ? '\nWarnings:\n' + warnings.map(w => `- ${w}`).join('\n') : ''}
    `.trim();
  }
}

export const performanceMonitor = new PerformanceMonitor();
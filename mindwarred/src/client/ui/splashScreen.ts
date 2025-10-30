export class SplashScreenManager {
  private splashScreen: HTMLElement | null;
  private enterUniverseBtn: HTMLElement | null;
  private loadingIndicator: HTMLElement | null;
  private loadingProgress: HTMLElement | null;
  private loadingText: HTMLElement | null;
  private gameInitialized = false;

  constructor() {
    this.splashScreen = document.getElementById('splash-screen');
    this.enterUniverseBtn = document.getElementById('enter-universe');
    this.loadingIndicator = document.querySelector('.loading-indicator') as HTMLElement;
    this.loadingProgress = document.getElementById('loading-progress') as HTMLElement;
    this.loadingText = document.getElementById('loading-text') as HTMLElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Splash screen enter button
    this.enterUniverseBtn?.addEventListener('click', () => {
      this.startGameInitialization();
    });

    // Auto-hide splash screen after 10 seconds if user doesn't click
    setTimeout(() => {
      if (this.splashScreen && !this.splashScreen.classList.contains('hidden')) {
        this.startGameInitialization();
      }
    }, 10000);
  }

  async startGameInitialization(initCallback?: () => Promise<void>): Promise<void> {
    if (!this.enterUniverseBtn || !this.loadingIndicator || !this.loadingProgress || !this.loadingText) return;

    // Hide button and show loading
    this.enterUniverseBtn.style.display = 'none';
    this.loadingIndicator.classList.add('visible');

    // Simulate loading steps with progress
    const loadingSteps = [
      { text: 'Connecting to Reddit API...', progress: 20 },
      { text: 'Fetching community data...', progress: 40 },
      { text: 'Initializing 3D universe...', progress: 60 },
      { text: 'Creating mind planets...', progress: 80 },
      { text: 'Preparing for battle...', progress: 100 }
    ];

    for (let i = 0; i < loadingSteps.length; i++) {
      const step = loadingSteps[i];
      if (step) {
        this.loadingText.textContent = step.text;
        this.loadingProgress.style.width = `${step.progress}%`;

        // Actual initialization on first step
        if (i === 0 && !this.gameInitialized && initCallback) {
          await initCallback();
          this.gameInitialized = true;
        }

        // Wait between steps for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Hide splash screen
    setTimeout(() => {
      this.hideSplashScreen();
    }, 500);
  }

  private hideSplashScreen(): void {
    if (this.splashScreen) {
      console.log('🎮 Hiding splash screen...');
      this.splashScreen.classList.add('hidden');
      this.splashScreen.style.display = 'none';
      this.splashScreen.style.opacity = '0';
      
      // Remove from DOM after transition
      setTimeout(() => {
        if (this.splashScreen) {
          this.splashScreen.remove();
          console.log('🎮 Splash screen removed from DOM');
        }
      }, 100);
    }
  }

  // Public method to force hide splash screen
  public forceHide(): void {
    console.log('🎮 Force hiding splash screen...');
    this.hideSplashScreen();
  }
}
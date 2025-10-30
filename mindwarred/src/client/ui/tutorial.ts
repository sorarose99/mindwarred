import { MindPlanet } from '../game/types';

export class TutorialManager {
  showTutorial(gameState: any, selectPlanetCallback: (planet: MindPlanet) => void): void {
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('mindwars-tutorial-seen');
    if (hasSeenTutorial) return;

    // Create tutorial overlay
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'tutorial-overlay';
    tutorialOverlay.innerHTML = `
      <div class="tutorial-content">
        <h2>Welcome to Reddit Mind Wars!</h2>
        <div class="tutorial-steps">
          <div class="tutorial-step active" data-step="1">
            <h3>🌍 Community Planets</h3>
            <p>Each planet represents a Reddit community. The size and appearance show their collective intelligence level.</p>
          </div>
          <div class="tutorial-step" data-step="2">
            <h3>🧠 Contribute Energy</h3>
            <p>Click on any planet to contribute thought energy. Help your favorite communities grow and evolve!</p>
          </div>
          <div class="tutorial-step" data-step="3">
            <h3>⚔️ Mind Wars</h3>
            <p>Communities can battle in real-time competitions. The most intelligent community wins!</p>
          </div>
          <div class="tutorial-step" data-step="4">
            <h3>🌟 Evolution Stages</h3>
            <p>Planets evolve from Nascent to Transcendent, gaining rings, moons, and special effects.</p>
          </div>
        </div>
        <div class="tutorial-controls">
          <button class="tutorial-prev" id="tutorial-prev">Previous</button>
          <div class="tutorial-dots">
            <span class="dot active" data-step="1"></span>
            <span class="dot" data-step="2"></span>
            <span class="dot" data-step="3"></span>
            <span class="dot" data-step="4"></span>
          </div>
          <button class="tutorial-next" id="tutorial-next">Next</button>
        </div>
        <button class="tutorial-close" id="tutorial-close">Start Playing</button>
      </div>
    `;

    document.body.appendChild(tutorialOverlay);

    // Tutorial navigation
    let currentStep = 1;
    const totalSteps = 4;

    const updateTutorialStep = (step: number) => {
      // Update step visibility
      document.querySelectorAll('.tutorial-step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === step);
      });

      // Update dots
      document.querySelectorAll('.tutorial-dots .dot').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === step);
      });

      // Update button states
      const prevBtn = document.getElementById('tutorial-prev') as HTMLButtonElement;
      const nextBtn = document.getElementById('tutorial-next') as HTMLButtonElement;

      if (prevBtn) prevBtn.disabled = step === 1;
      if (nextBtn) nextBtn.textContent = step === totalSteps ? 'Finish' : 'Next';
    };

    // Event listeners
    document.getElementById('tutorial-prev')?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateTutorialStep(currentStep);
      }
    });

    document.getElementById('tutorial-next')?.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        currentStep++;
        updateTutorialStep(currentStep);
      } else {
        this.closeTutorial(tutorialOverlay, gameState, selectPlanetCallback);
      }
    });

    document.getElementById('tutorial-close')?.addEventListener('click', () => {
      this.closeTutorial(tutorialOverlay, gameState, selectPlanetCallback);
    });

    // Dot navigation
    document.querySelectorAll('.tutorial-dots .dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentStep = index + 1;
        updateTutorialStep(currentStep);
      });
    });
  }

  private closeTutorial(
    tutorialOverlay: HTMLElement, 
    gameState: any, 
    selectPlanetCallback: (planet: MindPlanet) => void
  ): void {
    localStorage.setItem('mindwars-tutorial-seen', 'true');
    tutorialOverlay.remove();

    // Highlight first planet for user to try
    const firstPlanet = Array.from(gameState.planets.values())[0] as MindPlanet;
    if (firstPlanet) {
      selectPlanetCallback(firstPlanet);
      const gameInfoElement = document.getElementById('game-info') as HTMLDivElement;
      if (gameInfoElement) {
        gameInfoElement.textContent = 'Try clicking on this highlighted planet to contribute energy!';
      }
    }
  }
}
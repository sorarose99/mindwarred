import { Challenge, ChallengeResult, ChallengeType, challengeGenerator } from '../game/challenges';

export class ChallengeModal {
  private modal: HTMLElement | null = null;
  private currentChallenge: Challenge | null = null;
  private onComplete: ((result: ChallengeResult) => void) | null = null;

  show(planetId: string, onComplete: (result: ChallengeResult) => void): void {
    this.onComplete = onComplete;
    this.currentChallenge = challengeGenerator.generateChallenge(planetId);
    this.createModal();
  }

  private createModal(): void {
    if (!this.currentChallenge) return;

    // Remove existing modal if any
    this.close();

    this.modal = document.createElement('div');
    this.modal.className = 'challenge-modal';
    this.modal.innerHTML = this.generateModalHTML();

    document.body.appendChild(this.modal);
    this.setupEventListeners();

    // Animate in
    setTimeout(() => {
      this.modal?.classList.add('visible');
    }, 10);
  }

  private generateModalHTML(): string {
    if (!this.currentChallenge) return '';

    const challenge = this.currentChallenge;
    let contentHTML = '';

    switch (challenge.type) {
      case ChallengeType.PUZZLE:
      case ChallengeType.KNOWLEDGE:
        contentHTML = this.generateMultipleChoiceHTML(challenge);
        break;
      case ChallengeType.CREATIVE:
      case ChallengeType.STRATEGIC:
        contentHTML = this.generateTextInputHTML(challenge);
        break;
      case ChallengeType.COLLABORATIVE:
        contentHTML = this.generateCollaborativeHTML(challenge);
        break;
    }

    return `
      <div class="challenge-content">
        <div class="challenge-header">
          <h2>${challenge.title}</h2>
          <p class="challenge-description">${challenge.description}</p>
          <div class="challenge-meta">
            <span class="challenge-type">${challenge.type.toUpperCase()}</span>
            <span class="challenge-reward">+${challenge.energyReward} Energy</span>
            ${challenge.timeLimit ? `<span class="challenge-timer" id="challenge-timer">${challenge.timeLimit}s</span>` : ''}
          </div>
        </div>
        
        <div class="challenge-body">
          ${contentHTML}
        </div>
        
        <div class="challenge-actions">
          <button class="challenge-btn challenge-cancel" id="challenge-cancel">Skip</button>
          <button class="challenge-btn challenge-submit" id="challenge-submit">Submit</button>
        </div>
      </div>
    `;
  }

  private generateMultipleChoiceHTML(challenge: Challenge): string {
    const options = challenge.content.options || [];
    const optionsHTML = options.map((option, index) => `
      <label class="challenge-option">
        <input type="radio" name="challenge-answer" value="${index}">
        <span class="option-text">${option}</span>
      </label>
    `).join('');

    return `
      <div class="challenge-question">
        <p>${challenge.content.question}</p>
      </div>
      <div class="challenge-options">
        ${optionsHTML}
      </div>
    `;
  }

  private generateTextInputHTML(challenge: Challenge): string {
    const placeholder = challenge.type === ChallengeType.CREATIVE 
      ? 'Be creative and have fun!' 
      : 'Explain your strategy...';

    return `
      <div class="challenge-question">
        <p>${challenge.content.prompt || challenge.content.question}</p>
        ${challenge.content.targetLength ? `<small>Target length: ~${challenge.content.targetLength} characters</small>` : ''}
      </div>
      <div class="challenge-input">
        <textarea 
          id="challenge-text-input" 
          placeholder="${placeholder}"
          maxlength="1000"
        ></textarea>
        <div class="character-count">
          <span id="char-count">0</span> / 1000
        </div>
      </div>
    `;
  }

  private generateCollaborativeHTML(challenge: Challenge): string {
    const options = challenge.content.options || [];
    const optionsHTML = options.map((option, index) => `
      <label class="challenge-option collaborative">
        <input type="radio" name="challenge-answer" value="${index}">
        <span class="option-text">${option}</span>
      </label>
    `).join('');

    return `
      <div class="challenge-question">
        <p>${challenge.content.question}</p>
        <small>Your vote helps the community decide!</small>
      </div>
      <div class="challenge-options">
        ${optionsHTML}
      </div>
    `;
  }

  private setupEventListeners(): void {
    if (!this.modal || !this.currentChallenge) return;

    // Character counter for text inputs
    const textInput = this.modal.querySelector('#challenge-text-input') as HTMLTextAreaElement;
    const charCount = this.modal.querySelector('#char-count') as HTMLSpanElement;
    
    if (textInput && charCount) {
      textInput.addEventListener('input', () => {
        charCount.textContent = textInput.value.length.toString();
      });
    }

    // Timer countdown
    if (this.currentChallenge.timeLimit) {
      this.startTimer(this.currentChallenge.timeLimit);
    }

    // Button events
    const cancelBtn = this.modal.querySelector('#challenge-cancel');
    const submitBtn = this.modal.querySelector('#challenge-submit');

    cancelBtn?.addEventListener('click', () => {
      this.close();
    });

    submitBtn?.addEventListener('click', () => {
      this.submitChallenge();
    });

    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  private startTimer(seconds: number): void {
    const timerElement = this.modal?.querySelector('#challenge-timer');
    if (!timerElement) return;

    let timeLeft = seconds;
    const interval = setInterval(() => {
      timeLeft--;
      timerElement.textContent = `${timeLeft}s`;
      
      if (timeLeft <= 10) {
        timerElement.classList.add('warning');
      }
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        this.submitChallenge(); // Auto-submit when time runs out
      }
    }, 1000);
  }

  private submitChallenge(): void {
    if (!this.currentChallenge || !this.onComplete) return;

    let userAnswer: string | number = '';

    // Get user answer based on challenge type
    const radioInputs = this.modal?.querySelectorAll('input[name="challenge-answer"]:checked') as NodeListOf<HTMLInputElement>;
    const textInput = this.modal?.querySelector('#challenge-text-input') as HTMLTextAreaElement;

    if (radioInputs.length > 0) {
      userAnswer = parseInt(radioInputs[0].value);
    } else if (textInput) {
      userAnswer = textInput.value.trim();
    }

    // Validate answer
    if (userAnswer === '' || (typeof userAnswer === 'string' && userAnswer.length < 5)) {
      this.showError('Please provide a valid answer!');
      return;
    }

    // Evaluate challenge
    const result = challengeGenerator.evaluateChallenge(this.currentChallenge, userAnswer);
    
    // Show result
    this.showResult(result);
    
    // Call completion callback after showing result
    setTimeout(() => {
      this.onComplete?.(result);
      this.close();
    }, 2000);
  }

  private showError(message: string): void {
    const existingError = this.modal?.querySelector('.challenge-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'challenge-error';
    errorDiv.textContent = message;

    const actionsDiv = this.modal?.querySelector('.challenge-actions');
    actionsDiv?.insertBefore(errorDiv, actionsDiv.firstChild);

    setTimeout(() => errorDiv.remove(), 3000);
  }

  private showResult(result: ChallengeResult): void {
    if (!this.modal) return;

    const resultHTML = `
      <div class="challenge-result ${result.success ? 'success' : 'partial'}">
        <h3>${result.success ? '🎉 Success!' : '👍 Good Effort!'}</h3>
        <p>${result.feedback}</p>
        <div class="result-stats">
          <span class="score">Score: ${result.score}/100</span>
          <span class="energy">Energy Earned: +${result.energyAwarded}</span>
        </div>
      </div>
    `;

    const challengeBody = this.modal.querySelector('.challenge-body');
    if (challengeBody) {
      challengeBody.innerHTML = resultHTML;
    }

    // Hide action buttons
    const actionsDiv = this.modal.querySelector('.challenge-actions');
    if (actionsDiv) {
      actionsDiv.style.display = 'none';
    }
  }

  close(): void {
    if (this.modal) {
      this.modal.classList.remove('visible');
      setTimeout(() => {
        this.modal?.remove();
        this.modal = null;
      }, 300);
    }
    this.currentChallenge = null;
    this.onComplete = null;
  }
}
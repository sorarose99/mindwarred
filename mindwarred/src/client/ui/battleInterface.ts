import { BattleState, BattleParticipant } from '../game/battleArena';
import { Challenge } from '../game/challenges';

export class BattleInterface {
  private battleOverlay: HTMLElement | null = null;
  private leaderboard: HTMLElement | null = null;
  private challengeDisplay: HTMLElement | null = null;
  private battleTimer: HTMLElement | null = null;
  private currentBattle: BattleState | null = null;

  show(battleState: BattleState): void {
    console.log('🎮 Showing battle interface');
    this.currentBattle = battleState;
    
    try {
      this.createBattleOverlay();
      this.updateDisplay();
      console.log('✅ Battle interface created successfully');
    } catch (error) {
      console.error('❌ Battle interface error:', error);
      // Fallback - just show a simple message
      alert('Battle started! Click on planets to contribute energy and help your community win!');
    }
  }

  hide(): void {
    if (this.battleOverlay) {
      this.battleOverlay.classList.add('hidden');
      setTimeout(() => {
        this.battleOverlay?.remove();
        this.battleOverlay = null;
      }, 500);
    }
    this.currentBattle = null;
  }

  update(battleState: BattleState): void {
    this.currentBattle = battleState;
    this.updateDisplay();
  }

  showVictoryScreen(winner: BattleParticipant): void {
    if (!this.battleOverlay) return;

    const victoryOverlay = document.createElement('div');
    victoryOverlay.className = 'victory-overlay visible';
    victoryOverlay.innerHTML = `
      <div class="victory-content">
        <h2>🏆 VICTORY! 🏆</h2>
        <div class="winner-info">
          <h3>${winner.planet.communityName} Wins!</h3>
          <p>Congratulations to the ${winner.planet.communityName} community!</p>
        </div>
        <div class="winner-stats">
          <div class="stat">
            <span class="label">Final Score</span>
            <span class="value">${winner.score}</span>
          </div>
          <div class="stat">
            <span class="label">Challenges</span>
            <span class="value">${winner.completedChallenges}</span>
          </div>
          <div class="stat">
            <span class="label">Energy</span>
            <span class="value">${winner.planet.thoughtEnergy}</span>
          </div>
        </div>
        <button class="continue-btn" onclick="this.parentElement.parentElement.remove()">
          Continue Playing
        </button>
      </div>
    `;

    document.body.appendChild(victoryOverlay);
  }

  private updateDisplay(): void {
    if (!this.currentBattle || !this.battleOverlay) return;

    this.updateTimer();
    this.updateLeaderboard();
    this.updateStats();
  }

  private updateTimer(): void {
    const timerEl = document.getElementById('battle-timer');
    const timeRemainingEl = document.getElementById('time-remaining');
    
    if (!timerEl || !timeRemainingEl || !this.currentBattle) return;

    const elapsed = Date.now() - this.currentBattle.startTime;
    const remaining = Math.max(0, this.currentBattle.duration - elapsed);
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    timerEl.textContent = timeString;
    timeRemainingEl.textContent = timeString;

    // Add warning class when time is low
    if (remaining < 60000) { // Less than 1 minute
      timerElement.classList.add('timer-warning');
    }
  }

  private createBattleOverlay(): void {
    this.battleOverlay = document.createElement('div');
    this.battleOverlay.className = 'battle-overlay visible';
    this.battleOverlay.innerHTML = `
      <div class="battle-header">
        <h2 class="battle-title">⚔️ REDDIT MIND WAR ⚔️</h2>
        <div class="battle-subtitle">Communities Battle for Supremacy!</div>
        <div class="battle-timer" id="battle-timer">5:00</div>
      </div>
      
      <div class="battle-content">
        <div class="battle-leaderboard" id="battle-leaderboard">
          <h3>🏆 Live Leaderboard</h3>
          <div class="leaderboard-list" id="leaderboard-list">
            <div class="loading-leaderboard">Loading communities...</div>
          </div>
        </div>
        
        <div class="battle-challenge" id="battle-challenge">
          <div class="challenge-header">
            <h3>⚡ Battle Challenge</h3>
            <div class="challenge-timer" id="challenge-timer">Ready!</div>
          </div>
          <div class="challenge-content">
            <p class="challenge-description">Click on any planet to contribute energy and help your community win!</p>
            <div class="battle-instructions">
              <div class="instruction">🎯 <strong>Complete challenges</strong> to earn energy</div>
              <div class="instruction">⚡ <strong>Higher difficulty</strong> = more points</div>
              <div class="instruction">🏆 <strong>Most energy wins</strong> the battle</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="battle-stats">
        <div class="stat">
          <span class="stat-label">Total Energy</span>
          <span class="stat-value" id="total-energy">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Active Players</span>
          <span class="stat-value" id="active-players">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Time Left</span>
          <span class="stat-value" id="time-remaining">5:00</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.battleOverlay);

    // Setup event listeners
    this.battleTimer = document.getElementById('battle-timer');
    this.leaderboard = document.getElementById('battle-leaderboard');
    this.challengeDisplay = document.getElementById('battle-challenge');
    
    // Force show the overlay
    setTimeout(() => {
      if (this.battleOverlay) {
        this.battleOverlay.classList.add('visible');
      }
    }, 100);
  }
        <div class="stat">
          <span class="stat-label">Time Left</span>
          <span class="stat-value" id="time-left">5:00</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.battleOverlay);

    // Get references to elements
    this.leaderboard = document.getElementById('leaderboard-list');
    this.challengeDisplay = document.getElementById('challenge-content');
    this.battleTimer = document.getElementById('battle-timer');

    // Setup event listeners
    this.setupEventListeners();

    // Animate in
    setTimeout(() => {
      this.battleOverlay?.classList.add('visible');
    }, 10);
  }

  private setupEventListeners(): void {
    const participateBtn = document.getElementById('participate-btn');
    participateBtn?.addEventListener('click', () => {
      this.showChallengeModal();
    });
  }

  private updateDisplay(): void {
    if (!this.currentBattle) return;

    this.updateLeaderboard();
    this.updateChallenge();
    this.updateTimer();
    this.updateStats();
  }

  private updateLeaderboard(): void {
    if (!this.leaderboard || !this.currentBattle) return;

    const participants = Array.from(this.currentBattle.participants.values())
      .sort((a, b) => b.score - a.score);

    this.leaderboard.innerHTML = participants.map((participant, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      const isActive = Date.now() - participant.lastActivity < 60000;
      
      return `
        <div class="leaderboard-item ${index === 0 ? 'leader' : ''} ${isActive ? 'active' : ''}">
          <div class="rank">${medal || (index + 1)}</div>
          <div class="community">${participant.planet.communityName}</div>
          <div class="score">${participant.score}</div>
          <div class="challenges">${participant.completedChallenges}</div>
          <div class="status ${isActive ? 'online' : 'offline'}"></div>
        </div>
      `;
    }).join('');
  }

  private updateChallenge(): void {
    if (!this.challengeDisplay || !this.currentBattle) return;

    const challenge = this.currentBattle.currentChallenge;
    if (!challenge) {
      this.challengeDisplay.innerHTML = '<p>Waiting for next challenge...</p>';
      return;
    }

    this.challengeDisplay.innerHTML = `
      <div class="challenge-info">
        <h4>${challenge.title}</h4>
        <p class="challenge-desc">${challenge.description}</p>
        <div class="challenge-meta">
          <span class="challenge-type">${challenge.type.toUpperCase()}</span>
          <span class="challenge-reward">+${challenge.energyReward} Energy</span>
        </div>
      </div>
    `;

    // Update challenge timer
    if (challenge.timeLimit) {
      this.startChallengeTimer(challenge.timeLimit);
    }
  }

  private updateTimer(): void {
    if (!this.battleTimer || !this.currentBattle) return;

    const elapsed = Date.now() - this.currentBattle.startTime;
    const remaining = Math.max(0, this.currentBattle.duration - elapsed);
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.battleTimer.textContent = timeString;

    const timeLeftElement = document.getElementById('time-left');
    if (timeLeftElement) {
      timeLeftElement.textContent = timeString;
    }

    // Add warning class when time is low
    if (remaining < 60000) { // Less than 1 minute
      this.battleTimer.classList.add('warning');
    }
  }

  private updateStats(): void {
    if (!this.currentBattle) return;

    const participantCount = document.getElementById('participant-count');
    const challengeCount = document.getElementById('challenge-count');

    if (participantCount) {
      participantCount.textContent = this.currentBattle.participants.size.toString();
    }

    if (challengeCount) {
      const totalChallenges = Array.from(this.currentBattle.participants.values())
        .reduce((sum, p) => sum + p.completedChallenges, 0);
      challengeCount.textContent = totalChallenges.toString();
    }
  }

  private startChallengeTimer(seconds: number): void {
    const timerElement = document.getElementById('challenge-timer');
    if (!timerElement) return;

    let timeLeft = seconds;
    timerElement.textContent = `${timeLeft}s`;

    const interval = setInterval(() => {
      timeLeft--;
      timerElement.textContent = `${timeLeft}s`;
      
      if (timeLeft <= 10) {
        timerElement.classList.add('warning');
      }
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        timerElement.textContent = 'Time Up!';
      }
    }, 1000);
  }

  private showChallengeModal(): void {
    if (!this.currentBattle?.currentChallenge) return;

    // This would integrate with the existing challenge modal
    // For now, we'll emit an event that the main game can listen to
    const event = new CustomEvent('battle-challenge-request', {
      detail: { challenge: this.currentBattle.currentChallenge }
    });
    document.dispatchEvent(event);
  }

  showVictoryScreen(winner: BattleParticipant): void {
    const victoryOverlay = document.createElement('div');
    victoryOverlay.className = 'victory-overlay';
    victoryOverlay.innerHTML = `
      <div class="victory-content">
        <h2>🏆 VICTORY! 🏆</h2>
        <div class="winner-info">
          <h3>${winner.planet.communityName}</h3>
          <p>Wins the Mind War!</p>
          <div class="winner-stats">
            <div class="stat">
              <span class="label">Final Score</span>
              <span class="value">${winner.score}</span>
            </div>
            <div class="stat">
              <span class="label">Challenges Completed</span>
              <span class="value">${winner.completedChallenges}</span>
            </div>
          </div>
        </div>
        <button class="continue-btn" id="victory-continue">Continue</button>
      </div>
    `;

    document.body.appendChild(victoryOverlay);

    // Animate in
    setTimeout(() => {
      victoryOverlay.classList.add('visible');
    }, 10);

    // Setup continue button
    document.getElementById('victory-continue')?.addEventListener('click', () => {
      victoryOverlay.remove();
      this.hide();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.body.contains(victoryOverlay)) {
        victoryOverlay.remove();
        this.hide();
      }
    }, 10000);
  }
} 
   if (remaining < 60000) { // Less than 1 minute
      timerEl.classList.add('warning');
      timeRemainingEl.classList.add('warning');
    }
  }

  private updateLeaderboard(): void {
    const leaderboardEl = document.getElementById('leaderboard-list');
    if (!leaderboardEl || !this.currentBattle) return;

    const participants = Array.from(this.currentBattle.participants.values())
      .sort((a, b) => b.score - a.score);

    leaderboardEl.innerHTML = participants.map((participant, index) => `
      <div class="leaderboard-item ${index === 0 ? 'leader' : ''} ${participant.lastActivity > Date.now() - 30000 ? 'active' : ''}">
        <div class="rank">${index + 1}</div>
        <div class="community">${participant.planet.communityName}</div>
        <div class="score">${participant.score}</div>
        <div class="challenges">${participant.completedChallenges}</div>
        <div class="status ${participant.lastActivity > Date.now() - 10000 ? 'online' : ''}"></div>
      </div>
    `).join('');
  }

  private updateStats(): void {
    if (!this.currentBattle) return;

    const totalEnergyEl = document.getElementById('total-energy');
    const activePlayersEl = document.getElementById('active-players');

    if (totalEnergyEl) {
      const totalEnergy = Array.from(this.currentBattle.participants.values())
        .reduce((sum, p) => sum + p.planet.thoughtEnergy, 0);
      totalEnergyEl.textContent = totalEnergy.toLocaleString();
    }

    if (activePlayersEl) {
      const activePlayers = Array.from(this.currentBattle.participants.values())
        .filter(p => p.lastActivity > Date.now() - 60000).length;
      activePlayersEl.textContent = activePlayers.toString();
    }
  }
}
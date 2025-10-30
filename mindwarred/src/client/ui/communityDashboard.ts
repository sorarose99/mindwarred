import { MindPlanet } from '../game/types';
import { getEvolutionStageName } from '../game/evolution';

export interface CommunityStats {
  totalEnergy: number;
  energyGrowthRate: number;
  contributionsToday: number;
  activeMembers: number;
  evolutionProgress: number;
  battleWins: number;
  battleLosses: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export class CommunityDashboard {
  private dashboardOverlay: HTMLElement | null = null;
  private currentPlanet: MindPlanet | null = null;
  private stats: CommunityStats | null = null;

  show(planet: MindPlanet): void {
    this.currentPlanet = planet;
    this.generateStats(planet);
    this.createDashboard();
  }

  hide(): void {
    if (this.dashboardOverlay) {
      this.dashboardOverlay.classList.add('hidden');
      setTimeout(() => {
        this.dashboardOverlay?.remove();
        this.dashboardOverlay = null;
      }, 300);
    }
  }

  private generateStats(planet: MindPlanet): void {
    // Generate realistic stats based on planet data
    this.stats = {
      totalEnergy: planet.thoughtEnergy,
      energyGrowthRate: Math.floor(planet.thoughtEnergy * 0.1), // 10% growth rate
      contributionsToday: Math.floor(Math.random() * 50) + 10,
      activeMembers: Math.floor(Math.random() * 1000) + 100,
      evolutionProgress: (planet.thoughtEnergy % 500) / 500 * 100,
      battleWins: Math.floor(Math.random() * 20),
      battleLosses: Math.floor(Math.random() * 15),
      achievements: this.generateAchievements(planet)
    };
  }

  private generateAchievements(planet: MindPlanet): Achievement[] {
    const allAchievements: Achievement[] = [
      {
        id: 'first-contribution',
        name: 'First Steps',
        description: 'Made your first contribution to the community',
        icon: '🌱',
        unlockedAt: Date.now() - 86400000,
        rarity: 'common'
      },
      {
        id: 'energy-milestone-100',
        name: 'Power Surge',
        description: 'Reached 100 thought energy',
        icon: '⚡',
        unlockedAt: Date.now() - 3600000,
        rarity: 'common'
      },
      {
        id: 'evolution-developing',
        name: 'Growing Strong',
        description: 'Evolved to Developing stage',
        icon: '🌿',
        unlockedAt: Date.now() - 7200000,
        rarity: 'rare'
      },
      {
        id: 'battle-victor',
        name: 'Mind War Champion',
        description: 'Won your first battle',
        icon: '🏆',
        unlockedAt: Date.now() - 1800000,
        rarity: 'epic'
      },
      {
        id: 'transcendent',
        name: 'Beyond Mortal Limits',
        description: 'Achieved Transcendent evolution',
        icon: '✨',
        unlockedAt: Date.now() - 900000,
        rarity: 'legendary'
      }
    ];

    // Return achievements based on planet progress
    return allAchievements.filter(achievement => {
      switch (achievement.id) {
        case 'energy-milestone-100':
          return planet.thoughtEnergy >= 100;
        case 'evolution-developing':
          return planet.evolutionStage >= 1;
        case 'transcendent':
          return planet.evolutionStage >= 4;
        default:
          return true;
      }
    });
  }

  private createDashboard(): void {
    if (!this.currentPlanet || !this.stats) return;

    this.dashboardOverlay = document.createElement('div');
    this.dashboardOverlay.className = 'community-dashboard';
    this.dashboardOverlay.innerHTML = `
      <div class="dashboard-content">
        <div class="dashboard-header">
          <h2>${this.currentPlanet.communityName} Dashboard</h2>
          <button class="close-btn" id="dashboard-close">×</button>
        </div>
        
        <div class="dashboard-body">
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon">🧠</div>
              <div class="stat-info">
                <div class="stat-value">${this.stats.totalEnergy.toLocaleString()}</div>
                <div class="stat-label">Total Energy</div>
                <div class="stat-change">+${this.stats.energyGrowthRate}/day</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-value">${this.stats.activeMembers.toLocaleString()}</div>
                <div class="stat-label">Active Members</div>
                <div class="stat-change">${this.stats.contributionsToday} contributions today</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🌟</div>
              <div class="stat-info">
                <div class="stat-value">${getEvolutionStageName(this.currentPlanet.evolutionStage)}</div>
                <div class="stat-label">Evolution Stage</div>
                <div class="stat-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.stats.evolutionProgress}%"></div>
                  </div>
                  <span>${Math.round(this.stats.evolutionProgress)}% to next stage</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">⚔️</div>
              <div class="stat-info">
                <div class="stat-value">${this.stats.battleWins}W / ${this.stats.battleLosses}L</div>
                <div class="stat-label">Battle Record</div>
                <div class="stat-change">${Math.round(this.stats.battleWins / (this.stats.battleWins + this.stats.battleLosses) * 100)}% win rate</div>
              </div>
            </div>
          </div>
          
          <div class="dashboard-sections">
            <div class="achievements-section">
              <h3>🏆 Achievements</h3>
              <div class="achievements-grid">
                ${this.renderAchievements()}
              </div>
            </div>
            
            <div class="activity-section">
              <h3>📊 Recent Activity</h3>
              <div class="activity-feed">
                ${this.renderActivityFeed()}
              </div>
            </div>
            
            <div class="leaderboard-section">
              <h3>🥇 Community Ranking</h3>
              <div class="ranking-info">
                <div class="rank-display">
                  <span class="rank-number">#${Math.floor(Math.random() * 10) + 1}</span>
                  <span class="rank-label">Global Rank</span>
                </div>
                <div class="rank-details">
                  <div class="rank-stat">
                    <span class="label">Energy Rank:</span>
                    <span class="value">#${Math.floor(Math.random() * 15) + 1}</span>
                  </div>
                  <div class="rank-stat">
                    <span class="label">Battle Rank:</span>
                    <span class="value">#${Math.floor(Math.random() * 20) + 1}</span>
                  </div>
                  <div class="rank-stat">
                    <span class="label">Growth Rank:</span>
                    <span class="value">#${Math.floor(Math.random() * 12) + 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="dashboard-actions">
            <button class="action-btn primary" id="customize-planet">
              🎨 Customize Planet
            </button>
            <button class="action-btn" id="view-analytics">
              📈 View Analytics
            </button>
            <button class="action-btn" id="export-data">
              📤 Export Data
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.dashboardOverlay);
    this.setupEventListeners();

    // Animate in
    setTimeout(() => {
      this.dashboardOverlay?.classList.add('visible');
    }, 10);
  }

  private renderAchievements(): string {
    if (!this.stats) return '';

    return this.stats.achievements.map(achievement => `
      <div class="achievement-card ${achievement.rarity}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-desc">${achievement.description}</div>
          <div class="achievement-date">${new Date(achievement.unlockedAt).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
  }

  private renderActivityFeed(): string {
    const activities = [
      { type: 'contribution', message: 'Community contributed 150 energy', time: '2 hours ago' },
      { type: 'evolution', message: 'Planet evolved to next stage!', time: '1 day ago' },
      { type: 'battle', message: 'Won battle against r/funny', time: '3 hours ago' },
      { type: 'achievement', message: 'Unlocked "Power Surge" achievement', time: '5 hours ago' },
      { type: 'member', message: '25 new members joined', time: '1 day ago' }
    ];

    return activities.map(activity => `
      <div class="activity-item ${activity.type}">
        <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
        <div class="activity-content">
          <div class="activity-message">${activity.message}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  private getActivityIcon(type: string): string {
    switch (type) {
      case 'contribution': return '🧠';
      case 'evolution': return '🌟';
      case 'battle': return '⚔️';
      case 'achievement': return '🏆';
      case 'member': return '👥';
      default: return '📝';
    }
  }

  private setupEventListeners(): void {
    const closeBtn = document.getElementById('dashboard-close');
    const customizeBtn = document.getElementById('customize-planet');
    const analyticsBtn = document.getElementById('view-analytics');
    const exportBtn = document.getElementById('export-data');

    closeBtn?.addEventListener('click', () => {
      this.hide();
    });

    customizeBtn?.addEventListener('click', () => {
      this.showCustomizationPanel();
    });

    analyticsBtn?.addEventListener('click', () => {
      this.showAnalytics();
    });

    exportBtn?.addEventListener('click', () => {
      this.exportCommunityData();
    });

    // Close on background click
    this.dashboardOverlay?.addEventListener('click', (e) => {
      if (e.target === this.dashboardOverlay) {
        this.hide();
      }
    });
  }

  private showCustomizationPanel(): void {
    // Emit event for customization panel
    const event = new CustomEvent('show-planet-customization', {
      detail: { planet: this.currentPlanet }
    });
    document.dispatchEvent(event);
  }

  private showAnalytics(): void {
    if (!this.currentPlanet || !this.stats) return;

    const analyticsModal = document.createElement('div');
    analyticsModal.className = 'analytics-modal';
    analyticsModal.innerHTML = `
      <div class="analytics-content">
        <h3>📈 Community Analytics</h3>
        <div class="analytics-charts">
          <div class="chart-container">
            <h4>Energy Growth (Last 7 Days)</h4>
            <div class="mock-chart">
              <div class="chart-bars">
                ${Array.from({length: 7}, (_, i) => `
                  <div class="chart-bar" style="height: ${Math.random() * 80 + 20}%"></div>
                `).join('')}
              </div>
              <div class="chart-labels">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>
          
          <div class="chart-container">
            <h4>Member Activity</h4>
            <div class="activity-stats">
              <div class="activity-stat">
                <span class="stat-number">${this.stats.contributionsToday}</span>
                <span class="stat-label">Today</span>
              </div>
              <div class="activity-stat">
                <span class="stat-number">${this.stats.contributionsToday * 7}</span>
                <span class="stat-label">This Week</span>
              </div>
              <div class="activity-stat">
                <span class="stat-number">${this.stats.contributionsToday * 30}</span>
                <span class="stat-label">This Month</span>
              </div>
            </div>
          </div>
        </div>
        <button class="close-analytics">Close</button>
      </div>
    `;

    document.body.appendChild(analyticsModal);

    analyticsModal.querySelector('.close-analytics')?.addEventListener('click', () => {
      analyticsModal.remove();
    });

    setTimeout(() => analyticsModal.classList.add('visible'), 10);
  }

  private exportCommunityData(): void {
    if (!this.currentPlanet || !this.stats) return;

    const data = {
      community: this.currentPlanet.communityName,
      stats: this.stats,
      exportedAt: new Date().toISOString(),
      planetData: {
        id: this.currentPlanet.id,
        thoughtEnergy: this.currentPlanet.thoughtEnergy,
        evolutionStage: this.currentPlanet.evolutionStage,
        features: this.currentPlanet.features
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentPlanet.communityName.replace('/', '')}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'export-success';
    successMsg.textContent = 'Community data exported successfully!';
    document.body.appendChild(successMsg);

    setTimeout(() => {
      successMsg.remove();
    }, 3000);
  }
}
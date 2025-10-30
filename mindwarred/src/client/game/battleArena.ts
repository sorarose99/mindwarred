import * as THREE from 'three';
import { MindPlanet } from './types';
import { Challenge, challengeGenerator, ChallengeResult } from './challenges';

export interface BattleParticipant {
  planetId: string;
  planet: MindPlanet;
  score: number;
  completedChallenges: number;
  lastActivity: number;
}

export interface BattleState {
  id: string;
  participants: Map<string, BattleParticipant>;
  currentChallenge: Challenge | null;
  startTime: number;
  duration: number; // in milliseconds
  status: 'waiting' | 'active' | 'completed';
  winner: string | null;
}

export class BattleArena {
  private battleState: BattleState | null = null;
  private battleEffects: THREE.Group[] = [];
  private scene: THREE.Scene;
  private onBattleUpdate?: (state: BattleState) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  startBattle(planets: MindPlanet[], duration: number = 300000): BattleState {
    // Create new battle state
    this.battleState = {
      id: `battle-${Date.now()}`,
      participants: new Map(),
      currentChallenge: null,
      startTime: Date.now(),
      duration,
      status: 'active',
      winner: null
    };

    // Add participants
    planets.forEach(planet => {
      this.battleState!.participants.set(planet.id, {
        planetId: planet.id,
        planet,
        score: 0,
        completedChallenges: 0,
        lastActivity: Date.now()
      });
    });

    // Generate first challenge
    this.generateBattleChallenge();

    // Start battle effects
    this.startBattleEffects();

    // Set battle timer
    setTimeout(() => {
      this.endBattle();
    }, duration);

    return this.battleState;
  }

  private generateBattleChallenge(): void {
    if (!this.battleState) return;

    // Generate a challenge suitable for battle (shorter, more competitive)
    this.battleState.currentChallenge = challengeGenerator.generateChallenge();
    
    // Reduce time limit for battle pace
    if (this.battleState.currentChallenge.timeLimit) {
      this.battleState.currentChallenge.timeLimit = Math.min(
        this.battleState.currentChallenge.timeLimit, 
        60 // Max 60 seconds in battle
      );
    } else {
      this.battleState.currentChallenge.timeLimit = 45; // Default 45 seconds
    }

    // Notify about new challenge
    this.onBattleUpdate?.(this.battleState);
  }

  submitBattleChallenge(planetId: string, answer: string | number): ChallengeResult | null {
    if (!this.battleState || !this.battleState.currentChallenge) return null;

    const participant = this.battleState.participants.get(planetId);
    if (!participant) return null;

    // Evaluate challenge
    const result = challengeGenerator.evaluateChallenge(
      this.battleState.currentChallenge, 
      answer
    );

    // Update participant score
    participant.score += result.score;
    participant.completedChallenges++;
    participant.lastActivity = Date.now();

    // Create battle effect for this submission
    this.createBattleSubmissionEffect(participant.planet, result.success);

    // Check if we should generate next challenge
    const completedCount = Array.from(this.battleState.participants.values())
      .filter(p => p.lastActivity > Date.now() - 60000).length; // Active in last minute

    if (completedCount >= Math.min(3, this.battleState.participants.size)) {
      // Generate next challenge after short delay
      setTimeout(() => {
        this.generateBattleChallenge();
      }, 3000);
    }

    this.onBattleUpdate?.(this.battleState);
    return result;
  }

  private startBattleEffects(): void {
    if (!this.battleState) return;

    // Create energy field around all participating planets
    this.battleState.participants.forEach(participant => {
      this.createBattleAura(participant.planet);
    });

    // Create connecting energy beams between planets
    this.createBattleConnections();
  }

  private createBattleAura(planet: MindPlanet): void {
    const auraGeo = new THREE.SphereGeometry(15, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });

    const aura = new THREE.Mesh(auraGeo, auraMat);
    planet.group.add(aura);

    // Animate aura pulsing
    const startTime = Date.now();
    const animateAura = () => {
      if (!this.battleState || this.battleState.status !== 'active') {
        planet.group.remove(aura);
        return;
      }

      const elapsed = Date.now() - startTime;
      const pulse = 1 + Math.sin(elapsed * 0.003) * 0.2;
      aura.scale.setScalar(pulse);
      auraMat.opacity = 0.05 + Math.sin(elapsed * 0.005) * 0.05;

      requestAnimationFrame(animateAura);
    };

    animateAura();
  }

  private createBattleConnections(): void {
    if (!this.battleState) return;

    const planets = Array.from(this.battleState.participants.values());
    
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        this.createEnergyBeam(planets[i].planet, planets[j].planet);
      }
    }
  }

  private createEnergyBeam(planet1: MindPlanet, planet2: MindPlanet): void {
    const points = [planet1.position, planet2.position];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    const beam = new THREE.Line(geometry, material);
    
    const effectGroup = new THREE.Group();
    effectGroup.add(beam);
    this.scene.add(effectGroup);
    this.battleEffects.push(effectGroup);

    // Animate beam intensity
    const startTime = Date.now();
    const animateBeam = () => {
      if (!this.battleState || this.battleState.status !== 'active') {
        this.scene.remove(effectGroup);
        return;
      }

      const elapsed = Date.now() - startTime;
      material.opacity = 0.2 + Math.sin(elapsed * 0.01) * 0.2;

      requestAnimationFrame(animateBeam);
    };

    animateBeam();
  }

  private createBattleSubmissionEffect(planet: MindPlanet, success: boolean): void {
    const color = success ? 0x00ff88 : 0xff6b35;
    const particleCount = success ? 30 : 15;

    // Create burst effect
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);

      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 12;
      particle.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * 6
      );

      particles.add(particle);
    }

    planet.group.add(particles);

    // Animate particles
    const startTime = Date.now();
    const animateParticles = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 2000; // 2 second animation

      if (progress < 1) {
        particles.children.forEach(particle => {
          particle.position.multiplyScalar(1.08);
          const material = (particle as THREE.Mesh).material as THREE.MeshBasicMaterial;
          material.opacity = 0.8 * (1 - progress);
        });

        requestAnimationFrame(animateParticles);
      } else {
        planet.group.remove(particles);
      }
    };

    animateParticles();
  }

  private endBattle(): void {
    if (!this.battleState) return;

    this.battleState.status = 'completed';

    // Determine winner
    let maxScore = 0;
    let winner = null;

    this.battleState.participants.forEach((participant, planetId) => {
      if (participant.score > maxScore) {
        maxScore = participant.score;
        winner = planetId;
      }
    });

    this.battleState.winner = winner;

    // Clean up battle effects
    this.battleEffects.forEach(effect => {
      this.scene.remove(effect);
    });
    this.battleEffects = [];

    // Create victory effect for winner
    if (winner) {
      const winnerParticipant = this.battleState.participants.get(winner);
      if (winnerParticipant) {
        this.createVictoryEffect(winnerParticipant.planet);
      }
    }

    this.onBattleUpdate?.(this.battleState);
  }

  private createVictoryEffect(planet: MindPlanet): void {
    // Create golden victory aura
    const victoryGeo = new THREE.SphereGeometry(20, 32, 32);
    const victoryMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });

    const victoryAura = new THREE.Mesh(victoryGeo, victoryMat);
    planet.group.add(victoryAura);

    // Animate victory effect
    const startTime = Date.now();
    const animateVictory = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 5000; // 5 second effect

      if (progress < 1) {
        const pulse = 1 + Math.sin(elapsed * 0.01) * 0.3;
        victoryAura.scale.setScalar(pulse);
        victoryMat.opacity = 0.3 * (1 - progress * 0.5);

        requestAnimationFrame(animateVictory);
      } else {
        planet.group.remove(victoryAura);
      }
    };

    animateVictory();
  }

  getCurrentBattle(): BattleState | null {
    return this.battleState;
  }

  setBattleUpdateCallback(callback: (state: BattleState) => void): void {
    this.onBattleUpdate = callback;
  }

  isInBattle(): boolean {
    return this.battleState?.status === 'active';
  }

  getBattleLeaderboard(): BattleParticipant[] {
    if (!this.battleState) return [];

    return Array.from(this.battleState.participants.values())
      .sort((a, b) => b.score - a.score);
  }


}
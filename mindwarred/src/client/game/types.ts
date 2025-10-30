import * as THREE from 'three';

export enum EvolutionStage {
  NASCENT = 0,      // 0-499 energy - Small, dim planet
  DEVELOPING = 1,   // 500-999 energy - Growing, brighter
  THRIVING = 2,     // 1000-1999 energy - Large, vibrant
  ADVANCED = 3,     // 2000-2999 energy - Complex features
  TRANSCENDENT = 4  // 3000+ energy - Glowing, ethereal
}

export interface PlanetFeatures {
  hasRings: boolean;
  hasMoons: boolean;
  hasAurora: boolean;
  hasEnergyField: boolean;
  ringCount: number;
  moonCount: number;
}

export interface MindPlanet {
  id: string;
  communityName: string;
  mesh: THREE.Mesh;
  group: THREE.Group;
  thoughtEnergy: number;
  evolutionStage: EvolutionStage;
  position: THREE.Vector3;
  targetScale: number;
  currentScale: number;
  lastContribution: number;
  features: PlanetFeatures;
  rings: THREE.Mesh[];
  moons: THREE.Mesh[];
  energyField?: THREE.Mesh;
}

export interface GameState {
  planets: Map<string, MindPlanet>;
  selectedPlanet: MindPlanet | null;
  battleMode: boolean;
  totalEnergy: number;
}
import * as THREE from 'three';
import { MindPlanet, EvolutionStage } from './types';

export function getEvolutionStage(energy: number): EvolutionStage {
  if (energy >= 3000) return EvolutionStage.TRANSCENDENT;
  if (energy >= 2000) return EvolutionStage.ADVANCED;
  if (energy >= 1000) return EvolutionStage.THRIVING;
  if (energy >= 500) return EvolutionStage.DEVELOPING;
  return EvolutionStage.NASCENT;
}

export function getEvolutionStageName(stage: EvolutionStage): string {
  switch (stage) {
    case EvolutionStage.NASCENT: return 'Nascent';
    case EvolutionStage.DEVELOPING: return 'Developing';
    case EvolutionStage.THRIVING: return 'Thriving';
    case EvolutionStage.ADVANCED: return 'Advanced';
    case EvolutionStage.TRANSCENDENT: return 'Transcendent';
    default: return 'Unknown';
  }
}

export function applyEvolutionFeatures(planet: MindPlanet): void {
  const stage = planet.evolutionStage;

  // Clear existing features
  planet.rings.forEach(ring => planet.group.remove(ring));
  planet.moons.forEach(moon => planet.group.remove(moon));
  if (planet.energyField) planet.group.remove(planet.energyField);

  planet.rings = [];
  planet.moons = [];
  delete planet.energyField;

  // Apply features based on evolution stage
  switch (stage) {
    case EvolutionStage.DEVELOPING:
      addPlanetRings(planet, 1);
      break;
    case EvolutionStage.THRIVING:
      addPlanetRings(planet, 2);
      addPlanetMoons(planet, 1);
      break;
    case EvolutionStage.ADVANCED:
      addPlanetRings(planet, 3);
      addPlanetMoons(planet, 2);
      addEnergyField(planet);
      break;
    case EvolutionStage.TRANSCENDENT:
      addPlanetRings(planet, 4);
      addPlanetMoons(planet, 3);
      addEnergyField(planet);
      addAuroraEffect(planet);
      break;
  }
}

function addPlanetRings(planet: MindPlanet, count: number): void {
  const hue = (planet.id.charCodeAt(0) * 137.5) % 360;

  for (let i = 0; i < count; i++) {
    const innerRadius = 10 + (i * 2);
    const outerRadius = innerRadius + 1.5;

    const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue / 360, 0.6, 0.7),
      transparent: true,
      opacity: 0.4 - (i * 0.1),
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    ring.rotation.z = (Math.random() - 0.5) * 0.2;

    planet.group.add(ring);
    planet.rings.push(ring);
  }

  planet.features.hasRings = true;
  planet.features.ringCount = count;
}

function addPlanetMoons(planet: MindPlanet, count: number): void {
  const hue = (planet.id.charCodeAt(0) * 137.5) % 360;

  for (let i = 0; i < count; i++) {
    const moonGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const moonMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL((hue + 60) / 360, 0.4, 0.6),
      shininess: 10
    });

    const moon = new THREE.Mesh(moonGeo, moonMat);
    const distance = 15 + (i * 5);
    const angle = (i / count) * Math.PI * 2;

    moon.position.set(
      Math.cos(angle) * distance,
      (Math.random() - 0.5) * 4,
      Math.sin(angle) * distance
    );

    planet.group.add(moon);
    planet.moons.push(moon);
  }

  planet.features.hasMoons = true;
  planet.features.moonCount = count;
}

function addEnergyField(planet: MindPlanet): void {
  const fieldGeo = new THREE.SphereGeometry(12, 32, 32);
  const fieldMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.1,
    wireframe: true
  });

  const energyField = new THREE.Mesh(fieldGeo, fieldMat);
  planet.group.add(energyField);
  planet.energyField = energyField;
  planet.features.hasEnergyField = true;
}

function addAuroraEffect(planet: MindPlanet): void {
  // Create aurora-like particle system
  const auroraGeo = new THREE.RingGeometry(9, 11, 32);
  const auroraMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });

  const aurora = new THREE.Mesh(auroraGeo, auroraMat);
  aurora.rotation.x = Math.PI / 2;
  planet.group.add(aurora);

  planet.features.hasAurora = true;
}
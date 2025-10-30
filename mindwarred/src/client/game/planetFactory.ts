import * as THREE from 'three';
import { CommunityData } from '../../shared/types/api';
import { MindPlanet, EvolutionStage } from './types';
import { getEvolutionStage } from './evolution';

export function createMindPlanet(community: CommunityData, scene: THREE.Scene): MindPlanet {
  const planetGeo = new THREE.SphereGeometry(12, 32, 32); // Made bigger

  // Create unique materials based on community energy and type
  const hue = (community.id.charCodeAt(0) * 137.5) % 360; // Unique color per community
  const saturation = Math.min(0.7, community.thoughtEnergy / 2000);
  const lightness = 0.4 + (community.thoughtEnergy / 5000) * 0.3;

  const planetMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color().setHSL(hue / 360, saturation, lightness),
    shininess: 30 + (community.thoughtEnergy / 100),
    transparent: true,
    opacity: 0.9
  });

  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  const planetGroup = new THREE.Group();
  planetGroup.add(planetMesh);
  planetGroup.position.set(community.position.x, community.position.y, community.position.z);

  // Add atmosphere effect
  const atmosphereGeo = new THREE.SphereGeometry(12.5, 16, 16); // Made bigger to match planet
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(hue / 360, 0.8, 0.6),
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  planetGroup.add(atmosphere);

  scene.add(planetGroup);

  const planet: MindPlanet = {
    id: community.id,
    communityName: community.name,
    mesh: planetMesh,
    group: planetGroup,
    thoughtEnergy: community.thoughtEnergy,
    evolutionStage: getEvolutionStage(community.thoughtEnergy),
    position: new THREE.Vector3(community.position.x, community.position.y, community.position.z),
    targetScale: 1 + (community.thoughtEnergy / 2000),
    currentScale: 1,
    lastContribution: 0,
    features: {
      hasRings: false,
      hasMoons: false,
      hasAurora: false,
      hasEnergyField: false,
      ringCount: 0,
      moonCount: 0
    },
    rings: [],
    moons: []
  };

  return planet;
}

export function addStar(scene: THREE.Scene): void {
  const starGeo = new THREE.SphereGeometry(0.25, 24, 24);
  const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(starGeo, starMat);

  const x = THREE.MathUtils.randFloatSpread(200);
  const y = THREE.MathUtils.randFloatSpread(200);
  const z = THREE.MathUtils.randFloatSpread(200);
  star.position.set(x, y, z);
  scene.add(star);
}
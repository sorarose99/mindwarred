import * as THREE from 'three';
import { MindPlanet, EvolutionStage } from './types';
import { getEvolutionStageName } from './evolution';

export function createContributionEffect(planet: MindPlanet): void {
  // Create particle burst effect
  const particleCount = 20;
  const particles = new THREE.Group();

  for (let i = 0; i < particleCount; i++) {
    const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const particle = new THREE.Mesh(particleGeo, particleMat);

    // Random position around planet
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 10;
    particle.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (Math.random() - 0.5) * 4
    );

    particles.add(particle);
  }

  planet.group.add(particles);

  // Animate particles outward and fade
  const startTime = Date.now();
  const animateParticles = () => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / 1000; // 1 second animation

    if (progress < 1) {
      particles.children.forEach((particle) => {
        const mesh = particle as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;

        // Move outward
        particle.position.multiplyScalar(1.05);

        // Fade out
        material.opacity = 0.8 * (1 - progress);
      });

      requestAnimationFrame(animateParticles);
    } else {
      planet.group.remove(particles);
    }
  };

  animateParticles();
}

export function createEvolutionEffect(
  planet: MindPlanet, 
  oldStage: EvolutionStage, 
  newStage: EvolutionStage,
  titleElement: HTMLHeadingElement,
  gameState: any
): void {
  // Create multiple ring expansion effects for dramatic evolution
  const ringCount = newStage - oldStage;

  for (let i = 0; i < Math.max(1, ringCount); i++) {
    setTimeout(() => {
      createEvolutionRing(planet, i);
    }, i * 300);
  }

  // Update UI with evolution announcement
  titleElement.textContent = `🌟 ${planet.communityName} evolved to ${getEvolutionStageName(newStage)}! 🌟`;

  // Reset title after 3 seconds
  setTimeout(() => {
    if (gameState.selectedPlanet === planet) {
      titleElement.textContent = `Contributing to ${planet.communityName}`;
    } else {
      titleElement.textContent = 'Reddit Mind Wars';
    }
  }, 3000);
}

function createEvolutionRing(planet: MindPlanet, ringIndex: number): void {
  const ringGeo = new THREE.RingGeometry(8 + ringIndex, 12 + ringIndex, 32);
  const colors = [0xffd700, 0xff6b35, 0x00ff88, 0x4a90e2, 0xff00ff];
  const color = colors[planet.evolutionStage] || 0xffd700;

  const ringMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;

  planet.group.add(ring);

  // Animate ring expansion with more dramatic effect
  const startTime = Date.now();
  const animateRing = () => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / 3000; // 3 second animation

    if (progress < 1) {
      const scale = 1 + progress * 4;
      ring.scale.setScalar(scale);
      ringMat.opacity = 0.8 * (1 - progress);

      // Add rotation for more dynamic effect
      ring.rotation.z += 0.02;

      requestAnimationFrame(animateRing);
    } else {
      planet.group.remove(ring);
    }
  };

  animateRing();
}

export function createLightningEffect(planet1: MindPlanet, planet2: MindPlanet, scene: THREE.Scene): void {
  const points = [planet1.position, planet2.position];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8
  });
  const lightning = new THREE.Line(geometry, material);
  scene.add(lightning);

  // Remove lightning after short duration
  setTimeout(() => {
    scene.remove(lightning);
  }, 200);
}
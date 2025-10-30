import * as THREE from 'three';
import { MindPlanet, EvolutionStage } from './types';

export interface CustomizationOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  requiredStage: EvolutionStage;
  category: 'color' | 'texture' | 'effect' | 'feature';
  unlocked: boolean;
}

export interface ColorScheme {
  primary: number;
  secondary: number;
  accent: number;
  atmosphere: number;
}

export interface PlanetCustomization {
  colorScheme: ColorScheme;
  textureType: string;
  effectType: string;
  specialFeatures: string[];
}

export class PlanetCustomizationSystem {
  private customizationOptions: Map<string, CustomizationOption> = new Map();
  private planetCustomizations: Map<string, PlanetCustomization> = new Map();

  constructor() {
    this.initializeCustomizationOptions();
  }

  private initializeCustomizationOptions(): void {
    const options: CustomizationOption[] = [
      // Color Schemes
      {
        id: 'classic-blue',
        name: 'Classic Blue',
        description: 'Traditional blue planet with white clouds',
        cost: 0,
        requiredStage: EvolutionStage.NASCENT,
        category: 'color',
        unlocked: true
      },
      {
        id: 'fire-world',
        name: 'Fire World',
        description: 'Molten red and orange volcanic planet',
        cost: 100,
        requiredStage: EvolutionStage.DEVELOPING,
        category: 'color',
        unlocked: false
      },
      {
        id: 'ice-world',
        name: 'Ice World',
        description: 'Frozen blue and white crystalline planet',
        cost: 150,
        requiredStage: EvolutionStage.DEVELOPING,
        category: 'color',
        unlocked: false
      },
      {
        id: 'forest-world',
        name: 'Forest World',
        description: 'Lush green planet with deep forests',
        cost: 200,
        requiredStage: EvolutionStage.THRIVING,
        category: 'color',
        unlocked: false
      },
      {
        id: 'crystal-world',
        name: 'Crystal World',
        description: 'Prismatic crystal planet with rainbow effects',
        cost: 500,
        requiredStage: EvolutionStage.ADVANCED,
        category: 'color',
        unlocked: false
      },
      {
        id: 'void-world',
        name: 'Void World',
        description: 'Dark matter planet with purple energy',
        cost: 1000,
        requiredStage: EvolutionStage.TRANSCENDENT,
        category: 'color',
        unlocked: false
      },

      // Texture Types
      {
        id: 'smooth-surface',
        name: 'Smooth Surface',
        description: 'Clean, polished planetary surface',
        cost: 0,
        requiredStage: EvolutionStage.NASCENT,
        category: 'texture',
        unlocked: true
      },
      {
        id: 'rocky-terrain',
        name: 'Rocky Terrain',
        description: 'Rugged mountainous surface',
        cost: 75,
        requiredStage: EvolutionStage.DEVELOPING,
        category: 'texture',
        unlocked: false
      },
      {
        id: 'city-lights',
        name: 'City Lights',
        description: 'Urban civilization with glowing cities',
        cost: 300,
        requiredStage: EvolutionStage.THRIVING,
        category: 'texture',
        unlocked: false
      },
      {
        id: 'energy-grid',
        name: 'Energy Grid',
        description: 'Advanced energy network across surface',
        cost: 750,
        requiredStage: EvolutionStage.ADVANCED,
        category: 'texture',
        unlocked: false
      },

      // Special Effects
      {
        id: 'aurora-borealis',
        name: 'Aurora Borealis',
        description: 'Beautiful northern lights around planet',
        cost: 250,
        requiredStage: EvolutionStage.THRIVING,
        category: 'effect',
        unlocked: false
      },
      {
        id: 'energy-storms',
        name: 'Energy Storms',
        description: 'Lightning storms crackling around planet',
        cost: 400,
        requiredStage: EvolutionStage.ADVANCED,
        category: 'effect',
        unlocked: false
      },
      {
        id: 'quantum-field',
        name: 'Quantum Field',
        description: 'Reality-bending quantum effects',
        cost: 800,
        requiredStage: EvolutionStage.TRANSCENDENT,
        category: 'effect',
        unlocked: false
      },

      // Special Features
      {
        id: 'space-elevator',
        name: 'Space Elevator',
        description: 'Massive structure reaching into space',
        cost: 500,
        requiredStage: EvolutionStage.ADVANCED,
        category: 'feature',
        unlocked: false
      },
      {
        id: 'orbital-ring',
        name: 'Orbital Ring',
        description: 'Artificial ring structure around planet',
        cost: 600,
        requiredStage: EvolutionStage.ADVANCED,
        category: 'feature',
        unlocked: false
      },
      {
        id: 'dyson-swarm',
        name: 'Dyson Swarm',
        description: 'Solar collectors orbiting the planet',
        cost: 1200,
        requiredStage: EvolutionStage.TRANSCENDENT,
        category: 'feature',
        unlocked: false
      }
    ];

    options.forEach(option => {
      this.customizationOptions.set(option.id, option);
    });
  }

  getAvailableOptions(planet: MindPlanet): CustomizationOption[] {
    return Array.from(this.customizationOptions.values())
      .filter(option => 
        option.requiredStage <= planet.evolutionStage &&
        (option.unlocked || planet.thoughtEnergy >= option.cost)
      );
  }

  getCustomizationsByCategory(planet: MindPlanet): Record<string, CustomizationOption[]> {
    const available = this.getAvailableOptions(planet);
    const categories: Record<string, CustomizationOption[]> = {
      color: [],
      texture: [],
      effect: [],
      feature: []
    };

    available.forEach(option => {
      categories[option.category].push(option);
    });

    return categories;
  }

  applyCustomization(planet: MindPlanet, optionId: string): boolean {
    const option = this.customizationOptions.get(optionId);
    if (!option) return false;

    // Check requirements
    if (option.requiredStage > planet.evolutionStage) return false;
    if (!option.unlocked && planet.thoughtEnergy < option.cost) return false;

    // Deduct cost if not already unlocked
    if (!option.unlocked) {
      planet.thoughtEnergy -= option.cost;
      option.unlocked = true;
    }

    // Get or create customization for this planet
    let customization = this.planetCustomizations.get(planet.id);
    if (!customization) {
      customization = this.getDefaultCustomization(planet);
      this.planetCustomizations.set(planet.id, customization);
    }

    // Apply the customization
    switch (option.category) {
      case 'color':
        this.applyColorScheme(planet, option.id);
        break;
      case 'texture':
        this.applyTexture(planet, option.id);
        customization.textureType = option.id;
        break;
      case 'effect':
        this.applyEffect(planet, option.id);
        customization.effectType = option.id;
        break;
      case 'feature':
        this.applyFeature(planet, option.id);
        if (!customization.specialFeatures.includes(option.id)) {
          customization.specialFeatures.push(option.id);
        }
        break;
    }

    return true;
  }

  private getDefaultCustomization(planet: MindPlanet): PlanetCustomization {
    const hue = (planet.id.charCodeAt(0) * 137.5) % 360;
    return {
      colorScheme: {
        primary: new THREE.Color().setHSL(hue / 360, 0.7, 0.5).getHex(),
        secondary: new THREE.Color().setHSL((hue + 60) / 360, 0.5, 0.7).getHex(),
        accent: new THREE.Color().setHSL((hue + 120) / 360, 0.8, 0.6).getHex(),
        atmosphere: new THREE.Color().setHSL(hue / 360, 0.8, 0.6).getHex()
      },
      textureType: 'smooth-surface',
      effectType: '',
      specialFeatures: []
    };
  }

  private applyColorScheme(planet: MindPlanet, schemeId: string): void {
    const material = planet.mesh.material as THREE.MeshPhongMaterial;
    let colorScheme: ColorScheme;

    switch (schemeId) {
      case 'fire-world':
        colorScheme = {
          primary: 0xff4500,
          secondary: 0xff6b35,
          accent: 0xffd700,
          atmosphere: 0xff8c00
        };
        break;
      case 'ice-world':
        colorScheme = {
          primary: 0x87ceeb,
          secondary: 0xb0e0e6,
          accent: 0xffffff,
          atmosphere: 0xe0ffff
        };
        break;
      case 'forest-world':
        colorScheme = {
          primary: 0x228b22,
          secondary: 0x32cd32,
          accent: 0x90ee90,
          atmosphere: 0x98fb98
        };
        break;
      case 'crystal-world':
        colorScheme = {
          primary: 0x9370db,
          secondary: 0xba55d3,
          accent: 0xdda0dd,
          atmosphere: 0xe6e6fa
        };
        break;
      case 'void-world':
        colorScheme = {
          primary: 0x2f1b69,
          secondary: 0x4b0082,
          accent: 0x8a2be2,
          atmosphere: 0x9932cc
        };
        break;
      default: // classic-blue
        colorScheme = {
          primary: 0x4169e1,
          secondary: 0x6495ed,
          accent: 0x87ceeb,
          atmosphere: 0xb0c4de
        };
    }

    // Apply colors
    material.color.setHex(colorScheme.primary);
    
    // Update atmosphere
    const atmosphere = planet.group.children.find(child => 
      child !== planet.mesh && (child as THREE.Mesh).material
    ) as THREE.Mesh;
    
    if (atmosphere) {
      const atmosphereMaterial = atmosphere.material as THREE.MeshBasicMaterial;
      atmosphereMaterial.color.setHex(colorScheme.atmosphere);
    }

    // Store customization
    const customization = this.planetCustomizations.get(planet.id) || this.getDefaultCustomization(planet);
    customization.colorScheme = colorScheme;
    this.planetCustomizations.set(planet.id, customization);
  }

  private applyTexture(planet: MindPlanet, textureId: string): void {
    const material = planet.mesh.material as THREE.MeshPhongMaterial;

    switch (textureId) {
      case 'rocky-terrain':
        material.roughness = 0.8;
        material.metalness = 0.1;
        break;
      case 'city-lights':
        material.emissive.setHex(0x444444);
        this.addCityLights(planet);
        break;
      case 'energy-grid':
        material.emissive.setHex(0x00ffff);
        this.addEnergyGrid(planet);
        break;
      default: // smooth-surface
        material.roughness = 0.2;
        material.metalness = 0.0;
        material.emissive.setHex(0x000000);
    }
  }

  private applyEffect(planet: MindPlanet, effectId: string): void {
    switch (effectId) {
      case 'aurora-borealis':
        this.addAuroraEffect(planet);
        break;
      case 'energy-storms':
        this.addEnergyStorms(planet);
        break;
      case 'quantum-field':
        this.addQuantumField(planet);
        break;
    }
  }

  private applyFeature(planet: MindPlanet, featureId: string): void {
    switch (featureId) {
      case 'space-elevator':
        this.addSpaceElevator(planet);
        break;
      case 'orbital-ring':
        this.addOrbitalRing(planet);
        break;
      case 'dyson-swarm':
        this.addDysonSwarm(planet);
        break;
    }
  }

  private addCityLights(planet: MindPlanet): void {
    // Add small glowing points across the surface
    const lightCount = 20;
    const lights = new THREE.Group();

    for (let i = 0; i < lightCount; i++) {
      const lightGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      const light = new THREE.Mesh(lightGeo, lightMat);

      // Random position on surface
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = 8.2;

      light.position.set(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
      );

      lights.add(light);
    }

    planet.group.add(lights);
  }

  private addEnergyGrid(planet: MindPlanet): void {
    // Add glowing grid lines
    const gridLines = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6
    });

    // Create latitude lines
    for (let i = 0; i < 6; i++) {
      const points = [];
      const y = (i - 2.5) * 3;
      const radius = Math.sqrt(64 - y * y); // Sphere radius = 8

      for (let j = 0; j <= 32; j++) {
        const angle = (j / 32) * Math.PI * 2;
        points.push(new THREE.Vector3(
          radius * Math.cos(angle),
          y,
          radius * Math.sin(angle)
        ));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      gridLines.add(line);
    }

    planet.group.add(gridLines);
  }

  private addAuroraEffect(planet: MindPlanet): void {
    const auroraGeo = new THREE.RingGeometry(9, 11, 32);
    const auroraMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.rotation.x = Math.PI / 2;
    planet.group.add(aurora);

    // Animate aurora
    const startTime = Date.now();
    const animateAurora = () => {
      const elapsed = Date.now() - startTime;
      auroraMat.opacity = 0.3 + Math.sin(elapsed * 0.003) * 0.2;
      aurora.rotation.z += 0.005;
      requestAnimationFrame(animateAurora);
    };
    animateAurora();
  }

  private addEnergyStorms(planet: MindPlanet): void {
    // Create crackling energy effects
    setInterval(() => {
      if (Math.random() < 0.3) {
        this.createLightningBolt(planet);
      }
    }, 2000);
  }

  private createLightningBolt(planet: MindPlanet): void {
    const points = [];
    const startPoint = new THREE.Vector3(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
      8.5
    );
    const endPoint = new THREE.Vector3(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
      12
    );

    points.push(startPoint, endPoint);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    });
    const lightning = new THREE.Line(geometry, material);
    planet.group.add(lightning);

    // Fade out lightning
    const startTime = Date.now();
    const fadeLightning = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 500;

      if (progress < 1) {
        material.opacity = 1 - progress;
        requestAnimationFrame(fadeLightning);
      } else {
        planet.group.remove(lightning);
      }
    };
    fadeLightning();
  }

  private addQuantumField(planet: MindPlanet): void {
    const fieldGeo = new THREE.SphereGeometry(12, 32, 32);
    const fieldMat = new THREE.MeshBasicMaterial({
      color: 0x8a2be2,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });

    const quantumField = new THREE.Mesh(fieldGeo, fieldMat);
    planet.group.add(quantumField);

    // Animate quantum distortion
    const startTime = Date.now();
    const animateQuantum = () => {
      const elapsed = Date.now() - startTime;
      const distortion = Math.sin(elapsed * 0.005) * 0.2;
      quantumField.scale.setScalar(1 + distortion);
      fieldMat.opacity = 0.05 + Math.abs(distortion) * 0.1;
      requestAnimationFrame(animateQuantum);
    };
    animateQuantum();
  }

  private addSpaceElevator(planet: MindPlanet): void {
    const elevatorGeo = new THREE.CylinderGeometry(0.1, 0.1, 30, 8);
    const elevatorMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.8
    });

    const elevator = new THREE.Mesh(elevatorGeo, elevatorMat);
    elevator.position.set(0, 0, 23); // Extend upward from planet
    planet.group.add(elevator);
  }

  private addOrbitalRing(planet: MindPlanet): void {
    const ringGeo = new THREE.TorusGeometry(15, 0.5, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.9
    });

    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 2;
    planet.group.add(orbitalRing);
  }

  private addDysonSwarm(planet: MindPlanet): void {
    const swarmCount = 50;
    const swarm = new THREE.Group();

    for (let i = 0; i < swarmCount; i++) {
      const collectorGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const collectorMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.7
      });
      const collector = new THREE.Mesh(collectorGeo, collectorMat);

      // Random orbital position
      const distance = 20 + Math.random() * 10;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;

      collector.position.set(
        distance * Math.sin(theta) * Math.cos(phi),
        distance * Math.sin(theta) * Math.sin(phi),
        distance * Math.cos(theta)
      );

      swarm.add(collector);
    }

    planet.group.add(swarm);

    // Animate swarm orbital motion
    const startTime = Date.now();
    const animateSwarm = () => {
      const elapsed = Date.now() - startTime;
      swarm.rotation.y = elapsed * 0.0001;
      swarm.rotation.x = elapsed * 0.00005;
      requestAnimationFrame(animateSwarm);
    };
    animateSwarm();
  }

  getPlanetCustomization(planetId: string): PlanetCustomization | null {
    return this.planetCustomizations.get(planetId) || null;
  }

  getCustomizationOption(optionId: string): CustomizationOption | null {
    return this.customizationOptions.get(optionId) || null;
  }
}
import * as THREE from 'three';
import { navigateTo } from '@devvit/client';
import { InitResponse, GameStateResponse, ContributeResponse, CommunityData } from '../shared/types/api';

// Game modules
import { MindPlanet, GameState, EvolutionStage } from './game/types';
import { createMindPlanet, addStar } from './game/planetFactory';
import { getEvolutionStage, getEvolutionStageName, applyEvolutionFeatures } from './game/evolution';
import { createContributionEffect, createEvolutionEffect } from './game/effects';

// UI modules
import { SplashScreenManager } from './ui/splashScreen';
import { TutorialManager } from './ui/tutorial';
import { ChallengeModal } from './ui/challengeModal';
import { BattleInterface } from './ui/battleInterface';

// Beta testing
import { betaTestingManager } from './utils/betaTesting';
import { betaDashboard } from './ui/betaDashboard';

// Battle system
import { BattleArena } from './game/battleArena';

// Game UI Elements
const titleElement = document.getElementById('title') as HTMLHeadingElement;
const counterValueElement = document.getElementById('counter-value') as HTMLSpanElement;
const gameInfoElement = document.getElementById('game-info') as HTMLDivElement;

// Navigation Links
const docsLink = document.getElementById('docs-link');
const playtestLink = document.getElementById('playtest-link');
const discordLink = document.getElementById('discord-link');

// Game Controls
const battleBtn = document.getElementById('battle-btn');
const viewBtn = document.getElementById('view-btn');

console.log('🎮 Button elements found:', { 
  battleBtn: !!battleBtn, 
  viewBtn: !!viewBtn 
});

// Initialize UI managers
const splashManager = new SplashScreenManager();
const tutorialManager = new TutorialManager();
const challengeModal = new ChallengeModal();
const battleInterface = new BattleInterface();

// Initialize battle system
let battleArena: BattleArena;

docsLink?.addEventListener('click', () => navigateTo('https://developers.reddit.com/docs'));
playtestLink?.addEventListener('click', () => navigateTo('https://www.reddit.com/r/Devvit'));
discordLink?.addEventListener('click', () => navigateTo('https://discord.com/invite/R7yu2wh9Qz'));

// Add event listeners with fallback using document delegation
function setupButtonHandlers(): void {
  console.log('🎮 Setting up button handlers...');
  
  // Battle button handler
  if (battleBtn) {
    battleBtn.addEventListener('click', handleBattleClick);
    console.log('✅ Battle button handler attached');
  } else {
    console.log('⚠️ Battle button not found, using document delegation');
  }
  
  // View button handler  
  if (viewBtn) {
    viewBtn.addEventListener('click', handleViewClick);
    console.log('✅ View button handler attached');
  } else {
    console.log('⚠️ View button not found, using document delegation');
  }
  
  // Document delegation as fallback
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    if (target.id === 'battle-btn' || target.classList.contains('battle-btn')) {
      console.log('🎮 Battle button clicked (via delegation)');
      handleBattleClick();
    }
    
    if (target.id === 'view-btn' || target.classList.contains('view-btn')) {
      console.log('🎮 View button clicked (via delegation)');
      handleViewClick();
    }
  });
}

function handleBattleClick(): void {
  console.log('🎮 Battle button clicked - processing...');
  console.log('🎮 Current game state:', {
    planetsCount: gameState.planets.size,
    battleMode: gameState.battleMode,
    totalEnergy: gameState.totalEnergy
  });
  
  // Check if game is initialized
  if (gameState.planets.size === 0) {
    console.log('⚠️ Game not initialized yet, initializing demo mode...');
    initializeDemoMode();
    setTimeout(() => {
      handleBattleClick(); // Try again after initialization
    }, 1000);
    return;
  }
  
  try {
    if (gameState.battleMode) {
      console.log('🏁 Ending battle mode');
      endBattleMode();
    } else {
      console.log('⚔️ Starting battle mode');
      startBattleMode();
    }
  } catch (error) {
    console.error('❌ Battle button error:', error);
    gameInfoElement.textContent = 'Battle system error - please try again';
  }
}

function handleViewClick(): void {
  console.log('🎮 Universe View button clicked - processing...');
  console.log('🎮 Current camera position:', camera.position);
  
  try {
    resetCameraView();
    gameInfoElement.textContent = 'Universe view opened';
  } catch (error) {
    console.error('❌ View button error:', error);
    gameInfoElement.textContent = 'Universe view error - please try again';
  }
}

// Call setup function
setupButtonHandlers();

// Game State
let currentPostId: string | null = null;
const gameState: GameState = {
  planets: new Map(),
  selectedPlanet: null,
  battleMode: false,
  totalEnergy: 0
};

// Community data will be fetched from API
let communityData: CommunityData[] = [];

async function fetchInitialGameState(): Promise<void> {
  try {
    // First get basic init data
    const initResponse = await fetch('/api/init');
    if (!initResponse.ok) throw new Error(`HTTP error! status: ${initResponse.status}`);
    const initData = (await initResponse.json()) as InitResponse;

    if (initData.type === 'init') {
      currentPostId = initData.postId;
      titleElement.textContent = `Welcome to Mind Wars, ${initData.username}! 🧠`;

      // Then get game state with community data
      await fetchGameState();
    } else {
      counterValueElement.textContent = 'Error';
    }
  } catch (err) {
    console.error('Error fetching initial game state:', err);
    console.log('🎮 Falling back to demo mode...');
    
    // Fallback to demo mode with sample data
    initializeDemoMode();
  }
}

function initializeDemoMode(): void {
  console.log('🎮 Initializing demo mode with sample communities');
  
  // Set demo user info
  currentPostId = 'demo-post-id';
  titleElement.textContent = 'Welcome to Mind Wars Demo! 🧠';
  
  // Create sample community data with closer positions
  communityData = [
    {
      id: 'gaming',
      name: 'r/gaming',
      displayName: 'Gaming',
      memberCount: 2500000,
      thoughtEnergy: 1250,
      evolutionStage: 2,
      position: { x: 0, y: 0, z: 0 }
    },
    {
      id: 'funny',
      name: 'r/funny',
      displayName: 'Funny',
      memberCount: 1800000,
      thoughtEnergy: 890,
      evolutionStage: 1,
      position: { x: 25, y: 10, z: -15 }
    },
    {
      id: 'askreddit',
      name: 'r/AskReddit',
      displayName: 'Ask Reddit',
      memberCount: 3200000,
      thoughtEnergy: 2100,
      evolutionStage: 4,
      position: { x: -20, y: -8, z: 12 }
    },
    {
      id: 'programming',
      name: 'r/programming',
      displayName: 'Programming',
      memberCount: 950000,
      thoughtEnergy: 1650,
      evolutionStage: 3,
      position: { x: 15, y: -12, z: 20 }
    },
    {
      id: 'memes',
      name: 'r/memes',
      displayName: 'Memes',
      memberCount: 1200000,
      thoughtEnergy: 750,
      evolutionStage: 1,
      position: { x: -12, y: 15, z: -10 }
    }
  ];
  
  // Initialize planets with demo data
  initializePlanets();
  updateEnergyDisplay();
  
  gameInfoElement.textContent = 'Click on planets to contribute thought energy! (Demo Mode)';
  
  // Show tutorial for demo
  tutorialManager.showTutorial(gameState, selectPlanet);
}

async function fetchGameState(): Promise<void> {
  try {
    console.log('🌍 Fetching LIVE Reddit community data...');
    const response = await fetch('/api/gamestate');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as GameStateResponse;

    if (data.type === 'gameState') {
      communityData = data.communities;
      gameState.battleMode = data.battleActive;

      console.log(`✅ Loaded ${communityData.length} LIVE Reddit communities:`);
      communityData.forEach(community => {
        console.log(`  📡 ${community.name}: ${community.memberCount.toLocaleString()} members, ${community.thoughtEnergy} energy`);
      });

      // Initialize planets with REAL Reddit community data
      initializePlanets();
      updateEnergyDisplay();

      gameInfoElement.textContent = 'Click on planets to contribute to REAL Reddit communities!';

      // Update battle button state
      if (battleBtn) {
        battleBtn.textContent = gameState.battleMode ? 'End Battle' : 'Start Battle';
      }

      // Show tutorial for first-time users
      tutorialManager.showTutorial(gameState, selectPlanet);
      
      // Start live updates
      startLiveUpdates();
    }
  } catch (err) {
    console.error('Error fetching game state:', err);
    console.log('🎮 API unavailable, using demo data');
    
    // If we're already in demo mode, don't reinitialize
    if (communityData.length === 0) {
      initializeDemoMode();
    }
  }
}

// Add live updates for real-time Reddit integration
function startLiveUpdates(): void {
  console.log('🔄 Starting live updates for Reddit communities...');
  
  // Update community data every 30 seconds
  setInterval(async () => {
    try {
      const response = await fetch('/api/gamestate');
      if (response.ok) {
        const data = (await response.json()) as GameStateResponse;
        if (data.type === 'gameState') {
          // Update existing planets with new data
          data.communities.forEach(updatedCommunity => {
            const planet = gameState.planets.get(updatedCommunity.id);
            if (planet && planet.thoughtEnergy !== updatedCommunity.thoughtEnergy) {
              console.log(`🔄 ${updatedCommunity.name} energy updated: ${planet.thoughtEnergy} → ${updatedCommunity.thoughtEnergy}`);
              planet.thoughtEnergy = updatedCommunity.thoughtEnergy;
              planet.evolutionStage = updatedCommunity.evolutionStage;
              updatePlanetVisuals(planet);
            }
          });
          updateEnergyDisplay();
        }
      }
    } catch (error) {
      console.log('Live update failed:', error);
    }
  }, 30000); // 30 seconds
}

function showChallenge(planetId: string): void {
  console.log('🎮 Showing challenge for planet:', planetId);
  try {
    challengeModal.show(planetId, (result) => {
      // Contribute energy based on challenge result
      void contributeThoughtEnergy(planetId, result.energyAwarded);
    });
  } catch (error) {
    console.error('❌ Challenge modal error:', error);
    // Fallback - just contribute energy directly
    void contributeThoughtEnergy(planetId, 10);
  }
}

async function contributeThoughtEnergy(planetId: string, energy: number = 10): Promise<void> {
  if (!currentPostId) return;
  
  try {
    const response = await fetch('/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planetId, energy }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as ContributeResponse;

    // Update planet energy and visual state with server response
    const planet = gameState.planets.get(planetId);
    if (planet && data.success) {
      planet.thoughtEnergy = data.newEnergy;
      planet.evolutionStage = data.evolutionStage;
      planet.lastContribution = Date.now();
      updatePlanetVisuals(planet);
      createContributionEffect(planet);
      updateEnergyDisplay();

      // Show success message
      gameInfoElement.textContent = `+${energy} energy contributed to ${planet.communityName}!`;
      setTimeout(() => {
        gameInfoElement.textContent = 'Click on planets to contribute thought energy!';
      }, 2000);
    }
  } catch (err) {
    console.error('Error contributing thought energy:', err);
    console.log('🎮 Using demo mode contribution');
    
    // Demo mode - update locally
    const planet = gameState.planets.get(planetId);
    if (planet) {
      planet.thoughtEnergy += energy;
      planet.evolutionStage = getEvolutionStage(planet.thoughtEnergy);
      planet.lastContribution = Date.now();
      updatePlanetVisuals(planet);
      createContributionEffect(planet);
      updateEnergyDisplay();

      // Show success message
      gameInfoElement.textContent = `+${energy} energy contributed to ${planet.communityName}! (Demo Mode)`;
      setTimeout(() => {
        gameInfoElement.textContent = 'Click on planets to contribute thought energy! (Demo Mode)';
      }, 2000);
    }
  }
}

function updateEnergyDisplay(): void {
  const totalEnergy = Array.from(gameState.planets.values())
    .reduce((sum, planet) => sum + planet.thoughtEnergy, 0);
  counterValueElement.textContent = totalEnergy.toString();
  gameState.totalEnergy = totalEnergy;
}

// Button event listeners removed – handled via planet click.

const canvas = document.getElementById('bg') as HTMLCanvasElement;
if (!canvas) {
  console.error('❌ Canvas element not found!');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 80); // Better starting position to see planets

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio ?? 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

camera.lookAt(0, 0, 0);

console.log('🎮 Three.js renderer initialized');
console.log(`📐 Canvas size: ${window.innerWidth}x${window.innerHeight}`);

renderer.render(scene, camera);

// Resize handler
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = '';

// Planet management functions
function createPlanet(community: CommunityData): MindPlanet {
  const planet = createMindPlanet(community, scene);
  applyEvolutionFeatures(planet);
  return planet;
}

function initializePlanets(): void {
  console.log(`🌍 Initializing ${communityData.length} planets...`);
  
  // Clear existing planets
  gameState.planets.forEach(planet => {
    scene.remove(planet.group);
  });
  gameState.planets.clear();

  // Create planets from community data
  communityData.forEach(community => {
    console.log(`🌍 Creating planet for ${community.name}`);
    const planet = createPlanet(community);
    gameState.planets.set(community.id, planet);
  });
  
  console.log(`✅ ${gameState.planets.size} planets created successfully`);
  
  // Force hide splash screen once planets are ready
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.display = 'none';
      console.log('🎮 Splash screen hidden - game should be visible now');
    }
  }, 1000);
}

// Create starfield
Array.from({ length: 200 }).forEach(() => addStar(scene));

// Add a test cube to ensure rendering is working
const testGeometry = new THREE.BoxGeometry(10, 10, 10);
const testMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true });
const testCube = new THREE.Mesh(testGeometry, testMaterial);
testCube.position.set(0, 0, 0);
scene.add(testCube);
console.log('🟢 Test cube added to scene');

// Add some basic controls for camera movement
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousedown', (event) => {
  mouseDown = true;
  mouseX = event.clientX;
  mouseY = event.clientY;
});

canvas.addEventListener('mouseup', () => {
  mouseDown = false;
});

canvas.addEventListener('mousemove', (event) => {
  if (!mouseDown) return;
  
  const deltaX = event.clientX - mouseX;
  const deltaY = event.clientY - mouseY;
  
  camera.position.x += deltaX * 0.1;
  camera.position.y -= deltaY * 0.1;
  
  mouseX = event.clientX;
  mouseY = event.clientY;
  
  camera.lookAt(0, 0, 0);
});

// Add mouse wheel zoom
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const zoomSpeed = 0.1;
  const direction = event.deltaY > 0 ? 1 : -1;
  
  camera.position.multiplyScalar(1 + direction * zoomSpeed);
  camera.lookAt(0, 0, 0);
});

// Initialize battle arena
battleArena = new BattleArena(scene);

// Interaction system
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function handleClick(event: PointerEvent): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check intersections with all planets
  const planetMeshes = Array.from(gameState.planets.values()).map(p => p.mesh);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0]?.object as THREE.Mesh;
    const planet = Array.from(gameState.planets.values())
      .find(p => p.mesh === clickedMesh);

    if (planet) {
      selectPlanet(planet);
      // Show challenge modal instead of direct contribution
      showChallenge(planet.id);
    }
  }
}

function selectPlanet(planet: MindPlanet): void {
  // Deselect previous planet
  if (gameState.selectedPlanet) {
    const prevMaterial = gameState.selectedPlanet.mesh.material as THREE.MeshPhongMaterial;
    prevMaterial.emissive.setHex(0x000000);
  }

  // Select new planet
  gameState.selectedPlanet = planet;
  const material = planet.mesh.material as THREE.MeshPhongMaterial;
  material.emissive.setHex(0x444444);

  // Update UI
  titleElement.textContent = `Contributing to ${planet.communityName}`;
  gameInfoElement.textContent = `Energy: ${planet.thoughtEnergy} | Stage: ${getEvolutionStageName(planet.evolutionStage)}`;
}

// Evolution functions are now imported from modules

function updatePlanetVisuals(planet: MindPlanet): void {
  // Update scale based on energy
  planet.targetScale = 1 + (planet.thoughtEnergy / 2000);

  // Update evolution stage
  const newStage = getEvolutionStage(planet.thoughtEnergy);
  if (newStage > planet.evolutionStage) {
    const oldStage = planet.evolutionStage;
    planet.evolutionStage = newStage;

    // Trigger evolution effect
    createEvolutionEffect(planet, oldStage, newStage, titleElement, gameState);

    // Apply new features
    applyEvolutionFeatures(planet);
  }

  // Update material properties based on evolution stage
  const material = planet.mesh.material as THREE.MeshPhongMaterial;
  const hue = (planet.id.charCodeAt(0) * 137.5) % 360;
  const saturation = Math.min(0.9, 0.4 + (planet.thoughtEnergy / 3000) * 0.5);
  const lightness = 0.3 + (planet.thoughtEnergy / 4000) * 0.5;

  material.color.setHSL(hue / 360, saturation, lightness);
  material.shininess = 30 + (planet.thoughtEnergy / 50);

  // Add emissive glow for higher stages
  if (planet.evolutionStage >= EvolutionStage.ADVANCED) {
    material.emissive.setHSL(hue / 360, 0.3, 0.1);
  }
}

// Effect functions are now imported from modules

window.addEventListener('pointerdown', handleClick);

function animate(): void {
  requestAnimationFrame(animate);

  // Animate all planets
  gameState.planets.forEach(planet => {
    // Gentle rotation
    planet.group.rotation.y += 0.005;
    planet.group.rotation.x += 0.002;

    // Smooth scale transitions
    if (Math.abs(planet.currentScale - planet.targetScale) > 0.01) {
      planet.currentScale += (planet.targetScale - planet.currentScale) * 0.05;
      planet.group.scale.setScalar(planet.currentScale);
    }

    // Pulse effect for recent contributions
    const timeSinceContribution = Date.now() - planet.lastContribution;
    if (timeSinceContribution < 2000) {
      const pulseIntensity = Math.max(0, 1 - timeSinceContribution / 2000);
      const pulseScale = 1 + pulseIntensity * 0.1;
      planet.mesh.scale.setScalar(pulseScale);
    } else {
      planet.mesh.scale.setScalar(1);
    }

    // Animate moons orbiting around planet
    planet.moons.forEach((moon, index) => {
      const time = Date.now() * 0.001;
      const speed = 0.5 + (index * 0.2);
      const distance = 15 + (index * 5);
      const angle = time * speed + (index * Math.PI * 2 / planet.moons.length);

      moon.position.set(
        Math.cos(angle) * distance,
        Math.sin(time * speed * 0.3) * 2,
        Math.sin(angle) * distance
      );
    });

    // Animate rings rotation
    planet.rings.forEach((ring, index) => {
      ring.rotation.z += 0.01 * (1 + index * 0.5);
    });

    // Animate energy field pulsing
    if (planet.energyField) {
      const time = Date.now() * 0.002;
      const pulse = 1 + Math.sin(time) * 0.1;
      planet.energyField.scale.setScalar(pulse);

      const material = planet.energyField.material as THREE.MeshBasicMaterial;
      material.opacity = 0.05 + Math.sin(time * 2) * 0.05;
    }
  });

  renderer.render(scene, camera);
}

// Battle mode functions
function startBattleMode(): void {
  try {
    const planets = Array.from(gameState.planets.values());
    if (planets.length < 2) {
      gameInfoElement.textContent = 'Need at least 2 communities for battle!';
      setTimeout(() => {
        gameInfoElement.textContent = 'Click on planets to contribute to REAL Reddit communities!';
      }, 3000);
      return;
    }

    console.log('⚔️ Starting Mind War with', planets.length, 'communities!');

    // Simple battle mode - just change UI and add effects
    gameState.battleMode = true;

    // Add battle effects to planets
    planets.forEach(planet => {
      addBattleEffects(planet);
    });

    // Update UI
    titleElement.textContent = '⚔️ MIND WAR ACTIVE! ⚔️';
    gameInfoElement.textContent = 'BATTLE MODE: Click planets to contribute energy! Higher contributions = more points!';
    
    if (battleBtn) {
      battleBtn.textContent = 'End Battle';
      battleBtn.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
    }

    // Show proper battle interface
    showBattleScreen();
    
    // Auto-end battle after 5 minutes
    setTimeout(() => {
      endBattleMode();
    }, 300000); // 5 minutes

    // Start battle countdown and effects
    startBattleCountdown();
  } catch (error) {
    console.error('❌ Battle mode error:', error);
    gameInfoElement.textContent = 'Battle system error - please try again';
  }
}

function addBattleEffects(planet: MindPlanet): void {
  // Add pulsing red glow for battle mode
  const material = planet.mesh.material as THREE.MeshPhongMaterial;
  material.emissive.setHex(0x440000); // Red glow
  
  // Add battle particles
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 30;
    positions[i + 1] = (Math.random() - 0.5) * 30;
    positions[i + 2] = (Math.random() - 0.5) * 30;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff4444,
    size: 2,
    transparent: true,
    opacity: 0.8
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  planet.group.add(particles);
}

function startBattleCountdown(): void {
  const battleDuration = 300000; // 5 minutes
  const startTime = Date.now();
  
  const countdownInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, battleDuration - elapsed);
    
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      // Battle automatically ends
      if (gameState.battleMode) {
        endBattleMode();
      }
    }
  }, 1000);
}

function endBattleMode(): void {
  console.log('🏁 Ending Mind War...');
  
  gameState.battleMode = false;
  battleInterface.hide();

  // Remove battle effects from planets
  gameState.planets.forEach(planet => {
    const material = planet.mesh.material as THREE.MeshPhongMaterial;
    material.emissive.setHex(0x000000); // Remove red glow
    
    // Remove battle particles
    const particles = planet.group.children.find(child => child instanceof THREE.Points);
    if (particles) {
      planet.group.remove(particles);
    }
  });

  // Reset UI
  titleElement.textContent = 'Reddit Mind Wars';
  gameInfoElement.textContent = 'Click on planets to contribute to REAL Reddit communities!';
  
  if (battleBtn) {
    battleBtn.textContent = 'Start Battle';
    battleBtn.style.background = 'linear-gradient(135deg, #ff4500, #ff6b35)';
  }
}

// Listen for battle challenge requests
document.addEventListener('battle-challenge-request', (event: any) => {
  const challenge = event.detail.challenge;
  if (challenge && gameState.selectedPlanet) {
    challengeModal.show(gameState.selectedPlanet.id, (result) => {
      // Submit to battle arena
      battleArena.submitBattleChallenge(gameState.selectedPlanet!.id, result.energyAwarded);
    });
  }
});

// Lightning effects now use imported function

function resetCameraView(): void {
  try {
    console.log('📷 Showing universe view screen');
    showUniverseViewScreen();
  } catch (error) {
    console.error('❌ Universe view error:', error);
    // Fallback - just set position directly
    camera.position.set(0, 20, 80);
    camera.lookAt(0, 0, 0);
  }
}

function showBattleScreen(): void {
  console.log('⚔️ Creating battle screen interface');
  
  // Create battle screen panel (not full overlay)
  const battleScreen = document.createElement('div');
  battleScreen.className = 'battle-screen-panel';
  battleScreen.innerHTML = `
    <div class="battle-panel-header">
      <h2>⚔️ REDDIT MIND WAR</h2>
      <button class="close-panel" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    
    <div class="battle-panel-content">
      <div class="battle-info">
        <h3>🏆 Community Battle Active!</h3>
        <p>All Reddit communities are now competing for supremacy!</p>
        
        <div class="battle-timer-display">
          <span class="timer-label">Time Remaining:</span>
          <span class="timer-value" id="battle-timer-display">5:00</span>
        </div>
      </div>
      
      <div class="battle-instructions">
        <h4>How to Win:</h4>
        <div class="instruction-list">
          <div class="instruction-item">🎯 Click on planets to complete challenges</div>
          <div class="instruction-item">⚡ Higher difficulty = more battle points</div>
          <div class="instruction-item">🏆 Community with most energy wins</div>
          <div class="instruction-item">⏰ Battle lasts 5 minutes</div>
        </div>
      </div>
      
      <div class="live-leaderboard">
        <h4>🏆 Live Rankings:</h4>
        <div class="leaderboard-mini" id="battle-leaderboard-mini">
          <div class="loading">Loading community rankings...</div>
        </div>
      </div>
      
      <div class="battle-actions">
        <button class="battle-action-btn primary" onclick="this.parentElement.parentElement.parentElement.remove()">
          Start Contributing!
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(battleScreen);
  
  // Update the mini leaderboard
  updateBattleLeaderboard();
  
  // Start battle timer
  startBattleTimer();
}

function showUniverseViewScreen(): void {
  console.log('🌌 Creating universe view screen');
  
  // Create universe view panel
  const universeScreen = document.createElement('div');
  universeScreen.className = 'universe-screen-panel';
  universeScreen.innerHTML = `
    <div class="universe-panel-header">
      <h2>🌌 UNIVERSE VIEW</h2>
      <button class="close-panel" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    
    <div class="universe-panel-content">
      <div class="universe-info">
        <h3>🌍 Reddit Community Universe</h3>
        <p>Explore the vast universe of Reddit communities represented as evolving planets.</p>
      </div>
      
      <div class="universe-stats">
        <div class="stat-row">
          <span class="stat-label">Total Communities:</span>
          <span class="stat-value">${gameState.planets.size}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Total Energy:</span>
          <span class="stat-value">${gameState.totalEnergy.toLocaleString()}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Active Battle:</span>
          <span class="stat-value">${gameState.battleMode ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div class="community-list">
        <h4>🏘️ Active Communities:</h4>
        <div class="community-grid" id="community-grid">
          ${Array.from(gameState.planets.values()).map(planet => `
            <div class="community-item">
              <div class="community-name">${planet.communityName}</div>
              <div class="community-energy">${planet.thoughtEnergy} energy</div>
              <div class="community-stage">Stage: ${getEvolutionStageName(planet.evolutionStage)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="camera-controls">
        <h4>📷 Camera Controls:</h4>
        <div class="control-buttons">
          <button class="control-btn" onclick="resetCameraPosition()">🏠 Reset View</button>
          <button class="control-btn" onclick="focusOnPlanets()">🎯 Focus Planets</button>
          <button class="control-btn" onclick="overviewMode()">🌌 Overview</button>
        </div>
      </div>
      
      <div class="universe-actions">
        <button class="universe-action-btn primary" onclick="this.parentElement.parentElement.parentElement.remove()">
          Continue Exploring
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(universeScreen);
}

function updateBattleLeaderboard(): void {
  const leaderboardEl = document.getElementById('battle-leaderboard-mini');
  if (!leaderboardEl) return;
  
  const planets = Array.from(gameState.planets.values())
    .sort((a, b) => b.thoughtEnergy - a.thoughtEnergy)
    .slice(0, 3); // Top 3
  
  leaderboardEl.innerHTML = planets.map((planet, index) => `
    <div class="leaderboard-row">
      <span class="rank">${index + 1}.</span>
      <span class="community">${planet.communityName}</span>
      <span class="energy">${planet.thoughtEnergy}</span>
    </div>
  `).join('');
}

function startBattleTimer(): void {
  const timerEl = document.getElementById('battle-timer-display');
  if (!timerEl) return;
  
  const startTime = Date.now();
  const duration = 300000; // 5 minutes
  
  const updateTimer = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (remaining > 0) {
      setTimeout(updateTimer, 1000);
    }
  };
  
  updateTimer();
}

// Global functions for camera controls and testing
(window as any).resetCameraPosition = () => {
  camera.position.set(0, 20, 80);
  camera.lookAt(0, 0, 0);
  console.log('📷 Camera reset to default position');
};

(window as any).focusOnPlanets = () => {
  camera.position.set(0, 10, 50);
  camera.lookAt(0, 0, 0);
  console.log('📷 Camera focused on planets');
};

(window as any).overviewMode = () => {
  camera.position.set(0, 50, 100);
  camera.lookAt(0, 0, 0);
  console.log('📷 Camera set to overview mode');
};

// Global test functions
(window as any).testBattleButton = () => {
  console.log('🧪 Testing battle button...');
  handleBattleClick();
};

(window as any).testViewButton = () => {
  console.log('🧪 Testing view button...');
  handleViewClick();
};

// Test navigation functions directly
(window as any).testBattleScreen = () => {
  console.log('🧪 Testing battle screen creation...');
  showBattleScreen();
};

(window as any).testUniverseScreen = () => {
  console.log('🧪 Testing universe screen creation...');
  showUniverseViewScreen();
};

console.log('🎮 Global test functions available:');
console.log('- testBattleButton() - Test the battle button');
console.log('- testViewButton() - Test the universe view button');

// Add beta testing indicator
const betaIndicator = document.createElement('div');
betaIndicator.className = 'beta-indicator';
betaIndicator.textContent = '🧪 BETA VERSION';
document.body.appendChild(betaIndicator);

// Initialize beta testing system
betaTestingManager.enableFeedbackCollection();

// Add developer console message about beta dashboard
console.log('🧪 Beta Testing Mode Active');
console.log('📊 Press Ctrl+Shift+B to open Beta Dashboard');
console.log('💬 Purple feedback button available for user feedback');

// Initialize animation loop immediately (for background)
animate();

// Initialize the game
console.log('🎮 Starting game initialization...');

// Try to initialize with splash screen
splashManager.startGameInitialization(fetchInitialGameState).catch((error) => {
  console.error('Splash screen initialization failed:', error);
  // Direct fallback initialization
  initializeDemoMode();
});

// Additional fallback in case everything fails
setTimeout(() => {
  if (communityData.length === 0) {
    console.log('🎮 Emergency fallback initialization triggered');
    initializeDemoMode();
    
    // Force hide splash screen if it's still visible
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.display = 'none';
    }
  }
}, 8000); // 8 second emergency fallback

// Add keyboard shortcuts for debugging
document.addEventListener('keydown', (event) => {
  if (event.key === 'F9') {
    console.log('🎮 F9 pressed - Force starting game');
    initializeDemoMode();
    
    // Force hide splash screen
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.display = 'none';
    }
  }
  
  if (event.key === 'Escape') {
    console.log('🎮 Escape pressed - Removing all overlays');
    // Remove all overlays and modals
    const overlays = document.querySelectorAll('.overlay, .modal, .battle-overlay, .challenge-modal, .tutorial-overlay');
    overlays.forEach(overlay => {
      console.log('🎮 Removing overlay:', overlay.className);
      overlay.remove();
    });
    
    // Reset game state
    gameState.battleMode = false;
    titleElement.textContent = 'Reddit Mind Wars';
    gameInfoElement.textContent = 'Click on planets to contribute to REAL Reddit communities!';
    
    if (battleBtn) {
      battleBtn.textContent = 'Start Battle';
      battleBtn.style.background = 'linear-gradient(135deg, #ff4500, #ff6b35)';
    }
  }
});

// Add click handler to force hide splash screen if user clicks anywhere (but not on buttons)
document.addEventListener('click', (event) => {
  // Don't hide splash if clicking on buttons or UI elements
  const target = event.target as HTMLElement;
  if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.overlay')) {
    return;
  }
  
  const splash = document.getElementById('splash-screen');
  if (splash && splash.style.display !== 'none') {
    console.log('🎮 Click detected - hiding splash screen');
    splash.style.display = 'none';
    splashManager.forceHide();
  }
});

// Force hide splash screen after 3 seconds as emergency fallback
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash && splash.style.display !== 'none') {
    console.log('🎮 Emergency splash screen hide after 3 seconds');
    splash.style.display = 'none';
    splashManager.forceHide();
  }
}, 3000);

// Add a function to remove any dark overlays that might appear
function removeDarkOverlays(): void {
  // Remove any elements that might be causing dark screens
  const darkOverlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [style*="rgba(0, 0, 0"]');
  darkOverlays.forEach(overlay => {
    const element = overlay as HTMLElement;
    if (element.style.background && element.style.background.includes('rgba(0, 0, 0')) {
      console.log('🎮 Removing dark overlay:', element.className);
      element.remove();
    }
  });
}

// Check for and remove dark overlays every second
setInterval(removeDarkOverlays, 1000);

// Re-setup button handlers after game initialization
setTimeout(() => {
  console.log('🎮 Re-checking button handlers after initialization...');
  setupButtonHandlers();
  
  // Test if buttons are working
  const battleBtnTest = document.getElementById('battle-btn');
  const viewBtnTest = document.getElementById('view-btn');
  
  console.log('🎮 Button status after init:', {
    battleBtn: !!battleBtnTest,
    viewBtn: !!viewBtnTest,
    planetsLoaded: gameState.planets.size
  });
}, 5000);
// ===== NAVIGATION TESTING SYSTEM =====
// Automatically runs navigation tests and diagnostics

function runNavigationDiagnostics(): void {
  console.log('🔍 === NAVIGATION DIAGNOSTICS ===');
  
  // Step 1: Check if buttons exist
  const battleBtn = document.getElementById('battle-btn');
  const viewBtn = document.getElementById('view-btn');
  
  console.log('🔍 Button existence check:', {
    battleBtn: !!battleBtn,
    viewBtn: !!viewBtn,
    battleBtnVisible: battleBtn ? battleBtn.offsetWidth > 0 : false,
    viewBtnVisible: viewBtn ? viewBtn.offsetWidth > 0 : false
  });
  
  // Step 2: Check game state
  console.log('🔍 Game state check:', {
    planetsCount: gameState.planets.size,
    battleMode: gameState.battleMode,
    totalEnergy: gameState.totalEnergy,
    selectedPlanet: !!gameState.selectedPlanet
  });
  
  // Step 3: Check if navigation functions exist
  console.log('🔍 Navigation functions check:', {
    testBattleScreen: typeof (window as any).testBattleScreen === 'function',
    testUniverseScreen: typeof (window as any).testUniverseScreen === 'function',
    testBattleButton: typeof (window as any).testBattleButton === 'function',
    testViewButton: typeof (window as any).testViewButton === 'function'
  });
  
  // Step 4: Check for existing panels
  const existingBattlePanel = document.querySelector('.battle-screen-panel');
  const existingUniversePanel = document.querySelector('.universe-screen-panel');
  
  console.log('🔍 Existing panels check:', {
    battlePanel: !!existingBattlePanel,
    universePanel: !!existingUniversePanel
  });
}

function createTestNavigationButtons(): void {
  console.log('🧪 Creating test navigation buttons...');
  
  // Remove existing test buttons
  const existingTestButtons = document.querySelectorAll('.test-nav-btn');
  existingTestButtons.forEach(btn => btn.remove());
  
  // Create test battle button
  const testBattleBtn = document.createElement('button');
  testBattleBtn.textContent = '🔥 Test Battle Panel';
  testBattleBtn.className = 'test-nav-btn';
  testBattleBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001;
    padding: 12px 20px;
    background: linear-gradient(135deg, #ff6b35, #ff4500);
    color: white;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
    transition: all 0.3s ease;
  `;
  testBattleBtn.onclick = () => {
    console.log('🧪 Test battle button clicked');
    showBattleScreen();
  };
  document.body.appendChild(testBattleBtn);
  
  // Create test universe button
  const testUniverseBtn = document.createElement('button');
  testUniverseBtn.textContent = '🌌 Test Universe Panel';
  testUniverseBtn.className = 'test-nav-btn';
  testUniverseBtn.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1001;
    padding: 12px 20px;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    color: white;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
    transition: all 0.3s ease;
  `;
  testUniverseBtn.onclick = () => {
    console.log('🧪 Test universe button clicked');
    showUniverseViewScreen();
  };
  document.body.appendChild(testUniverseBtn);
  
  // Create diagnostics button
  const diagnosticsBtn = document.createElement('button');
  diagnosticsBtn.textContent = '🔍 Run Diagnostics';
  diagnosticsBtn.className = 'test-nav-btn';
  diagnosticsBtn.style.cssText = `
    position: fixed;
    top: 140px;
    right: 20px;
    z-index: 1001;
    padding: 12px 20px;
    background: linear-gradient(135deg, #9932cc, #8a2be2);
    color: white;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(153, 50, 204, 0.3);
    transition: all 0.3s ease;
  `;
  diagnosticsBtn.onclick = () => {
    console.log('🧪 Diagnostics button clicked');
    runNavigationDiagnostics();
  };
  document.body.appendChild(diagnosticsBtn);
  
  // Create clear panels button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑️ Clear Panels';
  clearBtn.className = 'test-nav-btn';
  clearBtn.style.cssText = `
    position: fixed;
    top: 200px;
    right: 20px;
    z-index: 1001;
    padding: 12px 20px;
    background: linear-gradient(135deg, #666666, #444444);
    color: white;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 102, 102, 0.3);
    transition: all 0.3s ease;
  `;
  clearBtn.onclick = () => {
    console.log('🧪 Clear panels button clicked');
    // Remove all panels
    const panels = document.querySelectorAll('.battle-screen-panel, .universe-screen-panel');
    panels.forEach(panel => {
      console.log('🗑️ Removing panel:', panel.className);
      panel.remove();
    });
  };
  document.body.appendChild(clearBtn);
  
  console.log('✅ Test navigation buttons created');
}

function testNavigationFunctions(): void {
  console.log('🧪 === TESTING NAVIGATION FUNCTIONS ===');
  
  // Test 1: Battle screen creation
  console.log('🧪 Test 1: Creating battle screen...');
  try {
    showBattleScreen();
    console.log('✅ Battle screen created successfully');
    
    // Check if panel was created
    setTimeout(() => {
      const battlePanel = document.querySelector('.battle-screen-panel');
      console.log('🔍 Battle panel check:', !!battlePanel);
    }, 500);
  } catch (error) {
    console.error('❌ Battle screen creation failed:', error);
  }
  
  // Test 2: Universe screen creation (after delay)
  setTimeout(() => {
    console.log('🧪 Test 2: Creating universe screen...');
    try {
      showUniverseViewScreen();
      console.log('✅ Universe screen created successfully');
      
      // Check if panel was created
      setTimeout(() => {
        const universePanel = document.querySelector('.universe-screen-panel');
        console.log('🔍 Universe panel check:', !!universePanel);
      }, 500);
    } catch (error) {
      console.error('❌ Universe screen creation failed:', error);
    }
  }, 2000);
  
  // Test 3: Button handlers (after delay)
  setTimeout(() => {
    console.log('🧪 Test 3: Testing button handlers...');
    try {
      handleBattleClick();
      console.log('✅ Battle button handler executed');
    } catch (error) {
      console.error('❌ Battle button handler failed:', error);
    }
    
    try {
      handleViewClick();
      console.log('✅ View button handler executed');
    } catch (error) {
      console.error('❌ View button handler failed:', error);
    }
  }, 4000);
}

// Auto-run navigation testing system after game initialization
setTimeout(() => {
  console.log('🚀 === STARTING NAVIGATION TESTING SYSTEM ===');
  
  // Run diagnostics first
  runNavigationDiagnostics();
  
  // Create test buttons
  createTestNavigationButtons();
  
  // Test navigation functions
  testNavigationFunctions();
  
  console.log('🎯 Navigation testing system ready!');
  console.log('📝 Instructions:');
  console.log('  - Use the test buttons on the right side of the screen');
  console.log('  - Check the console for diagnostic information');
  console.log('  - Battle panel should appear on the right');
  console.log('  - Universe panel should appear on the left');
  
}, 6000); // Wait 6 seconds for game to fully initialize

// Add hover effects to test buttons
const style = document.createElement('style');
style.textContent = `
  .test-nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;
document.head.appendChild(style);

console.log('🎮 Navigation testing system loaded - will auto-run in 6 seconds');

// Simple immediate test for navigation
setTimeout(() => {
  console.log('🎮 === IMMEDIATE NAVIGATION TEST ===');
  
  // Check if we can see the main UI elements
  const battleBtn = document.getElementById('battle-btn');
  const viewBtn = document.getElementById('view-btn');
  
  console.log('🎮 UI Elements Check:', {
    battleButton: !!battleBtn,
    viewButton: !!viewBtn,
    gameInitialized: gameState.planets.size > 0
  });
  
  // If buttons don't exist, create simple test buttons
  if (!battleBtn || !viewBtn) {
    console.log('🎮 Original buttons not found, creating test buttons...');
    
    const testBtn1 = document.createElement('button');
    testBtn1.textContent = '🔥 Battle Test';
    testBtn1.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:10px;background:#ff4500;color:white;border:none;border-radius:5px;cursor:pointer;';
    testBtn1.onclick = () => {
      console.log('🔥 Battle test clicked');
      showBattleScreen();
    };
    document.body.appendChild(testBtn1);
    
    const testBtn2 = document.createElement('button');
    testBtn2.textContent = '🌌 Universe Test';
    testBtn2.style.cssText = 'position:fixed;top:70px;right:20px;z-index:9999;padding:10px;background:#4a90e2;color:white;border:none;border-radius:5px;cursor:pointer;';
    testBtn2.onclick = () => {
      console.log('🌌 Universe test clicked');
      showUniverseViewScreen();
    };
    document.body.appendChild(testBtn2);
    
    console.log('✅ Test buttons created on right side of screen');
  }
  
  // Test the navigation functions immediately
  console.log('🧪 Testing navigation functions...');
  
  try {
    showBattleScreen();
    console.log('✅ Battle screen function works');
  } catch (e) {
    console.error('❌ Battle screen error:', e);
  }
  
  setTimeout(() => {
    try {
      showUniverseViewScreen();
      console.log('✅ Universe screen function works');
    } catch (e) {
      console.error('❌ Universe screen error:', e);
    }
  }, 1000);
  
}, 3000); // Run after 3 seconds
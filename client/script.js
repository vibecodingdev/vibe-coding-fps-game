// Game state management
let gameState = "mainMenu"; // 'mainMenu', 'multiplayerLobby', 'partyRoom', 'instructions', 'playing', 'paused', 'gameOver'
let gameInitialized = false;
let isMultiplayer = false;

// Networking
let socket = null;
let isConnected = false;
let currentRoom = null;
let localPlayer = null;
let remotePlayers = new Map();
let isRoomLeader = false;

// Scene setup
let scene, camera, renderer;
let ground, sky;
let controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

// Zombie system (now called demons for Doom style)
let demons = [];
let demonModel = null;
let loader = null;
const DEMON_COUNT = 10;

// =================== VOICE CHAT VARIABLES ===================
let voiceChat = {
  mediaRecorder: null,
  audioStream: null,
  isRecording: false,
  isPushToTalkPressed: false,
  recognition: null,
  audioContext: null,
  audioChunks: [],
  remoteAudios: new Map(), // Store remote player audio elements
  lastKeyPress: 0, // Timestamp of last key press to prevent spam
  settings: {
    mode: "speech-to-text", // 'speech-to-text', 'voice-transmission', 'disabled'
    pushToTalkKey: "KeyT",
    voiceVolume: 80,
  },
};

// Initialize loader with error handling (currently disabled for performance)
function initializeLoader() {
  // GLTFLoader disabled - using optimized built-in demon models
  loader = null;
  console.log("Using built-in Doom-style demon models for optimal performance");
}

// Demon types with Doom-style characteristics
const DEMON_TYPES = {
  IMP: {
    name: "Imp",
    emoji: "👹",
    health: 1,
    speed: 1.0,
    scale: 1.0,
    color: 0x8b4513, // Brown
    headColor: 0x654321, // Dark brown
    eyeColor: 0xff0000, // Red
    detectRange: 60,
    attackRange: 3.5,
    chaseRange: 8,
    attackDamage: 10,
    spawnWeight: 100,
  },
  DEMON: {
    name: "Demon",
    emoji: "🐺",
    health: 2,
    speed: 1.8,
    scale: 0.9,
    color: 0x4b0000, // Dark red
    headColor: 0x8b0000, // Red
    eyeColor: 0xff4400, // Orange-red
    detectRange: 70,
    attackRange: 4.0,
    chaseRange: 10,
    attackDamage: 15,
    spawnWeight: 60,
  },
  CACODEMON: {
    name: "Cacodemon",
    emoji: "👁️",
    health: 4,
    speed: 0.8,
    scale: 1.6,
    color: 0x800080, // Purple
    headColor: 0x4b0082, // Indigo
    eyeColor: 0xff0000, // Red
    detectRange: 80,
    attackRange: 6.0,
    chaseRange: 12,
    attackDamage: 20,
    spawnWeight: 30,
  },
  BARON: {
    name: "Baron of Hell",
    emoji: "👑",
    health: 8,
    speed: 0.6,
    scale: 2.2,
    color: 0x006400, // Dark green
    headColor: 0x228b22, // Forest green
    eyeColor: 0xff6600, // Bright orange
    detectRange: 100,
    attackRange: 8.0,
    chaseRange: 15,
    attackDamage: 35,
    spawnWeight: 5,
  },
};

// Track demon type counts for UI
let demonTypeCounts = {
  IMP: 0,
  DEMON: 0,
  CACODEMON: 0,
  BARON: 0,
};

// Health pack system
let healthPacks = [];
let lastHealthPackSpawn = 0;
const HEALTH_PACK_SPAWN_INTERVAL = 15000;
const HEALTH_PACK_HEAL_AMOUNT = 25;
const MAX_HEALTH_PACKS = 3;
let healthPacksCollected = 0;

// Ammo pack system
let ammoPacks = [];
let lastAmmoPackSpawn = 0;
const AMMO_PACK_SPAWN_INTERVAL = 20000;
const AMMO_PACK_REFILL_AMOUNT = 60;
const MAX_AMMO_PACKS = 2;
let ammoPacksCollected = 0;

// Doom-style weapon system
let gun = null;
let machineGun = null;
let rocketLauncher = null;
let plasmaRifle = null;
let currentWeapon = "shotgun";
let bullets = [];
const BULLET_SPEED = 50;
const BULLET_LIFETIME = 3000;

// Doom weapon properties
const WEAPONS = {
  shotgun: {
    name: "Shotgun",
    fireRate: 800, // ms between shots
    damage: 7, // Per pellet
    pellets: 8, // Shotgun pellets
    recoil: 0.6,
    emoji: "🔫",
    maxAmmo: 50,
    currentAmmo: 50,
    spread: 0.3, // Shotgun spread
  },
  chaingun: {
    name: "Chaingun",
    fireRate: 100, // Very fast
    damage: 1,
    recoil: 0.2,
    emoji: "⚡",
    maxAmmo: 200,
    currentAmmo: 200,
    spread: 0.1,
  },
  rocket: {
    name: "Rocket Launcher",
    fireRate: 1200, // Slow but powerful
    damage: 50,
    recoil: 1.0,
    emoji: "🚀",
    maxAmmo: 20,
    currentAmmo: 20,
    splash: 10, // Splash damage radius
    spread: 0.02,
  },
  plasma: {
    name: "Plasma Rifle",
    fireRate: 200,
    damage: 4,
    recoil: 0.3,
    emoji: "🔥",
    maxAmmo: 100,
    currentAmmo: 100,
    spread: 0.05,
  },
};

// Rapid fire system
let isAutoFiring = false;
let lastShotTime = 0;
let mouseHeld = false;

// Gun animation and effects
let gunRecoilOffset = 0;
let gunRecoilVelocity = 0;
let muzzleFlashLight = null;
let gunBasePosition = { x: 0, y: -3, z: -5 }; // Base gun position

// Crosshair and targeting system
let raycaster = new THREE.Raycaster();
let isAimingAtZombie = false;

// Mini radar system
let radarCanvas = null;
let radarContext = null;
const RADAR_RANGE = 50; // Range in game units
const RADAR_SIZE = 120; // Canvas size in pixels

// Score system
let demonKills = 0;

// Wave system
let currentWave = 1;
let demonsThisWave = 0;
let demonsSpawnedThisWave = 0;
let waveInProgress = false;
let timeBetweenWaves = 5000; // 5 seconds between waves
let nextWaveTimer = null;
let demonSpawnTimer = null;

// Player health system
let playerHealth = 100;
let maxHealth = 100;
let isGameOver = false;
let lastDamageTime = 0;
let damageInvulnerabilityTime = 1000; // 1 second invulnerability after damage

// Audio system
let audioListener;
let audioLoader;
let backgroundMusic;
let currentBackgroundTrack = null;
let backgroundTracks = [];
let menuMusic = null;
let isMenuMusicPlaying = false;

// Enhanced sound system with Doom-style audio
let sounds = {
  // Background music tracks
  backgroundMusic: null,
  menuMusic: null,
  quantumMysticIntro: null,
  quantumMysticRiff1: null,
  quantumMysticRiff2: null,
  suspenseTrack: null,

  // Weapon sounds
  gunfire: null,
  machinegun: null,
  doomShotgun: null,

  // Demon sounds (variety of monster sounds)
  demonGrowl1: null,
  demonGrowl2: null,
  demonRoar1: null,
  demonRoar2: null,
  demonRoar3: null,
  demonWarriorRoar: null,
  demonShriek: null,
  demonBite: null,
  demonBreath: null,
  monsterGeneric: null,

  // Environmental sounds
  bigExplosion: null,
  doomedEffect: null,
  hornOfDoom: null,
};

let musicVolume = 0.4;
let effectsVolume = 0.8;
let lastGrowlTime = 0;
let growlCooldownTime = 1500; // Reduced for more frequent demon sounds
let backgroundMusicEnabled = true;

// Background music playlist management
let musicPlaylist = [];
let currentTrackIndex = 0;
let isPlaylistPlaying = false;

// Initialize audio system
function initAudio() {
  console.log("🎵 Initializing enhanced Doom-style audio system...");

  // Create audio listener
  audioListener = new THREE.AudioListener();
  camera.add(audioListener);

  // Create audio loader
  audioLoader = new THREE.AudioLoader();

  // Initialize all sound categories
  initBackgroundMusic();
  initWeaponSounds();
  initDemonSounds();
  initEnvironmentalSounds();

  console.log("🎵 Enhanced audio system initialized successfully");
}

// Initialize background music with multiple tracks
function initBackgroundMusic() {
  console.log("🎼 Loading background music tracks...");

  // Create audio objects for background music
  const quantumMysticIntro = new THREE.Audio(audioListener);
  const quantumMysticRiff1 = new THREE.Audio(audioListener);
  const quantumMysticRiff2 = new THREE.Audio(audioListener);
  const suspenseTrack = new THREE.Audio(audioListener);
  const hornOfDoom = new THREE.Audio(audioListener);

  // Load atmospheric intro track
  audioLoader.load(
    "assets/quantum-mystic-unnerving-intro-323481.mp3",
    function (buffer) {
      console.log("🎵 Quantum Mystic Intro loaded successfully");
      quantumMysticIntro.setBuffer(buffer);
      quantumMysticIntro.setVolume(musicVolume * 0.8);
      quantumMysticIntro.setLoop(false);
      sounds.quantumMysticIntro = quantumMysticIntro;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading quantum mystic intro:", error);
    }
  );

  // Load main gameplay track 1
  audioLoader.load(
    "assets/quantum-mystic-riff-1-323475.mp3",
    function (buffer) {
      console.log("🎵 Quantum Mystic Riff 1 loaded successfully");
      quantumMysticRiff1.setBuffer(buffer);
      quantumMysticRiff1.setVolume(musicVolume);
      quantumMysticRiff1.setLoop(true);
      sounds.quantumMysticRiff1 = quantumMysticRiff1;
      backgroundTracks.push(quantumMysticRiff1);
    },
    undefined,
    function (error) {
      console.error("❌ Error loading quantum mystic riff 1:", error);
    }
  );

  // Load main gameplay track 2
  audioLoader.load(
    "assets/quantum-mystic-riff-2-323476.mp3",
    function (buffer) {
      console.log("🎵 Quantum Mystic Riff 2 loaded successfully");
      quantumMysticRiff2.setBuffer(buffer);
      quantumMysticRiff2.setVolume(musicVolume);
      quantumMysticRiff2.setLoop(true);
      sounds.quantumMysticRiff2 = quantumMysticRiff2;
      backgroundTracks.push(quantumMysticRiff2);
    },
    undefined,
    function (error) {
      console.error("❌ Error loading quantum mystic riff 2:", error);
    }
  );

  // Load suspense track for tense moments
  audioLoader.load(
    "assets/suspense-6002.mp3",
    function (buffer) {
      console.log("🎵 Suspense track loaded successfully");
      suspenseTrack.setBuffer(buffer);
      suspenseTrack.setVolume(musicVolume * 1.2);
      suspenseTrack.setLoop(true);
      sounds.suspenseTrack = suspenseTrack;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading suspense track:", error);
    }
  );

  // Load horn of doom for dramatic moments
  audioLoader.load(
    "assets/horn-of-doom-101734.mp3",
    function (buffer) {
      console.log("🎵 Horn of Doom loaded successfully");
      hornOfDoom.setBuffer(buffer);
      hornOfDoom.setVolume(musicVolume * 1.5);
      hornOfDoom.setLoop(false);
      sounds.hornOfDoom = hornOfDoom;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading horn of doom:", error);
    }
  );

  console.log("🎼 Background music loading initiated");
}

// Initialize weapon sounds with Doom-style audio
function initWeaponSounds() {
  console.log("🔫 Loading weapon sound effects...");

  // Create weapon sound objects
  const gunfireSound = new THREE.Audio(audioListener);
  const machineGunSound = new THREE.Audio(audioListener);
  const doomShotgunSound = new THREE.Audio(audioListener);

  // Load single shot gunfire sound
  audioLoader.load(
    "assets/single gun shot.mp3",
    function (buffer) {
      console.log("🔫 Single gun shot loaded successfully");
      gunfireSound.setBuffer(buffer);
      gunfireSound.setVolume(effectsVolume);
      sounds.gunfire = gunfireSound;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading single gun shot:", error);
    }
  );

  // Load machine gun sound for rapid fire
  audioLoader.load(
    "assets/machine gun (rapid fire).mp3",
    function (buffer) {
      console.log("🔫 Machine gun sound loaded successfully");
      machineGunSound.setBuffer(buffer);
      machineGunSound.setVolume(effectsVolume * 0.9);
      sounds.machinegun = machineGunSound;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading machine gun sound:", error);
    }
  );

  // Load Doom-style shotgun sound
  audioLoader.load(
    "assets/doom-shotgun-2017-80549.mp3",
    function (buffer) {
      console.log("🔫 Doom shotgun sound loaded successfully");
      doomShotgunSound.setBuffer(buffer);
      doomShotgunSound.setVolume(effectsVolume * 1.1);
      sounds.doomShotgun = doomShotgunSound;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading doom shotgun sound:", error);
    }
  );

  console.log("🔫 Weapon sounds loading initiated");
}

// Initialize demon sounds with variety
function initDemonSounds() {
  console.log("👹 Loading demon sound effects...");

  // Create demon sound objects
  const demonGrowl1 = new THREE.Audio(audioListener);
  const demonGrowl2 = new THREE.Audio(audioListener);
  const demonRoar1 = new THREE.Audio(audioListener);
  const demonRoar2 = new THREE.Audio(audioListener);
  const demonRoar3 = new THREE.Audio(audioListener);
  const demonWarriorRoar = new THREE.Audio(audioListener);
  const demonShriek = new THREE.Audio(audioListener);
  const demonBite = new THREE.Audio(audioListener);
  const demonBreath = new THREE.Audio(audioListener);
  const monsterGeneric = new THREE.Audio(audioListener);

  // Load demon growl sounds
  audioLoader.load(
    "assets/monster-growl-6311.mp3",
    function (buffer) {
      console.log("👹 Demon growl 1 loaded successfully");
      demonGrowl1.setBuffer(buffer);
      demonGrowl1.setVolume(effectsVolume * 0.7);
      sounds.demonGrowl1 = demonGrowl1;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading demon growl 1:", error);
    }
  );

  audioLoader.load(
    "assets/monster-growl-376892.mp3",
    function (buffer) {
      console.log("👹 Demon growl 2 loaded successfully");
      demonGrowl2.setBuffer(buffer);
      demonGrowl2.setVolume(effectsVolume * 0.7);
      sounds.demonGrowl2 = demonGrowl2;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading demon growl 2:", error);
    }
  );

  // Load demon roar sounds
  audioLoader.load(
    "assets/low-monster-roar-97413.mp3",
    function (buffer) {
      console.log("👹 Low monster roar loaded successfully");
      demonRoar1.setBuffer(buffer);
      demonRoar1.setVolume(effectsVolume * 0.8);
      sounds.demonRoar1 = demonRoar1;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading low monster roar:", error);
    }
  );

  audioLoader.load(
    "assets/monster-roar-02-102957.mp3",
    function (buffer) {
      console.log("👹 Monster roar 2 loaded successfully");
      demonRoar2.setBuffer(buffer);
      demonRoar2.setVolume(effectsVolume * 0.8);
      sounds.demonRoar2 = demonRoar2;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading monster roar 2:", error);
    }
  );

  audioLoader.load(
    "assets/deep-sea-monster-roar-329857.mp3",
    function (buffer) {
      console.log("👹 Deep sea monster roar loaded successfully");
      demonRoar3.setBuffer(buffer);
      demonRoar3.setVolume(effectsVolume * 0.9);
      sounds.demonRoar3 = demonRoar3;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading deep sea monster roar:", error);
    }
  );

  // Load warrior roar for stronger demons
  audioLoader.load(
    "assets/monster-warrior-roar-195877.mp3",
    function (buffer) {
      console.log("👹 Monster warrior roar loaded successfully");
      demonWarriorRoar.setBuffer(buffer);
      demonWarriorRoar.setVolume(effectsVolume);
      sounds.demonWarriorRoar = demonWarriorRoar;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading monster warrior roar:", error);
    }
  );

  // Load demon shriek for special moments
  audioLoader.load(
    "assets/monster-shriek-100292.mp3",
    function (buffer) {
      console.log("👹 Monster shriek loaded successfully");
      demonShriek.setBuffer(buffer);
      demonShriek.setVolume(effectsVolume * 0.9);
      sounds.demonShriek = demonShriek;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading monster shriek:", error);
    }
  );

  // Load demon bite for attacks
  audioLoader.load(
    "assets/monster-bite-44538.mp3",
    function (buffer) {
      console.log("👹 Monster bite loaded successfully");
      demonBite.setBuffer(buffer);
      demonBite.setVolume(effectsVolume * 0.8);
      sounds.demonBite = demonBite;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading monster bite:", error);
    }
  );

  // Load horror breathing sound
  audioLoader.load(
    "assets/horror-sound-monster-breath-189934.mp3",
    function (buffer) {
      console.log("👹 Horror monster breath loaded successfully");
      demonBreath.setBuffer(buffer);
      demonBreath.setVolume(effectsVolume * 0.6);
      sounds.demonBreath = demonBreath;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading horror monster breath:", error);
    }
  );

  // Load generic monster sound
  audioLoader.load(
    "assets/monster-105850.mp3",
    function (buffer) {
      console.log("👹 Generic monster sound loaded successfully");
      monsterGeneric.setBuffer(buffer);
      monsterGeneric.setVolume(effectsVolume * 0.7);
      sounds.monsterGeneric = monsterGeneric;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading generic monster sound:", error);
    }
  );

  // Keep original zombie sound as fallback
  const zombieSound = new THREE.Audio(audioListener);
  audioLoader.load(
    "assets/zombie.mp3",
    function (buffer) {
      console.log("👹 Zombie sound loaded successfully");
      zombieSound.setBuffer(buffer);
      zombieSound.setVolume(effectsVolume * 0.6);
      sounds.zombie = zombieSound;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading zombie sound:", error);
    }
  );

  console.log("👹 Demon sounds loading initiated");
}

// Initialize environmental sounds
function initEnvironmentalSounds() {
  console.log("💥 Loading environmental sound effects...");

  // Create environmental sound objects
  const bigExplosion = new THREE.Audio(audioListener);
  const doomedEffect = new THREE.Audio(audioListener);

  // Load big explosion sound
  audioLoader.load(
    "assets/big-explosion-41783.mp3",
    function (buffer) {
      console.log("💥 Big explosion sound loaded successfully");
      bigExplosion.setBuffer(buffer);
      bigExplosion.setVolume(effectsVolume * 1.2);
      sounds.bigExplosion = bigExplosion;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading big explosion sound:", error);
    }
  );

  // Load doomed effect
  audioLoader.load(
    "assets/doomed-effect-37231.mp3",
    function (buffer) {
      console.log("💥 Doomed effect loaded successfully");
      doomedEffect.setBuffer(buffer);
      doomedEffect.setVolume(effectsVolume);
      sounds.doomedEffect = doomedEffect;
    },
    undefined,
    function (error) {
      console.error("❌ Error loading doomed effect:", error);
    }
  );

  console.log("💥 Environmental sounds loading initiated");
}

// Enhanced background music management
function startBackgroundMusic() {
  if (!backgroundMusicEnabled || backgroundTracks.length === 0) {
    console.log("🎵 Background music disabled or no tracks available");
    return;
  }

  // Stop any currently playing music
  stopBackgroundMusic();

  // Play intro track if available and not already played
  if (
    sounds.quantumMysticIntro &&
    !sounds.quantumMysticIntro.userData?.hasPlayed
  ) {
    console.log("🎵 Starting with atmospheric intro...");
    currentBackgroundTrack = sounds.quantumMysticIntro;
    sounds.quantumMysticIntro.userData = { hasPlayed: true };

    // Set up intro to transition to main tracks
    sounds.quantumMysticIntro.onEnded = () => {
      setTimeout(() => {
        startMainBackgroundMusic();
      }, 1000); // 1 second pause between intro and main music
    };

    try {
      sounds.quantumMysticIntro.play();
      console.log("🎵 Atmospheric intro playing");
    } catch (error) {
      console.error("❌ Failed to play intro music:", error);
      startMainBackgroundMusic();
    }
  } else {
    startMainBackgroundMusic();
  }
}

function startMainBackgroundMusic() {
  if (backgroundTracks.length === 0) {
    console.log("⚠️ No background tracks available");
    return;
  }

  // Select a random track from the available background tracks
  const randomIndex = Math.floor(Math.random() * backgroundTracks.length);
  const selectedTrack = backgroundTracks[randomIndex];

  if (selectedTrack && selectedTrack.buffer) {
    currentBackgroundTrack = selectedTrack;
    currentTrackIndex = randomIndex;

    try {
      selectedTrack.play();
      console.log(`🎵 Playing background track ${randomIndex + 1}`);
    } catch (error) {
      console.error("❌ Failed to play background music:", error);
    }
  }
}

function stopBackgroundMusic() {
  if (currentBackgroundTrack && currentBackgroundTrack.isPlaying) {
    currentBackgroundTrack.stop();
    console.log("🎵 Background music stopped");
  }
  currentBackgroundTrack = null;
}

function pauseBackgroundMusic() {
  if (currentBackgroundTrack && currentBackgroundTrack.isPlaying) {
    currentBackgroundTrack.pause();
    console.log("🎵 Background music paused");
  }
}

function resumeBackgroundMusic() {
  if (currentBackgroundTrack && !currentBackgroundTrack.isPlaying) {
    try {
      currentBackgroundTrack.play();
      console.log("🎵 Background music resumed");
    } catch (error) {
      console.error("❌ Failed to resume background music:", error);
    }
  }
}

// Enhanced sound volume management
function updateSoundVolumes() {
  // Update weapon sounds
  if (sounds.gunfire) sounds.gunfire.setVolume(effectsVolume);
  if (sounds.machinegun) sounds.machinegun.setVolume(effectsVolume * 0.9);
  if (sounds.doomShotgun) sounds.doomShotgun.setVolume(effectsVolume * 1.1);

  // Update demon sounds
  if (sounds.demonGrowl1) sounds.demonGrowl1.setVolume(effectsVolume * 0.7);
  if (sounds.demonGrowl2) sounds.demonGrowl2.setVolume(effectsVolume * 0.7);
  if (sounds.demonRoar1) sounds.demonRoar1.setVolume(effectsVolume * 0.8);
  if (sounds.demonRoar2) sounds.demonRoar2.setVolume(effectsVolume * 0.8);
  if (sounds.demonRoar3) sounds.demonRoar3.setVolume(effectsVolume * 0.9);
  if (sounds.demonWarriorRoar) sounds.demonWarriorRoar.setVolume(effectsVolume);
  if (sounds.demonShriek) sounds.demonShriek.setVolume(effectsVolume * 0.9);
  if (sounds.demonBite) sounds.demonBite.setVolume(effectsVolume * 0.8);
  if (sounds.demonBreath) sounds.demonBreath.setVolume(effectsVolume * 0.6);
  if (sounds.monsterGeneric)
    sounds.monsterGeneric.setVolume(effectsVolume * 0.7);
  if (sounds.zombie) sounds.zombie.setVolume(effectsVolume * 0.6);

  // Update environmental sounds
  if (sounds.bigExplosion) sounds.bigExplosion.setVolume(effectsVolume * 1.2);
  if (sounds.doomedEffect) sounds.doomedEffect.setVolume(effectsVolume);

  // Update background music
  if (sounds.quantumMysticRiff1)
    sounds.quantumMysticRiff1.setVolume(musicVolume);
  if (sounds.quantumMysticRiff2)
    sounds.quantumMysticRiff2.setVolume(musicVolume);
  if (sounds.suspenseTrack) sounds.suspenseTrack.setVolume(musicVolume * 1.2);
  if (sounds.hornOfDoom) sounds.hornOfDoom.setVolume(musicVolume * 1.5);
  if (sounds.quantumMysticIntro)
    sounds.quantumMysticIntro.setVolume(musicVolume * 0.8);
}

// Enhanced gunfire sound function
function playGunfireSound() {
  let weaponSound;

  // Use Doom shotgun sound for shotgun, machine gun for chaingun
  if (currentWeapon === "shotgun") {
    weaponSound = sounds.doomShotgun || sounds.gunfire;
  } else {
    weaponSound = sounds.machinegun;
  }

  if (!weaponSound) {
    console.warn(`No sound loaded for ${currentWeapon}`);
    return;
  }

  // Stop the sound if it's already playing (for rapid fire)
  if (weaponSound.isPlaying) {
    weaponSound.stop();
  }

  // Update volume and play
  weaponSound.setVolume(
    effectsVolume * (currentWeapon === "shotgun" ? 1.1 : 0.9)
  );
  try {
    weaponSound.play();
  } catch (error) {
    console.error("❌ Failed to play weapon sound:", error);
  }
}

// Enhanced demon sound functions with variety
function playDemonGrowlSound() {
  const currentTime = Date.now();
  if (currentTime - lastGrowlTime < growlCooldownTime) return;

  // Select random demon sound based on availability
  const availableSounds = [];

  if (sounds.demonGrowl1) availableSounds.push(sounds.demonGrowl1);
  if (sounds.demonGrowl2) availableSounds.push(sounds.demonGrowl2);
  if (sounds.demonRoar1) availableSounds.push(sounds.demonRoar1);
  if (sounds.demonRoar2) availableSounds.push(sounds.demonRoar2);
  if (sounds.monsterGeneric) availableSounds.push(sounds.monsterGeneric);
  if (sounds.zombie) availableSounds.push(sounds.zombie);

  if (availableSounds.length === 0) {
    console.warn("⚠️ No demon sounds available");
    return;
  }

  const randomSound =
    availableSounds[Math.floor(Math.random() * availableSounds.length)];
  lastGrowlTime = currentTime;

  // Stop the sound if it's already playing
  if (randomSound.isPlaying) {
    randomSound.stop();
  }

  try {
    randomSound.play();
    console.log("👹 Playing random demon sound");
  } catch (error) {
    console.error("❌ Failed to play demon sound:", error);
  }
}

function playDemonAttackSound() {
  // Use more aggressive sounds for attacks
  const attackSounds = [];

  if (sounds.demonBite) attackSounds.push(sounds.demonBite);
  if (sounds.demonShriek) attackSounds.push(sounds.demonShriek);
  if (sounds.demonWarriorRoar) attackSounds.push(sounds.demonWarriorRoar);
  if (sounds.demonRoar3) attackSounds.push(sounds.demonRoar3);

  if (attackSounds.length === 0) {
    console.warn("⚠️ No demon attack sounds available");
    return;
  }

  const randomAttackSound =
    attackSounds[Math.floor(Math.random() * attackSounds.length)];

  // Stop the sound if it's already playing
  if (randomAttackSound.isPlaying) {
    randomAttackSound.stop();
  }

  try {
    randomAttackSound.play();
    console.log("👹 Playing demon attack sound");
  } catch (error) {
    console.error("❌ Failed to play demon attack sound:", error);
  }
}

// Play special demon sounds based on demon type
function playDemonTypeSound(demonType) {
  let soundToPlay = null;

  switch (demonType) {
    case "IMP":
      soundToPlay = sounds.demonGrowl1 || sounds.monsterGeneric;
      break;
    case "DEMON":
      soundToPlay = sounds.demonGrowl2 || sounds.demonRoar1;
      break;
    case "CACODEMON":
      soundToPlay = sounds.demonRoar3 || sounds.demonBreath;
      break;
    case "BARON":
      soundToPlay = sounds.demonWarriorRoar || sounds.demonRoar2;
      break;
    default:
      soundToPlay = sounds.zombie;
  }

  if (soundToPlay && !soundToPlay.isPlaying) {
    try {
      soundToPlay.play();
      console.log(`👹 Playing ${demonType} specific sound`);
    } catch (error) {
      console.error("❌ Failed to play demon type sound:", error);
    }
  }
}

// Environmental sound functions
function playExplosionSound() {
  if (sounds.bigExplosion && !sounds.bigExplosion.isPlaying) {
    try {
      sounds.bigExplosion.play();
      console.log("💥 Playing explosion sound");
    } catch (error) {
      console.error("❌ Failed to play explosion sound:", error);
    }
  }
}

function playDoomedEffect() {
  if (sounds.doomedEffect && !sounds.doomedEffect.isPlaying) {
    try {
      sounds.doomedEffect.play();
      console.log("💀 Playing doomed effect");
    } catch (error) {
      console.error("❌ Failed to play doomed effect:", error);
    }
  }
}

function playHornOfDoom() {
  if (sounds.hornOfDoom && !sounds.hornOfDoom.isPlaying) {
    try {
      sounds.hornOfDoom.play();
      console.log("📯 Playing Horn of Doom");
    } catch (error) {
      console.error("❌ Failed to play Horn of Doom:", error);
    }
  }
}

// Dynamic music system based on game state
function updateMusicBasedOnGameState() {
  if (!backgroundMusicEnabled) return;

  const livingDemons = demons.filter(
    (demon) =>
      demon.userData && !demon.userData.isDead && !demon.userData.isFalling
  ).length;

  // Switch to suspense music when many demons are near
  const nearbyDemons = demons.filter((demon) => {
    if (!demon.userData || demon.userData.isDead || demon.userData.isFalling)
      return false;

    const playerPos = controls.getObject().position;
    const dx = playerPos.x - demon.position.x;
    const dz = playerPos.z - demon.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    return distance < 15; // Demons within 15 units
  }).length;

  // Dynamic music switching
  if (
    nearbyDemons >= 3 &&
    sounds.suspenseTrack &&
    currentBackgroundTrack !== sounds.suspenseTrack
  ) {
    console.log("🎵 Switching to suspense music - danger nearby!");
    stopBackgroundMusic();
    currentBackgroundTrack = sounds.suspenseTrack;
    try {
      sounds.suspenseTrack.play();
    } catch (error) {
      console.error("❌ Failed to play suspense music:", error);
    }
  } else if (
    nearbyDemons < 2 &&
    currentBackgroundTrack === sounds.suspenseTrack
  ) {
    console.log("🎵 Switching back to main background music");
    stopBackgroundMusic();
    startMainBackgroundMusic();
  }
}

// Initialize the scene
function init() {
  // Initialize loader first
  initializeLoader();

  // Create scene
  scene = new THREE.Scene();

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  camera.position.set(0, 1.8, 20);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb); // Sky blue background
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Ensure canvas takes full screen
  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.zIndex = "1";

  document.body.appendChild(renderer.domElement);

  // Initialize audio system
  initAudio();

  // Initialize pointer lock controls
  initControls();

  // Create weapons
  createGun();
  createMachineGun();

  // Create ground
  createGround();

  // Create sky
  createSky();

  // Add lighting
  addLighting();

  // Add some objects to make the scene more interesting
  addObjects();

  // Load demon model and start wave system
  loadDemonModel();

  // Add event listeners
  addEventListeners();

  // Initialize radar
  initRadar();

  // Initialize voice chat
  initVoiceChat();

  // Initialize pause menu settings
  initializePauseMenuSettings();

  // Start animation loop
  animate();
}

// =================== VOICE CHAT SYSTEM ===================

// Initialize voice chat system
async function initVoiceChat() {
  console.log("Initializing voice chat system...");

  // Load settings from localStorage
  loadVoiceChatSettings();

  // Setup UI event listeners
  setupVoiceChatUI();

  // Initialize speech recognition for speech-to-text mode
  if (voiceChat.settings.mode === "speech-to-text") {
    initSpeechRecognition();
  }

  // Request microphone permission only if needed
  try {
    if (voiceChat.settings.mode !== "disabled") {
      voiceChat.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1, // Use mono audio to reduce bandwidth
        },
      });

      // Create audio context for processing with error handling
      try {
        voiceChat.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();

        // Handle audio context state changes
        voiceChat.audioContext.addEventListener("statechange", () => {
          console.log("AudioContext state:", voiceChat.audioContext.state);
          if (voiceChat.audioContext.state === "suspended") {
            // Try to resume when user interaction occurs
            document.addEventListener("click", resumeAudioContext, {
              once: true,
            });
          }
        });
      } catch (audioError) {
        console.warn("AudioContext creation failed:", audioError);
        voiceChat.audioContext = null;
      }
    }

    console.log("Voice chat initialized successfully");
    updateVoiceChatStatus("ready");
  } catch (error) {
    console.error("Failed to initialize voice chat:", error);
    updateVoiceChatStatus("error");
  }
}

// Resume audio context if suspended
function resumeAudioContext() {
  if (voiceChat.audioContext && voiceChat.audioContext.state === "suspended") {
    voiceChat.audioContext
      .resume()
      .then(() => {
        console.log("AudioContext resumed");
      })
      .catch((error) => {
        console.error("Failed to resume AudioContext:", error);
      });
  }
}

// Load voice chat settings from localStorage
function loadVoiceChatSettings() {
  const savedSettings = localStorage.getItem("voiceChatSettings");
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    voiceChat.settings = { ...voiceChat.settings, ...settings };
  }

  // Update UI elements
  const voiceChatMode = document.getElementById("voiceChatMode");
  const voiceVolume = document.getElementById("voiceVolume");
  const pushToTalkKey = document.getElementById("pushToTalkKey");

  if (voiceChatMode) voiceChatMode.value = voiceChat.settings.mode;
  if (voiceVolume) voiceVolume.value = voiceChat.settings.voiceVolume;
  if (pushToTalkKey) pushToTalkKey.value = voiceChat.settings.pushToTalkKey;
}

// Save voice chat settings to localStorage
function saveVoiceChatSettings() {
  localStorage.setItem("voiceChatSettings", JSON.stringify(voiceChat.settings));
}

// Setup voice chat UI event listeners
function setupVoiceChatUI() {
  // Mode change
  const voiceChatMode = document.getElementById("voiceChatMode");
  if (voiceChatMode) {
    voiceChatMode.addEventListener("change", (e) => {
      const newMode = e.target.value;
      const oldMode = voiceChat.settings.mode;

      voiceChat.settings.mode = newMode;
      saveVoiceChatSettings();

      // Stop any current recording
      if (voiceChat.isRecording) {
        stopVoiceRecording();
      }

      if (newMode === "speech-to-text") {
        if (oldMode !== "speech-to-text") {
          initSpeechRecognition();
        }
        updateVoiceChatStatus("ready");
      } else if (newMode === "disabled") {
        disableVoiceChat();
      } else {
        updateVoiceChatStatus("ready");
      }
    });
  }

  // Voice volume change
  const voiceVolume = document.getElementById("voiceVolume");
  if (voiceVolume) {
    voiceVolume.addEventListener("input", (e) => {
      voiceChat.settings.voiceVolume = parseInt(e.target.value);
      saveVoiceChatSettings();
      updateVoiceVolume(e.target.value);
    });
  }

  // Push-to-talk key change
  const pushToTalkKey = document.getElementById("pushToTalkKey");
  if (pushToTalkKey) {
    pushToTalkKey.addEventListener("change", (e) => {
      voiceChat.settings.pushToTalkKey = e.target.value;
      saveVoiceChatSettings();
      updatePushToTalkDisplay();
      console.log("Push-to-talk key changed:", e.target.value);
    });
  }
}

// Voice volume control function (restored full version)
function updateVoiceVolume(value) {
  const volume = value / 100;
  voiceChat.settings.voiceVolume = parseInt(value);

  // Update all remote audio elements
  voiceChat.remoteAudios.forEach((audio) => {
    audio.volume = volume;
  });

  // Save settings
  saveVoiceChatSettings();

  // Update display
  const display = document.getElementById("voiceVolumeDisplay");
  if (display) display.textContent = value + "%";

  console.log("Voice volume:", volume);
}

// Initialize speech recognition for speech-to-text mode
function initSpeechRecognition() {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    console.warn("Speech recognition not supported in this browser");
    updateVoiceChatStatus("error");
    return;
  }

  // Clean up existing recognition if any
  if (voiceChat.recognition) {
    if (voiceChat.recognition.state === "active") {
      voiceChat.recognition.stop();
    }
    voiceChat.recognition = null;
  }

  try {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceChat.recognition = new SpeechRecognition();

    voiceChat.recognition.continuous = false;
    voiceChat.recognition.interimResults = false;
    voiceChat.recognition.lang = navigator.language || "en-US"; // Auto-detect language
    voiceChat.recognition.maxAlternatives = 1;

    voiceChat.recognition.onresult = (event) => {
      if (event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          sendVoiceMessage(transcript, "speech-to-text");
        }
      }
    };

    voiceChat.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      // Don't immediately stop on certain errors
      if (event.error === "audio-capture" || event.error === "not-allowed") {
        updateVoiceChatStatus("error");
      }
      stopVoiceRecording();
    };

    voiceChat.recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    voiceChat.recognition.onend = () => {
      console.log("Speech recognition ended");
      // Only stop if we're actually recording
      if (voiceChat.isRecording) {
        stopVoiceRecording();
      }
    };

    console.log("Speech recognition initialized successfully");
  } catch (error) {
    console.error("Failed to initialize speech recognition:", error);
    updateVoiceChatStatus("error");
  }
}

// Start voice recording based on current mode
function startVoiceRecording() {
  if (voiceChat.settings.mode === "disabled" || voiceChat.isRecording) {
    return;
  }

  // Check if recognition is already active
  if (voiceChat.recognition && voiceChat.recognition.state === "active") {
    console.warn("Speech recognition already active, skipping start");
    return;
  }

  voiceChat.isRecording = true;
  updateVoiceChatStatus("recording");

  try {
    if (voiceChat.settings.mode === "speech-to-text") {
      startSpeechToText();
    } else if (voiceChat.settings.mode === "voice-transmission") {
      startVoiceTransmission();
    }
  } catch (error) {
    console.error("Failed to start voice recording:", error);
    stopVoiceRecording();
  }
}

// Stop voice recording
function stopVoiceRecording() {
  if (!voiceChat.isRecording) {
    return;
  }

  voiceChat.isRecording = false;
  updateVoiceChatStatus("ready");

  try {
    if (voiceChat.recognition && voiceChat.settings.mode === "speech-to-text") {
      // Only stop if it's active
      if (voiceChat.recognition.state === "active") {
        voiceChat.recognition.stop();
      }
    }

    if (
      voiceChat.mediaRecorder &&
      voiceChat.settings.mode === "voice-transmission" &&
      voiceChat.mediaRecorder.state === "recording"
    ) {
      voiceChat.mediaRecorder.stop();
    }
  } catch (error) {
    console.error("Error stopping voice recording:", error);
  }
}

// Start speech-to-text recording
function startSpeechToText() {
  if (!voiceChat.recognition) {
    console.warn("Speech recognition not initialized");
    stopVoiceRecording();
    return;
  }

  // Check if already running
  if (voiceChat.recognition.state === "active") {
    console.warn("Speech recognition already active");
    return;
  }

  try {
    voiceChat.recognition.start();
  } catch (error) {
    console.error("Failed to start speech recognition:", error);
    stopVoiceRecording();
  }
}

// Start voice transmission recording
function startVoiceTransmission() {
  if (!voiceChat.audioStream) {
    console.error("No audio stream available");
    stopVoiceRecording();
    return;
  }

  voiceChat.audioChunks = [];

  try {
    voiceChat.mediaRecorder = new MediaRecorder(voiceChat.audioStream, {
      mimeType: "audio/webm;codecs=opus",
    });

    voiceChat.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        voiceChat.audioChunks.push(event.data);
      }
    };

    voiceChat.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(voiceChat.audioChunks, {
        type: "audio/webm;codecs=opus",
      });
      sendVoiceData(audioBlob);
    };

    voiceChat.mediaRecorder.start(100); // Collect data every 100ms
  } catch (error) {
    console.error("Failed to start voice transmission:", error);
    stopVoiceRecording();
  }
}

// Send voice message (text or audio data)
function sendVoiceMessage(message, type) {
  const playerName = document.getElementById("playerName")?.value || "Player";

  // In single player mode, just show the message locally for testing
  if (!isMultiplayer) {
    console.log("🎤 Voice message (single player):", message);
    addGameChatMessage("voice", message, playerName);
    return;
  }

  // In multiplayer mode, send to server
  if (!socket || !socket.connected) {
    console.warn("Not connected to server");
    return;
  }

  const voiceMessage = {
    type: type,
    message: message,
    playerId: socket.id,
    playerName: playerName,
    timestamp: Date.now(),
  };

  socket.emit("voice:message", voiceMessage);

  // Add to local chat
  addGameChatMessage("voice", message, voiceMessage.playerName);
}

// Send voice audio data
function sendVoiceData(audioBlob) {
  const playerName = document.getElementById("playerName")?.value || "Player";

  // In single player mode, just show a test message
  if (!isMultiplayer) {
    console.log(
      "🎤 Voice audio recorded (single player):",
      audioBlob.size,
      "bytes"
    );
    addGameChatMessage(
      "voice",
      "🎤 Voice recording test (audio mode)",
      playerName
    );
    return;
  }

  // In multiplayer mode, send to server
  if (!socket || !socket.connected) {
    console.warn("Not connected to server");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const voiceData = {
      type: "voice-transmission",
      audioData: reader.result,
      playerId: socket.id,
      playerName: playerName,
      timestamp: Date.now(),
    };

    socket.emit("voice:data", voiceData);
  };

  reader.readAsArrayBuffer(audioBlob);
}

// Update voice chat status display
function updateVoiceChatStatus(status) {
  const statusIndicator = document.querySelector(".voice-status-indicator");
  const recordingIndicator = document.querySelector(
    ".voice-recording-indicator"
  );

  if (!statusIndicator || !recordingIndicator) {
    return; // UI elements not available
  }

  if (status === "recording") {
    statusIndicator.style.display = "none";
    recordingIndicator.style.display = "flex";
  } else {
    statusIndicator.style.display = "flex";
    recordingIndicator.style.display = "none";

    const icon = statusIndicator.querySelector("i");
    const text = statusIndicator.querySelector("span");

    if (icon && text) {
      switch (status) {
        case "ready":
          icon.className = "fas fa-microphone";
          text.textContent = `Hold ${getPushToTalkKeyDisplay()} to speak`;
          break;
        case "error":
          icon.className = "fas fa-microphone-slash";
          text.textContent = "Voice chat unavailable";
          break;
        case "disabled":
          icon.className = "fas fa-microphone-slash";
          text.textContent = "Voice chat disabled";
          break;
      }
    }
  }
}

// Get display name for push-to-talk key
function getPushToTalkKeyDisplay() {
  const keyMap = {
    KeyT: "T",
    KeyV: "V",
    KeyB: "B",
    KeyG: "G",
  };
  return keyMap[voiceChat.settings.pushToTalkKey] || "T";
}

// Update push-to-talk display
function updatePushToTalkDisplay() {
  updateVoiceChatStatus(
    voiceChat.settings.mode === "disabled" ? "disabled" : "ready"
  );
}

// Disable voice chat
function disableVoiceChat() {
  if (voiceChat.isRecording) {
    stopVoiceRecording();
  }

  if (voiceChat.audioStream) {
    voiceChat.audioStream.getTracks().forEach((track) => track.stop());
    voiceChat.audioStream = null;
  }

  if (voiceChat.audioContext) {
    voiceChat.audioContext.close().catch((error) => {
      console.warn("Failed to close AudioContext:", error);
    });
    voiceChat.audioContext = null;
  }

  if (voiceChat.recognition) {
    if (voiceChat.recognition.state === "active") {
      voiceChat.recognition.stop();
    }
    voiceChat.recognition = null;
  }

  updateVoiceChatStatus("disabled");
}

// Clean up voice chat resources when page unloads
window.addEventListener("beforeunload", () => {
  disableVoiceChat();
});

// Debug function to check voice chat status
function debugVoiceChat() {
  console.log("Voice Chat Debug Info:", {
    mode: voiceChat.settings.mode,
    isRecording: voiceChat.isRecording,
    isPushToTalkPressed: voiceChat.isPushToTalkPressed,
    hasAudioStream: !!voiceChat.audioStream,
    hasAudioContext: !!voiceChat.audioContext,
    audioContextState: voiceChat.audioContext?.state,
    hasRecognition: !!voiceChat.recognition,
    recognitionState: voiceChat.recognition?.state,
    pushToTalkKey: voiceChat.settings.pushToTalkKey,
    gameState: gameState,
    isMultiplayer: isMultiplayer,
  });
}

// Make debug function globally accessible
window.debugVoiceChat = debugVoiceChat;

// Test function for single player voice chat
function testSinglePlayerVoiceChat() {
  console.log("🎤 Testing Single Player Voice Chat:");
  console.log("- Press and hold T to test speech-to-text");
  console.log("- Check voice status indicator bottom-left");
  console.log("- Voice messages will appear in chat area");
  console.log("- Current mode:", voiceChat.settings.mode);

  if (voiceChat.settings.mode === "disabled") {
    console.log("⚠️ Voice chat is disabled. Enable it in pause menu (ESC)");
  }

  debugVoiceChat();
}

// Make test function globally accessible
window.testSinglePlayerVoiceChat = testSinglePlayerVoiceChat;

// Create ground plane
function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x4a4a4a,
    side: THREE.DoubleSide,
  });

  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add a grid helper for better depth perception
  const gridHelper = new THREE.GridHelper(100, 100, 0x606060, 0x404040);
  scene.add(gridHelper);
}

// Create sky dome
function createSky() {
  const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide, // Render inside of sphere
  });

  sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  // Add gradient effect to sky
  const skyGradient = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077be) },
      bottomColor: { value: new THREE.Color(0x87ceeb) },
      offset: { value: 33 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
    side: THREE.BackSide,
  });

  sky.material = skyGradient;
}

// Add lighting to the scene
function addLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;

  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;

  scene.add(directionalLight);

  // Point light for additional illumination
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
  pointLight.position.set(10, 10, 10);
  pointLight.castShadow = true;
  scene.add(pointLight);
}

// Add apocalyptic environment objects to create zombie movie atmosphere
function addObjects() {
  // Create burned/abandoned buildings
  createBurnedBuildings();

  // Create abandoned vehicles
  createAbandonedVehicles();

  // Create graveyard elements
  createGraveyardElements();

  // Create dead trees
  createDeadTrees();

  // Create debris and wreckage
  createDebrisAndWreckage();

  // Create additional urban elements
  createStreetLights();

  // Create barricades and barriers
  createBarricades();

  // Create ruined structures
  createRuinedStructures();

  // Create playground areas
  createPlaygrounds();

  // Create school buildings
  createSchools();

  // Create hospital complexes
  createHospitals();
}

// Create burned and damaged buildings
function createBurnedBuildings() {
  for (let i = 0; i < 2; i++) {
    const buildingGroup = new THREE.Group();

    // Main building structure
    const buildingGeometry = new THREE.BoxGeometry(
      4 + Math.random() * 3,
      3 + Math.random() * 4,
      4 + Math.random() * 3
    );
    const buildingMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2a2a, // Dark gray/black for burned look
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = building.geometry.parameters.height / 2;
    buildingGroup.add(building);

    // Roof (damaged/collapsed)
    const roofGeometry = new THREE.BoxGeometry(
      buildingGeometry.parameters.width + 0.5,
      0.3,
      buildingGeometry.parameters.depth + 0.5
    );
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = buildingGeometry.parameters.height + 0.15;
    roof.rotation.z = (Math.random() - 0.5) * 0.3; // Slight tilt for damage
    buildingGroup.add(roof);

    // Windows (broken/dark)
    for (let j = 0; j < 3; j++) {
      const windowGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
      const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        -1.5 + j * 1.5,
        1 + Math.random() * 1.5,
        buildingGeometry.parameters.depth / 2 + 0.05
      );
      buildingGroup.add(window);
    }

    // Damage/holes in walls
    const holeGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.position.set(Math.random() * 2 - 1, 1, 0);
    buildingGroup.add(hole);

    // Add social media advertising text on walls
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 512;

    // Set background with border
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.fillStyle = "#000000";
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Configure text style
    ctx.fillStyle = "#00ffcc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add different social media handles for each building
    if (i === 0) {
      // First building: GitHub, LinkedIn, X
      ctx.font = "bold 40px Arial";
      ctx.fillText("FOLLOW ON:", canvas.width / 2, 80);

      ctx.font = "bold 32px Arial";
      ctx.fillText("GitHub: yournamehere", canvas.width / 2, 150);
      ctx.fillText("LinkedIn: yournamehere", canvas.width / 2, 200);
      ctx.fillText("X: @yournamehere", canvas.width / 2, 250);

      ctx.font = "bold 28px Arial";
      ctx.fillText("FOLLOW FOR UPDATES!", canvas.width / 2, 320);
    } else {
      // Second building: YouTube, Instagram
      ctx.font = "bold 40px Arial";
      ctx.fillText("FOLLOW ON:", canvas.width / 2, 100);

      ctx.font = "bold 32px Arial";
      ctx.fillText("YouTube: @yournamehere", canvas.width / 2, 170);
      ctx.fillText("Instagram: @yournamehere", canvas.width / 2, 220);

      ctx.font = "bold 28px Arial";
      ctx.fillText("LIKE & SUBSCRIBE!", canvas.width / 2, 290);
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    // Don't flip Y - keep it as default (true) for proper orientation

    // Create advertising sign material
    const signMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
    });

    // Add advertising sign to building wall
    const signGeometry = new THREE.PlaneGeometry(5, 2.5);
    const sign = new THREE.Mesh(signGeometry, signMaterial);

    // Position the sign clearly on the front wall
    sign.position.set(0, 2.5, buildingGeometry.parameters.depth / 2 + 0.02);

    // Make sure it casts and receives shadows
    sign.castShadow = true;
    sign.receiveShadow = true;

    buildingGroup.add(sign);

    // Position building
    buildingGroup.position.set(
      (Math.random() - 0.5) * 70,
      0,
      (Math.random() - 0.5) * 70
    );
    buildingGroup.rotation.y = Math.random() * Math.PI;

    // Enable shadows
    buildingGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(buildingGroup);
  }
}

// Create abandoned and wrecked vehicles
function createAbandonedVehicles() {
  for (let i = 0; i < 6; i++) {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(4, 1.2, 1.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: [0x8b0000, 0x2f4f4f, 0x1a1a1a, 0x654321][
        Math.floor(Math.random() * 4)
      ], // Random rust/dark colors
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    carGroup.add(body);

    // Car roof/cabin
    const cabinGeometry = new THREE.BoxGeometry(2.5, 1, 1.6);
    const cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0.5, 1.7, 0);
    carGroup.add(cabin);

    // Wheels (flat/damaged)
    for (let j = 0; j < 4; j++) {
      const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
      const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(j < 2 ? -1.5 : 1.5, 0.2, j % 2 === 0 ? -0.8 : 0.8);
      carGroup.add(wheel);
    }

    // Broken windows
    const windshieldGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.05);
    const windshieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0.8, 1.5, 0.8);
    windshield.rotation.x = -0.2;
    carGroup.add(windshield);

    // Position car
    carGroup.position.set(
      (Math.random() - 0.5) * 75,
      0,
      (Math.random() - 0.5) * 75
    );
    carGroup.rotation.y = Math.random() * Math.PI * 2;
    carGroup.rotation.z = (Math.random() - 0.5) * 0.2; // Slight tilt

    // Enable shadows
    carGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(carGroup);
  }
}

// Create graveyard elements
function createGraveyardElements() {
  for (let i = 0; i < 8; i++) {
    const tombstoneGroup = new THREE.Group();

    // Tombstone base
    const baseGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.2);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.75;
    tombstoneGroup.add(base);

    // Tombstone top (rounded or cross)
    if (Math.random() > 0.5) {
      // Rounded top
      const topGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
      const topMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 1.6;
      top.rotation.x = Math.PI / 2;
      tombstoneGroup.add(top);
    } else {
      // Cross
      const crossV = new THREE.BoxGeometry(0.1, 0.6, 0.1);
      const crossH = new THREE.BoxGeometry(0.4, 0.1, 0.1);
      const crossMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

      const verticalCross = new THREE.Mesh(crossV, crossMaterial);
      verticalCross.position.y = 1.8;
      tombstoneGroup.add(verticalCross);

      const horizontalCross = new THREE.Mesh(crossH, crossMaterial);
      horizontalCross.position.y = 1.9;
      tombstoneGroup.add(horizontalCross);
    }

    // Small mound of dirt
    const moundGeometry = new THREE.SphereGeometry(1.2, 8, 6);
    const moundMaterial = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const mound = new THREE.Mesh(moundGeometry, moundMaterial);
    mound.position.y = -0.3;
    mound.scale.y = 0.3;
    tombstoneGroup.add(mound);

    // Position tombstone
    tombstoneGroup.position.set(
      (Math.random() - 0.5) * 65,
      0,
      (Math.random() - 0.5) * 65
    );
    tombstoneGroup.rotation.y = Math.random() * Math.PI * 2;
    tombstoneGroup.rotation.z = (Math.random() - 0.5) * 0.1; // Slight lean

    // Enable shadows
    tombstoneGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(tombstoneGroup);
  }
}

// Create dead trees
function createDeadTrees() {
  for (let i = 0; i < 6; i++) {
    const treeGroup = new THREE.Group();

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(
      0.2,
      0.3,
      3 + Math.random() * 2,
      6
    );
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x2d1b14 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunk.geometry.parameters.height / 2;
    treeGroup.add(trunk);

    // Dead branches
    for (let j = 0; j < 3 + Math.random() * 3; j++) {
      const branchGeometry = new THREE.CylinderGeometry(
        0.05,
        0.1,
        1 + Math.random() * 1.5,
        4
      );
      const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);

      branch.position.set(
        Math.random() * 2 - 1,
        2 + Math.random() * 2,
        Math.random() * 2 - 1
      );
      branch.rotation.z = ((Math.random() - 0.5) * Math.PI) / 2;
      branch.rotation.x = ((Math.random() - 0.5) * Math.PI) / 4;

      treeGroup.add(branch);
    }

    // Position tree
    treeGroup.position.set(
      (Math.random() - 0.5) * 80,
      0,
      (Math.random() - 0.5) * 80
    );

    // Enable shadows
    treeGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(treeGroup);
  }
}

// Create debris and wreckage
function createDebrisAndWreckage() {
  for (let i = 0; i < 6; i++) {
    const debrisGroup = new THREE.Group();

    // Random debris pieces
    for (let j = 0; j < 2 + Math.random() * 3; j++) {
      const debrisGeometry = new THREE.BoxGeometry(
        0.3 + Math.random() * 1.5,
        0.2 + Math.random() * 0.8,
        0.3 + Math.random() * 1.2
      );
      const debrisMaterial = new THREE.MeshLambertMaterial({
        color: [0x2f2f2f, 0x8b4513, 0x1a1a1a, 0x654321][
          Math.floor(Math.random() * 4)
        ],
      });
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);

      debris.position.set(
        (Math.random() - 0.5) * 3,
        debris.geometry.parameters.height / 2,
        (Math.random() - 0.5) * 3
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      debris.castShadow = true;
      debris.receiveShadow = true;
      debrisGroup.add(debris);
    }

    // Position debris cluster
    debrisGroup.position.set(
      (Math.random() - 0.5) * 70,
      0,
      (Math.random() - 0.5) * 70
    );

    scene.add(debrisGroup);
  }
}

// Create broken street lights and lamp posts
function createStreetLights() {
  for (let i = 0; i < 6; i++) {
    const lampGroup = new THREE.Group();

    // Lamp post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.15, 4, 8);
    const postMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = 2;
    lampGroup.add(post);

    // Lamp head (broken/dark)
    const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 4.3;
    head.rotation.x = (Math.random() - 0.5) * 0.4; // Tilted/damaged
    lampGroup.add(head);

    // Some hanging wires
    const wireGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
    const wireMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
    wire.position.set(0.3, 3.5, 0);
    wire.rotation.z = 0.3;
    lampGroup.add(wire);

    // Position lamp
    lampGroup.position.set(
      (Math.random() - 0.5) * 75,
      0,
      (Math.random() - 0.5) * 75
    );
    lampGroup.rotation.y = Math.random() * Math.PI * 2;
    lampGroup.rotation.z = (Math.random() - 0.5) * 0.2; // Slight lean

    // Enable shadows
    lampGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(lampGroup);
  }
}

// Create barricades and roadblocks
function createBarricades() {
  for (let i = 0; i < 8; i++) {
    const barrierGroup = new THREE.Group();

    // Main barrier structure
    for (let j = 0; j < 2 + Math.random() * 3; j++) {
      const barrierGeometry = new THREE.BoxGeometry(2, 0.8, 0.3);
      const barrierMaterial = new THREE.MeshLambertMaterial({
        color: [0x8b4513, 0x2f2f2f, 0x654321][Math.floor(Math.random() * 3)],
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(j * 2.2, 0.4, 0);
      barrier.rotation.y = (Math.random() - 0.5) * 0.3;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      barrierGroup.add(barrier);
    }

    // Support posts
    for (let k = 0; k < 3; k++) {
      const postGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
      const postMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(k * 2, 0.75, -0.3);
      post.castShadow = true;
      post.receiveShadow = true;
      barrierGroup.add(post);
    }

    // Position barricade
    barrierGroup.position.set(
      (Math.random() - 0.5) * 70,
      0,
      (Math.random() - 0.5) * 70
    );
    barrierGroup.rotation.y = Math.random() * Math.PI * 2;

    scene.add(barrierGroup);
  }
}

// Create ruined structures and walls
function createRuinedStructures() {
  for (let i = 0; i < 10; i++) {
    const ruinGroup = new THREE.Group();

    // Broken wall sections
    for (let j = 0; j < 1 + Math.random() * 3; j++) {
      const wallGeometry = new THREE.BoxGeometry(
        1 + Math.random() * 2,
        1 + Math.random() * 2,
        0.3
      );
      const wallMaterial = new THREE.MeshLambertMaterial({
        color: [0x3e3e3e, 0x2a2a2a, 0x4a4a4a][Math.floor(Math.random() * 3)],
      });
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(j * 1.5, wall.geometry.parameters.height / 2, 0);
      wall.rotation.z = (Math.random() - 0.5) * 0.4; // Leaning walls
      wall.castShadow = true;
      wall.receiveShadow = true;
      ruinGroup.add(wall);
    }

    // Rubble pile
    const rubbleGeometry = new THREE.SphereGeometry(1, 6, 4);
    const rubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
    const rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
    rubble.position.y = 0.3;
    rubble.scale.set(1, 0.4, 1);
    rubble.castShadow = true;
    rubble.receiveShadow = true;
    ruinGroup.add(rubble);

    // Position ruin
    ruinGroup.position.set(
      (Math.random() - 0.5) * 75,
      0,
      (Math.random() - 0.5) * 75
    );
    ruinGroup.rotation.y = Math.random() * Math.PI * 2;

    scene.add(ruinGroup);
  }
}

// Create abandoned playgrounds
function createPlaygrounds() {
  for (let i = 0; i < 2; i++) {
    const playgroundGroup = new THREE.Group();

    // Swing set
    const swingGroup = new THREE.Group();

    // Swing frame
    const frameGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    const leftPost = new THREE.Mesh(frameGeometry, frameMaterial);
    leftPost.position.set(-2, 1.5, 0);
    swingGroup.add(leftPost);

    const rightPost = new THREE.Mesh(frameGeometry, frameMaterial);
    rightPost.position.set(2, 1.5, 0);
    swingGroup.add(rightPost);

    const topBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
      frameMaterial
    );
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = 2.8;
    swingGroup.add(topBar);

    // Broken swings
    for (let j = 0; j < 2; j++) {
      const seatGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.4);
      const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      const seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(-1 + j * 2, 1.2, 0);
      seat.rotation.z = (Math.random() - 0.5) * 0.3; // Tilted/broken
      swingGroup.add(seat);

      // Chain (only one side hanging)
      const chainGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4);
      const chainMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
      const chain = new THREE.Mesh(chainGeometry, chainMaterial);
      chain.position.set(-1 + j * 2, 2, 0);
      chain.rotation.z = (Math.random() - 0.5) * 0.2;
      swingGroup.add(chain);
    }

    playgroundGroup.add(swingGroup);

    // Slide (broken)
    const slideGroup = new THREE.Group();
    slideGroup.position.set(6, 0, 0);

    // Slide platform
    const platformGeometry = new THREE.BoxGeometry(2, 0.2, 2);
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 2;
    slideGroup.add(platform);

    // Slide surface (cracked)
    const slideGeometry = new THREE.BoxGeometry(0.8, 0.1, 3);
    const slideMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
    const slide = new THREE.Mesh(slideGeometry, slideMaterial);
    slide.position.set(0, 1, 1.5);
    slide.rotation.x = -0.5;
    slideGroup.add(slide);

    // Support legs
    for (let k = 0; k < 4; k++) {
      const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 6);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(k < 2 ? -0.8 : 0.8, 1, k % 2 === 0 ? -0.8 : 0.8);
      slideGroup.add(leg);
    }

    playgroundGroup.add(slideGroup);

    // Seesaw (broken)
    const seesawGroup = new THREE.Group();
    seesawGroup.position.set(-6, 0, 0);

    const seesawPlank = new THREE.BoxGeometry(4, 0.2, 0.4);
    const seesawMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const seesaw = new THREE.Mesh(seesawPlank, seesawMaterial);
    seesaw.position.y = 0.8;
    seesaw.rotation.z = (Math.random() - 0.5) * 0.4; // Tilted
    seesawGroup.add(seesaw);

    const fulcrumGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
    const fulcrum = new THREE.Mesh(
      fulcrumGeometry,
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    fulcrum.position.y = 0.3;
    seesawGroup.add(fulcrum);

    playgroundGroup.add(seesawGroup);

    // Position playground
    playgroundGroup.position.set(
      (Math.random() - 0.5) * 60,
      0,
      (Math.random() - 0.5) * 60
    );
    playgroundGroup.rotation.y = Math.random() * Math.PI * 2;

    // Enable shadows
    playgroundGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(playgroundGroup);
  }
}

// Create school buildings
function createSchools() {
  for (let i = 0; i < 1; i++) {
    const schoolGroup = new THREE.Group();

    // Main school building
    const buildingGeometry = new THREE.BoxGeometry(8, 4, 6);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 }); // School brick color
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 2;
    schoolGroup.add(building);

    // School roof
    const roofGeometry = new THREE.BoxGeometry(8.5, 0.4, 6.5);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4.2;
    schoolGroup.add(roof);

    // School windows (many)
    for (let j = 0; j < 6; j++) {
      for (let k = 0; k < 2; k++) {
        const windowGeometry = new THREE.BoxGeometry(0.8, 1, 0.1);
        const windowMaterial = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.7 ? 0x000000 : 0x1a1a3a, // Some broken, some dark
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(-3.5 + j * 1.2, 1.5 + k * 1.5, 3.05);
        schoolGroup.add(window);
      }
    }

    // School entrance
    const doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.1);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.25, 3.05);
    schoolGroup.add(door);

    // School sign (fallen)
    const signGeometry = new THREE.BoxGeometry(3, 0.8, 0.1);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(2, 0.5, 4);
    sign.rotation.x = Math.PI / 2;
    sign.rotation.z = (Math.random() - 0.5) * 0.5;
    schoolGroup.add(sign);

    // Basketball hoop (broken)
    const hoopGroup = new THREE.Group();
    hoopGroup.position.set(10, 0, 0);

    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.75;
    hoopGroup.add(pole);

    const backboardGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const backboardMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(0, 3.2, 0.5);
    backboard.rotation.x = -0.2; // Tilted/damaged
    hoopGroup.add(backboard);

    schoolGroup.add(hoopGroup);

    // Position school
    schoolGroup.position.set(
      (Math.random() - 0.5) * 70,
      0,
      (Math.random() - 0.5) * 70
    );
    schoolGroup.rotation.y = Math.random() * Math.PI * 2;

    // Enable shadows
    schoolGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(schoolGroup);
  }
}

// Create hospital complexes
function createHospitals() {
  for (let i = 0; i < 1; i++) {
    const hospitalGroup = new THREE.Group();

    // Main hospital building (larger)
    const buildingGeometry = new THREE.BoxGeometry(10, 5, 8);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff }); // White hospital
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 2.5;
    hospitalGroup.add(building);

    // Hospital roof
    const roofGeometry = new THREE.BoxGeometry(10.5, 0.3, 8.5);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5.15;
    hospitalGroup.add(roof);

    // Red cross on building
    const crossV = new THREE.BoxGeometry(0.3, 2, 0.1);
    const crossH = new THREE.BoxGeometry(1.5, 0.3, 0.1);
    const crossMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

    const verticalCross = new THREE.Mesh(crossV, crossMaterial);
    verticalCross.position.set(0, 3, 4.05);
    hospitalGroup.add(verticalCross);

    const horizontalCross = new THREE.Mesh(crossH, crossMaterial);
    horizontalCross.position.set(0, 3, 4.05);
    hospitalGroup.add(horizontalCross);

    // Hospital windows
    for (let j = 0; j < 8; j++) {
      for (let k = 0; k < 3; k++) {
        const windowGeometry = new THREE.BoxGeometry(0.8, 1, 0.1);
        const windowMaterial = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0x87ceeb : 0x000000, // Some lit, some dark
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(-4 + j * 1, 1 + k * 1.3, 4.05);
        hospitalGroup.add(window);
      }
    }

    // Emergency entrance
    const entranceGeometry = new THREE.BoxGeometry(3, 3, 0.1);
    const entranceMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(-3, 1.5, 4.05);
    hospitalGroup.add(entrance);

    // Ambulance (abandoned)
    const ambulanceGroup = new THREE.Group();
    ambulanceGroup.position.set(8, 0, -2);

    // Ambulance body
    const ambulanceBody = new THREE.BoxGeometry(3, 1.5, 1.8);
    const ambulanceMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    });
    const ambBody = new THREE.Mesh(ambulanceBody, ambulanceMaterial);
    ambBody.position.y = 0.75;
    ambulanceGroup.add(ambBody);

    // Ambulance cabin
    const cabinGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.6);
    const cabin = new THREE.Mesh(
      cabinGeometry,
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    cabin.position.set(1.2, 1.8, 0);
    ambulanceGroup.add(cabin);

    // Red cross on ambulance
    const ambCrossV = new THREE.BoxGeometry(0.1, 0.5, 0.05);
    const ambCrossH = new THREE.BoxGeometry(0.3, 0.1, 0.05);

    const ambVerticalCross = new THREE.Mesh(ambCrossV, crossMaterial);
    ambVerticalCross.position.set(-1.5, 1, 0.9);
    ambulanceGroup.add(ambVerticalCross);

    const ambHorizontalCross = new THREE.Mesh(ambCrossH, crossMaterial);
    ambHorizontalCross.position.set(-1.5, 1, 0.9);
    ambulanceGroup.add(ambHorizontalCross);

    // Ambulance wheels
    for (let j = 0; j < 4; j++) {
      const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
      const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(j < 2 ? -0.8 : 1, 0.3, j % 2 === 0 ? -0.7 : 0.7);
      ambulanceGroup.add(wheel);
    }

    hospitalGroup.add(ambulanceGroup);

    // Medical equipment (scattered)
    for (let j = 0; j < 3; j++) {
      const equipGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
      const equipMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const equipment = new THREE.Mesh(equipGeometry, equipMaterial);
      equipment.position.set(
        (Math.random() - 0.5) * 10,
        0.4,
        (Math.random() - 0.5) * 8
      );
      equipment.rotation.y = Math.random() * Math.PI;
      equipment.castShadow = true;
      equipment.receiveShadow = true;
      hospitalGroup.add(equipment);
    }

    // Position hospital
    hospitalGroup.position.set(
      (Math.random() - 0.5) * 65,
      0,
      (Math.random() - 0.5) * 65
    );
    hospitalGroup.rotation.y = Math.random() * Math.PI * 2;

    // Enable shadows
    hospitalGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(hospitalGroup);
  }
}

// Load demon model and spawn demons
function loadDemonModel() {
  console.log("Starting demon model loading...");

  // Always create placeholder demons first for immediate gameplay
  console.log("Creating placeholder demon models...");
  createPlaceholderDemonModel();

  // Initialize all UI elements
  initializeUI();

  // Start wave system instead of spawning all demons at once
  startWaveSystem();

  // Note: GLTF model loading disabled - using optimized placeholder models
  // This ensures immediate gameplay without network dependencies
  console.log("Using optimized Doom-style demon models for best performance");
}

// Create a demon model based on type
function createDemonModel(demonType) {
  const typeData = DEMON_TYPES[demonType];
  const demonGroup = new THREE.Group();

  // Body (using box geometry for better compatibility)
  const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: typeData.color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  demonGroup.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const headMaterial = new THREE.MeshLambertMaterial({
    color: typeData.headColor,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.4;
  demonGroup.add(head);

  // Eyes (different colors for different types)
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: typeData.eyeColor,
    emissive: typeData.eyeColor,
    emissiveIntensity: 0.5,
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, 1.45, 0.25);
  demonGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, 1.45, 0.25);
  demonGroup.add(rightEye);

  // Arms
  const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
  const armMaterial = new THREE.MeshLambertMaterial({
    color: typeData.headColor,
  });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.45, 0.8, 0);
  leftArm.rotation.z = 0.3;
  demonGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.45, 0.8, 0);
  rightArm.rotation.z = -0.3;
  demonGroup.add(rightArm);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
  const legMaterial = new THREE.MeshLambertMaterial({ color: typeData.color });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.15, -0.4, 0);
  demonGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.15, -0.4, 0);
  demonGroup.add(rightLeg);

  // Special features based on demon type
  if (demonType === "CACODEMON" || demonType === "BARON") {
    // Add armor/spikes for Cacodemon and Baron
    const armorGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
    const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const armor = new THREE.Mesh(armorGeometry, armorMaterial);
    armor.position.y = 1.0;
    demonGroup.add(armor);
  }

  if (demonType === "DEMON") {
    // Add running gear for fast demons
    const helmetGeometry = new THREE.BoxGeometry(0.45, 0.15, 0.45);
    const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 1.6;
    demonGroup.add(helmet);
  }

  if (demonType === "BARON") {
    // Add crown for Baron
    const crownGeometry = new THREE.ConeGeometry(0.3, 0.4, 6);
    const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 1.8;
    demonGroup.add(crown);
  }

  // Enable shadows
  demonGroup.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Store demon type in the model
  demonGroup.userData.demonType = demonType;

  return demonGroup;
}

// Create placeholder demon models for all types
function createPlaceholderDemonModel() {
  console.log("Creating placeholder demon models for all types...");

  // Create base model (normal type)
  demonModel = createDemonModel("IMP");

  console.log("Placeholder demon models created successfully");
}

// Create an ammo pack model
function createAmmoPack() {
  const ammoPackGroup = new THREE.Group();

  // Main ammo symbol (lightning bolt/battery)
  const symbolGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.05);
  const symbolMaterial = new THREE.MeshLambertMaterial({
    color: 0x00aaff,
    emissive: 0x001144,
    emissiveIntensity: 0.3,
  });

  // Vertical part of lightning bolt
  const symbolVertical = new THREE.Mesh(symbolGeometry, symbolMaterial);
  symbolVertical.position.y = 0.5;
  symbolVertical.rotation.z = 0.2;
  ammoPackGroup.add(symbolVertical);

  // Diagonal part of lightning bolt
  const symbolDiagonal = new THREE.Mesh(symbolGeometry, symbolMaterial);
  symbolDiagonal.rotation.z = Math.PI / 3;
  symbolDiagonal.position.set(0.05, 0.45, 0);
  ammoPackGroup.add(symbolDiagonal);

  // Base/container (dark metallic box)
  const baseGeometry = new THREE.BoxGeometry(0.7, 0.9, 0.7);
  const baseMaterial = new THREE.MeshLambertMaterial({
    color: 0x333333,
    emissive: 0x001122,
    emissiveIntensity: 0.1,
  });

  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.45;
  ammoPackGroup.add(base);

  // Add pulsing glow effect around the pack (blue)
  const glowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x0088ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = 0.45;
  ammoPackGroup.add(glow);

  // Enable shadows
  ammoPackGroup.traverse(function (child) {
    if (child.isMesh && child !== glow) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Store glow for animation
  ammoPackGroup.userData.glow = glow;
  ammoPackGroup.userData.creationTime = Date.now();

  return ammoPackGroup;
}

// Create a health pack model
function createHealthPack() {
  const healthPackGroup = new THREE.Group();

  // Main cross (red cross symbol)
  const crossGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
  const crossMaterial = new THREE.MeshLambertMaterial({
    color: 0xff0000,
    emissive: 0x330000,
    emissiveIntensity: 0.3,
  });

  // Horizontal part of cross
  const crossHorizontal = new THREE.Mesh(crossGeometry, crossMaterial);
  crossHorizontal.position.y = 0.5;
  healthPackGroup.add(crossHorizontal);

  // Vertical part of cross
  const crossVertical = new THREE.Mesh(crossGeometry, crossMaterial);
  crossVertical.rotation.z = Math.PI / 2;
  crossVertical.position.y = 0.5;
  healthPackGroup.add(crossVertical);

  // Base/container (white box)
  const baseGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
  const baseMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0x111111,
    emissiveIntensity: 0.1,
  });

  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.4;
  healthPackGroup.add(base);

  // Add pulsing glow effect around the pack
  const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = 0.4;
  healthPackGroup.add(glow);

  // Enable shadows
  healthPackGroup.traverse(function (child) {
    if (child.isMesh && child !== glow) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Store glow for animation
  healthPackGroup.userData.glow = glow;
  healthPackGroup.userData.creationTime = Date.now();

  return healthPackGroup;
}

// Spawn an ammo pack at a random location
function spawnAmmoPack() {
  if (ammoPacks.length >= MAX_AMMO_PACKS) {
    return; // Don't spawn if at maximum
  }

  const ammoPack = createAmmoPack();

  // Random position on the map (avoiding demons and player)
  let x, z;
  let attempts = 0;
  do {
    x = (Math.random() - 0.5) * 50; // Slightly smaller area than demons
    z = (Math.random() - 0.5) * 50;
    attempts++;
  } while (attempts < 10 && isTooCloseToEntities(x, z, 8)); // 8 unit clearance

  ammoPack.position.set(x, 0, z);
  ammoPack.rotation.y = Math.random() * Math.PI * 2;

  ammoPacks.push(ammoPack);
  scene.add(ammoPack);

  // Update UI
  updateAmmoPackCount();

  console.log(`🔋 Energy cell spawned at (${x.toFixed(2)}, ${z.toFixed(2)})`);
}

// Spawn a health pack at a random location
function spawnHealthPack() {
  if (healthPacks.length >= MAX_HEALTH_PACKS) {
    return; // Don't spawn if at maximum
  }

  const healthPack = createHealthPack();

  // Random position on the map (avoiding demons and player)
  let x, z;
  let attempts = 0;
  do {
    x = (Math.random() - 0.5) * 50; // Slightly smaller area than demons
    z = (Math.random() - 0.5) * 50;
    attempts++;
  } while (attempts < 10 && isTooCloseToEntities(x, z, 8)); // 8 unit clearance

  healthPack.position.set(x, 0, z);
  healthPack.rotation.y = Math.random() * Math.PI * 2;

  healthPacks.push(healthPack);
  scene.add(healthPack);

  // Update UI
  updateHealthPackCount();

  console.log(`💉 Neural stim spawned at (${x.toFixed(2)}, ${z.toFixed(2)})`);
}

// Check if position is too close to player or demons
function isTooCloseToEntities(x, z, minDistance) {
  // Check distance to player
  const playerPos = controls.getObject().position;
  const distToPlayer = Math.sqrt(
    Math.pow(x - playerPos.x, 2) + Math.pow(z - playerPos.z, 2)
  );
  if (distToPlayer < minDistance) return true;

  // Check distance to demons
  for (const demon of demons) {
    if (!demon) continue;
    const distToDemon = Math.sqrt(
      Math.pow(x - demon.position.x, 2) + Math.pow(z - demon.position.z, 2)
    );
    if (distToDemon < minDistance) return true;
  }

  return false;
}

// Update ammo pack spawning
function updateAmmoPackSpawning() {
  const currentTime = Date.now();

  // Spawn ammo packs periodically
  if (currentTime - lastAmmoPackSpawn > AMMO_PACK_SPAWN_INTERVAL) {
    spawnAmmoPack();
    lastAmmoPackSpawn = currentTime;
  }
}

// Update health pack spawning
function updateHealthPackSpawning() {
  const currentTime = Date.now();

  // Spawn health packs periodically
  if (currentTime - lastHealthPackSpawn > HEALTH_PACK_SPAWN_INTERVAL) {
    spawnHealthPack();
    lastHealthPackSpawn = currentTime;
  }
}

// Update ammo pack animations and effects
function updateAmmoPacks() {
  ammoPacks.forEach((ammoPack, index) => {
    if (!ammoPack) return;

    const time = Date.now() * 0.003;

    // Floating animation
    ammoPack.position.y = 0.2 + Math.sin(time + index + 1) * 0.18;

    // Rotation animation
    ammoPack.rotation.y += 0.025;

    // Pulsing glow effect (blue)
    if (ammoPack.userData.glow) {
      const glowIntensity = 0.15 + Math.sin(time * 2.5 + index) * 0.1;
      ammoPack.userData.glow.material.opacity = glowIntensity;

      // Scale pulsing
      const scale = 1 + Math.sin(time * 1.8 + index) * 0.12;
      ammoPack.userData.glow.scale.setScalar(scale);
    }
  });
}

// Update health pack animations and effects
function updateHealthPacks() {
  healthPacks.forEach((healthPack, index) => {
    if (!healthPack) return;

    const time = Date.now() * 0.003;

    // Floating animation
    healthPack.position.y = 0.2 + Math.sin(time + index) * 0.15;

    // Rotation animation
    healthPack.rotation.y += 0.02;

    // Pulsing glow effect
    if (healthPack.userData.glow) {
      const glowIntensity = 0.1 + Math.sin(time * 2 + index) * 0.1;
      healthPack.userData.glow.material.opacity = glowIntensity;

      // Scale pulsing
      const scale = 1 + Math.sin(time * 1.5 + index) * 0.1;
      healthPack.userData.glow.scale.setScalar(scale);
    }
  });
}

// Check collision between player and ammo packs
function checkAmmoPackCollision() {
  if (isGameOver) return;

  const playerPosition = controls.getObject().position;
  const shotgun = WEAPONS.shotgun;
  const chaingun = WEAPONS.chaingun;

  // Don't collect if both weapons are at max ammo
  if (
    shotgun.currentAmmo >= shotgun.maxAmmo &&
    chaingun.currentAmmo >= chaingun.maxAmmo
  )
    return;

  ammoPacks.forEach((ammoPack, index) => {
    if (!ammoPack) return;

    // Calculate distance between player and ammo pack
    const dx = playerPosition.x - ammoPack.position.x;
    const dz = playerPosition.z - ammoPack.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // If player is close enough to collect
    if (distance < 2.0) {
      // 2 unit collection radius
      collectAmmoPack(ammoPack, index);
    }
  });
}

// Check collision between player and health packs
function checkHealthPackCollision() {
  if (isGameOver || playerHealth >= maxHealth) return;

  const playerPosition = controls.getObject().position;

  healthPacks.forEach((healthPack, index) => {
    if (!healthPack) return;

    // Calculate distance between player and health pack
    const dx = playerPosition.x - healthPack.position.x;
    const dz = playerPosition.z - healthPack.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // If player is close enough to collect
    if (distance < 2.0) {
      // 2 unit collection radius
      collectHealthPack(healthPack, index);
    }
  });
}

// Collect an ammo pack
function collectAmmoPack(ammoPack, index) {
  const shotgun = WEAPONS.shotgun;
  const chaingun = WEAPONS.chaingun;

  // Calculate ammo to add for each weapon
  let totalRefill = 0;
  let refillDetails = [];

  // Refill shotgun if needed
  if (shotgun.currentAmmo < shotgun.maxAmmo) {
    const shotgunRefillAmount = Math.floor(AMMO_PACK_REFILL_AMOUNT * 0.4); // 40% for shotgun (24 shells)
    const oldShotgunAmmo = shotgun.currentAmmo;
    shotgun.currentAmmo = Math.min(
      shotgun.maxAmmo,
      shotgun.currentAmmo + shotgunRefillAmount
    );
    const actualShotgunRefill = shotgun.currentAmmo - oldShotgunAmmo;
    if (actualShotgunRefill > 0) {
      totalRefill += actualShotgunRefill;
      refillDetails.push(`${actualShotgunRefill} shells`);
    }
  }

  // Refill chaingun if needed
  if (chaingun.currentAmmo < chaingun.maxAmmo) {
    const chainguRefillAmount = Math.floor(AMMO_PACK_REFILL_AMOUNT * 0.6); // 60% for chaingun (36 rounds)
    const oldChainguAmmo = chaingun.currentAmmo;
    chaingun.currentAmmo = Math.min(
      chaingun.maxAmmo,
      chaingun.currentAmmo + chainguRefillAmount
    );
    const actualChainguRefill = chaingun.currentAmmo - oldChainguAmmo;
    if (actualChainguRefill > 0) {
      totalRefill += actualChainguRefill;
      refillDetails.push(`${actualChainguRefill} rounds`);
    }
  }

  // Only proceed if we actually refilled something
  if (totalRefill === 0) return;

  // Update weapon display
  updateWeaponDisplay();

  // Create collection effect
  createAmmoPackCollectionEffect(ammoPack.position);

  // Play collection sound
  playAmmoPackSound();

  // Remove ammo pack from scene and array
  scene.remove(ammoPack);
  ammoPacks.splice(index, 1);

  // Update collection count
  ammoPacksCollected++;

  // Update UI
  updateAmmoPackCount();

  const refillText = refillDetails.join(" + ");
  console.log(`🔋 Energy cell collected! Refilled ${refillText}`);

  // Show floating text
  showFloatingText(`+${totalRefill} AMMO`, ammoPack.position, 0x00aaff);
}

// Collect a health pack
function collectHealthPack(healthPack, index) {
  // Heal player
  const oldHealth = playerHealth;
  playerHealth = Math.min(maxHealth, playerHealth + HEALTH_PACK_HEAL_AMOUNT);
  const actualHeal = playerHealth - oldHealth;

  // Update health bar
  updateHealthBar();

  // Create collection effect
  createHealthPackCollectionEffect(healthPack.position);

  // Play collection sound
  playHealthPackSound();

  // Remove health pack from scene and array
  scene.remove(healthPack);
  healthPacks.splice(index, 1);

  // Update collection count
  healthPacksCollected++;

  // Update UI
  updateHealthPackCount();

  console.log(
    `💉 Neural stim collected! Restored ${actualHeal} integrity (${oldHealth} → ${playerHealth})`
  );

  // Show floating text
  showFloatingText(`+${actualHeal} HP`, healthPack.position, 0x00ff00);
}

// Create visual effect when ammo pack is collected
function createAmmoPackCollectionEffect(position) {
  // Create blue ammo particles
  const particles = [];

  for (let i = 0; i < 12; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.04, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.9,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Position at collection location
    particle.position.copy(position);
    particle.position.y += 0.5;

    // Random velocity upward and outward
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        Math.random() * 3.5 + 1, // Upward bias
        (Math.random() - 0.5) * 2.5
      ),
      life: 1.0,
    };

    particles.push(particle);
    scene.add(particle);
  }

  // Animate and remove particles
  const animateParticles = () => {
    particles.forEach((particle, index) => {
      if (!particle.userData) return;

      // Move particle
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(0.025)
      );
      particle.userData.velocity.y -= 0.05; // Gravity

      // Fade out
      particle.userData.life -= 0.025;
      particle.material.opacity = particle.userData.life;

      // Remove when faded
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(index, 1);
      }
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };

  animateParticles();
}

// Create visual effect when health pack is collected
function createHealthPackCollectionEffect(position) {
  // Create green healing particles
  const particles = [];

  for (let i = 0; i < 15; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Position at collection location
    particle.position.copy(position);
    particle.position.y += 0.5;

    // Random velocity upward and outward
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1, // Upward bias
        (Math.random() - 0.5) * 2
      ),
      life: 1.0,
    };

    particles.push(particle);
    scene.add(particle);
  }

  // Animate and remove particles
  const animateParticles = () => {
    particles.forEach((particle, index) => {
      if (!particle.userData) return;

      // Move particle
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(0.02)
      );
      particle.userData.velocity.y -= 0.04; // Gravity

      // Fade out
      particle.userData.life -= 0.02;
      particle.material.opacity = particle.userData.life;

      // Remove when faded
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(index, 1);
      }
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };

  animateParticles();
}

// Show floating text above position
function showFloatingText(text, position, color) {
  // Create temporary div for floating text (simple implementation)
  // In a real game, you'd use a more sophisticated text rendering system
  console.log(
    `Floating text: ${text} at (${position.x.toFixed(1)}, ${position.z.toFixed(
      1
    )})`
  );
}

// Play ammo pack collection sound
function playAmmoPackSound() {
  if (!audioListener) return;

  // Create a distinctive electric/power sound for ammo pack collection
  const audioContext = audioListener.context;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Configure electric power sound
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
  oscillator.frequency.exponentialRampToValueAtTime(
    440,
    audioContext.currentTime + 0.2
  ); // A4
  oscillator.frequency.exponentialRampToValueAtTime(
    330,
    audioContext.currentTime + 0.4
  ); // E4

  // Envelope for electric sound
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    effectsVolume * 0.6,
    audioContext.currentTime + 0.05
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.5
  );

  // Connect and play
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Play health pack collection sound
function playHealthPackSound() {
  if (!audioListener) return;

  // Create a pleasant chime sound for health pack collection
  const audioContext = audioListener.context;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Configure healing sound
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
  oscillator.frequency.exponentialRampToValueAtTime(
    784,
    audioContext.currentTime + 0.3
  ); // G5

  // Envelope for chime
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    effectsVolume * 0.5,
    audioContext.currentTime + 0.1
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.6
  );

  // Connect and play
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.6);
}

// Spawn demons randomly around the map
function spawnDemons() {
  console.log(`Spawning ${DEMON_COUNT} demons...`);

  if (!demonModel) {
    console.error("Demon model not created yet!");
    return;
  }

  for (let i = 0; i < DEMON_COUNT; i++) {
    const demon = demonModel.clone();

    // Random position on the map (avoiding the center where player starts)
    let x, z;
    do {
      x = (Math.random() - 0.5) * 60; // Spread across 60 units (smaller for visibility)
      z = (Math.random() - 0.5) * 60;
    } while (Math.sqrt(x * x + z * z) < 10); // Keep away from player start position

    demon.position.set(x, 0, z);
    demon.rotation.y = Math.random() * Math.PI * 2; // Random rotation

    // Scale demons to make them more visible
    const scale = 1.5 + Math.random() * 0.5; // 1.5 to 2.0 scale (larger)
    demon.scale.setScalar(scale);

    // Add some properties for demon behavior
    demon.userData = {
      walkSpeed: 0.3 + Math.random() * 0.4, // Base walk speed (0.3-0.7)
      rotationSpeed: 0.01 + Math.random() * 0.02,
      wanderDirection: Math.random() * Math.PI * 2,
      wanderTimer: Math.random() * 100,
      attackCooldown: 0,
      isAttacking: false,
      hasAttacked: false, // New: track if demon has attacked in current cycle
      originalScale: scale, // Store original scale
      attackScaleSet: false,
    };

    demons.push(demon);
    scene.add(demon);

    console.log(
      `Demon ${i + 1} spawned at position (${x.toFixed(2)}, 0, ${z.toFixed(2)})`
    );
  }

  // Also add a few test demons close to the player for immediate visibility
  for (let i = 0; i < 3; i++) {
    const testDemon = demonModel.clone();
    testDemon.position.set(
      5 + i * 3, // 5, 8, 11 units in front
      0,
      -10 - i * 2 // Spread them out
    );
    testDemon.scale.setScalar(2); // Make them big and obvious
    testDemon.userData = {
      walkSpeed: 0.3,
      rotationSpeed: 0.01,
      wanderDirection: 0,
      wanderTimer: 0,
      attackCooldown: 0,
      isAttacking: false,
      hasAttacked: false,
      originalScale: 2, // Test demons are scaled to 2
      attackScaleSet: false,
    };
    demons.push(testDemon);
    scene.add(testDemon);
    console.log(
      `Test demon ${i + 1} placed at (${testDemon.position.x}, ${
        testDemon.position.y
      }, ${testDemon.position.z})`
    );
  }

  console.log(`Successfully spawned ${DEMON_COUNT + 3} demons on the map!`);
  console.log("Total demons in array:", demons.length);
}

// Wave system functions
function startWaveSystem() {
  console.log("Starting wave system...");
  updateWaveDisplay();

  // Start background music when game begins
  setTimeout(() => {
    startBackgroundMusic();
  }, 2000); // Delay to allow audio to initialize

  // In multiplayer, waves are controlled by the server
  if (isMultiplayer) {
    console.log("🌐 Multiplayer mode: Wave system controlled by server");
    return;
  }

  startWave();
}

function startWave() {
  console.log(`Starting Wave ${currentWave}`);
  waveInProgress = true;
  demonsThisWave = getDemonsForWave(currentWave);
  demonsSpawnedThisWave = 0;

  // Play dramatic sound for new wave
  if (currentWave > 1) {
    playHornOfDoom();
  }

  updateWaveDisplay();

  // Start spawning demons for this wave (single player only)
  if (!isMultiplayer) {
    spawnWaveDemons();
  }
}

function getDemonsForWave(waveNumber) {
  // Increase demon count each wave: Wave 1 = 3, Wave 2 = 5, Wave 3 = 8, etc.
  return Math.floor(2 + waveNumber * 1.5);
}

// Determine which demon types can spawn in current wave
function getAvailableDemonTypes(waveNumber) {
  const availableTypes = [];

  // Normal demons always available
  availableTypes.push({
    type: "IMP",
    weight: DEMON_TYPES.IMP.spawnWeight,
  });

  // Fast demons from wave 2
  if (waveNumber >= 2) {
    availableTypes.push({
      type: "DEMON",
      weight: DEMON_TYPES.DEMON.spawnWeight,
    });
  }

  // Tank demons from wave 4
  if (waveNumber >= 4) {
    availableTypes.push({
      type: "CACODEMON",
      weight: DEMON_TYPES.CACODEMON.spawnWeight,
    });
  }

  // Boss demons from wave 6 (rare)
  if (waveNumber >= 6) {
    availableTypes.push({
      type: "BARON",
      weight: DEMON_TYPES.BARON.spawnWeight,
    });
  }

  return availableTypes;
}

// Select a random demon type based on spawn weights
function selectDemonType(waveNumber) {
  const availableTypes = getAvailableDemonTypes(waveNumber);

  // Calculate total weight
  const totalWeight = availableTypes.reduce(
    (sum, type) => sum + type.weight,
    0
  );

  // Random selection based on weight
  let random = Math.random() * totalWeight;

  for (const typeInfo of availableTypes) {
    random -= typeInfo.weight;
    if (random <= 0) {
      return typeInfo.type;
    }
  }

  // Fallback to normal
  return "IMP";
}

function spawnWaveDemons() {
  if (demonsSpawnedThisWave >= demonsThisWave) {
    console.log(
      `All ${demonsThisWave} combat units deployed for protocol wave ${currentWave}`
    );
    return;
  }

  // Spawn one demon
  spawnSingleDemon();
  demonsSpawnedThisWave++;

  // Schedule next demon spawn (every 1-3 seconds)
  const spawnDelay = 1000 + Math.random() * 2000;
  demonSpawnTimer = setTimeout(spawnWaveDemons, spawnDelay);
}

function spawnSingleDemon() {
  // Select demon type based on current wave
  const demonType = selectDemonType(currentWave);
  const typeData = DEMON_TYPES[demonType];

  // Create demon of selected type
  const demon = createDemonModel(demonType);

  // Random position on the map (avoiding the center where player starts)
  let x, z;
  do {
    x = (Math.random() - 0.5) * 60;
    z = (Math.random() - 0.5) * 60;
  } while (Math.sqrt(x * x + z * z) < 10);

  demon.position.set(x, 0, z);
  demon.rotation.y = Math.random() * Math.PI * 2;

  // Apply type-specific scaling with wave multiplier
  const waveMultiplier = 1 + (currentWave - 1) * 0.05; // Reduced wave scaling
  const baseScale = 1.5 + Math.random() * 0.5;
  const finalScale = baseScale * typeData.scale * waveMultiplier;
  demon.scale.setScalar(finalScale);

  // Set up demon data based on type
  demon.userData = {
    demonType: demonType,
    health: typeData.health,
    maxHealth: typeData.health,
    walkSpeed: typeData.speed * (0.8 + Math.random() * 0.4) * waveMultiplier,
    rotationSpeed: 0.01 + Math.random() * 0.02,
    wanderDirection: Math.random() * Math.PI * 2,
    wanderTimer: Math.random() * 100,
    attackCooldown: 0,
    isAttacking: false,
    hasAttacked: false,
    originalScale: finalScale,
    attackScaleSet: false,
    detectRange: typeData.detectRange,
    attackRange: typeData.attackRange,
    chaseRange: typeData.chaseRange,
    attackDamage: typeData.attackDamage,
  };

  demons.push(demon);
  scene.add(demon);

  // Update type count for UI
  demonTypeCounts[demonType]++;

  // Play demon spawn sound based on type (occasionally)
  if (Math.random() < 0.3) {
    // 30% chance to play spawn sound
    setTimeout(() => {
      playDemonTypeSound(demonType);
    }, 500 + Math.random() * 1000); // Random delay between 0.5-1.5 seconds
  }

  console.log(
    `${typeData.emoji} ${typeData.name} deployed for protocol wave ${currentWave} (${demonsSpawnedThisWave}/${demonsThisWave})`
  );
}

function checkWaveComplete() {
  if (!waveInProgress || isGameOver) return;

  // In multiplayer, wave completion is handled by server
  if (isMultiplayer) return;

  // Count living demons (not dead or falling)
  const livingDemons = demons.filter(
    (demon) =>
      demon.userData && !demon.userData.isDead && !demon.userData.isFalling
  ).length;

  if (livingDemons === 0 && demonsSpawnedThisWave >= demonsThisWave) {
    completeWave();
  }
}

function completeWave() {
  console.log(`Wave ${currentWave} completed!`);
  waveInProgress = false;
  currentWave++;

  // Play victory sound for wave completion
  if (currentWave > 2) {
    // Play for wave 2 and onwards
    playExplosionSound();
  }

  // Clear any remaining spawn timers
  if (demonSpawnTimer) {
    clearTimeout(demonSpawnTimer);
    demonSpawnTimer = null;
  }

  updateWaveDisplay();

  // Start next wave after delay
  console.log(`Next wave starts in ${timeBetweenWaves / 1000} seconds...`);
  nextWaveTimer = setTimeout(() => {
    startWave();
  }, timeBetweenWaves);
}

// Enhanced demon AI - hunt the player
function updateDemons() {
  if (demons.length === 0) return;

  const playerPosition = controls.getObject().position;

  demons.forEach((demon, index) => {
    if (!demon || !demon.userData) return;

    const userData = demon.userData;

    // Handle falling demons
    if (userData.isFalling) {
      userData.fallSpeed += 0.02; // Increase fall speed
      demon.rotation.x += userData.fallSpeed;

      // Stop falling when demon has rotated 90 degrees
      if (demon.rotation.x >= Math.PI / 2) {
        demon.rotation.x = Math.PI / 2;
        userData.isFalling = false;
        userData.isDead = true;
        console.log("Demon fell down and is now dead");
      }
      return; // Skip normal movement for falling demons
    }

    // Skip movement if demon is dead
    if (userData.isDead) return;

    // Calculate distance to player
    const dx = playerPosition.x - demon.position.x;
    const dz = playerPosition.z - demon.position.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

    // Initialize attack state if not present
    if (userData.attackCooldown === undefined) {
      userData.attackCooldown = 0;
      userData.isAttacking = false;
    }

    // Update attack cooldown
    if (userData.attackCooldown > 0) {
      userData.attackCooldown--;
    }

    // Enhanced pathfinding and behavior system using type-specific ranges
    const detectionRange = userData.detectRange || 60;
    const attackRange = userData.attackRange || 3.5;
    const chaseRange = userData.chaseRange || 8;

    // Determine demon behavior based on distance to player
    if (distanceToPlayer < detectionRange) {
      // PLAYER DETECTED - Start hunting behavior

      // Play growl sound occasionally when hunting
      if (Math.random() < 0.003) {
        // Slightly more frequent growls
        playDemonGrowlSound();
      }

      // Calculate optimal path to player (basic pathfinding)
      const pathToPlayer = calculatePathToPlayer(
        demon.position,
        playerPosition
      );

      // Check behavior state based on distance
      if (distanceToPlayer <= attackRange) {
        // ATTACK MODE - Close enough to attack
        executeDemonAttack(demon, userData, pathToPlayer.direction);
      } else if (distanceToPlayer <= chaseRange) {
        // PREPARE ATTACK MODE - Close but not in attack range
        prepareDemonAttack(demon, userData, pathToPlayer);
      } else {
        // CHASE MODE - Actively pursue player
        executeDemonChase(demon, userData, pathToPlayer);
      }
    } else {
      // WANDERING MODE - Player too far away
      executeDemonWander(demon, userData);
    }

    // Keep demons within map bounds
    const maxDistance = 45;
    if (demon.position.x > maxDistance) demon.position.x = maxDistance;
    if (demon.position.x < -maxDistance) demon.position.x = -maxDistance;
    if (demon.position.z > maxDistance) demon.position.z = maxDistance;
    if (demon.position.z < -maxDistance) demon.position.z = -maxDistance;

    // Enhanced animations are now handled in the behavior functions
    // Just handle attack scaling here
    if (!userData.isDead) {
      if (userData.isAttacking) {
        // Set attack scale only once (don't multiply every frame)
        if (!userData.attackScaleSet) {
          userData.originalScale = demon.scale.x;
          demon.scale.setScalar(userData.originalScale * 1.15); // Slightly larger when attacking
          userData.attackScaleSet = true;
        }
      } else {
        // Reset scale when not attacking
        if (userData.attackScaleSet) {
          demon.scale.setScalar(userData.originalScale || 1);
          userData.attackScaleSet = false;
        }
      }
    }
  });
}

// Basic pathfinding - calculate direct path to player
function calculatePathToPlayer(demonPos, playerPos) {
  const dx = playerPos.x - demonPos.x;
  const dz = playerPos.z - demonPos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Calculate direction
  const direction = Math.atan2(dx, dz);

  // Normalize movement vector
  const normalizedX = distance > 0 ? dx / distance : 0;
  const normalizedZ = distance > 0 ? dz / distance : 0;

  return {
    direction: direction,
    normalizedX: normalizedX,
    normalizedZ: normalizedZ,
    distance: distance,
  };
}

// Execute demon attack behavior
function executeDemonAttack(demon, userData, direction) {
  // Stop all movement during attack
  userData.isAttacking = true;

  // Execute attack if cooldown is ready
  if (!userData.hasAttacked && userData.attackCooldown <= 0) {
    userData.attackCooldown = 180; // 3 seconds at 60fps
    userData.hasAttacked = true;

    // Attack animation - lunge forward
    const lungeDistance = 0.8;
    demon.position.x += Math.sin(direction) * lungeDistance;
    demon.position.z += Math.cos(direction) * lungeDistance;

    // Create attack effect
    createDemonAttackEffect(demon.position);

    // Play attack sound based on demon type
    const demonType = userData.demonType || "IMP";
    if (demonType === "BARON" || demonType === "CACODEMON") {
      // Stronger demons use warrior roar
      if (sounds.demonWarriorRoar && !sounds.demonWarriorRoar.isPlaying) {
        sounds.demonWarriorRoar.play();
      }
    } else {
      // Regular attack sound
      playDemonAttackSound();
    }

    console.log("Demon executing attack!");
  }

  // Face the player during attack
  demon.rotation.y = direction;

  // Reset attack flag when cooldown ends
  if (userData.attackCooldown <= 60) {
    // Last 1 second of cooldown
    userData.hasAttacked = false;
    userData.isAttacking = false;
  }
}

// Prepare for attack - slow down and focus on player
function prepareDemonAttack(demon, userData, pathToPlayer) {
  userData.isAttacking = false;

  // Move slowly toward player while preparing
  const prepareSpeed = userData.walkSpeed * 0.6; // Slower approach
  const moveDistance = prepareSpeed * 0.016;

  demon.position.x += pathToPlayer.normalizedX * moveDistance;
  demon.position.z += pathToPlayer.normalizedZ * moveDistance;

  // Face the player
  demon.rotation.y = pathToPlayer.direction;

  // Add anticipation animation (more aggressive bobbing)
  const time = Date.now() * 0.008;
  demon.position.y = Math.sin(time) * 0.25;
}

// Execute aggressive chase behavior
function executeDemonChase(demon, userData, pathToPlayer) {
  userData.isAttacking = false;

  // Fast aggressive movement toward player
  const chaseSpeed = userData.walkSpeed * 1.5; // Faster when chasing
  const moveDistance = chaseSpeed * 0.016;

  // Move directly toward player using pathfinding
  demon.position.x += pathToPlayer.normalizedX * moveDistance;
  demon.position.z += pathToPlayer.normalizedZ * moveDistance;

  // Face movement direction
  demon.rotation.y = pathToPlayer.direction;

  // Add running animation (faster bobbing)
  const time = Date.now() * 0.006;
  demon.position.y = Math.sin(time) * 0.3;
}

// Execute wandering behavior when player is far
function executeDemonWander(demon, userData) {
  userData.isAttacking = false;
  userData.wanderTimer++;

  // Change direction occasionally
  if (userData.wanderTimer > 180 + Math.random() * 120) {
    // More frequent direction changes
    userData.wanderDirection += (Math.random() - 0.5) * 1.0; // Larger direction changes
    userData.wanderTimer = 0;
  }

  // Slow wandering movement
  const wanderSpeed = userData.walkSpeed * 0.3; // Very slow when wandering
  const moveDistance = wanderSpeed * 0.016;

  demon.position.x += Math.sin(userData.wanderDirection) * moveDistance;
  demon.position.z += Math.cos(userData.wanderDirection) * moveDistance;

  // Face movement direction
  demon.rotation.y = userData.wanderDirection;

  // Normal idle animation
  const time = Date.now() * 0.002;
  demon.position.y = Math.sin(time) * 0.15;
}

// Update gun position to always stay at bottom center of screen
function updateGunPosition() {
  if (!controls.isLocked) return;

  const activeWeapon = currentWeapon === "shotgun" ? gun : machineGun;
  if (!activeWeapon) return;

  // Update recoil animation
  updateGunRecoil();

  // Get camera position and direction
  const cameraPosition = controls.getObject().position.clone();
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  // Calculate gun position relative to camera with recoil offset
  const gunOffset = new THREE.Vector3(
    gunBasePosition.x,
    gunBasePosition.y,
    gunBasePosition.z + gunRecoilOffset // Apply recoil to Z position
  );

  // Apply camera rotation to the offset
  gunOffset.applyQuaternion(camera.quaternion);

  // Position active weapon relative to camera
  activeWeapon.position.copy(cameraPosition).add(gunOffset);
  activeWeapon.rotation.copy(camera.rotation);
  activeWeapon.rotation.x += 0.1; // Slight upward tilt
}

// Update gun recoil animation
function updateGunRecoil() {
  // Apply spring physics for recoil
  const springStrength = 0.2;
  const damping = 0.85;

  // Spring force pulls gun back to original position
  const springForce = -gunRecoilOffset * springStrength;

  // Update velocity and position
  gunRecoilVelocity += springForce;
  gunRecoilVelocity *= damping; // Apply damping
  gunRecoilOffset += gunRecoilVelocity;

  // Stop tiny movements to prevent jitter
  if (
    Math.abs(gunRecoilOffset) < 0.001 &&
    Math.abs(gunRecoilVelocity) < 0.001
  ) {
    gunRecoilOffset = 0;
    gunRecoilVelocity = 0;
  }
}

// Check if player is aiming at a demon for crosshair targeting
function updateCrosshairTargeting() {
  if (!controls || !controls.isLocked || gameState !== "playing") {
    isAimingAtZombie = false;
    updateCrosshairAppearance();
    return;
  }

  // Get camera position and direction
  const cameraPosition = controls.getObject().position;
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  // Set up raycaster from camera position in camera direction
  raycaster.set(cameraPosition, cameraDirection);

  // Create array of demon objects for raycasting
  const demonObjects = [];
  demons.forEach((demon) => {
    if (
      demon &&
      demon.userData &&
      !demon.userData.isDead &&
      !demon.userData.isFalling
    ) {
      // Add all mesh children of the demon group to the raycast targets
      demon.traverse((child) => {
        if (child.isMesh) {
          demonObjects.push(child);
        }
      });
    }
  });

  // Perform raycast
  const intersects = raycaster.intersectObjects(demonObjects);

  // Check if we're aiming at a demon within reasonable range
  const targetingRange = 50; // Maximum targeting range
  const wasAimingAtZombie = isAimingAtZombie;

  isAimingAtZombie =
    intersects.length > 0 && intersects[0].distance <= targetingRange;

  // Update crosshair appearance if targeting state changed
  if (isAimingAtZombie !== wasAimingAtZombie) {
    updateCrosshairAppearance();
  }
}

// Update crosshair visual appearance based on targeting state
function updateCrosshairAppearance() {
  const crosshair = document.getElementById("crosshair");
  if (!crosshair) return;

  if (isAimingAtZombie) {
    crosshair.classList.add("target-lock");
  } else {
    crosshair.classList.remove("target-lock");
  }
}

// Initialize mini radar system
function initRadar() {
  radarCanvas = document.getElementById("radarCanvas");
  if (!radarCanvas) {
    console.warn("Radar canvas not found");
    return;
  }

  radarContext = radarCanvas.getContext("2d");
  console.log("Mini radar initialized");
}

// Update and draw the mini radar
function updateRadar() {
  if (!radarContext || !controls || gameState !== "playing") return;

  // Clear the canvas
  radarContext.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

  // Get player position
  const playerPos = controls.getObject().position;
  const centerX = RADAR_SIZE / 2;
  const centerY = RADAR_SIZE / 2;

  // Draw radar grid
  drawRadarGrid();

  // Draw demons as dots
  drawDemonsOnRadar(playerPos, centerX, centerY);

  // Draw remote players if in multiplayer mode
  if (isMultiplayer) {
    drawRemotePlayersOnRadar(playerPos, centerX, centerY);
  }

  // Draw player as center dot
  drawPlayerOnRadar(centerX, centerY);

  // Draw range circles
  drawRadarRangeCircles();
}

// Draw radar background grid
function drawRadarGrid() {
  radarContext.strokeStyle = "rgba(0, 255, 0, 0.2)";
  radarContext.lineWidth = 1;

  // Draw crosshairs
  radarContext.beginPath();
  radarContext.moveTo(RADAR_SIZE / 2, 0);
  radarContext.lineTo(RADAR_SIZE / 2, RADAR_SIZE);
  radarContext.moveTo(0, RADAR_SIZE / 2);
  radarContext.lineTo(RADAR_SIZE, RADAR_SIZE / 2);
  radarContext.stroke();
}

// Draw range circles on radar
function drawRadarRangeCircles() {
  radarContext.strokeStyle = "rgba(0, 255, 0, 0.15)";
  radarContext.lineWidth = 1;

  const centerX = RADAR_SIZE / 2;
  const centerY = RADAR_SIZE / 2;

  // Draw range circles at 25%, 50%, 75% of max range
  for (let i = 1; i <= 3; i++) {
    const radius = (RADAR_SIZE / 2) * (i / 4);
    radarContext.beginPath();
    radarContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    radarContext.stroke();
  }
}

// Draw player position on radar
function drawPlayerOnRadar(centerX, centerY) {
  // Draw player direction indicator
  if (camera) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    radarContext.strokeStyle = "rgba(0, 255, 255, 0.8)";
    radarContext.lineWidth = 2;
    radarContext.beginPath();
    radarContext.moveTo(centerX, centerY);
    radarContext.lineTo(centerX + direction.x * 15, centerY + direction.z * 15);
    radarContext.stroke();
  }

  // Draw player dot
  radarContext.fillStyle = "rgba(0, 255, 255, 1)";
  radarContext.beginPath();
  radarContext.arc(centerX, centerY, 3, 0, Math.PI * 2);
  radarContext.fill();

  // Draw player outline
  radarContext.strokeStyle = "rgba(255, 255, 255, 0.8)";
  radarContext.lineWidth = 1;
  radarContext.beginPath();
  radarContext.arc(centerX, centerY, 4, 0, Math.PI * 2);
  radarContext.stroke();
}

// Draw demons on radar
function drawDemonsOnRadar(playerPos, centerX, centerY) {
  demons.forEach((demon) => {
    if (
      !demon ||
      !demon.userData ||
      demon.userData.isDead ||
      demon.userData.isFalling
    ) {
      return;
    }

    // Calculate relative position
    const dx = demon.position.x - playerPos.x;
    const dz = demon.position.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Only show demons within radar range
    if (distance > RADAR_RANGE) return;

    // Convert world coordinates to radar coordinates
    const scale = RADAR_SIZE / 2 / RADAR_RANGE;
    const radarX = centerX + dx * scale;
    const radarY = centerY + dz * scale;

    // Skip if outside radar circle
    const radarDistance = Math.sqrt(
      (radarX - centerX) ** 2 + (radarY - centerY) ** 2
    );
    if (radarDistance > RADAR_SIZE / 2) return;

    // Determine demon color based on type and behavior
    let demonColor = "rgba(255, 0, 0, 0.8)"; // Default red
    let demonSize = 2;

    if (demon.userData.demonType) {
      switch (demon.userData.demonType) {
        case "DEMON":
          demonColor = "rgba(255, 165, 0, 0.8)"; // Orange for fast demons
          demonSize = 1.5;
          break;
        case "CACODEMON":
          demonColor = "rgba(255, 0, 255, 0.8)"; // Magenta for tank demons
          demonSize = 3;
          break;
        case "BARON":
          demonColor = "rgba(255, 255, 0, 0.8)"; // Yellow for boss demons
          demonSize = 4;
          break;
        default:
          demonColor = "rgba(255, 0, 0, 0.8)"; // Red for normal demons
          demonSize = 2;
      }
    }

    // Make demons more visible if they're attacking
    if (distance < 10) {
      demonSize += 1;
      demonColor = demonColor.replace("0.8", "1.0");
    }

    // Draw demon dot
    radarContext.fillStyle = demonColor;
    radarContext.beginPath();
    radarContext.arc(radarX, radarY, demonSize, 0, Math.PI * 2);
    radarContext.fill();

    // Add pulsing effect for very close demons
    if (distance < 5) {
      const pulseAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.01);
      radarContext.fillStyle = demonColor.replace("0.8", pulseAlpha.toString());
      radarContext.beginPath();
      radarContext.arc(radarX, radarY, demonSize + 2, 0, Math.PI * 2);
      radarContext.fill();
    }
  });
}

// Draw remote players on radar
function drawRemotePlayersOnRadar(playerPos, centerX, centerY) {
  remotePlayers.forEach((player, playerId) => {
    if (!player.mesh || !player.mesh.position) return;

    // Calculate relative position
    const dx = player.mesh.position.x - playerPos.x;
    const dz = player.mesh.position.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Only show players within radar range
    if (distance > RADAR_RANGE) return;

    // Convert world coordinates to radar coordinates
    const scale = RADAR_SIZE / 2 / RADAR_RANGE;
    const radarX = centerX + dx * scale;
    const radarY = centerY + dz * scale;

    // Skip if outside radar circle
    const radarDistance = Math.sqrt(
      (radarX - centerX) ** 2 + (radarY - centerY) ** 2
    );
    if (radarDistance > RADAR_SIZE / 2) return;

    // Get player color scheme
    const colorScheme = player.colorScheme || getPlayerColor(0); // Fallback color
    const playerColor = `#${colorScheme.body.toString(16).padStart(6, "0")}`;
    const eyeColor = `#${colorScheme.eyes.toString(16).padStart(6, "0")}`;

    // Draw player base (larger than demons)
    radarContext.fillStyle = playerColor;
    radarContext.beginPath();
    radarContext.arc(radarX, radarY, 4, 0, Math.PI * 2);
    radarContext.fill();

    // Draw player eye glow (inner circle)
    radarContext.fillStyle = eyeColor;
    radarContext.beginPath();
    radarContext.arc(radarX, radarY, 2, 0, Math.PI * 2);
    radarContext.fill();

    // Draw player outline to distinguish from demons
    radarContext.strokeStyle = "#ffffff";
    radarContext.lineWidth = 1;
    radarContext.beginPath();
    radarContext.arc(radarX, radarY, 5, 0, Math.PI * 2);
    radarContext.stroke();

    // Add team marker (small square)
    const markerSize = 2;
    radarContext.fillStyle = eyeColor;
    radarContext.fillRect(
      radarX - markerSize / 2,
      radarY - 8,
      markerSize,
      markerSize
    );

    // Add pulsing effect for very close players (friendly identification)
    if (distance < 8) {
      const pulseAlpha = 0.4 + 0.4 * Math.sin(Date.now() * 0.008);
      radarContext.fillStyle =
        eyeColor +
        Math.floor(pulseAlpha * 255)
          .toString(16)
          .padStart(2, "0");
      radarContext.beginPath();
      radarContext.arc(radarX, radarY, 7, 0, Math.PI * 2);
      radarContext.fill();
    }
  });
}

// Initialize FPS controls
function initControls() {
  // Ensure camera exists before creating controls
  if (!camera) {
    console.warn("⚠️ Camera not found, cannot initialize controls yet");
    return;
  }

  // Create pointer lock controls
  controls = new THREE.PointerLockControls(camera, document.body);

  // Add event listeners for pointer lock
  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  // Handle instructions menu clicks - dismiss the menu
  if (instructions) {
    instructions.addEventListener("click", function (event) {
      // If clicking on the instructions menu itself, hide it and show main menu
      hideAllMenus();
      showMainMenu();
    });
  }

  controls.addEventListener("lock", function () {
    console.log("🔒 Pointer lock acquired, gameState:", gameState);
    if (gameState === "playing") {
      hideAllMenus();
      if (blocker) blocker.style.display = "none";
      document.getElementById("gameUI").style.display = "block";
      console.log("✅ Mouse controls enabled");
    }
  });

  controls.addEventListener("unlock", function () {
    console.log("🔓 Pointer lock released, gameState:", gameState);
    if (gameState === "playing") {
      // When pointer lock is lost during gameplay, pause the game
      pauseGame();
    }
  });

  scene.add(controls.getObject());

  // Don't attach gun to camera - we'll position it separately
  // The gun will be positioned as a fixed UI element

  // Add keyboard event listeners
  const onKeyDown = function (event) {
    // Handle ESC key for pause/resume or menu dismissal
    if (event.code === "Escape") {
      if (gameState === "playing") {
        pauseGame();
      } else if (gameState === "paused") {
        resumeGame();
      } else {
        // If we're in a menu, go back to main menu
        hideAllMenus();
        showMainMenu();
      }
      return;
    }

    // Handle ENTER key for chat in multiplayer mode
    if (event.code === "Enter") {
      if (gameState === "playing" && isMultiplayer) {
        toggleGameChat();
      }
      return;
    }

    // Handle push-to-talk key for voice chat
    if (event.code === voiceChat.settings.pushToTalkKey && !event.repeat) {
      const now = Date.now();
      // Prevent rapid key presses (throttle to 200ms)
      if (now - voiceChat.lastKeyPress < 200) {
        return;
      }
      voiceChat.lastKeyPress = now;

      if (
        gameState === "playing" &&
        !voiceChat.isPushToTalkPressed &&
        voiceChat.settings.mode !== "disabled"
      ) {
        voiceChat.isPushToTalkPressed = true;
        startVoiceRecording();
      }
      return;
    }

    // Only handle movement keys when game is active
    if (gameState !== "playing") return;

    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;
      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;
    }
  };

  const onKeyUp = function (event) {
    // Handle push-to-talk key release for voice chat
    if (event.code === voiceChat.settings.pushToTalkKey) {
      if (voiceChat.isPushToTalkPressed) {
        voiceChat.isPushToTalkPressed = false;
        stopVoiceRecording();
      }
      return;
    }

    // Only handle movement keys when game is active
    if (gameState !== "playing") return;

    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;
      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Add shooting controls
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("contextmenu", onContextMenu); // Prevent right-click menu
}

// Create a simple gun model that appears at bottom of screen
function createGun() {
  console.log("Creating gun model...");

  gun = new THREE.Group();

  // Main gun body (rectangular block) - oriented forward along Z-axis
  const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 2.0);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0, 0);
  gun.add(body);

  // Gun barrel (cylinder extending forward along Z-axis)
  const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.0, 8);
  const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.x = Math.PI / 2; // Rotate to point forward along Z-axis
  barrel.position.set(0, 0.1, -1.2);
  gun.add(barrel);

  // Gun handle/grip
  const handleGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
  const handleMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0, -0.6, 0.4);
  gun.add(handle);

  // Gun stock (back part)
  const stockGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.6);
  const stockMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 }); // Brown wood color
  const stock = new THREE.Mesh(stockGeometry, stockMaterial);
  stock.position.set(0, 0, 1.0);
  gun.add(stock);

  // Front sight
  const sightGeometry = new THREE.BoxGeometry(0.04, 0.2, 0.04);
  const sightMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
  const sight = new THREE.Mesh(sightGeometry, sightMaterial);
  sight.position.set(0, 0.4, -1.8);
  gun.add(sight);

  // Trigger
  const triggerGeometry = new THREE.BoxGeometry(0.04, 0.16, 0.06);
  const triggerMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
  trigger.position.set(0, -0.2, 0.2);
  gun.add(trigger);

  // Position gun at bottom center of screen (like user is holding it)
  gun.position.set(gunBasePosition.x, gunBasePosition.y, gunBasePosition.z);
  gun.rotation.set(0.1, 0, 0); // Slight upward angle
  gun.scale.setScalar(0.8);

  // Create muzzle flash light (initially off)
  muzzleFlashLight = new THREE.PointLight(0xffaa00, 0, 10); // Orange light
  muzzleFlashLight.position.set(0, 0.1, -1.8); // At barrel tip
  gun.add(muzzleFlashLight); // Attach to gun so it moves with recoil

  // Add gun directly to scene (not camera)
  scene.add(gun);

  console.log("Gun model created and added to scene");
}

// Create machine gun model with different styling
function createMachineGun() {
  console.log("Creating machine gun model...");

  machineGun = new THREE.Group();

  // Main gun body - larger and more robust, oriented forward along Z-axis
  const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 2.5);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }); // Darker
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0, 0);
  machineGun.add(body);

  // Heavy barrel - thicker and longer, extending forward along Z-axis
  const barrelGeometry = new THREE.CylinderGeometry(0.12, 0.15, 1.5, 12);
  const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x0f0f0f }); // Almost black
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.1, -1.5);
  machineGun.add(barrel);

  // Barrel cooling vents
  for (let i = 0; i < 6; i++) {
    const ventGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.05);
    const ventMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.set(0, 0.25, -1.2 - i * 0.1);
    machineGun.add(vent);
  }

  // Bipod legs
  const bipodGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
  const bipodMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });

  const leftBipod = new THREE.Mesh(bipodGeometry, bipodMaterial);
  leftBipod.position.set(-0.3, -0.8, -0.8);
  leftBipod.rotation.x = 0.3;
  machineGun.add(leftBipod);

  const rightBipod = new THREE.Mesh(bipodGeometry, bipodMaterial);
  rightBipod.position.set(0.3, -0.8, -0.8);
  rightBipod.rotation.x = -0.3;
  machineGun.add(rightBipod);

  // Ammunition belt/box
  const ammoBoxGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.6);
  const ammoBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x4a4a00 }); // Olive drab
  const ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoBoxMaterial);
  ammoBox.position.set(0.4, 0.3, 0.8);
  machineGun.add(ammoBox);

  // Heavy stock - reinforced
  const stockGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.8);
  const stockMaterial = new THREE.MeshBasicMaterial({ color: 0x2d1b0e }); // Dark brown
  const stock = new THREE.Mesh(stockGeometry, stockMaterial);
  stock.position.set(0, 0, 1.2);
  machineGun.add(stock);

  // Large front sight
  const sightGeometry = new THREE.BoxGeometry(0.06, 0.25, 0.06);
  const sightMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const sight = new THREE.Mesh(sightGeometry, sightMaterial);
  sight.position.set(0, 0.5, -2.2);
  machineGun.add(sight);

  // Heavy trigger assembly
  const triggerGeometry = new THREE.BoxGeometry(0.06, 0.2, 0.08);
  const triggerMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
  const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
  trigger.position.set(0, -0.3, 0.3);
  machineGun.add(trigger);

  // Muzzle brake/flash hider
  const muzzleBrakeGeometry = new THREE.CylinderGeometry(0.18, 0.16, 0.3, 8);
  const muzzleBrakeMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const muzzleBrake = new THREE.Mesh(muzzleBrakeGeometry, muzzleBrakeMaterial);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.set(0, 0.1, -2.4);
  machineGun.add(muzzleBrake);

  // Position machine gun at same base position as rifle
  machineGun.position.set(
    gunBasePosition.x,
    gunBasePosition.y,
    gunBasePosition.z
  );
  machineGun.rotation.set(0.1, 0, 0);
  machineGun.scale.setScalar(0.7); // Slightly smaller scale to fit

  // Create separate muzzle flash light for machine gun
  const machineGunFlashLight = new THREE.PointLight(0xffaa00, 0, 10);
  machineGunFlashLight.position.set(0, 0.1, -2.4); // At muzzle brake
  machineGun.add(machineGunFlashLight);
  machineGun.userData.muzzleFlashLight = machineGunFlashLight;

  // Enable shadows
  machineGun.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add to scene but hide initially
  machineGun.visible = false;
  scene.add(machineGun);

  console.log("Machine gun model created and added to scene");
}

// Handle mouse down events
function onMouseDown(event) {
  // Only handle if game is playing, pointer is locked, and game is not over
  if (gameState !== "playing" || !controls.isLocked || isGameOver) return;

  // Prevent default behavior
  event.preventDefault();

  if (event.button === 0) {
    // Left click - shoot
    mouseHeld = true;
    shoot();
  } else if (event.button === 2) {
    // Right click - switch weapon
    switchWeapon();
  }
}

// Handle mouse up events
function onMouseUp(event) {
  if (event.button === 0) {
    // Left click released - stop auto fire
    mouseHeld = false;
    isAutoFiring = false;

    // Stop machine gun sound immediately when mouse is released
    if (
      currentWeapon === "chaingun" &&
      sounds.machinegun &&
      sounds.machinegun.isPlaying
    ) {
      sounds.machinegun.stop();
      console.log("Machine gun sound stopped");
    }
  }
}

// Prevent right-click context menu
function onContextMenu(event) {
  event.preventDefault();
}

// Switch between weapons
function switchWeapon() {
  if (currentWeapon === "shotgun") {
    currentWeapon = "chaingun";
    gun.visible = false;
    machineGun.visible = true;
    muzzleFlashLight = machineGun.userData.muzzleFlashLight;
  } else {
    currentWeapon = "shotgun";
    gun.visible = true;
    machineGun.visible = false;
    muzzleFlashLight = gun.children.find((child) => child.isLight);
  }

  // Update UI
  updateWeaponDisplay();

  console.log(`Switched to ${WEAPONS[currentWeapon].name}`);
}

// Main shooting function
function shoot() {
  const currentTime = Date.now();
  const weapon = WEAPONS[currentWeapon];

  // Check if weapon has ammo
  if (weapon.currentAmmo <= 0) {
    console.log(`${weapon.name} is out of ammo!`);
    // Stop auto-firing if out of ammo
    isAutoFiring = false;
    mouseHeld = false;
    return;
  }

  if (weapon.fireRate === 0) {
    // Single shot weapon (shotgun)
    if (!mouseHeld) return; // Only fire once per click for single shot
    createBullet();
    weapon.currentAmmo--; // Consume ammo
    mouseHeld = false; // Prevent rapid clicking
  } else {
    // Auto-fire weapon (machine gun)
    const timeBetweenShots = 60000 / weapon.fireRate; // Convert RPM to milliseconds

    if (currentTime - lastShotTime >= timeBetweenShots) {
      createBullet();
      weapon.currentAmmo--; // Consume ammo
      lastShotTime = currentTime;

      if (mouseHeld && weapon.currentAmmo > 0) {
        isAutoFiring = true;
      } else {
        isAutoFiring = false;
      }
    }
  }

  // Update weapon display to show new ammo count
  updateWeaponDisplay();
}

// Hide instructions interface
function hideInstructions() {
  const blocker = document.getElementById("blocker");
  if (blocker) {
    blocker.style.display = "none";
  }

  // If game is ready, try to lock controls
  if (gameState === "playing" && controls) {
    controls.lock();
  }
}

// Create and fire a bullet
function createBullet() {
  const bulletGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const bulletMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    emissive: 0xffaa00,
    emissiveIntensity: 0.5,
  });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  // Get camera position and direction
  const cameraPosition = controls.getObject().position.clone();
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  // Position bullet slightly in front of camera
  bullet.position.copy(cameraPosition);
  bullet.position.add(cameraDirection.clone().multiplyScalar(0.5));

  // Store bullet properties
  bullet.userData = {
    direction: cameraDirection.clone(),
    speed: BULLET_SPEED,
    creationTime: Date.now(),
  };

  bullets.push(bullet);
  scene.add(bullet);

  // Add muzzle flash effect
  createMuzzleFlash();

  // Create muzzle flash light
  createMuzzleFlashLight();

  // Trigger gun recoil
  triggerGunRecoil();

  // Play gunfire sound
  playGunfireSound();

  console.log("Bullet fired!");
}

// Create muzzle flash effect
function createMuzzleFlash() {
  const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    emissive: 0xffaa00,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.8,
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);

  // Position at gun barrel
  const cameraPosition = controls.getObject().position.clone();
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  flash.position.copy(cameraPosition);
  flash.position.add(cameraDirection.clone().multiplyScalar(0.3));

  scene.add(flash);

  // Remove flash after short duration
  setTimeout(() => {
    scene.remove(flash);
  }, 100);
}

// Create muzzle flash light effect
function createMuzzleFlashLight() {
  if (!muzzleFlashLight) return;

  // Turn on the light with full intensity
  muzzleFlashLight.intensity = 3.0;
  muzzleFlashLight.color.setHex(0xffaa00); // Bright orange

  // Animate the light fading out
  let intensity = 3.0;
  const fadeInterval = setInterval(() => {
    intensity -= 0.3;
    if (intensity <= 0) {
      muzzleFlashLight.intensity = 0;
      clearInterval(fadeInterval);
    } else {
      muzzleFlashLight.intensity = intensity;
      // Slightly randomize color for flicker effect
      const flicker = 0.9 + Math.random() * 0.1;
      muzzleFlashLight.color.setRGB(1.0 * flicker, 0.67 * flicker, 0.0);
    }
  }, 16); // ~60fps
}

// Trigger gun recoil animation
function triggerGunRecoil() {
  // Add backward velocity for recoil based on current weapon
  const weapon = WEAPONS[currentWeapon];
  gunRecoilVelocity += weapon.recoil;
}

// Update bullets
function updateBullets() {
  bullets.forEach((bullet, index) => {
    if (!bullet.userData) return;

    const currentTime = Date.now();
    const userData = bullet.userData;

    // Remove bullets that are too old
    if (currentTime - userData.creationTime > BULLET_LIFETIME) {
      scene.remove(bullet);
      bullets.splice(index, 1);
      return;
    }

    // Move bullet forward
    const moveDistance = userData.speed * 0.016; // 60fps
    bullet.position.add(
      userData.direction.clone().multiplyScalar(moveDistance)
    );

    // Check collision with demons
    if (checkBulletDemonCollision(bullet)) {
      // Remove the bullet on hit
      scene.remove(bullet);
      bullets.splice(index, 1);
      return;
    }

    // Remove bullets that are too far from origin
    if (bullet.position.length() > 100) {
      scene.remove(bullet);
      bullets.splice(index, 1);
    }
  });
}

// Check collision between bullet and demons
function checkBulletDemonCollision(bullet) {
  for (let i = 0; i < demons.length; i++) {
    const demon = demons[i];
    if (!demon) continue;

    // Calculate distance between bullet and demon
    const distance = bullet.position.distanceTo(demon.position);

    // If bullet is close enough to demon (collision)
    if (distance < 1.5) {
      // Collision radius
      console.log("Demon hit!");
      hitDemon(demon, i);
      return true; // Collision detected
    }
  }
  return false; // No collision
}

// Handle demon being hit
function hitDemon(demon, demonIndex) {
  // Create hit effect
  createHitEffect(demon.position);

  // Reduce demon health
  if (demon.userData && demon.userData.health !== undefined) {
    demon.userData.health--;

    const demonType = demon.userData.demonType || "IMP";
    const typeData = DEMON_TYPES[demonType];

    console.log(
      `${typeData.emoji} ${typeData.name} hit! Health: ${demon.userData.health}/${demon.userData.maxHealth}`
    );

    // Check if demon is dead
    if (demon.userData.health <= 0) {
      // Make demon fall or remove it
      if (Math.random() < 0.5) {
        // 50% chance demon falls down
        makeDemonFall(demon);
      } else {
        // 50% chance demon disappears
        removeDemon(demon, demonIndex);
      }
    } else {
      // Demon is wounded but still alive - create smaller hit effect
      createWoundedEffect(demon.position);
    }
  } else {
    // Fallback for demons without health system
    if (Math.random() < 0.5) {
      makeDemonFall(demon);
    } else {
      removeDemon(demon, demonIndex);
    }
  }
}

// Create effect for wounded (but not dead) demons
function createWoundedEffect(position) {
  // Create smaller red effect for wounded demons
  const particles = [];

  for (let i = 0; i < 3; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa4400,
      transparent: true,
      opacity: 0.6,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Position at hit location
    particle.position.copy(position);
    particle.position.y += Math.random() * 0.3;

    // Random velocity
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        Math.random() * 1,
        (Math.random() - 0.5) * 1
      ),
      life: 0.8,
    };

    particles.push(particle);
    scene.add(particle);
  }

  // Animate and remove particles
  const animateParticles = () => {
    particles.forEach((particle, index) => {
      if (!particle.userData) return;

      // Move particle
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(0.015)
      );
      particle.userData.velocity.y -= 0.03; // Gravity

      // Fade out
      particle.userData.life -= 0.025;
      particle.material.opacity = particle.userData.life;

      // Remove when faded
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(index, 1);
      }
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };

  animateParticles();
}

// Create visual effect when demon is hit
function createHitEffect(position) {
  // Create red explosion effect
  const particles = [];

  for (let i = 0; i < 10; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Position at hit location
    particle.position.copy(position);
    particle.position.y += Math.random() * 0.5;

    // Random velocity
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      life: 1.0,
    };

    particles.push(particle);
    scene.add(particle);
  }

  // Animate and remove particles
  const animateParticles = () => {
    particles.forEach((particle, index) => {
      if (!particle.userData) return;

      // Move particle
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(0.02)
      );
      particle.userData.velocity.y -= 0.05; // Gravity

      // Fade out
      particle.userData.life -= 0.02;
      particle.material.opacity = particle.userData.life;

      // Remove when faded
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(index, 1);
      }
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };

  animateParticles();
}

// Make demon fall down
function makeDemonFall(demon) {
  if (!demon.userData) return;

  demon.userData.isFalling = true;
  demon.userData.fallSpeed = 0;
  demon.userData.originalRotation = demon.rotation.x;

  console.log("Demon is falling!");
}

// Remove demon completely
function removeDemon(demon, demonIndex) {
  scene.remove(demon);
  demons.splice(demonIndex, 1);
  demonKills++;
  updateKillCount();
  console.log(
    "Demon removed! Demons remaining:",
    demons.length,
    "Kills:",
    demonKills
  );
}

// Update kill count display
function updateKillCount() {
  const infoDiv = document.querySelector(".info");
  let killCountDiv = document.getElementById("killCount");

  if (!killCountDiv) {
    killCountDiv = document.createElement("div");
    killCountDiv.id = "killCount";
    infoDiv.appendChild(killCountDiv);
  }

  killCountDiv.textContent = `💀 Units Eliminated: ${demonKills}`;
}

// Update ammo pack count display
function updateAmmoPackCount() {
  const infoDiv = document.querySelector(".info");
  let ammoPackCountDiv = document.getElementById("ammoPackCount");

  if (!ammoPackCountDiv) {
    ammoPackCountDiv = document.createElement("div");
    ammoPackCountDiv.id = "ammoPackCount";
    infoDiv.appendChild(ammoPackCountDiv);
  }

  ammoPackCountDiv.textContent = `🔋 Energy Cells: ${ammoPacks.length}/${MAX_AMMO_PACKS} | Collected: ${ammoPacksCollected}`;
}

// Update health pack count display
function updateHealthPackCount() {
  const infoDiv = document.querySelector(".info");
  let healthPackCountDiv = document.getElementById("healthPackCount");

  if (!healthPackCountDiv) {
    healthPackCountDiv = document.createElement("div");
    healthPackCountDiv.id = "healthPackCount";
    infoDiv.appendChild(healthPackCountDiv);
  }

  healthPackCountDiv.textContent = `💉 Neural Stims: ${healthPacks.length}/${MAX_HEALTH_PACKS} | Collected: ${healthPacksCollected}`;
}

// Update weapon display
function updateWeaponDisplay() {
  const weaponNameElement = document.getElementById("weaponName");
  const ammoCountElement = document.getElementById("ammoCount");

  if (!weaponNameElement || !ammoCountElement) {
    console.warn("Weapon display elements not found");
    return;
  }

  const weapon = WEAPONS[currentWeapon];
  if (!weapon) {
    console.warn("Weapon data not found for:", currentWeapon);
    return;
  }

  // Update weapon name
  weaponNameElement.textContent = `${weapon.emoji} ${weapon.name}`;

  // Update ammo count - show ammo for weapons with limited ammo
  if (weapon.maxAmmo < 500) {
    ammoCountElement.textContent = `${weapon.currentAmmo}/${weapon.maxAmmo}`;

    // Change color if ammo is low
    if (weapon.currentAmmo <= 10) {
      ammoCountElement.style.color = "#ff4444"; // Red for very low ammo
    } else if (weapon.currentAmmo <= 30) {
      ammoCountElement.style.color = "#ffaa00"; // Orange for low ammo
    } else {
      ammoCountElement.style.color = "#ffffff"; // White for normal ammo
    }
  } else {
    // For weapons with "unlimited" ammo (like shotgun)
    ammoCountElement.textContent = "∞";
    ammoCountElement.style.color = "#ffffff";
  }
}

// Update health bar display
function updateHealthBar() {
  const healthFill = document.getElementById("healthFill");
  const healthText = document.getElementById("healthText");

  if (healthFill && healthText) {
    const healthPercentage = (playerHealth / maxHealth) * 100;
    healthFill.style.width = healthPercentage + "%";
    healthText.textContent = `Health: ${playerHealth}/${maxHealth}`;

    // Change health bar color based on health level
    if (healthPercentage <= 25) {
      healthFill.style.background = "#ff0000"; // Red
    } else if (healthPercentage <= 50) {
      healthFill.style.background =
        "linear-gradient(90deg, #ff0000 0%, #ffff00 100%)"; // Red to yellow
    } else {
      healthFill.style.background =
        "linear-gradient(90deg, #ff0000 0%, #ffff00 50%, #00ff00 100%)"; // Full gradient
    }
  }
}

// Check collision between player and demons
function checkPlayerDemonCollision() {
  if (isGameOver) return;

  const currentTime = Date.now();

  // Skip if still invulnerable from last damage
  if (currentTime - lastDamageTime < damageInvulnerabilityTime) return;

  const playerPosition = controls.getObject().position;

  demons.forEach((demon, index) => {
    if (
      !demon ||
      !demon.userData ||
      demon.userData.isDead ||
      demon.userData.isFalling
    )
      return;

    // Calculate horizontal distance (ignore Y difference)
    const dx = playerPosition.x - demon.position.x;
    const dz = playerPosition.z - demon.position.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    // If demon is close enough to damage player
    if (horizontalDistance < 3.0) {
      const attackDamage = demon.userData.attackDamage || 10;
      takeDamage(attackDamage);
      lastDamageTime = currentTime;

      // Create damage effect
      createDamageEffect();

      const demonType = demon.userData.demonType || "IMP";
      const typeData = DEMON_TYPES[demonType];
      console.log(
        `${typeData.emoji} ${typeData.name} dealt ${attackDamage} damage!`
      );

      return; // Only take damage from one demon per frame
    }
  });
}

// Player takes damage
function takeDamage(amount) {
  if (isGameOver) return;

  playerHealth = Math.max(0, playerHealth - amount);
  updateHealthBar();

  if (playerHealth <= 0) {
    gameOver();
  }
}

// Create visual damage effect
function createDamageEffect() {
  // Flash red screen effect
  const flashDiv = document.createElement("div");
  flashDiv.style.position = "fixed";
  flashDiv.style.top = "0";
  flashDiv.style.left = "0";
  flashDiv.style.width = "100%";
  flashDiv.style.height = "100%";
  flashDiv.style.background = "rgba(255, 0, 0, 0.3)";
  flashDiv.style.pointerEvents = "none";
  flashDiv.style.zIndex = "999";
  document.body.appendChild(flashDiv);

  // Remove flash after short duration
  setTimeout(() => {
    if (flashDiv.parentNode) {
      flashDiv.parentNode.removeChild(flashDiv);
    }
  }, 200);
}

// Create demon attack effect
function createDemonAttackEffect(position) {
  // Create orange/red swipe effect
  const attackGeometry = new THREE.ConeGeometry(0.5, 1.0, 6);
  const attackMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.7,
  });
  const attackEffect = new THREE.Mesh(attackGeometry, attackMaterial);

  // Position at demon attack location
  attackEffect.position.copy(position);
  attackEffect.position.y += 1.0; // Raise it up
  attackEffect.rotation.x = Math.PI / 2; // Rotate to be horizontal
  attackEffect.rotation.z = Math.random() * Math.PI * 2; // Random rotation

  scene.add(attackEffect);

  // Animate the attack effect
  let scale = 0.1;
  let opacity = 0.7;

  const animateAttack = () => {
    scale += 0.1;
    opacity -= 0.05;

    attackEffect.scale.setScalar(scale);
    attackEffect.material.opacity = opacity;
    attackEffect.rotation.z += 0.2;

    if (opacity > 0) {
      requestAnimationFrame(animateAttack);
    } else {
      scene.remove(attackEffect);
    }
  };

  animateAttack();

  // Create claw marks particles
  for (let i = 0; i < 5; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa0000,
      transparent: true,
      opacity: 0.8,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Position near attack location
    particle.position.copy(position);
    particle.position.x += (Math.random() - 0.5) * 2;
    particle.position.y += 0.5 + Math.random();
    particle.position.z += (Math.random() - 0.5) * 2;

    // Random velocity
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      ),
      life: 1.0,
    };

    scene.add(particle);

    // Animate particle
    const animateParticle = () => {
      if (!particle.userData) return;

      // Move particle
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(0.03)
      );
      particle.userData.velocity.y -= 0.08; // Gravity

      // Fade out
      particle.userData.life -= 0.03;
      particle.material.opacity = particle.userData.life;

      // Remove when faded
      if (particle.userData.life <= 0) {
        scene.remove(particle);
      } else {
        requestAnimationFrame(animateParticle);
      }
    };

    setTimeout(() => animateParticle(), i * 50); // Stagger particle animations
  }
}

// Note: gameOver() and restartGame() functions are now defined above in the menu system section

// Initialize all UI elements
function initializeUI() {
  console.log("Initializing UI elements...");

  // Initialize health bar
  updateHealthBar();

  // Initialize kill count
  updateKillCount();

  // Initialize health pack count
  updateHealthPackCount();

  // Initialize ammo pack count
  updateAmmoPackCount();

  // Initialize wave display
  updateWaveDisplay();

  // Initialize weapon display
  updateWeaponDisplay();

  console.log("UI elements initialized");
}

// Update wave display
function updateWaveDisplay() {
  const infoDiv = document.querySelector(".info");
  let waveDiv = document.getElementById("waveInfo");

  if (!waveDiv) {
    waveDiv = document.createElement("div");
    waveDiv.id = "waveInfo";
    infoDiv.appendChild(waveDiv);
  }

  if (waveInProgress) {
    const livingDemons = demons.filter(
      (demon) =>
        demon.userData && !demon.userData.isDead && !demon.userData.isFalling
    ).length;

    // Count demons by type and state
    const playerPosition = controls.getObject().position;
    let huntingDemons = 0;
    let chasingDemons = 0;
    let attackingDemons = 0;
    let typeBreakdown = { IMP: 0, DEMON: 0, CACODEMON: 0, BARON: 0 };

    demons.forEach((demon) => {
      if (
        !demon ||
        !demon.userData ||
        demon.userData.isDead ||
        demon.userData.isFalling
      )
        return;

      // Count by type
      const demonType = demon.userData.demonType || "IMP";
      typeBreakdown[demonType]++;

      const dx = playerPosition.x - demon.position.x;
      const dz = playerPosition.z - demon.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      const detectRange = demon.userData.detectRange || 60;
      const attackRange = demon.userData.attackRange || 3.5;
      const chaseRange = demon.userData.chaseRange || 8;

      if (distance < detectRange) {
        // Detection range
        if (distance <= attackRange) {
          // Attack range
          attackingDemons++;
        } else if (distance <= chaseRange) {
          // Chase range
          chasingDemons++;
        } else {
          huntingDemons++;
        }
      }
    });

    let status = `🌊 Protocol Wave ${currentWave} | Combat Units: ${livingDemons}/${demonsThisWave}`;

    // Add type breakdown for variety
    const typeInfo = [];
    Object.keys(typeBreakdown).forEach((type) => {
      if (typeBreakdown[type] > 0) {
        const typeData = DEMON_TYPES[type];
        typeInfo.push(`${typeData.emoji}${typeBreakdown[type]}`);
      }
    });

    if (typeInfo.length > 0) {
      status += ` | ${typeInfo.join(" ")}`;
    }

    if (huntingDemons > 0) {
      status += ` | 👁️ Scanning: ${huntingDemons}`;
    }
    if (chasingDemons > 0) {
      status += ` | 🏃 Pursuing: ${chasingDemons}`;
    }
    if (attackingDemons > 0) {
      status += ` | ⚔️ Engaging: ${attackingDemons}`;
    }

    waveDiv.textContent = status;
  } else {
    const timeLeft = Math.ceil(
      (timeBetweenWaves - (Date.now() % timeBetweenWaves)) / 1000
    );
    waveDiv.textContent = `🌊 Protocol Wave ${currentWave} initializing...`;
  }
}

// Add event listeners for other controls
function addEventListeners() {
  // Window resize event
  window.addEventListener("resize", onWindowResize, false);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // Ensure canvas remains fullscreen after resize
  if (renderer && renderer.domElement) {
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Only run game logic if initialized and playing
  if (!gameInitialized) {
    return;
  }

  const time = performance.now();

  // Only handle movement when game is playing
  if (gameState === "playing" && controls.isLocked === true) {
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // Keep player within game boundaries
    const playerPos = controls.getObject().position;
    const boundary = 45; // Half of the 100x100 ground size minus some padding

    // Clamp X position
    if (playerPos.x > boundary) {
      playerPos.x = boundary;
    } else if (playerPos.x < -boundary) {
      playerPos.x = -boundary;
    }

    // Clamp Z position
    if (playerPos.z > boundary) {
      playerPos.z = boundary;
    } else if (playerPos.z < -boundary) {
      playerPos.z = -boundary;
    }

    // Keep camera above ground
    controls.getObject().position.y = Math.max(
      1.8,
      controls.getObject().position.y
    );
  }

  prevTime = time;

  // Only run game systems when playing
  if (gameState === "playing" && !isGameOver) {
    // Update demon behavior
    updateDemons();

    // Check if wave is complete
    checkWaveComplete();

    // Check player-demon collisions
    checkPlayerDemonCollision();

    // Update health pack system
    updateHealthPackSpawning();
    updateHealthPacks();
    checkHealthPackCollision();

    // Update ammo pack system
    updateAmmoPackSpawning();
    updateAmmoPacks();
    checkAmmoPackCollision();

    // Update wave display
    updateWaveDisplay();

    // Update bullets
    updateBullets();

    // Handle auto-fire for machine gun
    if (isAutoFiring && mouseHeld) {
      shoot();
    }

    // Update gun position to stay at bottom of screen
    updateGunPosition();

    // Update crosshair targeting
    updateCrosshairTargeting();

    // Update mini radar
    updateRadar();

    // Update dynamic music system based on game state
    updateMusicBasedOnGameState();
  }

  // Always render animated objects for visual interest
  if (scene && scene.children) {
    scene.children.forEach((child, index) => {
      if (child.geometry && child.geometry.type === "BoxGeometry") {
        child.rotation.x += 0.01;
        child.rotation.y += 0.01;
      }
      if (child.geometry && child.geometry.type === "SphereGeometry") {
        child.position.y = 1.5 + Math.sin(Date.now() * 0.001 + index) * 0.5;
      }
    });
  }

  // Always render the scene if it exists
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Menu System Functions
function showMainMenu() {
  gameState = "mainMenu";
  hideAllMenus();
  document.getElementById("mainMenu").classList.add("active");
  document.getElementById("gameUI").style.display = "none";

  // Exit pointer lock if active
  if (document.exitPointerLock) {
    document.exitPointerLock();
  }

  console.log("Showing main menu");
}

function showInstructions() {
  gameState = "instructions";
  hideAllMenus();
  document.getElementById("instructionsMenu").classList.add("active");
  console.log("Showing instructions");
}

function startGame() {
  hideAllMenus();
  document.getElementById("gameUI").style.display = "block";

  // Enter fullscreen mode
  enterFullscreen();

  // Initialize game if not already done
  if (!gameInitialized) {
    init();
    gameInitialized = true;
  } else {
    // Reset and restart if already initialized
    resetGameState();
    startWaveSystem();
  }

  // Set game state AFTER initialization
  gameState = "playing";

  // Show voice chat hint for single player
  if (voiceChat.settings.mode !== "disabled") {
    console.log(
      "🎤 Voice chat enabled! Press and hold T to test speech-to-text in single player mode."
    );
  }

  // Request pointer lock to enable mouse controls with error handling
  setTimeout(() => {
    console.log("🎯 Requesting pointer lock for single player...");

    // Check if controls are properly initialized
    if (!controls) {
      console.warn("⚠️ Controls not initialized, reinitializing...");
      initControls();
    }

    try {
      const lockPromise = document.body.requestPointerLock();

      // Handle promise-based pointer lock API
      if (lockPromise) {
        lockPromise
          .then(() => {
            console.log("✅ Pointer lock acquired for single player");
          })
          .catch((error) => {
            console.warn("⚠️ Pointer lock failed in single player:", error);
          });
      } else {
        console.log("✅ Pointer lock requested for single player (legacy API)");
      }
    } catch (error) {
      console.warn("⚠️ Pointer lock request failed:", error);
    }
  }, 50); // Small delay to ensure proper initialization

  console.log("Starting game");
}

// Fullscreen functionality
function enterFullscreen() {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen().catch((err) => {
      console.log("Error attempting to enable fullscreen:", err);
    });
  } else if (element.mozRequestFullScreen) {
    // Firefox
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    // Chrome, Safari and Opera
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    // IE/Edge
    element.msRequestFullscreen();
  }
}

function pauseGame() {
  if (gameState !== "playing") return;

  gameState = "paused";

  // Pause background music
  pauseBackgroundMusic();

  // Exit pointer lock to free the cursor
  if (document.exitPointerLock) {
    document.exitPointerLock();
  }

  // Show voice chat settings (always available for testing)
  const voiceChatSettings = document.getElementById("pauseVoiceChatSettings");
  if (voiceChatSettings) {
    voiceChatSettings.style.display = "block";
  }

  // Update pause menu UI with current settings
  updatePauseMenuUI();

  // Show pause menu
  hideAllMenus();
  document.getElementById("pauseMenu").classList.add("active");

  console.log("Game paused - press ESC again or click Resume to continue");
}

function resumeGame() {
  if (gameState !== "paused") return;

  gameState = "playing";
  hideAllMenus();
  document.getElementById("gameUI").style.display = "block";

  // Resume background music
  resumeBackgroundMusic();

  // Request pointer lock to continue playing
  setTimeout(() => {
    requestPointerLock();
  }, 100); // Small delay to ensure UI is ready

  console.log("Game resumed");
}

// Toggle interface visibility without affecting game state or pointer lock
function toggleInterface() {
  const gameUI = document.getElementById("gameUI");
  if (gameUI.style.display === "none") {
    gameUI.style.display = "block";
    console.log("Interface shown");
  } else {
    gameUI.style.display = "none";
    console.log("Interface hidden");
  }
}

function quitToMainMenu() {
  // Stop all game timers and reset state
  if (demonSpawnTimer) {
    clearTimeout(demonSpawnTimer);
    demonSpawnTimer = null;
  }
  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
  }

  // Stop background music
  stopBackgroundMusic();

  // Reset all game variables
  resetGameState();

  // Show main menu
  showMainMenu();

  console.log("Quit to main menu");
}

function hideAllMenus() {
  const menus = document.querySelectorAll(".menu-screen");
  menus.forEach((menu) => menu.classList.remove("active"));

  // Also ensure pauseMenu is hidden by ID for backup
  const pauseMenu = document.getElementById("pauseMenu");
  if (pauseMenu) {
    pauseMenu.classList.remove("active");
  }
}

// Enhanced game over function
function gameOver() {
  isGameOver = true;
  gameState = "gameOver";
  console.log("Game Over!");

  // Stop background music and play doom effect
  stopBackgroundMusic();
  setTimeout(() => {
    playDoomedEffect();
  }, 500);

  // Stop all timers
  if (demonSpawnTimer) {
    clearTimeout(demonSpawnTimer);
    demonSpawnTimer = null;
  }
  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
  }

  // Update final stats
  const finalWavesElement = document.getElementById("finalWaves");
  const finalKillsElement = document.getElementById("finalKills");
  const finalTimeElement = document.getElementById("finalTime");

  if (finalWavesElement) finalWavesElement.textContent = currentWave - 1;
  if (finalKillsElement) finalKillsElement.textContent = demonKills;
  if (finalTimeElement) finalTimeElement.textContent = "0:00"; // TODO: Add time tracking

  // Show game over screen
  hideAllMenus();
  const gameOverElement = document.getElementById("gameOver");
  if (gameOverElement) {
    gameOverElement.classList.add("active");
  }
  document.getElementById("gameUI").style.display = "none";

  // Exit pointer lock
  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

// Enhanced restart function
function restartGame() {
  console.log("Restarting game by reloading the page...");

  // Reload the entire page for a completely fresh start
  window.location.reload();
}

// Reset game state function
function resetGameState() {
  // Reset all game variables
  playerHealth = maxHealth;
  isGameOver = false;
  currentWave = 1;
  demonKills = 0;
  demonsThisWave = 0;
  demonsSpawnedThisWave = 0;
  waveInProgress = false;
  lastDamageTime = 0;

  // Clear all demons
  demons.forEach((demon) => scene.remove(demon));
  demons = [];

  // Reset demon type counts
  demonTypeCounts = {
    IMP: 0,
    DEMON: 0,
    CACODEMON: 0,
    BARON: 0,
  };

  // Clear all bullets
  bullets.forEach((bullet) => scene.remove(bullet));
  bullets = [];

  // Clear all health packs
  healthPacks.forEach((healthPack) => scene.remove(healthPack));
  healthPacks = [];
  healthPacksCollected = 0;
  lastHealthPackSpawn = 0;

  // Clear all ammo packs
  ammoPacks.forEach((ammoPack) => scene.remove(ammoPack));
  ammoPacks = [];
  ammoPacksCollected = 0;
  lastAmmoPackSpawn = 0;

  // Reset player position
  if (controls) {
    controls.getObject().position.set(0, 1.8, 0);
  }

  // Reset weapon system
  currentWeapon = "shotgun";
  isAutoFiring = false;
  mouseHeld = false;
  lastShotTime = 0;
  gunRecoilOffset = 0;
  gunRecoilVelocity = 0;

  // Reset weapon ammo
  WEAPONS.shotgun.currentAmmo = WEAPONS.shotgun.maxAmmo;
  WEAPONS.chaingun.currentAmmo = WEAPONS.chaingun.maxAmmo;

  // Reset crosshair targeting
  isAimingAtZombie = false;
  updateCrosshairAppearance();

  // Reset weapon visibility
  if (gun) gun.visible = true;
  if (machineGun) machineGun.visible = false;

  // Reset muzzle flash
  if (gun && gun.children.find((child) => child.isLight)) {
    muzzleFlashLight = gun.children.find((child) => child.isLight);
    muzzleFlashLight.intensity = 0;
  }

  // Re-initialize all UI elements
  if (gameInitialized) {
    initializeUI();
  }
}

// Initialize the scene when the page loads
window.addEventListener("load", () => {
  console.log("Page loaded, showing main menu");

  // Ensure viewport is properly set for fullscreen
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    const viewportMeta = document.createElement("meta");
    viewportMeta.name = "viewport";
    viewportMeta.content =
      "width=device-width, initial-scale=1.0, user-scalable=no";
    document.head.appendChild(viewportMeta);
  }

  // Start animation loop immediately for any visual effects
  animate();
  // Don't initialize the game immediately, wait for user to click start

  // Set up server configuration event listeners
  setupServerConfigListeners();
});

function setupServerConfigListeners() {
  const serverRadios = document.querySelectorAll('input[name="serverType"]');
  const lanServerIP = document.getElementById("lanServerIP");
  const customServerIP = document.getElementById("customServerIP");

  serverRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      // Enable/disable IP input fields based on selection
      if (lanServerIP) {
        lanServerIP.disabled = e.target.value !== "lan";
      }
      if (customServerIP) {
        customServerIP.disabled = e.target.value !== "custom";
      }
    });
  });

  // Auto-connect when switching to local server
  const localRadio = document.getElementById("localServer");
  if (localRadio) {
    localRadio.addEventListener("change", (e) => {
      if (e.target.checked) {
        setTimeout(() => connectToServer(), 100);
      }
    });
  }

  // Setup username input enhancements
  setupUsernameInput();
}

function setupUsernameInput() {
  const usernameInput = document.getElementById("playerName");
  const usernameHelper = document.getElementById("usernameHelper");

  if (!usernameInput || !usernameHelper) return;

  // Load saved username
  const savedUsername = localStorage.getItem("demonUsername");
  if (savedUsername) {
    usernameInput.value = savedUsername;
  }

  // Real-time validation and feedback
  usernameInput.addEventListener("input", (e) => {
    const value = e.target.value;
    const length = value.length;

    // Update helper text based on input
    if (length === 0) {
      usernameHelper.textContent =
        "👹 Choose your demonic identity (2-20 characters)";
    } else if (length < 2) {
      usernameHelper.textContent = `⚠️ Too short! Need ${
        2 - length
      } more character${2 - length > 1 ? "s" : ""}`;
    } else if (length > 20) {
      usernameHelper.textContent = "⚠️ Too long! Maximum 20 characters";
    } else if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      usernameHelper.textContent = "⚠️ Use only letters, numbers, _ and -";
    } else {
      usernameHelper.textContent = `✅ Perfect demon name! (${length}/20 characters)`;
      // Save valid username
      localStorage.setItem("demonUsername", value);
    }
  });

  // Enhanced focus/blur effects
  usernameInput.addEventListener("focus", () => {
    usernameInput.parentElement.style.transform = "scale(1.02)";
    usernameInput.parentElement.style.boxShadow =
      "0 0 40px rgba(255, 102, 0, 0.7)";
  });

  usernameInput.addEventListener("blur", () => {
    usernameInput.parentElement.style.transform = "scale(1)";
    usernameInput.parentElement.style.boxShadow =
      "0 0 30px rgba(255, 102, 0, 0.5)";
  });

  // Auto-generate username suggestion
  usernameInput.addEventListener("dblclick", () => {
    if (!usernameInput.value) {
      const demonNames = [
        "HellSpawn",
        "DoomSlayer",
        "InfernoWalker",
        "ShadowDemon",
        "BlazeFury",
        "DarkReaper",
        "FireStorm",
        "VoidHunter",
        "CrimsonBeast",
        "NightTerror",
        "BurningSkull",
        "DeathBringer",
        "HellRaiser",
        "DemonLord",
        "SoulEater",
      ];
      const randomName =
        demonNames[Math.floor(Math.random() * demonNames.length)];
      const randomNum = Math.floor(Math.random() * 999) + 1;
      usernameInput.value = `${randomName}${randomNum}`;
      usernameInput.dispatchEvent(new Event("input"));

      // Show suggestion hint
      usernameHelper.textContent =
        "🎲 Random demon name generated! Double-click again for another";
      setTimeout(() => {
        usernameInput.dispatchEvent(new Event("input"));
      }, 2000);
    }
  });
}

// Master volume control function
function updateMasterVolume(value) {
  const volume = value / 100;
  musicVolume = volume * 0.4; // Music at 40% of master volume
  effectsVolume = volume * 0.8; // Effects at 80% of master volume
  console.log(
    "Master volume:",
    volume,
    "Music:",
    musicVolume,
    "Effects:",
    effectsVolume
  );

  // Update current background music volume if playing
  if (currentBackgroundTrack && currentBackgroundTrack.setVolume) {
    currentBackgroundTrack.setVolume(musicVolume);
  }

  // Update all sound effect volumes
  updateSoundVolumes();

  // Update display
  const masterVolumeDisplay = document.getElementById("masterVolumeDisplay");
  if (masterVolumeDisplay) {
    masterVolumeDisplay.textContent = value + "%";
  }

  // Save setting
  localStorage.setItem("masterVolume", value);
}

// Remove the duplicate UI management functions since they'll be defined earlier

// Make functions globally accessible
window.startGame = startGame;
window.startSinglePlayer = startSinglePlayer;
window.showMainMenu = showMainMenu;
window.showMultiplayerLobby = showMultiplayerLobby;
window.showInstructions = showInstructions;
window.createRoom = createRoom;
window.refreshRooms = refreshRooms;
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.sendChatMessage = sendChatMessage;
window.sendGameChatMessage = sendGameChatMessage;
window.startMultiplayerGame = startMultiplayerGame;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.quitToMainMenu = quitToMainMenu;
window.restartGame = restartGame;
window.updateMasterVolume = updateMasterVolume;
window.updateVoiceVolume = updateVoiceVolume;
window.connectToServer = connectToServer;
window.toggleReady = toggleReady;

// UI Management Functions
function showMainMenu() {
  hideAllMenus();
  const mainMenu = document.getElementById("mainMenu");
  if (mainMenu) {
    mainMenu.classList.add("active");
  }
  gameState = "mainMenu";
}

function showMultiplayerLobby() {
  hideAllMenus();
  const multiplayerLobby = document.getElementById("multiplayerLobby");
  if (multiplayerLobby) {
    multiplayerLobby.classList.add("active");
  }
  gameState = "multiplayerLobby";

  if (!socket) {
    // Try to connect to the currently selected server
    connectToServer();
  }

  // Auto-refresh rooms
  setTimeout(() => {
    if (isConnected) refreshRooms();
  }, 1000); // Increased delay to allow connection to establish
}

function showPartyRoom() {
  hideAllMenus();
  const partyRoom = document.getElementById("partyRoom");
  if (partyRoom) {
    partyRoom.classList.add("active");
  }
  gameState = "partyRoom";

  if (currentRoom) {
    const roomTitle = document.getElementById("roomTitle");
    if (roomTitle) {
      roomTitle.textContent = `🔥 ${currentRoom.name} 🔥`;
    }
  }
}

function showInstructions() {
  hideAllMenus();
  const instructions = document.getElementById("instructions");
  if (instructions) {
    instructions.classList.add("active");
  }
  gameState = "instructions";
}

function startSinglePlayer() {
  isMultiplayer = false;
  startGame();
}

function hideAllMenus() {
  const menus = [
    "mainMenu",
    "multiplayerLobby",
    "partyRoom",
    "instructions",
    "gameOver",
    "pauseMenu", // 添加缺失的pauseMenu
  ];
  menus.forEach((menuId) => {
    const element = document.getElementById(menuId);
    if (element) {
      element.classList.remove("active");
    }
  });
}

// Networking functions
let currentServerURL = "http://localhost:3000";

function getServerURL() {
  const serverType = document.querySelector(
    'input[name="serverType"]:checked'
  )?.value;

  switch (serverType) {
    case "local":
      return "http://localhost:3000";
    case "lan":
      const lanIP = document.getElementById("lanServerIP")?.value?.trim();
      if (lanIP) {
        return lanIP.startsWith("http") ? lanIP : `http://${lanIP}`;
      }
      return "http://localhost:3000";
    case "custom":
      const customIP = document.getElementById("customServerIP")?.value?.trim();
      if (customIP) {
        return customIP.startsWith("http") ? customIP : `http://${customIP}`;
      }
      return "http://localhost:3000";
    default:
      return "http://localhost:3000";
  }
}

function connectToServer() {
  // Disconnect existing connection if any
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentServerURL = getServerURL();
  console.log(`🌐 Attempting to connect to: ${currentServerURL}`);
  updateConnectionStatus("🔄 Connecting to Hell...");

  initializeNetworking();
}

function initializeNetworking() {
  if (socket) return;

  // Check if io (Socket.IO) is available
  if (typeof io === "undefined") {
    console.error("Socket.IO not loaded! Multiplayer features will not work.");
    updateConnectionStatus("🔴 Socket.IO not available");
    return;
  }

  try {
    socket = io(currentServerURL, {
      timeout: 10000, // 10 second timeout
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
    });
  } catch (error) {
    console.error("Failed to initialize Socket.IO:", error);
    updateConnectionStatus("🔴 Connection failed");
    return;
  }

  socket.on("connect", () => {
    console.log(`🔥 Connected to Hell Server: ${currentServerURL}`);
    isConnected = true;
    updateConnectionStatus(`🟢 Connected to Hell (${currentServerURL})`);
  });

  socket.on("disconnect", () => {
    console.log("💀 Disconnected from Hell Server");
    isConnected = false;
    updateConnectionStatus("🔴 Disconnected from Hell");
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error);
    isConnected = false;
    updateConnectionStatus(
      `🔴 Connection failed: ${error.message || "Unknown error"}`
    );
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
    isConnected = true;
    updateConnectionStatus(`🟢 Reconnected to Hell (${currentServerURL})`);
  });

  socket.on("reconnect_error", (error) => {
    console.error("❌ Reconnection failed:", error);
    updateConnectionStatus("🔴 Reconnection failed");
  });

  // Room events
  socket.on("room:created", (data) => {
    console.log("🏰 Room created:", data);
    currentRoom = data.room;
    isRoomLeader = data.isLeader;
    isPlayerReady = false; // Reset ready state when creating room

    // Update party members with the current player (room creator)
    const playerName = document.getElementById("playerName").value.trim();
    if (playerName) {
      const currentPlayer = {
        id: socket.id,
        name: playerName,
        ready: false,
        isLeader: true,
      };
      updatePartyMembers([currentPlayer]);
    }

    showPartyRoom();

    // Reset ready button
    const readyButton = document.getElementById("readyButton");
    if (readyButton) {
      readyButton.textContent = "⏳ NOT READY";
      readyButton.classList.remove("success");
    }
  });

  socket.on("room:joined", (data) => {
    console.log("👹 Joined room:", data);
    currentRoom = data.room;
    isRoomLeader = data.isLeader;
    isPlayerReady = false; // Reset ready state when joining room
    updatePartyMembers(data.players);
    showPartyRoom();

    // Reset ready button
    const readyButton = document.getElementById("readyButton");
    if (readyButton) {
      readyButton.textContent = "⏳ NOT READY";
      readyButton.classList.remove("success");
    }
  });

  socket.on("room:list", (rooms) => {
    updateRoomsList(rooms);
  });

  socket.on("room:full", () => {
    alert("🔥 Chamber is full! Try another one.");
  });

  socket.on("room:not_found", () => {
    alert("👹 Chamber not found! It may have been destroyed.");
  });

  // Party events
  socket.on("party:member_joined", (data) => {
    console.log("👹 New demon joined:", data.player);
    addPartyMember(data.player);
    addChatMessage("system", `${data.player.name} entered the chamber`);
  });

  socket.on("party:member_left", (data) => {
    console.log("👹 Demon left:", data);
    removePartyMember(data.playerId);
    addChatMessage("system", `${data.playerName} left the chamber`);
  });

  socket.on("party:leader_changed", (data) => {
    console.log("👑 New leader:", data);
    isRoomLeader = data.newLeaderId === socket.id;
    updatePartyLeader(data.newLeaderId);
    addChatMessage("system", `${data.newLeaderName} is now the chamber leader`);
  });

  socket.on("party:ready_state", (data) => {
    updatePlayerReadyState(data.playerId, data.ready);
  });

  socket.on("party:all_ready", (data) => {
    if (isRoomLeader && data.canStart) {
      const startButton = document.getElementById("startGameButton");
      if (startButton) startButton.disabled = false;
    }
  });

  // Chat events
  socket.on("chat:lobby_message", (data) => {
    addChatMessage("player", data.message, data.playerName);
  });

  socket.on("chat:game_message", (data) => {
    addGameChatMessage("player", data.message, data.playerName);
  });

  // Game events
  socket.on("game:start", (data) => {
    console.log("🎮 Game starting:", data);
    isMultiplayer = true;
    initializeMultiplayerGame(data);
  });

  // World/Demon synchronization events
  socket.on("world:wave:start", (data) => {
    console.log("🌊 Wave starting:", data);
    handleServerWaveStart(data);
  });

  socket.on("world:demon:spawn", (data) => {
    console.log("👹 Demon spawned by server:", data);
    handleServerDemonSpawn(data);
  });

  socket.on("world:demon:death", (data) => {
    console.log("💀 Demon killed:", data);
    handleServerDemonDeath(data);
  });

  socket.on("world:demon:update", (data) => {
    handleServerDemonUpdate(data);
  });

  socket.on("world:wave:complete", (data) => {
    console.log("✅ Wave complete:", data);
    handleServerWaveComplete(data);
  });

  // Player synchronization
  socket.on("player:position", (data) => {
    updateRemotePlayerPosition(data);
  });

  socket.on("weapon:shoot", (data) => {
    handleRemotePlayerShoot(data);
  });

  socket.on("combat:hit", (data) => {
    handleRemotePlayerHit(data);
  });

  socket.on("combat:damage", (data) => {
    handleDemonDamage(data);
  });

  // Voice chat events
  socket.on("voice:message", (data) => {
    handleVoiceMessage(data);
  });

  socket.on("voice:data", (data) => {
    handleVoiceData(data);
  });
}

function updateConnectionStatus(status) {
  const statusElement = document.getElementById("connectionStatus");
  if (statusElement) {
    statusElement.textContent = status;
  }
}

// Add the rest of the missing multiplayer functions

function createRoom() {
  if (!isConnected) {
    alert("🔥 Not connected to Hell Server!");
    return;
  }

  const roomName = document.getElementById("roomName").value.trim();
  const maxPlayers = parseInt(document.getElementById("maxPlayers").value);
  const mapType = document.getElementById("mapType").value;
  const playerName = document.getElementById("playerName").value.trim();

  if (!roomName) {
    alert("👹 Enter a chamber name!");
    return;
  }

  if (!playerName) {
    alert("👹 Enter your demon name!");
    return;
  }

  // Join with player name first
  socket.emit("user:joined", { name: playerName });

  // Create room
  socket.emit("room:create", {
    name: roomName,
    maxPlayers: maxPlayers,
    mapType: mapType,
  });
}

function refreshRooms() {
  if (!isConnected) {
    alert("🔥 Not connected to Hell Server!");
    return;
  }
  socket.emit("room:list");
}

function joinRoom(roomId) {
  if (!isConnected) {
    alert("🔥 Not connected to Hell Server!");
    return;
  }

  const playerName = document.getElementById("playerName").value.trim();
  if (!playerName) {
    alert("👹 Enter your demon name!");
    return;
  }

  // Join with player name first
  socket.emit("user:joined", { name: playerName });

  // Join room
  socket.emit("room:join", { roomId: roomId });
}

function leaveRoom() {
  if (socket && currentRoom) {
    socket.emit("room:leave");
    currentRoom = null;
    isRoomLeader = false;
    showMultiplayerLobby();
  }
}

// Add ready state management
let isPlayerReady = false;

function toggleReady() {
  if (!socket || !currentRoom) return;

  isPlayerReady = !isPlayerReady;
  socket.emit("player:ready", { ready: isPlayerReady });

  const readyButton = document.getElementById("readyButton");
  if (readyButton) {
    if (isPlayerReady) {
      readyButton.textContent = "✅ READY";
      readyButton.classList.add("success");
    } else {
      readyButton.textContent = "⏳ NOT READY";
      readyButton.classList.remove("success");
    }
  }
}

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (message && socket && currentRoom) {
    socket.emit("chat:lobby_message", { message: message });
    input.value = "";
  }
}

function sendGameChatMessage() {
  const input = document.getElementById("gameChatInput");
  const message = input.value.trim();

  if (message && socket && currentRoom) {
    socket.emit("chat:game_message", { message: message });
    input.value = "";
    toggleGameChat();
  }
}

function startMultiplayerGame() {
  if (socket && currentRoom && isRoomLeader) {
    socket.emit("game:start");
  }
}

function updateRoomsList(rooms) {
  const roomList = document.getElementById("roomList");

  if (!roomList) return;

  if (rooms.length === 0) {
    roomList.innerHTML =
      '<div class="room-item empty">🏜️ No chambers found in Hell</div>';
    return;
  }

  roomList.innerHTML = rooms
    .map(
      (room) => `
    <div class="room-item" onclick="joinRoom('${room.id}')">
      <div class="room-info">
        <div class="room-name">🏰 ${room.name}</div>
        <div class="room-details">
          👹 ${room.players}/${room.maxPlayers} | 🗺️ ${room.mapType}
        </div>
      </div>
      <div class="room-status">
        ${room.players < room.maxPlayers ? "🟢 OPEN" : "🔴 FULL"}
      </div>
    </div>
  `
    )
    .join("");
}

function updatePartyMembers(players) {
  const container = document.getElementById("partyMembers");

  if (!container) return;

  container.innerHTML = players
    .map(
      (player) => `
    <div class="party-member" id="player-${player.id}">
      <div class="member-info">
        <span class="member-name">${player.isLeader ? "👑" : "👹"} ${
        player.name
      }</span>
        <span class="member-status ${player.ready ? "ready" : "not-ready"}">
          ${player.ready ? "✅ READY" : "⏳ NOT READY"}
        </span>
      </div>
    </div>
  `
    )
    .join("");
}

function addPartyMember(player) {
  const container = document.getElementById("partyMembers");
  if (!container) return;

  const memberDiv = document.createElement("div");
  memberDiv.className = "party-member";
  memberDiv.id = `player-${player.id}`;
  memberDiv.innerHTML = `
    <div class="member-info">
      <span class="member-name">${player.isLeader ? "👑" : "👹"} ${
    player.name
  }</span>
      <span class="member-status ${player.ready ? "ready" : "not-ready"}">
        ${player.ready ? "✅ READY" : "⏳ NOT READY"}
      </span>
    </div>
  `;
  container.appendChild(memberDiv);
}

function removePartyMember(playerId) {
  const memberElement = document.getElementById(`player-${playerId}`);
  if (memberElement) {
    memberElement.remove();
  }
}

function updatePartyLeader(leaderId) {
  // Update UI to show new leader
  const members = document.querySelectorAll(".party-member");
  members.forEach((member) => {
    const nameSpan = member.querySelector(".member-name");
    const playerId = member.id.replace("player-", "");
    if (playerId === leaderId) {
      nameSpan.textContent = nameSpan.textContent.replace("👹", "👑");
    } else {
      nameSpan.textContent = nameSpan.textContent.replace("👑", "👹");
    }
  });

  // Update start button visibility
  const startButton = document.getElementById("startGameButton");
  if (startButton) {
    if (isRoomLeader) {
      startButton.style.display = "block";
    } else {
      startButton.style.display = "none";
    }
  }
}

function updatePlayerReadyState(playerId, ready) {
  const memberElement = document.getElementById(`player-${playerId}`);
  if (memberElement) {
    const statusSpan = memberElement.querySelector(".member-status");
    statusSpan.className = `member-status ${ready ? "ready" : "not-ready"}`;
    statusSpan.textContent = ready ? "✅ READY" : "⏳ NOT READY";
  }
}

function addChatMessage(type, message, playerName = null) {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}`;

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (type === "system") {
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="system-msg">🔥 ${message}</span>`;
  } else {
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="player-name">${playerName}:</span> ${message}`;
  }

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function addGameChatMessage(type, message, playerName = null) {
  const container = document.getElementById("gameChatMessages");
  if (!container) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `game-chat-message ${type}`;

  // Add voice message styling
  if (type === "voice") {
    messageDiv.classList.add("voice-message");
  }

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (type === "system") {
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="system-msg">🔥 ${message}</span>`;
  } else if (type === "voice") {
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="player-name">${playerName}:</span> ${message}`;
  } else {
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="player-name">${playerName}:</span> ${message}`;
  }

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.style.opacity = "0.3";
    }
  }, 5000);
}

function toggleGameChat() {
  const chatInput = document.querySelector(".game-chat-input");
  const input = document.getElementById("gameChatInput");

  if (!chatInput || !input) return;

  if (chatInput.style.display === "none" || !chatInput.style.display) {
    chatInput.style.display = "flex";
    input.focus();
  } else {
    chatInput.style.display = "none";
    input.blur();
  }
}

// Enhanced multiplayer game initialization
function initializeMultiplayerGame(gameData) {
  console.log("🎮 Initializing multiplayer game:", gameData);

  // Set multiplayer flag
  isMultiplayer = true;

  // Hide menu and show game
  hideAllMenus();
  document.getElementById("gameUI").style.display = "block";

  // Enter fullscreen mode (IMPORTANT for pointer lock)
  enterFullscreen();

  // Initialize the game if not already done
  if (!gameInitialized) {
    init();
    gameInitialized = true;
  } else {
    // Reset and restart if already initialized
    resetGameState();
    startWaveSystem();
  }

  // Set game state AFTER initialization
  gameState = "playing";

  // Update room info
  if (currentRoom) {
    const roomInfoElement = document.getElementById("roomInfo");
    if (roomInfoElement) {
      roomInfoElement.textContent = `🏰 Chamber: ${currentRoom.name}`;
    }
  }

  // Initialize remote players
  gameData.players.forEach((player) => {
    if (player.id !== socket.id) {
      createRemotePlayer(player);
    }
  });

  // Start position sync
  startPositionSync();

  // Ensure UI is properly initialized for multiplayer
  setTimeout(() => {
    if (typeof initializeUI === "function") {
      initializeUI();
      console.log("🖥️ UI reinitialized for multiplayer mode");
    }
  }, 25);

  // Add delay and error handling for pointer lock in multiplayer mode
  setTimeout(() => {
    console.log("🎯 Requesting pointer lock for multiplayer...");

    // Check if controls are properly initialized
    if (!controls) {
      console.warn("⚠️ Controls not initialized, reinitializing...");
      initControls();
    }

    // Request pointer lock with error handling
    try {
      const lockPromise = document.body.requestPointerLock();

      // Handle promise-based pointer lock API
      if (lockPromise) {
        lockPromise
          .then(() => {
            console.log("✅ Pointer lock acquired for multiplayer");
          })
          .catch((error) => {
            console.warn("⚠️ Pointer lock failed in multiplayer:", error);
            // Try alternative approach
            requestPointerLockFallback();
          });
      } else {
        console.log("✅ Pointer lock requested for multiplayer (legacy API)");
      }
    } catch (error) {
      console.warn("⚠️ Pointer lock request failed:", error);
      requestPointerLockFallback();
    }
  }, 100); // Small delay to ensure proper initialization

  console.log("🔥 Multiplayer game initialized successfully");
}

// Check if pointer lock is supported and working
function checkPointerLockSupport() {
  const hasPointerLock =
    "requestPointerLock" in document.body ||
    "mozRequestPointerLock" in document.body ||
    "webkitRequestPointerLock" in document.body;

  console.log("🔍 Pointer lock support:", hasPointerLock);
  console.log("🔍 Current game state:", gameState);
  console.log("🔍 Controls initialized:", !!controls);
  console.log("🔍 Is multiplayer:", isMultiplayer);

  return hasPointerLock;
}

// Fallback function for pointer lock issues
function requestPointerLockFallback() {
  console.log("🔧 Attempting pointer lock fallback...");

  // Check support first
  if (!checkPointerLockSupport()) {
    console.error("❌ Pointer lock not supported in this browser");
    return;
  }

  // Try clicking anywhere to enable pointer lock
  const instructionsElement = document.getElementById("instructions");
  if (instructionsElement) {
    instructionsElement.style.display = "block";
    instructionsElement.innerHTML = `
      <h1>🎮 Multiplayer Controls</h1>
      <p><strong>Click anywhere to enable mouse controls</strong></p>
      <p>Move: WASD | Look: Mouse | Shoot: Left Click</p>
      <p>Press ESC to pause</p>
    `;
  }

  // Add one-time click listener to request pointer lock
  const handleClick = () => {
    console.log("👆 User clicked, requesting pointer lock...");
    document.body.requestPointerLock();
    if (instructionsElement) {
      instructionsElement.style.display = "none";
    }
    document.removeEventListener("click", handleClick);
  };

  document.addEventListener("click", handleClick);
}

// Server-synchronized demon management functions
function handleServerWaveStart(data) {
  currentWave = data.wave;
  waveInProgress = true;

  // Clear existing demons if any
  demons.forEach((demon) => scene.remove(demon));
  demons = [];

  // Reset demon type counts
  demonTypeCounts = {
    IMP: 0,
    DEMON: 0,
    CACODEMON: 0,
    BARON: 0,
  };

  updateWaveDisplay();
  console.log(
    `🌊 Starting server-synchronized wave ${data.wave} with ${data.demonsCount} demons`
  );
}

function handleServerDemonSpawn(data) {
  const demon = createDemonModel(data.demon.type);
  if (!demon) return;

  // Set position and rotation from server
  demon.position.set(
    data.demon.position.x,
    data.demon.position.y,
    data.demon.position.z
  );
  demon.rotation.set(
    data.demon.rotation.x,
    data.demon.rotation.y,
    data.demon.rotation.z
  );

  // Get demon type data for proper initialization
  const demonType = data.demon.type;
  const typeData = DEMON_TYPES[demonType];

  // Initialize complete userData for server demons (matching client demon structure)
  demon.userData = {
    serverId: data.demon.id,
    serverHealth: data.demon.health,
    maxHealth: data.demon.maxHealth,
    isServerControlled: true,
    demonType: demonType,

    // AI properties needed for client-side behavior
    walkSpeed: typeData.speed * 0.3,
    rotationSpeed: 0.01 + Math.random() * 0.02,
    wanderDirection: Math.random() * Math.PI * 2,
    wanderTimer: Math.random() * 100,
    attackCooldown: 0,
    isAttacking: false,
    hasAttacked: false,
    originalScale: typeData.scale,
    attackScaleSet: false,

    // Type-specific properties
    detectRange: typeData.detectRange,
    attackRange: typeData.attackRange,
    chaseRange: typeData.chaseRange,
    attackDamage: typeData.attackDamage,

    // State flags
    isDead: false,
    isFalling: false,
    fallSpeed: 0,
  };

  // Set proper scale
  demon.scale.setScalar(typeData.scale);

  // Add to scene and demons array
  scene.add(demon);
  demons.push(demon);

  // Update demon type counts
  if (demonTypeCounts[demonType] !== undefined) {
    demonTypeCounts[demonType]++;
  }

  console.log(
    `👹 Spawned server demon ${data.demon.id} of type ${
      data.demon.type
    } at (${data.demon.position.x.toFixed(2)}, ${data.demon.position.z.toFixed(
      2
    )})`
  );
}

function handleServerDemonDeath(data) {
  // Find the demon by server ID
  const demonIndex = demons.findIndex(
    (demon) => demon.userData.serverId === data.demonId
  );

  if (demonIndex !== -1) {
    const demon = demons[demonIndex];

    // Create death effects
    createWoundedEffect(demon.position);
    createHitEffect(demon.position);

    // Update demon type counts
    const demonType = demon.userData.demonType;
    if (
      demonTypeCounts[demonType] !== undefined &&
      demonTypeCounts[demonType] > 0
    ) {
      demonTypeCounts[demonType]--;
    }

    // Remove from scene and array
    scene.remove(demon);
    demons.splice(demonIndex, 1);

    // Update kill count if this player killed it
    if (data.killerId === socket?.id) {
      demonKills++;
      updateKillCount();
    }

    console.log(
      `💀 Removed server demon ${data.demonId}, killed by ${data.killerName}`
    );
  }
}

function handleServerDemonUpdate(data) {
  // Find the demon by server ID
  const demon = demons.find(
    (demon) => demon.userData.serverId === data.demonId
  );

  if (demon) {
    // Update position and rotation from server
    demon.position.set(data.position.x, data.position.y, data.position.z);
    demon.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
  }
}

function handleServerWaveComplete(data) {
  waveInProgress = false;
  currentWave = data.nextWave;

  // Show wave completion message
  const waveMessage = `🌊 Wave ${data.wave} Complete! Next wave: ${data.nextWave}`;
  console.log(waveMessage);

  // Update UI
  updateWaveDisplay();

  // Show player stats if available
  if (data.playersStats) {
    data.playersStats.forEach((player) => {
      console.log(
        `👹 ${player.name}: ${player.kills} kills, ${player.score} score`
      );
    });
  }
}

// Override demon hit detection for multiplayer
function hitDemon(demon, demonIndex) {
  if (isMultiplayer && demon.userData.isServerControlled) {
    // In multiplayer, notify server of demon hit
    if (socket && demon.userData.serverId) {
      socket.emit("world:demon:death", {
        demonId: demon.userData.serverId,
      });
    }
    // Don't remove the demon here - wait for server confirmation
    return;
  }

  // Single player logic (original)
  const demonType = demon.userData.demonType;
  if (
    demonTypeCounts[demonType] !== undefined &&
    demonTypeCounts[demonType] > 0
  ) {
    demonTypeCounts[demonType]--;
  }

  // Create visual effects
  createWoundedEffect(demon.position);
  createHitEffect(demon.position);

  // Make demon fall
  makeDemonFall(demon);

  // Remove demon after fall animation
  setTimeout(() => {
    removeDemon(demon, demonIndex);
  }, 1000);

  // Update kill count
  demonKills++;
  updateKillCount();
  console.log(
    "Demon removed! Demons remaining:",
    demons.length,
    "Kills:",
    demonKills
  );
}

function createRemotePlayer(playerData) {
  // Generate a unique color for this player based on their ID or index
  const playerIndex = Array.from(remotePlayers.keys()).length;
  const colorScheme = getPlayerColor(playerIndex);

  // Create a demon-style player model with unique colors
  const playerMesh = createPlayerModel(colorScheme, playerData.name);

  // Enhanced name tag with player color and emoji
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 320;
  canvas.height = 80;

  // Background with player color
  context.fillStyle = `#${colorScheme.body.toString(16).padStart(6, "0")}`;
  context.globalAlpha = 0.8;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Text with white outline for better readability
  context.globalAlpha = 1.0;
  context.fillStyle = "#000000";
  context.font = "bold 24px Arial";
  context.textAlign = "center";
  context.fillText(`${colorScheme.emoji} ${playerData.name}`, 162, 32);
  context.fillText(`${colorScheme.emoji} ${playerData.name}`, 158, 32);
  context.fillText(`${colorScheme.emoji} ${playerData.name}`, 160, 30);
  context.fillText(`${colorScheme.emoji} ${playerData.name}`, 160, 34);

  context.fillStyle = "#ffffff";
  context.fillText(`${colorScheme.emoji} ${playerData.name}`, 160, 32);

  // Color name subtitle
  context.font = "16px Arial";
  context.fillStyle = "#ffffff";
  context.fillText(colorScheme.name, 160, 55);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const nameSprite = new THREE.Sprite(spriteMaterial);
  nameSprite.position.set(0, 2.8, 0); // Higher position for better visibility
  nameSprite.scale.set(2.5, 0.6, 1);

  playerMesh.add(nameSprite);
  playerMesh.position.set(
    playerData.position.x,
    playerData.position.y,
    playerData.position.z
  );

  // Scale player model to be slightly larger than demons for visibility
  playerMesh.scale.setScalar(1.2);

  scene.add(playerMesh);
  remotePlayers.set(playerData.id, {
    mesh: playerMesh,
    data: playerData,
    colorScheme: colorScheme,
  });

  console.log(
    `👤 Created remote player ${playerData.name} with ${colorScheme.name} color scheme`
  );
}

function updateRemotePlayerPosition(data) {
  const player = remotePlayers.get(data.playerId);
  if (player) {
    // Smooth interpolation
    player.mesh.position.lerp(
      new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      0.1
    );
    player.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
  }
}

function handleRemotePlayerShoot(data) {
  // Create visual effect for remote player shooting
  console.log("Remote player shot:", data);
  // Add muzzle flash, bullet trail, etc.
}

function handleRemotePlayerHit(data) {
  // Handle when remote player hits something
  console.log("Remote player hit:", data);
}

function handleDemonDamage(data) {
  // Only apply damage if this is the target player
  if (data.playerId === socket?.id) {
    const currentTime = Date.now();

    // Check for damage invulnerability
    if (currentTime - lastDamageTime < damageInvulnerabilityTime) {
      return; // Still invulnerable
    }

    // Apply damage
    takeDamage(data.damage);
    lastDamageTime = currentTime;

    // Create damage effect
    createDamageEffect();

    // Find the demon that attacked for visual feedback
    const attackingDemon = demons.find(
      (demon) => demon.userData && demon.userData.serverId === data.demonId
    );

    if (attackingDemon) {
      // Create attack effect at demon position
      createDemonAttackEffect(attackingDemon.position);

      // Play attack sound
      playDemonAttackSound();

      const demonType = attackingDemon.userData.demonType || "IMP";
      const typeData = DEMON_TYPES[demonType];
      console.log(
        `${typeData.emoji} Server ${typeData.name} dealt ${data.damage} damage!`
      );
    }
  }
}

function startPositionSync() {
  if (!socket || !isMultiplayer) return;

  setInterval(() => {
    if (controls && gameState === "playing") {
      const position = controls.getObject().position;
      const rotation = controls.getObject().rotation;

      socket.emit("player:position", {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      });
    }
  }, 50); // 20 FPS position updates
}

// Handle received voice message
function handleVoiceMessage(data) {
  console.log("🎤 Received voice message:", data);
  if (data.type === "speech-to-text" && data.message) {
    // Display the message in game chat - avoid duplicating local user's messages
    if (data.playerId !== socket?.id) {
      addGameChatMessage("voice", data.message, data.playerName);
    }
  }
}

// Handle received voice data (restored full version)
async function handleVoiceData(data) {
  if (data.type === "voice-transmission" && data.audioData) {
    try {
      // Check if audio context is available and ready
      if (!voiceChat.audioContext) {
        console.warn("AudioContext not available for voice playback");
        return;
      }

      // Resume audio context if suspended
      if (voiceChat.audioContext.state === "suspended") {
        await voiceChat.audioContext.resume();
      }

      // Create audio buffer from received data
      const audioBuffer = await voiceChat.audioContext.decodeAudioData(
        data.audioData
      );

      // Play the audio
      const source = voiceChat.audioContext.createBufferSource();
      const gainNode = voiceChat.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = voiceChat.settings.voiceVolume / 100;

      source.connect(gainNode);
      gainNode.connect(voiceChat.audioContext.destination);

      source.start();

      // Show voice activity indicator for the sender
      showVoiceActivity(data.playerId);

      // Add visual indication in chat
      addGameChatMessage("voice", "🎤 Voice message", data.playerName);
    } catch (error) {
      console.error("Failed to play voice data:", error);
      // Fallback: just show text indication
      addGameChatMessage(
        "voice",
        "🎤 Voice message (audio playback failed)",
        data.playerName
      );
    }
  }
}

// Show voice activity indicator for a player
function showVoiceActivity(playerId) {
  // Find the remote player object
  const remotePlayer = remotePlayers.get(playerId);
  if (remotePlayer && remotePlayer.mesh) {
    // Add voice activity indicator
    const indicator = document.createElement("div");
    indicator.className = "voice-activity-indicator";
    indicator.style.position = "absolute";

    // Position indicator above player (this would need proper world-to-screen conversion)
    // For now, just show a temporary indicator
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 1000);
  }
}

// Event listeners for chat
document.addEventListener("keydown", (event) => {
  if (gameState === "partyRoom" && event.key === "Enter") {
    const chatInput = document.getElementById("chatInput");
    if (chatInput && document.activeElement !== chatInput) {
      chatInput.focus();
    } else if (chatInput) {
      sendChatMessage();
    }
  }
  // Note: In-game Enter key handling is now done in the main controls listener
});

// Player color system for multiplayer
const PLAYER_COLORS = [
  {
    name: "Cyber Blue",
    body: 0x0066ff,
    head: 0x0044cc,
    eyes: 0x00ffff,
    weapon: 0x0088ff,
    emoji: "🤖",
  },
  {
    name: "Hell Fire",
    body: 0xff3300,
    head: 0xcc2200,
    eyes: 0xffff00,
    weapon: 0xff6600,
    emoji: "🔥",
  },
  {
    name: "Toxic Green",
    body: 0x00ff44,
    head: 0x00cc33,
    eyes: 0x44ff44,
    weapon: 0x00ff88,
    emoji: "☢️",
  },
  {
    name: "Shadow Purple",
    body: 0x8800ff,
    head: 0x6600cc,
    eyes: 0xaa00ff,
    weapon: 0x9944ff,
    emoji: "🌙",
  },
  {
    name: "Golden Warrior",
    body: 0xffaa00,
    head: 0xcc8800,
    eyes: 0xffdd00,
    weapon: 0xffcc00,
    emoji: "👑",
  },
  {
    name: "Ice Crystal",
    body: 0x00aaff,
    head: 0x0088cc,
    eyes: 0x88ddff,
    weapon: 0x44bbff,
    emoji: "❄️",
  },
  {
    name: "Blood Red",
    body: 0x880000,
    head: 0x660000,
    eyes: 0xff0000,
    weapon: 0xaa0000,
    emoji: "🩸",
  },
  {
    name: "Electric Yellow",
    body: 0xffff00,
    head: 0xcccc00,
    eyes: 0xffff88,
    weapon: 0xffff44,
    emoji: "⚡",
  },
];

// Function to get player color by index
function getPlayerColor(playerIndex) {
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
}

// Check if an object is a player rather than a demon
function isPlayerObject(object) {
  return object && object.userData && object.userData.isPlayer === true;
}

// Create a player model based on demon style with custom colors
function createPlayerModel(colorScheme, playerName) {
  const playerGroup = new THREE.Group();

  // Body (main torso)
  const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
  const bodyMaterial = new THREE.MeshLambertMaterial({
    color: colorScheme.body,
    emissive: colorScheme.body,
    emissiveIntensity: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  playerGroup.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const headMaterial = new THREE.MeshLambertMaterial({
    color: colorScheme.head,
    emissive: colorScheme.head,
    emissiveIntensity: 0.1,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.4;
  playerGroup.add(head);

  // Eyes (glowing to indicate it's a player)
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: colorScheme.eyes,
    emissive: colorScheme.eyes,
    emissiveIntensity: 0.8, // Brighter than demons
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, 1.45, 0.25);
  playerGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, 1.45, 0.25);
  playerGroup.add(rightEye);

  // Arms
  const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
  const armMaterial = new THREE.MeshLambertMaterial({
    color: colorScheme.head,
  });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.45, 0.8, 0);
  leftArm.rotation.z = 0.3;
  playerGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.45, 0.8, 0);
  rightArm.rotation.z = -0.3;
  playerGroup.add(rightArm);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
  const legMaterial = new THREE.MeshLambertMaterial({
    color: colorScheme.body,
  });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.15, -0.4, 0);
  playerGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.15, -0.4, 0);
  playerGroup.add(rightLeg);

  // Player identification features
  // Add a weapon to distinguish from demons
  const weaponGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.8);
  const weaponMaterial = new THREE.MeshLambertMaterial({
    color: colorScheme.weapon,
    emissive: colorScheme.weapon,
    emissiveIntensity: 0.2,
  });
  const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
  weapon.position.set(0.5, 0.7, -0.4);
  weapon.rotation.x = -0.2;
  playerGroup.add(weapon);

  // Add a helmet/headgear to make players more distinct
  const helmetGeometry = new THREE.BoxGeometry(0.45, 0.15, 0.45);
  const helmetMaterial = new THREE.MeshLambertMaterial({
    color: colorScheme.weapon,
    metalness: 0.5,
  });
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
  helmet.position.y = 1.6;
  playerGroup.add(helmet);

  // Add team identification antenna/marker
  const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
  const antennaMaterial = new THREE.MeshBasicMaterial({
    color: colorScheme.eyes,
    emissive: colorScheme.eyes,
    emissiveIntensity: 1.0,
  });
  const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antenna.position.y = 1.9;
  playerGroup.add(antenna);

  // Enable shadows
  playerGroup.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Store player info in the model
  playerGroup.userData.isPlayer = true;
  playerGroup.userData.playerName = playerName;
  playerGroup.userData.colorScheme = colorScheme;

  return playerGroup;
}

// Helper function to request pointer lock with error handling
function requestPointerLock() {
  if (!controls) {
    console.warn("⚠️ Controls not initialized");
    return;
  }

  try {
    const lockPromise = document.body.requestPointerLock();

    if (lockPromise) {
      lockPromise
        .then(() => {
          console.log("✅ Pointer lock acquired");
        })
        .catch((error) => {
          console.warn("⚠️ Pointer lock failed:", error);
        });
    } else {
      console.log("✅ Pointer lock requested (legacy API)");
    }
  } catch (error) {
    console.warn("⚠️ Pointer lock request failed:", error);
  }
}

// =================== PAUSE MENU SETTINGS FUNCTIONS ===================

// Initialize pause menu settings and event listeners
function initializePauseMenuSettings() {
  // Load settings from localStorage
  loadPauseMenuSettings();

  // Setup event listeners for pause menu controls
  setupPauseMenuEventListeners();
}

// Load settings from localStorage
function loadPauseMenuSettings() {
  // Load voice chat settings
  const savedVoiceSettings = localStorage.getItem("voiceChatSettings");
  if (savedVoiceSettings) {
    const settings = JSON.parse(savedVoiceSettings);
    voiceChat.settings = { ...voiceChat.settings, ...settings };
  }

  // Load master volume
  const savedMasterVolume = localStorage.getItem("masterVolume");
  if (savedMasterVolume) {
    const pauseMasterVolume = document.getElementById("pauseMasterVolume");
    if (pauseMasterVolume) {
      pauseMasterVolume.value = savedMasterVolume;
    }
  }

  // Update pause menu UI elements
  updatePauseMenuUI();
}

// Update pause menu UI with current settings
function updatePauseMenuUI() {
  const pauseVoiceChatMode = document.getElementById("pauseVoiceChatMode");
  const pauseVoiceVolume = document.getElementById("pauseVoiceVolume");
  const pausePushToTalkKey = document.getElementById("pausePushToTalkKey");

  if (pauseVoiceChatMode) pauseVoiceChatMode.value = voiceChat.settings.mode;
  if (pauseVoiceVolume) pauseVoiceVolume.value = voiceChat.settings.voiceVolume;
  if (pausePushToTalkKey)
    pausePushToTalkKey.value = voiceChat.settings.pushToTalkKey;

  // Update volume displays
  const masterVolumeDisplay = document.getElementById("masterVolumeDisplay");
  const voiceVolumeDisplay = document.getElementById("voiceVolumeDisplay");
  const pauseMasterVolume = document.getElementById("pauseMasterVolume");

  if (masterVolumeDisplay && pauseMasterVolume) {
    masterVolumeDisplay.textContent = pauseMasterVolume.value + "%";
  }
  if (voiceVolumeDisplay) {
    voiceVolumeDisplay.textContent = voiceChat.settings.voiceVolume + "%";
  }
}

// Setup event listeners for pause menu controls
function setupPauseMenuEventListeners() {
  const pauseVoiceChatMode = document.getElementById("pauseVoiceChatMode");
  const pauseVoiceVolume = document.getElementById("pauseVoiceVolume");
  const pausePushToTalkKey = document.getElementById("pausePushToTalkKey");

  if (pauseVoiceChatMode) {
    pauseVoiceChatMode.addEventListener("change", (e) => {
      const newMode = e.target.value;
      const oldMode = voiceChat.settings.mode;

      voiceChat.settings.mode = newMode;
      saveVoiceChatSettings();

      // Apply the voice chat mode change
      if (newMode === "speech-to-text") {
        if (oldMode !== "speech-to-text") {
          initSpeechRecognition();
        }
        updateVoiceChatStatus("ready");
      } else if (newMode === "disabled") {
        disableVoiceChat();
      } else {
        updateVoiceChatStatus("ready");
      }

      console.log("Voice chat mode changed:", newMode);
    });
  }

  if (pauseVoiceVolume) {
    pauseVoiceVolume.addEventListener("input", (e) => {
      updateVoiceVolume(e.target.value);
      console.log("Voice volume changed:", e.target.value);
    });
  }

  if (pausePushToTalkKey) {
    pausePushToTalkKey.addEventListener("change", (e) => {
      voiceChat.settings.pushToTalkKey = e.target.value;
      saveVoiceChatSettings();
      updatePushToTalkDisplay();
      console.log("Push-to-talk key changed:", e.target.value);
    });
  }
}

// Voice volume control function
function updateVoiceVolume(value) {
  const volume = value / 100;
  voiceChat.settings.voiceVolume = parseInt(value);

  // Update all remote audio elements
  voiceChat.remoteAudios.forEach((audio) => {
    audio.volume = volume;
  });

  // Save settings
  saveVoiceChatSettings();

  // Update display
  const display = document.getElementById("voiceVolumeDisplay");
  if (display) display.textContent = value + "%";

  console.log("Voice volume:", volume);
}

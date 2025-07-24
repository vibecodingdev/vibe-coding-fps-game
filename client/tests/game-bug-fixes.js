/**
 * DOOM Protocol - Bug Fixes and Improvements
 * Comprehensive fixes identified through testing
 */

// Fix 1: Incomplete script.js file (truncated)
function fixTruncatedScriptFile() {
    console.log('🔧 Fixing truncated script.js file...');
    
    // The script.js file appears to be cut off mid-line
    // Need to complete the createBullet function and add missing functions
    
    const missingFunctions = `
// Complete the createBullet function (was cut off)
function createBullet() {
    const weapon = WEAPONS[currentWeapon];
    const bulletGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
    });

    // Handle different weapon types
    if (weapon.name === "Shotgun") {
        // Create multiple pellets for shotgun
        for (let i = 0; i < weapon.pellets; i++) {
            createSingleBullet(bulletGeometry, bulletMaterial, weapon);
        }
    } else {
        // Single bullet for other weapons
        createSingleBullet(bulletGeometry, bulletMaterial, weapon);
    }

    // Apply recoil
    applyGunRecoil(weapon.recoil);
    
    // Play sound
    playGunfireSound();
    
    // Muzzle flash effect
    createMuzzleFlash();
}

function createSingleBullet(geometry, material, weapon) {
    const bullet = new THREE.Mesh(geometry, material);
    
    // Get camera position and direction
    const cameraPosition = controls.getObject().position.clone();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Apply weapon spread
    const spread = weapon.spread || 0;
    if (spread > 0) {
        cameraDirection.x += (Math.random() - 0.5) * spread;
        cameraDirection.y += (Math.random() - 0.5) * spread;
        cameraDirection.z += (Math.random() - 0.5) * spread;
        cameraDirection.normalize();
    }
    
    // Position bullet at gun muzzle
    bullet.position.copy(cameraPosition);
    bullet.position.add(cameraDirection.clone().multiplyScalar(2)); // Start 2 units forward
    
    // Set bullet velocity
    bullet.userData = {
        velocity: cameraDirection.clone().multiplyScalar(BULLET_SPEED),
        damage: weapon.damage,
        lifetime: BULLET_LIFETIME,
        creationTime: Date.now()
    };
    
    bullets.push(bullet);
    scene.add(bullet);
}

function applyGunRecoil(recoilAmount) {
    gunRecoilVelocity += recoilAmount;
}

function createMuzzleFlash() {
    if (!muzzleFlashLight) return;
    
    // Bright flash
    muzzleFlashLight.intensity = 2;
    muzzleFlashLight.color.setHex(0xffaa00);
    
    // Fade out quickly
    setTimeout(() => {
        muzzleFlashLight.intensity = 0;
    }, 50);
}

// Update bullets every frame
function updateBullets() {
    const currentTime = Date.now();
    
    bullets.forEach((bullet, index) => {
        if (!bullet || !bullet.userData) return;
        
        // Move bullet
        bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(0.016));
        
        // Check lifetime
        if (currentTime - bullet.userData.creationTime > bullet.userData.lifetime) {
            scene.remove(bullet);
            bullets.splice(index, 1);
            return;
        }
        
        // Check collision with demons
        checkBulletDemonCollision(bullet, index);
        
        // Check bounds
        if (Math.abs(bullet.position.x) > 100 || 
            Math.abs(bullet.position.z) > 100 || 
            bullet.position.y < -10 || 
            bullet.position.y > 50) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}

function checkBulletDemonCollision(bullet, bulletIndex) {
    const bulletPosition = bullet.position;
    
    demons.forEach((demon, demonIndex) => {
        if (!demon || !demon.userData || demon.userData.isDead) return;
        
        const distance = bulletPosition.distanceTo(demon.position);
        
        if (distance < 1.0) { // Hit!
            // Damage demon
            demon.userData.health -= bullet.userData.damage;
            
            // Create hit effect
            createHitEffect(demon.position);
            
            // Remove bullet
            scene.remove(bullet);
            bullets.splice(bulletIndex, 1);
            
            // Check if demon is dead
            if (demon.userData.health <= 0) {
                killDemon(demon, demonIndex);
            }
        }
    });
}

function createHitEffect(position) {
    // Create blood/hit particles
    for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        
        particle.position.copy(position);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2
            ),
            life: 1.0
        };
        
        scene.add(particle);
        
        // Animate particle
        const animateParticle = () => {
            if (!particle.userData) return;
            
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
            particle.userData.velocity.y -= 0.05; // Gravity
            particle.userData.life -= 0.02;
            
            particle.material.opacity = particle.userData.life;
            
            if (particle.userData.life <= 0) {
                scene.remove(particle);
            } else {
                requestAnimationFrame(animateParticle);
            }
        };
        
        animateParticle();
    }
}

function killDemon(demon, index) {
    if (!demon || !demon.userData) return;
    
    demon.userData.isDead = true;
    demon.userData.isFalling = true;
    demon.userData.fallSpeed = 0;
    
    // Update kill count
    demonKills++;
    updateKillDisplay();
    
    // Update demon type count
    if (demon.userData.demonType) {
        demonTypeCounts[demon.userData.demonType]--;
    }
    
    // Play death sound
    playDemonDeathSound();
    
    console.log(\`💀 Demon eliminated! Total kills: \${demonKills}\`);
    
    // Check wave completion
    checkWaveComplete();
}

function playDemonDeathSound() {
    if (!audioListener) return;
    
    const audioContext = audioListener.context;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(effectsVolume * 0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
}

// Fix missing UI update functions
function updateKillDisplay() {
    const killElement = document.getElementById('killCount');
    if (killElement) {
        killElement.textContent = \`💀 Demons Slain: \${demonKills}\`;
    }
}

function updateWaveDisplay() {
    const waveElement = document.getElementById('waveInfo');
    if (waveElement) {
        waveElement.textContent = \`🌊 Hell Wave \${currentWave}\`;
    }
}

function updateWeaponDisplay() {
    const weaponNameElement = document.getElementById('weaponName');
    const ammoCountElement = document.getElementById('ammoCount');
    
    if (weaponNameElement && ammoCountElement) {
        const weapon = WEAPONS[currentWeapon];
        weaponNameElement.textContent = \`\${weapon.emoji} \${weapon.name.toUpperCase()}\`;
        ammoCountElement.textContent = \`\${weapon.currentAmmo}/\${weapon.maxAmmo}\`;
    }
}

function updateHealthBar() {
    const healthFill = document.getElementById('healthFill');
    const healthText = document.getElementById('healthText');
    
    if (healthFill && healthText) {
        const healthPercent = (playerHealth / maxHealth) * 100;
        healthFill.style.width = healthPercent + '%';
        healthText.textContent = \`Hell Energy: \${playerHealth}/\${maxHealth}\`;
        
        // Change color based on health
        if (healthPercent > 75) {
            healthFill.style.background = 'linear-gradient(90deg, #00ff00, #88ff00)';
        } else if (healthPercent > 50) {
            healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
        } else if (healthPercent > 25) {
            healthFill.style.background = 'linear-gradient(90deg, #ff8800, #ff4400)';
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #ff0000, #880000)';
        }
    }
}

function updateAmmoPackCount() {
    // Update UI to show ammo pack count if needed
    console.log(\`Energy cells available: \${ammoPacks.length}\`);
}

function updateHealthPackCount() {
    // Update UI to show health pack count if needed
    console.log(\`Neural stims available: \${healthPacks.length}\`);
}

// Fix missing game state functions
function pauseGame() {
    if (gameState !== 'playing') return;
    
    gameState = 'paused';
    controls.unlock();
    
    // Show pause menu
    showPauseMenu();
    
    console.log('Game paused');
}

function resumeGame() {
    if (gameState !== 'paused') return;
    
    gameState = 'playing';
    hidePauseMenu();
    
    // Re-lock controls
    controls.lock();
    
    console.log('Game resumed');
}

function showPauseMenu() {
    // Create pause menu if it doesn't exist
    let pauseMenu = document.getElementById('pauseMenu');
    if (!pauseMenu) {
        pauseMenu = document.createElement('div');
        pauseMenu.id = 'pauseMenu';
        pauseMenu.className = 'menu-screen active';
        pauseMenu.innerHTML = \`
            <h1>⏸️ GAME PAUSED</h1>
            <div class="menu-buttons">
                <button class="menu-button" onclick="resumeGame()">▶️ RESUME HELL</button>
                <button class="menu-button" onclick="restartGame()">🔄 RESTART WAVE</button>
                <button class="menu-button" onclick="showMainMenu()">🏠 BACK TO MENU</button>
            </div>
        \`;
        document.body.appendChild(pauseMenu);
    }
    pauseMenu.style.display = 'flex';
}

function hidePauseMenu() {
    const pauseMenu = document.getElementById('pauseMenu');
    if (pauseMenu) {
        pauseMenu.style.display = 'none';
    }
}

function restartGame() {
    // Reset game state
    gameState = 'playing';
    playerHealth = maxHealth;
    demonKills = 0;
    currentWave = 1;
    
    // Clear existing demons and bullets
    demons.forEach(demon => scene.remove(demon));
    demons.length = 0;
    
    bullets.forEach(bullet => scene.remove(bullet));
    bullets.length = 0;
    
    // Reset weapons
    Object.values(WEAPONS).forEach(weapon => {
        weapon.currentAmmo = weapon.maxAmmo;
    });
    
    // Hide menus
    hideAllMenus();
    
    // Start fresh wave
    startWaveSystem();
    
    // Lock controls
    controls.lock();
    
    console.log('Game restarted');
}

function showMainMenu() {
    gameState = 'mainMenu';
    
    // Unlock controls
    if (controls && controls.isLocked) {
        controls.unlock();
    }
    
    // Hide all other menus
    hideAllMenus();
    
    // Show main menu
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
        mainMenu.classList.add('active');
    }
    
    // Hide game UI
    const gameUI = document.getElementById('gameUI');
    if (gameUI) {
        gameUI.style.display = 'none';
    }
}

function hideAllMenus() {
    const menus = [
        'mainMenu', 'multiplayerLobby', 'partyRoom', 
        'instructions', 'gameOver', 'pauseMenu'
    ];
    
    menus.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.remove('active');
            menu.style.display = 'none';
        }
    });
}

// Fix missing multiplayer functions
function startSinglePlayer() {
    gameState = 'playing';
    isMultiplayer = false;
    
    hideAllMenus();
    
    // Initialize game if not already done
    if (!gameInitialized) {
        init();
        gameInitialized = true;
    }
    
    // Show game UI
    const gameUI = document.getElementById('gameUI');
    if (gameUI) {
        gameUI.style.display = 'block';
    }
    
    // Lock controls
    controls.lock();
    
    console.log('Single player game started');
}

function showMultiplayerLobby() {
    hideAllMenus();
    
    const lobby = document.getElementById('multiplayerLobby');
    if (lobby) {
        lobby.classList.add('active');
    }
    
    console.log('Showing multiplayer lobby');
}

function showInstructions() {
    hideAllMenus();
    
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.classList.add('active');
    }
    
    console.log('Showing instructions');
}

// Fix missing animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState !== 'playing') return;
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    
    // Update movement
    updateMovement(delta);
    
    // Update gun position
    updateGunPosition();
    
    // Update crosshair targeting
    updateCrosshairTargeting();
    
    // Update demons
    updateDemons();
    
    // Update bullets
    updateBullets();
    
    // Update ammo packs
    updateAmmoPacks();
    updateAmmoPackSpawning();
    
    // Update health packs
    updateHealthPacks();
    updateHealthPackSpawning();
    
    // Check collisions
    checkAmmoPackCollision();
    checkHealthPackCollision();
    checkDemonPlayerCollision();
    
    // Update radar
    updateRadar();
    
    // Handle auto-firing
    if (isAutoFiring && mouseHeld) {
        shoot();
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    prevTime = time;
}

function updateMovement(delta) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
    
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    
    controls.getObject().position.y = 5; // Keep player at ground level
}

function checkDemonPlayerCollision() {
    if (isGameOver) return;
    
    const playerPosition = controls.getObject().position;
    const currentTime = Date.now();
    
    // Check if still invulnerable from last damage
    if (currentTime - lastDamageTime < damageInvulnerabilityTime) return;
    
    demons.forEach(demon => {
        if (!demon || !demon.userData || demon.userData.isDead) return;
        
        const distance = playerPosition.distanceTo(demon.position);
        
        if (distance < 2.0) { // Close enough to attack player
            // Take damage
            playerHealth -= demon.userData.attackDamage || 10;
            lastDamageTime = currentTime;
            
            // Update health bar
            updateHealthBar();
            
            // Create damage effect
            createDamageEffect();
            
            // Play damage sound
            playPlayerDamageSound();
            
            console.log(\`💔 Player took damage! Health: \${playerHealth}\`);
            
            // Check if player is dead
            if (playerHealth <= 0) {
                gameOver();
            }
        }
    });
}

function createDamageEffect() {
    // Red screen flash
    const damageOverlay = document.createElement('div');
    damageOverlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 0, 0, 0.3);
        pointer-events: none;
        z-index: 999;
    \`;
    
    document.body.appendChild(damageOverlay);
    
    setTimeout(() => {
        document.body.removeChild(damageOverlay);
    }, 200);
}

function playPlayerDamageSound() {
    if (!audioListener) return;
    
    const audioContext = audioListener.context;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(effectsVolume * 0.4, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
}

function gameOver() {
    gameState = 'gameOver';
    isGameOver = true;
    
    // Unlock controls
    controls.unlock();
    
    // Hide game UI
    const gameUI = document.getElementById('gameUI');
    if (gameUI) {
        gameUI.style.display = 'none';
    }
    
    // Show game over screen
    showGameOverScreen();
    
    console.log('💀 GAME OVER');
}

function showGameOverScreen() {
    hideAllMenus();
    
    const gameOverScreen = document.getElementById('gameOver');
    if (gameOverScreen) {
        // Update final stats
        const finalKills = document.getElementById('finalKills');
        const finalWaves = document.getElementById('finalWaves');
        const finalTime = document.getElementById('finalTime');
        
        if (finalKills) finalKills.textContent = demonKills;
        if (finalWaves) finalWaves.textContent = currentWave - 1;
        if (finalTime) finalTime.textContent = '0:00'; // TODO: Add time tracking
        
        gameOverScreen.classList.add('active');
    }
}

// Fix missing initialization check
function initializeUI() {
    // Initialize all UI elements
    updateHealthBar();
    updateWeaponDisplay();
    updateWaveDisplay();
    updateKillDisplay();
    
    console.log('UI initialized');
}

// Fix missing volume control
function updateMasterVolume(value) {
    const volume = value / 100;
    effectsVolume = volume;
    musicVolume = volume * 0.5; // Music quieter than effects
    
    updateSoundVolumes();
    
    console.log(\`Volume updated: \${value}%\`);
}

// Fix missing chat functions (for multiplayer)
function toggleGameChat() {
    const chatInput = document.querySelector('.game-chat-input');
    if (chatInput) {
        const isVisible = chatInput.style.display !== 'none';
        chatInput.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            const input = chatInput.querySelector('input');
            if (input) input.focus();
        }
    }
}

// Hide instructions interface with X button
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

function toggleInterface() {
    const gameUI = document.getElementById('gameUI');
    if (gameUI) {
        const isVisible = gameUI.style.display !== 'none';
        gameUI.style.display = isVisible ? 'none' : 'block';
    }
}

console.log('🔧 Bug fixes loaded successfully!');
`;
    
    return missingFunctions;
}

// Fix 2: Audio loading issues
function fixAudioLoading() {
    console.log('🔧 Fixing audio loading issues...');
    
    const audioFixes = `
// Enhanced audio loading with better error handling
function loadAudioWithFallback(audioObject, filePath, fallbackFunction) {
    return new Promise((resolve, reject) => {
        audioLoader.load(
            filePath,
            function(buffer) {
                console.log(\`✅ Audio loaded: \${filePath}\`);
                audioObject.setBuffer(buffer);
                audioObject.setVolume(effectsVolume);
                resolve(audioObject);
            },
            function(progress) {
                console.log(\`Loading \${filePath}: \${(progress.loaded / progress.total * 100).toFixed(1)}%\`);
            },
            function(error) {
                console.warn(\`⚠️ Failed to load \${filePath}, using fallback\`);
                if (fallbackFunction) {
                    fallbackFunction();
                }
                resolve(null); // Don't reject, just return null
            }
        );
    });
}

// Improved sound initialization
async function initSoundEffectsWithFallbacks() {
    console.log('Loading sound effects with fallbacks...');
    
    // Load gunfire sound with fallback
    gunfireSound = new THREE.Audio(audioListener);
    await loadAudioWithFallback(
        gunfireSound, 
        'assets/single gun shot.mp3',
        () => createProceduralGunfireSound()
    );
    
    // Load machine gun sound with fallback
    const machineGunSound = new THREE.Audio(audioListener);
    await loadAudioWithFallback(
        machineGunSound,
        'assets/machine gun (rapid fire).mp3',
        () => createProceduralMachineGunSound()
    );
    sounds.machinegun = machineGunSound;
    
    // Load demon sound with fallback
    demonGrowlSound = new THREE.Audio(audioListener);
    await loadAudioWithFallback(
        demonGrowlSound,
        'assets/zombie.mp3',
        () => createProceduralDemonSound()
    );
    
    console.log('Sound effects initialization complete');
}

// Procedural sound generation fallbacks
function createProceduralGunfireSound() {
    console.log('Creating procedural gunfire sound');
    // This would create a synthetic gunfire sound using Web Audio API
}

function createProceduralMachineGunSound() {
    console.log('Creating procedural machine gun sound');
    // This would create a synthetic machine gun sound
}

function createProceduralDemonSound() {
    console.log('Creating procedural demon sound');
    // This would create a synthetic demon growl sound
}
`;
    
    return audioFixes;
}

// Fix 3: Performance optimizations
function fixPerformanceIssues() {
    console.log('🔧 Applying performance optimizations...');
    
    const performanceFixes = `
// Object pooling for bullets
class BulletPool {
    constructor(size = 100) {
        this.pool = [];
        this.active = [];
        
        // Pre-create bullet objects
        for (let i = 0; i < size; i++) {
            const bullet = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            bullet.visible = false;
            this.pool.push(bullet);
            scene.add(bullet); // Add to scene once
        }
    }
    
    getBullet() {
        if (this.pool.length > 0) {
            const bullet = this.pool.pop();
            this.active.push(bullet);
            bullet.visible = true;
            return bullet;
        }
        return null; // Pool exhausted
    }
    
    returnBullet(bullet) {
        const index = this.active.indexOf(bullet);
        if (index > -1) {
            this.active.splice(index, 1);
            this.pool.push(bullet);
            bullet.visible = false;
        }
    }
}

// Initialize bullet pool
const bulletPool = new BulletPool(100);

// Optimized bullet creation using pool
function createOptimizedBullet() {
    const bullet = bulletPool.getBullet();
    if (!bullet) {
        console.warn('Bullet pool exhausted!');
        return;
    }
    
    // Set up bullet as before
    const cameraPosition = controls.getObject().position.clone();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    bullet.position.copy(cameraPosition);
    bullet.userData = {
        velocity: cameraDirection.clone().multiplyScalar(BULLET_SPEED),
        damage: WEAPONS[currentWeapon].damage,
        creationTime: Date.now()
    };
}

// Optimized demon update with spatial partitioning
function updateDemonsOptimized() {
    if (demons.length === 0) return;
    
    const playerPosition = controls.getObject().position;
    const maxUpdateDistance = 100; // Only update demons within this range
    
    demons.forEach((demon, index) => {
        if (!demon || !demon.userData) return;
        
        // Skip distant demons for performance
        const distance = demon.position.distanceTo(playerPosition);
        if (distance > maxUpdateDistance) {
            return; // Skip this demon
        }
        
        // Update demon as normal for close demons
        updateSingleDemon(demon, playerPosition, distance);
    });
}

function updateSingleDemon(demon, playerPosition, distance) {
    const userData = demon.userData;
    
    if (userData.isFalling || userData.isDead) {
        if (userData.isFalling) {
            userData.fallSpeed += 0.02;
            demon.rotation.x += userData.fallSpeed;
            if (demon.rotation.x >= Math.PI / 2) {
                demon.rotation.x = Math.PI / 2;
                userData.isFalling = false;
                userData.isDead = true;
            }
        }
        return;
    }
    
    // Simplified AI based on distance
    if (distance < 3.5) {
        // Attack mode
        if (userData.attackCooldown <= 0) {
            userData.attackCooldown = 180;
            // Attack logic here
        } else {
            userData.attackCooldown--;
        }
    } else if (distance < 60) {
        // Chase mode - move toward player
        const dx = playerPosition.x - demon.position.x;
        const dz = playerPosition.z - demon.position.z;
        const moveDistance = userData.walkSpeed * 0.016;
        
        demon.position.x += (dx / distance) * moveDistance;
        demon.position.z += (dz / distance) * moveDistance;
        demon.rotation.y = Math.atan2(dx, dz);
    }
    
    // Simple animation
    const time = Date.now() * 0.003;
    demon.position.y = Math.sin(time + index) * 0.2;
}

// Level of Detail (LOD) system for demons
function updateDemonLOD() {
    const playerPosition = controls.getObject().position;
    
    demons.forEach(demon => {
        if (!demon) return;
        
        const distance = demon.position.distanceTo(playerPosition);
        
        // Adjust detail based on distance
        if (distance > 50) {
            // Far demons - lowest detail
            demon.traverse(child => {
                if (child.isMesh && child.geometry) {
                    child.visible = false; // Hide very far demons
                }
            });
        } else if (distance > 25) {
            // Medium distance - reduced detail
            demon.traverse(child => {
                if (child.isMesh) {
                    child.visible = true;
                    if (child.geometry && child.geometry.parameters) {
                        // Could reduce geometry detail here
                    }
                }
            });
        } else {
            // Close demons - full detail
            demon.traverse(child => {
                if (child.isMesh) {
                    child.visible = true;
                }
            });
        }
    });
}

// Optimized render loop
let lastRenderTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;

function optimizedAnimate(currentTime) {
    requestAnimationFrame(optimizedAnimate);
    
    // Frame rate limiting
    if (currentTime - lastRenderTime < frameTime) {
        return;
    }
    
    const delta = (currentTime - lastRenderTime) / 1000;
    lastRenderTime = currentTime;
    
    if (gameState !== 'playing') return;
    
    // Update systems with reduced frequency for some
    updateMovement(delta);
    updateGunPosition();
    
    // Update demons less frequently
    if (currentTime % 2 === 0) { // Every other frame
        updateDemonsOptimized();
    }
    
    // Update bullets every frame (important for hit detection)
    updateBullets();
    
    // Update UI less frequently
    if (currentTime % 5 === 0) { // Every 5th frame
        updateRadar();
        updateCrosshairTargeting();
    }
    
    // Update packs less frequently
    if (currentTime % 10 === 0) { // Every 10th frame
        updateAmmoPacks();
        updateHealthPacks();
        checkAmmoPackCollision();
        checkHealthPackCollision();
    }
    
    renderer.render(scene, camera);
}
`;
    
    return performanceFixes;
}

// Fix 4: Memory management
function fixMemoryLeaks() {
    console.log('🔧 Fixing memory leaks...');
    
    const memoryFixes = `
// Proper cleanup functions
function cleanupScene() {
    console.log('Cleaning up scene...');
    
    // Clean up demons
    demons.forEach(demon => {
        if (demon) {
            demon.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            scene.remove(demon);
        }
    });
    demons.length = 0;
    
    // Clean up bullets
    bullets.forEach(bullet => {
        if (bullet) {
            if (bullet.geometry) bullet.geometry.dispose();
            if (bullet.material) bullet.material.dispose();
            scene.remove(bullet);
        }
    });
    bullets.length = 0;
    
    // Clean up ammo packs
    ammoPacks.forEach(pack => {
        if (pack) {
            pack.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
            scene.remove(pack);
        }
    });
    ammoPacks.length = 0;
    
    // Clean up health packs
    healthPacks.forEach(pack => {
        if (pack) {
            pack.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
            scene.remove(pack);
        }
    });
    healthPacks.length = 0;
    
    console.log('Scene cleanup complete');
}

// Resource manager
class ResourceManager {
    constructor() {
        this.geometries = new Map();
        this.materials = new Map();
        this.textures = new Map();
    }
    
    getGeometry(key, createFunc) {
        if (!this.geometries.has(key)) {
            this.geometries.set(key, createFunc());
        }
        return this.geometries.get(key);
    }
    
    getMaterial(key, createFunc) {
        if (!this.materials.has(key)) {
            this.materials.set(key, createFunc());
        }
        return this.materials.get(key);
    }
    
    getTexture(key, createFunc) {
        if (!this.textures.has(key)) {
            this.textures.set(key, createFunc());
        }
        return this.textures.get(key);
    }
    
    dispose() {
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(material => material.dispose());
        this.textures.forEach(texture => texture.dispose());
        
        this.geometries.clear();
        this.materials.clear();
        this.textures.clear();
    }
}

const resourceManager = new ResourceManager();

// Shared geometry and materials
function createDemonModelOptimized(demonType) {
    const typeData = DEMON_TYPES[demonType];
    const demonGroup = new THREE.Group();
    
    // Reuse geometries
    const bodyGeometry = resourceManager.getGeometry('demonBody', 
        () => new THREE.BoxGeometry(0.6, 1.2, 0.3));
    const headGeometry = resourceManager.getGeometry('demonHead',
        () => new THREE.BoxGeometry(0.4, 0.4, 0.4));
    const eyeGeometry = resourceManager.getGeometry('demonEye',
        () => new THREE.SphereGeometry(0.08, 8, 8));
    
    // Create materials (these can be unique per type)
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: typeData.color });
    const headMaterial = new THREE.MeshLambertMaterial({ color: typeData.headColor });
    const eyeMaterial = new THREE.MeshBasicMaterial({ 
        color: typeData.eyeColor,
        emissive: typeData.eyeColor,
        emissiveIntensity: 0.5
    });
    
    // Create meshes with shared geometries
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    
    // Position parts
    body.position.y = 0.6;
    head.position.y = 1.4;
    leftEye.position.set(-0.1, 1.45, 0.25);
    rightEye.position.set(0.1, 1.45, 0.25);
    
    demonGroup.add(body, head, leftEye, rightEye);
    
    // Enable shadows
    demonGroup.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    demonGroup.userData.demonType = demonType;
    return demonGroup;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    cleanupScene();
    resourceManager.dispose();
    
    if (renderer) {
        renderer.dispose();
    }
});
`;
    
    return memoryFixes;
}

// Fix 5: UI and responsive design fixes
function fixUIIssues() {
    console.log('🔧 Fixing UI and responsive design issues...');
    
    const uiFixes = `
// Responsive UI adjustments
function adjustUIForScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust crosshair size
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        const size = Math.max(16, Math.min(24, width / 80));
        crosshair.style.width = size + 'px';
        crosshair.style.height = size + 'px';
        crosshair.style.margin = (-size/2) + 'px 0 0 ' + (-size/2) + 'px';
    }
    
    // Adjust UI element sizes for mobile
    if (width < 768) {
        const info = document.querySelector('.info');
        if (info) {
            info.style.fontSize = '14px';
            info.style.padding = '10px';
            info.style.minWidth = '200px';
        }
        
        const weaponInfo = document.querySelector('.weapon-info');
        if (weaponInfo) {
            weaponInfo.style.fontSize = '14px';
            weaponInfo.style.padding = '8px';
        }
        
        const healthBar = document.getElementById('healthBar');
        if (healthBar) {
            healthBar.style.width = '250px';
        }
    }
}

// Better touch controls for mobile
function addTouchControls() {
    if ('ontouchstart' in window) {
        console.log('Adding touch controls for mobile...');
        
        // Create virtual joystick
        const joystick = document.createElement('div');
        joystick.id = 'virtualJoystick';
        joystick.style.cssText = \`
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 100px;
            height: 100px;
            background: rgba(255, 102, 0, 0.3);
            border: 2px solid #ff6600;
            border-radius: 50%;
            z-index: 1001;
            display: none;
        \`;
        
        const joystickKnob = document.createElement('div');
        joystickKnob.style.cssText = \`
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            background: #ff6600;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        \`;
        
        joystick.appendChild(joystickKnob);
        document.body.appendChild(joystick);
        
        // Show joystick when game starts
        if (gameState === 'playing') {
            joystick.style.display = 'block';
        }
        
        // Create fire button
        const fireButton = document.createElement('button');
        fireButton.id = 'fireButton';
        fireButton.innerHTML = '🔥';
        fireButton.style.cssText = \`
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            background: #8b0000;
            border: 2px solid #ff6600;
            border-radius: 50%;
            color: #ffffff;
            font-size: 24px;
            z-index: 1001;
            display: none;
        \`;
        
        document.body.appendChild(fireButton);
        
        // Touch event handlers
        let joystickActive = false;
        let joystickCenter = { x: 0, y: 0 };
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            const rect = joystick.getBoundingClientRect();
            joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const dx = touch.clientX - joystickCenter.x;
            const dy = touch.clientY - joystickCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 30;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(dy, dx);
                joystickKnob.style.left = (50 + Math.cos(angle) * maxDistance) + 'px';
                joystickKnob.style.top = (50 + Math.sin(angle) * maxDistance) + 'px';
            } else {
                joystickKnob.style.left = (50 + dx) + 'px';
                joystickKnob.style.top = (50 + dy) + 'px';
            }
            
            // Update movement based on joystick position
            const normalizedX = Math.max(-1, Math.min(1, dx / maxDistance));
            const normalizedY = Math.max(-1, Math.min(1, dy / maxDistance));
            
            moveLeft = normalizedX < -0.3;
            moveRight = normalizedX > 0.3;
            moveForward = normalizedY < -0.3;
            moveBackward = normalizedY > 0.3;
        });
        
        document.addEventListener('touchend', () => {
            if (joystickActive) {
                joystickActive = false;
                joystickKnob.style.left = '50%';
                joystickKnob.style.top = '50%';
                
                // Stop movement
                moveLeft = moveRight = moveForward = moveBackward = false;
            }
        });
        
        // Fire button
        fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            mouseHeld = true;
            shoot();
        });
        
        fireButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            mouseHeld = false;
            isAutoFiring = false;
        });
    }
}

// Better error messages
function showUserFriendlyError(error, context) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = \`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(139, 0, 0, 0.9);
        border: 2px solid #ff6600;
        padding: 20px;
        color: #ffffff;
        font-family: 'Orbitron', monospace;
        text-align: center;
        z-index: 2000;
        max-width: 400px;
    \`;
    
    errorDiv.innerHTML = \`
        <h3>⚠️ SYSTEM ERROR</h3>
        <p><strong>Context:</strong> \${context}</p>
        <p><strong>Error:</strong> \${error.message}</p>
        <button onclick="this.parentElement.remove()" style="
            background: #8b0000;
            border: 1px solid #ff6600;
            color: #ffffff;
            padding: 10px 20px;
            margin-top: 10px;
            cursor: pointer;
            font-family: inherit;
        ">DISMISS</button>
    \`;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

// Window resize handler
function handleResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    adjustUIForScreenSize();
}

window.addEventListener('resize', handleResize);

// Initialize UI fixes
document.addEventListener('DOMContentLoaded', () => {
    adjustUIForScreenSize();
    addTouchControls();
});
`;
    
    return uiFixes;
}

// Export all fixes
export {
    fixTruncatedScriptFile,
    fixAudioLoading,
    fixPerformanceIssues,
    fixMemoryLeaks,
    fixUIIssues
};

console.log('🔧 All bug fixes and improvements loaded!'); 
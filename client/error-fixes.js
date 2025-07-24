// Automatic Error Fixes for FPS Game
// This file contains fixes for common errors found in the game

console.log("🔧 Loading automatic error fixes...");

// Fix 1: Ensure all required functions exist
function ensureFunction(name, defaultImpl) {
  if (typeof window[name] !== "function") {
    console.warn(
      `⚠️  Function ${name} not found, creating default implementation`
    );
    window[name] = defaultImpl;
  }
}

// Fix 2: Ensure all required variables exist
function ensureVariable(name, defaultValue) {
  if (typeof window[name] === "undefined") {
    console.warn(`⚠️  Variable ${name} not found, creating with default value`);
    window[name] = defaultValue;
  }
}

// Fix 3: Ensure DOM elements exist
function ensureDOMElement(id, tagName = "div", parentId = "body") {
  let element = document.getElementById(id);
  if (!element) {
    console.warn(`⚠️  DOM element ${id} not found, creating it`);
    element = document.createElement(tagName);
    element.id = id;

    const parent =
      parentId === "body" ? document.body : document.getElementById(parentId);
    if (parent) {
      parent.appendChild(element);
    }
  }
  return element;
}

// Apply fixes when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Applying automatic error fixes...");

  // Ensure critical DOM elements exist
  ensureDOMElement("gameUI");
  ensureDOMElement("mainMenu");
  ensureDOMElement("healthBar");
  ensureDOMElement("weaponInfo");
  ensureDOMElement("crosshair");
  ensureDOMElement("radarCanvas", "canvas");
  ensureDOMElement("gameOver");
  ensureDOMElement("blocker");
  ensureDOMElement("instructions");

  // Ensure critical variables exist
  ensureVariable("gameState", "mainMenu");
  ensureVariable("gameInitialized", false);
  ensureVariable("isMultiplayer", false);
  ensureVariable("demons", []);
  ensureVariable("bullets", []);
  ensureVariable("currentWeapon", "shotgun");
  ensureVariable("playerHealth", 100);
  ensureVariable("maxHealth", 100);
  ensureVariable("currentWave", 1);
  ensureVariable("demonKills", 0);
  ensureVariable("moveForward", false);
  ensureVariable("moveBackward", false);
  ensureVariable("moveLeft", false);
  ensureVariable("moveRight", false);
  ensureVariable("isAutoFiring", false);
  ensureVariable("mouseHeld", false);
  ensureVariable("lastShotTime", 0);
  ensureVariable("isAimingAtZombie", false);
  ensureVariable("radarCanvas", null);
  ensureVariable("radarContext", null);

  // Ensure weapon configuration exists
  if (typeof WEAPONS === "undefined") {
    console.warn("⚠️  WEAPONS configuration not found, creating default");
    window.WEAPONS = {
      shotgun: {
        name: "Shotgun",
        fireRate: 800,
        damage: 7,
        pellets: 8,
        recoil: 0.6,
        emoji: "🔫",
        maxAmmo: 50,
        currentAmmo: 50,
        spread: 0.3,
      },
      chaingun: {
        name: "Chaingun",
        fireRate: 100,
        damage: 1,
        recoil: 0.2,
        emoji: "⚡",
        maxAmmo: 200,
        currentAmmo: 200,
        spread: 0.1,
      },
    };
  }

  // Ensure Three.js objects exist
  if (typeof THREE !== "undefined") {
    ensureVariable("scene", new THREE.Scene());
    ensureVariable(
      "camera",
      new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
    );

    if (!window.renderer) {
      console.warn("⚠️  Renderer not found, creating default");
      window.renderer = new THREE.WebGLRenderer({ antialias: true });
      window.renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(window.renderer.domElement);
    }

    ensureVariable("velocity", new THREE.Vector3());
    ensureVariable("direction", new THREE.Vector3());
    ensureVariable("raycaster", new THREE.Raycaster());
  }

  // Ensure critical functions exist
  ensureFunction("init", function () {
    console.log("🎮 Default init function called");
    if (typeof THREE !== "undefined" && !window.scene) {
      window.scene = new THREE.Scene();
    }
  });

  ensureFunction("animate", function () {
    requestAnimationFrame(window.animate);
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
  });

  ensureFunction("startGame", function () {
    console.log("🎮 Default startGame function called");
    window.gameState = "playing";
    if (typeof init === "function") {
      init();
    }
  });

  ensureFunction("pauseGame", function () {
    console.log("⏸️ Default pauseGame function called");
    window.gameState = "paused";
  });

  ensureFunction("resumeGame", function () {
    console.log("▶️ Default resumeGame function called");
    window.gameState = "playing";
  });

  ensureFunction("showMainMenu", function () {
    console.log("🏠 Default showMainMenu function called");
    window.gameState = "mainMenu";
    const mainMenu = document.getElementById("mainMenu");
    if (mainMenu) {
      mainMenu.style.display = "block";
    }
  });

  ensureFunction("hideAllMenus", function () {
    console.log("👻 Default hideAllMenus function called");
    const menus = ["mainMenu", "gameOver", "instructions"];
    menus.forEach((menuId) => {
      const menu = document.getElementById(menuId);
      if (menu) {
        menu.style.display = "none";
      }
    });
  });

  ensureFunction("updateHealthBar", function () {
    const healthBar = document.getElementById("healthFill");
    const healthText = document.getElementById("healthText");
    if (
      healthBar &&
      typeof playerHealth !== "undefined" &&
      typeof maxHealth !== "undefined"
    ) {
      const percentage = (playerHealth / maxHealth) * 100;
      healthBar.style.width = percentage + "%";
    }
    if (
      healthText &&
      typeof playerHealth !== "undefined" &&
      typeof maxHealth !== "undefined"
    ) {
      healthText.textContent = `Health: ${playerHealth}/${maxHealth}`;
    }
  });

  ensureFunction("updateWeaponDisplay", function () {
    const weaponNameElement = document.getElementById("weaponName");
    const ammoCountElement = document.getElementById("ammoCount");

    if (
      weaponNameElement &&
      ammoCountElement &&
      typeof currentWeapon !== "undefined" &&
      typeof WEAPONS !== "undefined"
    ) {
      const weapon = WEAPONS[currentWeapon];
      if (weapon) {
        weaponNameElement.textContent = `${weapon.emoji || "🔫"} ${
          weapon.name
        }`;

        if (weapon.maxAmmo < 500) {
          ammoCountElement.textContent = `${weapon.currentAmmo || 0}/${
            weapon.maxAmmo
          }`;
        } else {
          ammoCountElement.textContent = "∞";
        }
      }
    }
  });

  ensureFunction("updateKillCount", function () {
    const killCountElement = document.getElementById("killCount");
    if (killCountElement && typeof demonKills !== "undefined") {
      killCountElement.textContent = `Kills: ${demonKills}`;
    }
  });

  ensureFunction("initializeUI", function () {
    console.log("🖥️ Default initializeUI function called");
    if (typeof updateHealthBar === "function") updateHealthBar();
    if (typeof updateWeaponDisplay === "function") updateWeaponDisplay();
    if (typeof updateKillCount === "function") updateKillCount();
  });

  ensureFunction("shoot", function () {
    console.log("🔫 Default shoot function called");
    // Basic shooting logic
    if (typeof createBullet === "function") {
      createBullet();
    }
  });

  ensureFunction("createBullet", function () {
    console.log("💥 Default createBullet function called");
    // Basic bullet creation
    if (typeof THREE !== "undefined" && window.scene && window.camera) {
      const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

      bullet.position.copy(window.camera.position);
      window.scene.add(bullet);

      if (!window.bullets) window.bullets = [];
      window.bullets.push(bullet);
    }
  });

  ensureFunction("updateBullets", function () {
    if (window.bullets && window.scene) {
      window.bullets.forEach((bullet, index) => {
        bullet.position.z -= 0.5; // Move bullet forward

        // Remove bullet if too far
        if (bullet.position.z < -100) {
          window.scene.remove(bullet);
          window.bullets.splice(index, 1);
        }
      });
    }
  });

  ensureFunction("initControls", function () {
    console.log("🎮 Default initControls function called");

    // Basic keyboard controls
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          window.moveForward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          window.moveBackward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          window.moveLeft = true;
          break;
        case "KeyD":
        case "ArrowRight":
          window.moveRight = true;
          break;
        case "Escape":
          if (typeof pauseGame === "function") pauseGame();
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          window.moveForward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          window.moveBackward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          window.moveLeft = false;
          break;
        case "KeyD":
        case "ArrowRight":
          window.moveRight = false;
          break;
      }
    });

    // Mouse controls
    document.addEventListener("click", () => {
      if (window.gameState === "playing" && typeof shoot === "function") {
        shoot();
      }
    });
  });

  ensureFunction("initAudio", function () {
    console.log("🔊 Default initAudio function called");
    // Basic audio initialization
    if (typeof THREE !== "undefined" && window.camera) {
      window.audioListener = new THREE.AudioListener();
      window.camera.add(window.audioListener);
    }
  });

  ensureFunction("playGunfireSound", function () {
    console.log("🔫 Gunfire sound played (default)");
  });

  ensureFunction("playDemonGrowlSound", function () {
    console.log("👹 Demon growl sound played (default)");
  });

  ensureFunction("playDemonAttackSound", function () {
    console.log("💀 Demon attack sound played (default)");
  });

  ensureFunction("updateSoundVolumes", function () {
    console.log("🔊 Sound volumes updated (default)");
  });

  ensureFunction("spawnDemons", function () {
    console.log("👹 Default spawnDemons function called");
    // Basic demon spawning
    if (!window.demons) window.demons = [];
  });

  ensureFunction("updateDemons", function () {
    // Basic demon update logic
    if (window.demons) {
      window.demons.forEach((demon) => {
        // Basic AI: move towards player
        if (demon && demon.position && window.camera) {
          const direction = new THREE.Vector3()
            .subVectors(window.camera.position, demon.position)
            .normalize();
          demon.position.add(direction.multiplyScalar(0.01));
        }
      });
    }
  });

  ensureFunction("createGun", function () {
    console.log("🔫 Default createGun function called");
    if (typeof THREE !== "undefined") {
      const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
      const gunMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
      window.gun = new THREE.Mesh(gunGeometry, gunMaterial);

      if (window.camera) {
        window.camera.add(window.gun);
        window.gun.position.set(0.3, -0.3, -0.5);
      }
    }
  });

  ensureFunction("createMachineGun", function () {
    console.log("⚡ Default createMachineGun function called");
    if (typeof THREE !== "undefined") {
      const gunGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.7);
      const gunMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
      window.machineGun = new THREE.Mesh(gunGeometry, gunMaterial);

      if (window.camera) {
        window.camera.add(window.machineGun);
        window.machineGun.position.set(0.3, -0.3, -0.5);
        window.machineGun.visible = false;
      }
    }
  });

  ensureFunction("switchWeapon", function () {
    console.log("🔄 Default switchWeapon function called");
    if (window.currentWeapon === "shotgun") {
      window.currentWeapon = "chaingun";
      if (window.gun) window.gun.visible = false;
      if (window.machineGun) window.machineGun.visible = true;
    } else {
      window.currentWeapon = "shotgun";
      if (window.gun) window.gun.visible = true;
      if (window.machineGun) window.machineGun.visible = false;
    }

    if (typeof updateWeaponDisplay === "function") {
      updateWeaponDisplay();
    }
  });

  ensureFunction("initRadar", function () {
    console.log("📡 Default initRadar function called");
    const radarCanvas = document.getElementById("radarCanvas");
    if (radarCanvas) {
      window.radarContext = radarCanvas.getContext("2d");
    }
  });

  ensureFunction("updateRadar", function () {
    if (window.radarContext) {
      const canvas = window.radarContext.canvas;
      window.radarContext.clearRect(0, 0, canvas.width, canvas.height);

      // Draw simple radar circle
      window.radarContext.strokeStyle = "#0f0";
      window.radarContext.beginPath();
      window.radarContext.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2 - 5,
        0,
        2 * Math.PI
      );
      window.radarContext.stroke();

      // Draw player dot
      window.radarContext.fillStyle = "#0f0";
      window.radarContext.beginPath();
      window.radarContext.arc(
        canvas.width / 2,
        canvas.height / 2,
        3,
        0,
        2 * Math.PI
      );
      window.radarContext.fill();
    }
  });

  // Networking functions (basic stubs)
  ensureFunction("initializeNetworking", function () {
    console.log(
      "🌐 Default initializeNetworking function called (multiplayer disabled)"
    );
  });

  ensureFunction("createRoom", function () {
    console.log("🏰 Default createRoom function called (multiplayer disabled)");
  });

  ensureFunction("joinRoom", function () {
    console.log("🚪 Default joinRoom function called (multiplayer disabled)");
  });

  ensureFunction("leaveRoom", function () {
    console.log("🚪 Default leaveRoom function called (multiplayer disabled)");
  });

  ensureFunction("sendChatMessage", function () {
    console.log(
      "💬 Default sendChatMessage function called (multiplayer disabled)"
    );
  });

  ensureFunction("updateConnectionStatus", function (status) {
    console.log(`🌐 Connection status: ${status}`);
  });

  console.log("✅ Automatic error fixes applied successfully!");
});

// Global error handler
window.addEventListener("error", (event) => {
  console.error("🚨 Global Error Caught:", event.error.message);
  console.error("Stack:", event.error.stack);

  // Try to prevent game crash
  event.preventDefault();
  return true;
});

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("🚨 Unhandled Promise Rejection:", event.reason);

  // Try to prevent game crash
  event.preventDefault();
  return true;
});

console.log("🛡️ Error protection system loaded");

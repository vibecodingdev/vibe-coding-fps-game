import "./styles/main.css";
import { Game } from "./core/Game";
import { NetworkManager } from "./systems/NetworkManager";

console.log("🔥 DOOM PROTOCOL - TypeScript Client Starting 🔥");

// Global network manager instance for UI access
declare global {
  interface Window {
    networkManager: NetworkManager;
    game: Game;
  }
}

async function initializeGame(): Promise<void> {
  try {
    const game = Game.getInstance();
    const networkManager = new NetworkManager();

    // Make instances globally accessible
    window.game = game;
    window.networkManager = networkManager;

    await game.initialize();
    await networkManager.initialize();

    // Setup basic network callbacks
    setupBasicNetworkCallbacks(networkManager);

    // Setup UI event listeners
    setupUIEventListeners(game, networkManager);

    console.log("🎮 Game and Network systems ready!");
    showMainMenu();
  } catch (error) {
    console.error("Failed to initialize game:", error);
    showErrorMessage("Failed to initialize game. Please refresh the page.");
  }
}

function setupBasicNetworkCallbacks(networkManager: NetworkManager): void {
  // Connection status updates
  networkManager.setOnConnectionStatusUpdate((status: string) => {
    const connectionStatus = document.getElementById("connectionStatus");
    if (connectionStatus) {
      connectionStatus.textContent = status;

      // Update styling based on status
      if (status.includes("🟢")) {
        connectionStatus.style.borderColor = "#00ff00";
        connectionStatus.style.color = "#00ff00";
      } else if (status.includes("🔴")) {
        connectionStatus.style.borderColor = "#ff0000";
        connectionStatus.style.color = "#ff0000";
      } else if (status.includes("🔄")) {
        connectionStatus.style.borderColor = "#ffaa00";
        connectionStatus.style.color = "#ffaa00";
      }
    }
  });

  // Room list updates
  networkManager.setOnRoomListUpdate((rooms: any[]) => {
    updateRoomsList(rooms);
  });

  // Party members updates
  networkManager.setOnPartyMembersUpdate((members: any[]) => {
    updatePartyMembers(members, networkManager);
  });

  // Chat messages
  networkManager.setOnChatMessage(
    (type: string, message: string, sender?: string) => {
      addChatMessage(type as any, message, sender);
    }
  );

  // Game start
  networkManager.setOnGameStart((gameData: any) => {
    console.log("🎮 Starting multiplayer game:", gameData);
    startMultiplayerGame(gameData, networkManager);
  });

  // Player position updates
  networkManager.setOnPlayerPosition((data: any) => {
    networkManager.updateRemotePlayerPosition(data);
  });

  // Demon synchronization with full original logic
  networkManager.setOnDemonSpawn((data: any) => {
    const game = window.game;
    const scene = game.getScene();
    if (scene) {
      const demon = networkManager.handleServerDemonSpawn(
        data,
        (demonData: any) => {
          return game.createDemonModel(demonData.type);
        }
      );
      if (demon) {
        scene.add(demon);
        game.addDemon(demon);
        console.log(`👹 Added server demon to scene: ${data.demon.id}`);
      }
    }
  });

  networkManager.setOnDemonDeath((data: any) => {
    const game = window.game;
    const scene = game.getScene();
    if (scene) {
      const demons = game.getDemons();
      networkManager.handleServerDemonDeath(
        data,
        demons,
        scene,
        (position: any) => {
          // Create death effects
          game.createHitEffect(position);
          game.createWoundedEffect(position);
        },
        () => {
          // Update kill count
          game.incrementKillCount();
        }
      );
    }
  });

  networkManager.setOnDemonUpdate((data: any) => {
    const game = window.game;
    const demons = game.getDemons();
    networkManager.handleServerDemonUpdate(data, demons);
  });

  networkManager.setOnWaveStart((data: any) => {
    const game = window.game;
    networkManager.handleServerWaveStart(data, (waveData: any) => {
      // Clear existing demons
      game.clearDemons();

      // Start new wave
      game.startWave(waveData.wave, waveData.demonsCount);

      console.log(
        `🌊 Started wave ${waveData.wave} with ${waveData.demonsCount} demons`
      );
    });
  });

  networkManager.setOnWaveComplete((data: any) => {
    const game = window.game;
    networkManager.handleServerWaveComplete(data, (waveData: any) => {
      game.completeWave(waveData.wave);
      console.log(`✅ Completed wave ${waveData.wave}`);
    });
  });
}

function updateRoomsList(rooms: any[]): void {
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
    <div class="room-item" onclick="window.networkManager?.joinRoom('${
      room.id
    }')">
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

function updatePartyMembers(
  members: any[],
  networkManager: NetworkManager
): void {
  const partyMembers = document.getElementById("partyMembers");
  if (!partyMembers) return;

  partyMembers.innerHTML = members
    .map(
      (member) => `
    <div class="party-member ${member.isLeader ? "leader" : ""} ${
        member.ready ? "ready" : ""
      }">
      <div class="member-info">
        <div class="member-name">
          ${member.isLeader ? "👑" : "👹"} ${member.name}
        </div>
        <div class="member-status">
          ${member.isLeader ? "Chamber Leader" : "Demon"}
          ${member.ready ? " • Ready" : " • Not Ready"}
        </div>
      </div>
      <div class="member-ready-status">
        ${member.ready ? "✅" : "⏳"}
      </div>
    </div>
  `
    )
    .join("");

  // Update room title if we have room info
  if (networkManager.currentRoom) {
    const roomTitle = document.getElementById("roomTitle");
    if (roomTitle) {
      roomTitle.textContent = `🔥 ${networkManager.currentRoom.name} 🔥`;
    }
  }

  // Update ready button state
  const readyButton = document.getElementById("readyButton");
  if (readyButton) {
    if (networkManager.isPlayerReady) {
      readyButton.textContent = "✅ READY";
      readyButton.classList.add("ready");
    } else {
      readyButton.textContent = "⏳ NOT READY";
      readyButton.classList.remove("ready");
    }
  }

  // Update start game button
  const allReady = members.every((m) => m.ready);
  const startButton = document.getElementById(
    "startGameButton"
  ) as HTMLButtonElement;
  if (startButton) {
    startButton.disabled = !allReady || !networkManager.isRoomLeader;
    if (!networkManager.isRoomLeader) {
      startButton.textContent = "🎮 WAITING FOR LEADER";
    } else if (!allReady) {
      startButton.textContent = "🎮 WAITING FOR PLAYERS";
    } else {
      startButton.textContent = "🎮 BEGIN HELLISH COMBAT";
    }
  }

  // Show party room
  hideAllMenus();
  const partyRoom = document.getElementById("partyRoom");
  if (partyRoom) {
    partyRoom.style.display = "block";
  }
}

function addChatMessage(
  type: "system" | "player" | "voice",
  message: string,
  sender?: string
): void {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}`;

  const timestamp = new Date().toLocaleTimeString();

  if (type === "system") {
    messageDiv.innerHTML = `<span style="color: #ffaa66; font-style: italic;">[${timestamp}] ${message}</span>`;
  } else if (type === "voice") {
    messageDiv.innerHTML = `<span style="color: #00ff00;">[${timestamp}] <span class="sender">${sender}:</span> ${message}</span>`;
  } else {
    messageDiv.innerHTML = `<span style="color: #ffffff;">[${timestamp}] <span class="sender">${sender}:</span> ${message}</span>`;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Limit chat history to prevent memory issues
  while (chatMessages.children.length > 100) {
    chatMessages.removeChild(chatMessages.firstChild!);
  }
}

function startMultiplayerGame(
  gameData: any,
  networkManager: NetworkManager
): void {
  // Hide all menus and show game UI
  hideAllMenus();
  const gameUI = document.getElementById("gameUI");
  if (gameUI) gameUI.style.display = "block";

  // Show room info during game
  if (networkManager.currentRoom) {
    showRoomInfo(networkManager.currentRoom.name);
  }

  // Enter fullscreen and start game
  requestFullscreen();
  window.game.setMultiplayerMode(true);
  window.game.startGame(true); // true for multiplayer

  // Initialize remote players with full 3D models
  const scene = window.game.getScene();
  if (scene && gameData.players) {
    console.log("🎮 Initializing remote players:", gameData.players.length);

    gameData.players.forEach((player: any) => {
      if (player.id !== networkManager.socket?.id) {
        console.log("👤 Creating remote player:", player.name);
        const remotePlayer = networkManager.createRemotePlayer(player, scene);
        if (remotePlayer) {
          console.log(`✅ Remote player ${player.name} added to scene`);
        }
      }
    });
  }

  // Start position synchronization with proper player data
  networkManager.startPositionSync(() => {
    const game = window.game;
    const position = game.getPlayerPosition();
    const rotation = game.getPlayerRotation();

    return {
      position: position,
      rotation: rotation,
    };
  });

  // Setup multiplayer input handling with enhanced features
  setupMultiplayerInput(networkManager);

  // Add game over handler for multiplayer
  setupMultiplayerGameEvents(networkManager);

  console.log(
    "🎮 Multiplayer game started with",
    gameData.players.length,
    "players"
  );
  console.log("🏰 Room:", networkManager.currentRoom?.name);
}

function setupMultiplayerGameEvents(networkManager: NetworkManager): void {
  // Handle game over in multiplayer
  document.addEventListener("gameOver", () => {
    if (networkManager.isMultiplayer) {
      // Send final stats to server
      const game = window.game;
      const stats = game.getGameStats();
      networkManager.sendPlayerScore(stats.score, stats.demonKills);

      // Show game over screen
      setTimeout(() => {
        game.showGameOver();
        hideRoomInfo();
      }, 2000);
    }
  });

  // Handle disconnection during game
  networkManager.setOnConnectionStatusUpdate((status: string) => {
    if (status.includes("🔴") && window.game.getGameState() === "playing") {
      window.game.showMessage("⚠️ Lost connection to server", 5000);
      window.game.pauseGame();
    }
  });

  // Handle player leave during game
  window.addEventListener("beforeunload", () => {
    if (networkManager.isMultiplayer && networkManager.isConnected) {
      networkManager.leaveGame();
    }
  });
}

function showRoomInfo(roomName: string): void {
  let roomInfo = document.getElementById("roomInfo");
  if (!roomInfo) {
    roomInfo = document.createElement("div");
    roomInfo.id = "roomInfo";
    roomInfo.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #ff6600;
      padding: 0.5rem 1rem;
      border: 2px solid #ff6600;
      border-radius: 5px;
      font-weight: 600;
      text-shadow: 0 0 10px #ff6600;
      z-index: 1000;
      font-family: 'Orbitron', monospace;
    `;
    document.body.appendChild(roomInfo);
  }
  roomInfo.textContent = `🏰 Chamber: ${roomName}`;
}

function hideRoomInfo(): void {
  const roomInfo = document.getElementById("roomInfo");
  if (roomInfo) {
    roomInfo.remove();
  }
}

function setupUIEventListeners(
  game: Game,
  networkManager: NetworkManager
): void {
  // Setup multiplayer event listeners (using a simplified version)
  setupMultiplayerEventListeners(networkManager);

  // Single player button
  const singlePlayerBtn = document.getElementById("singlePlayerBtn");
  singlePlayerBtn?.addEventListener("click", () => {
    startSinglePlayer(game);
  });

  // Multiplayer button
  const multiPlayerBtn = document.getElementById("multiPlayerBtn");
  multiPlayerBtn?.addEventListener("click", () => {
    showMultiplayerLobby();
  });
}

function setupMultiplayerEventListeners(networkManager: NetworkManager): void {
  // Server configuration radio buttons
  const serverRadios = document.querySelectorAll('input[name="serverType"]');
  serverRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const lanInput = document.getElementById(
        "lanServerIP"
      ) as HTMLInputElement;
      const customInput = document.getElementById(
        "customServerIP"
      ) as HTMLInputElement;

      if (lanInput)
        lanInput.disabled = !(
          document.getElementById("lanServer") as HTMLInputElement
        )?.checked;
      if (customInput)
        customInput.disabled = !(
          document.getElementById("customServer") as HTMLInputElement
        )?.checked;
    });
  });

  // Connect to server button
  const connectBtn = document.getElementById("connectServerBtn");
  connectBtn?.addEventListener("click", () => {
    const config = getSelectedServerConfig();
    networkManager.setServerURL(config.url);
    networkManager.connectToServer();
  });

  // Create room button
  const createRoomBtn = document.getElementById("createRoomBtn");
  createRoomBtn?.addEventListener("click", () => {
    const roomName =
      (document.getElementById("roomName") as HTMLInputElement)?.value ||
      "Hell Chamber";
    const maxPlayers = parseInt(
      (document.getElementById("maxPlayers") as HTMLSelectElement)?.value || "4"
    );
    const mapType =
      (document.getElementById("mapType") as HTMLSelectElement)?.value ||
      "industrial";

    networkManager.createRoom(roomName, maxPlayers, mapType);
  });

  // Refresh rooms button
  const refreshBtn = document.getElementById("refreshRoomsBtn");
  refreshBtn?.addEventListener("click", () => {
    networkManager.refreshRooms();
  });

  // Chat input
  const chatInput = document.getElementById("chatInput") as HTMLInputElement;
  const sendChatBtn = document.getElementById("sendChatBtn");

  const sendMessage = () => {
    const message = chatInput?.value.trim();
    if (message) {
      networkManager.sendChatMessage(message);
      chatInput.value = "";
    }
  };

  sendChatBtn?.addEventListener("click", sendMessage);
  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Ready button
  const readyBtn = document.getElementById("readyButton");
  readyBtn?.addEventListener("click", () => {
    networkManager.toggleReady();
  });

  // Start game button
  const startBtn = document.getElementById("startGameButton");
  startBtn?.addEventListener("click", () => {
    networkManager.startGame();
  });

  // Leave room button
  const leaveBtn = document.getElementById("leaveRoomBtn");
  leaveBtn?.addEventListener("click", () => {
    networkManager.leaveRoom();
    showMultiplayerLobby();
  });

  // Back to menu buttons
  const backBtns = document.querySelectorAll(
    "#backToMenuBtn, #backToMainMenuBtn"
  );
  backBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      showMainMenu();
    });
  });
}

function getSelectedServerConfig(): { type: string; url: string } {
  const localServer = document.getElementById(
    "localServer"
  ) as HTMLInputElement;
  const lanServer = document.getElementById("lanServer") as HTMLInputElement;
  const customServer = document.getElementById(
    "customServer"
  ) as HTMLInputElement;
  const lanServerIP = document.getElementById(
    "lanServerIP"
  ) as HTMLInputElement;
  const customServerIP = document.getElementById(
    "customServerIP"
  ) as HTMLInputElement;

  if (localServer?.checked) {
    return { type: "local", url: "http://localhost:3000" };
  } else if (lanServer?.checked) {
    const ip = lanServerIP?.value || "192.168.1.100:3000";
    return { type: "lan", url: `http://${ip}` };
  } else if (customServer?.checked) {
    const ip = customServerIP?.value || "localhost:3000";
    return { type: "custom", url: `http://${ip}` };
  }

  return { type: "local", url: "http://localhost:3000" };
}

function setupMultiplayerInput(networkManager: NetworkManager): void {
  // Voice chat controls (按键语音)
  document.addEventListener("keydown", (event) => {
    if (event.code === "KeyT") {
      // Push to talk
      event.preventDefault();
      networkManager.startVoiceRecording();

      // Show voice indicator
      showVoiceIndicator();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code === "KeyT") {
      event.preventDefault();
      networkManager.stopVoiceRecording();

      // Hide voice indicator
      hideVoiceIndicator();
    }
  });

  // Game chat (Enter键)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      const gameUI = document.getElementById("gameUI");
      if (gameUI && gameUI.style.display !== "none") {
        // Show in-game chat input
        event.preventDefault();
        showInGameChat(networkManager);
      }
    }
  });

  // Weapon switching synchronization
  document.addEventListener("keydown", (event) => {
    const game = window.game;
    if (game.getGameState() === "playing") {
      let weaponType = "";

      switch (event.code) {
        case "Digit1":
          weaponType = "shotgun";
          break;
        case "Digit2":
          weaponType = "chaingun";
          break;
        case "Digit3":
          weaponType = "rocket";
          break;
        case "Digit4":
          weaponType = "plasma";
          break;
      }

      if (weaponType) {
        // Switch weapon locally
        game.switchWeapon(weaponType);

        // Sync with other players
        networkManager.sendWeaponSwitch(weaponType);
      }
    }
  });

  // Mouse controls for shooting
  document.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
      // Left click
      const game = window.game;
      if (game.getGameState() === "playing") {
        // Handle shooting locally
        // Weapon shooting will be handled by the game systems
        // but we can sync weapon usage stats
        const currentWeapon = game.getCurrentWeapon();
        if (currentWeapon) {
          // Optional: sync shooting events for multiplayer stats
          console.log("🔫 Shooting:", currentWeapon.name);
        }
      }
    }
  });

  // Health synchronization
  let lastHealthSent = 100;
  setInterval(() => {
    const game = window.game;
    if (game.getGameState() === "playing" && networkManager.isMultiplayer) {
      const currentHealth = game.getPlayerHealth();
      if (Math.abs(currentHealth - lastHealthSent) > 5) {
        // Only sync significant health changes
        networkManager.sendPlayerHealthUpdate(currentHealth);
        lastHealthSent = currentHealth;
      }
    }
  }, 1000); // Check every second

  console.log("🎮 Multiplayer input controls initialized");
}

function showInGameChat(networkManager: NetworkManager): void {
  // Create temporary chat input overlay
  const chatOverlay = document.createElement("div");
  chatOverlay.style.cssText = `
    position: fixed;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border: 2px solid #ff6600;
    border-radius: 5px;
    z-index: 10000;
  `;

  const chatInput = document.createElement("input");
  chatInput.type = "text";
  chatInput.placeholder = "Type message and press Enter...";
  chatInput.style.cssText = `
    background: rgba(139, 0, 0, 0.3);
    border: 2px solid #ff6600;
    color: white;
    padding: 5px 10px;
    width: 300px;
    font-family: inherit;
  `;

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const message = chatInput.value.trim();
      if (message) {
        networkManager.sendGameChatMessage(message);
      }
      document.body.removeChild(chatOverlay);
    } else if (e.key === "Escape") {
      document.body.removeChild(chatOverlay);
    }
  });

  chatOverlay.appendChild(chatInput);
  document.body.appendChild(chatOverlay);
  chatInput.focus();
}

function startSinglePlayer(game: Game): void {
  const menuElement = document.getElementById("mainMenu");
  if (menuElement) {
    menuElement.style.display = "none";
  }

  // Enter fullscreen mode
  requestFullscreen();

  // Start single player game
  game.startGame(false);

  // Setup pointer lock
  setTimeout(() => {
    document.addEventListener("click", requestPointerLock);

    function requestPointerLock() {
      document.body.requestPointerLock();
      document.removeEventListener("click", requestPointerLock);
    }
  }, 100);
}

function showMainMenu(): void {
  hideAllMenus();
  const menuElement = document.getElementById("mainMenu");
  if (menuElement) {
    menuElement.style.display = "block";
  }
}

function showMultiplayerLobby(): void {
  hideAllMenus();
  const multiplayerLobby = document.getElementById("multiplayerLobby");
  if (multiplayerLobby) {
    multiplayerLobby.style.display = "block";
  }
}

function hideAllMenus(): void {
  const menus = [
    "mainMenu",
    "multiplayerLobby",
    "partyRoom",
    "instructionsScreen",
    "gameOverScreen",
  ];

  menus.forEach((menuId) => {
    const menu = document.getElementById(menuId);
    if (menu) {
      menu.style.display = "none";
    }
  });
}

function requestFullscreen(): void {
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Could not enter fullscreen:", err);
      });
    }
  } catch (error) {
    console.warn("Fullscreen not supported:", error);
  }
}

function showErrorMessage(message: string): void {
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(139, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border: 3px solid #ff0000;
    border-radius: 10px;
    text-align: center;
    z-index: 10000;
    font-family: 'Orbitron', sans-serif;
  `;
  errorDiv.innerHTML = `
    <h2>🔥 Error 🔥</h2>
    <p>${message}</p>
    <button onclick="location.reload()" style="
      background: #ff6600;
      color: white;
      border: none;
      padding: 10px 20px;
      margin-top: 10px;
      cursor: pointer;
      border-radius: 5px;
      font-family: inherit;
    ">Reload Game</button>
  `;
  document.body.appendChild(errorDiv);
}

function showVoiceIndicator(): void {
  let indicator = document.getElementById("voiceIndicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "voiceIndicator";
    indicator.className = "voice-indicator";
    indicator.textContent = "🎤";
    indicator.style.cssText = `
      position: fixed;
      bottom: 150px;
      right: 20px;
      background: rgba(0, 255, 0, 0.8);
      color: #000000;
      padding: 0.5rem;
      border-radius: 50%;
      font-size: 1.2rem;
      z-index: 1000;
      animation: pulse 1s infinite;
    `;
    document.body.appendChild(indicator);
  }
  indicator.style.display = "block";
}

function hideVoiceIndicator(): void {
  const indicator = document.getElementById("voiceIndicator");
  if (indicator) {
    indicator.style.display = "none";
  }
}

// Start the game when the page loads
document.addEventListener("DOMContentLoaded", initializeGame);

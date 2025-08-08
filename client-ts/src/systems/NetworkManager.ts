import * as THREE from "three";
import { io, Socket } from "socket.io-client";
import { NetworkState, PlayerData, RoomData } from "@/types/network";

export class NetworkManager implements NetworkState {
  private static instance: NetworkManager | null = null;

  public socket: Socket | null = null;
  public isConnected = false;
  public currentRoom: RoomData | null = null;
  public localPlayer: PlayerData | null = null;
  public remotePlayers = new Map<string, any>();
  public isRoomLeader = false;
  public isMultiplayer = false;
  public isPlayerReady = false;

  // Backup: manually maintain current players list
  private currentPlayers: any[] = [];

  // Server connection
  private currentServerURL = "http://localhost:3000";

  // Position sync optimization
  private lastSentPosition: THREE.Vector3 | null = null;
  private lastSentRotation: THREE.Euler | null = null;
  private lastPositionSendTime = 0;
  private positionSyncInterval: NodeJS.Timeout | null = null;

  // Position sync thresholds
  private readonly POSITION_THRESHOLD = 0.1; // Minimum movement distance to trigger update
  private readonly ROTATION_THRESHOLD = 0.05; // Minimum rotation change (radians)
  private readonly MAX_SYNC_INTERVAL = 1000; // Maximum time between forced updates (ms)
  private readonly MIN_SYNC_INTERVAL = 50; // Minimum time between updates (ms)

  // Voice chat properties
  private voiceChat = {
    audioStream: null as MediaStream | null,
    audioContext: null as AudioContext | null,
    mediaRecorder: null as MediaRecorder | null,
    audioChunks: [] as BlobPart[],
    settings: {
      mode: "push-to-talk", // "push-to-talk", "voice-activation", "speech-to-text", "disabled"
      pushToTalkKey: "KeyT",
      voiceActivationThreshold: 0.02,
      voiceVolume: 50,
      micVolume: 80,
    },
    isRecording: false,
    speechRecognition: null as any,
  };

  // Callbacks for UI updates
  private onConnectionStatusUpdate?: (status: string) => void;
  private onRoomListUpdate?: (rooms: any[]) => void;
  private onPartyMembersUpdate?: (members: any[]) => void;
  private onChatMessage?: (
    type: string,
    message: string,
    sender?: string
  ) => void;
  private onGameStart?: (gameData: any) => void;
  private onPlayerPosition?: (data: any) => void;
  private onDemonSpawn?: (data: any) => void;
  private onDemonDeath?: (data: any) => void;
  private onDemonUpdate?: (data: any) => void;
  private onWaveStart?: (data: any) => void;
  private onWaveComplete?: (data: any) => void;
  private onPlayerShooting?: (data: any) => void;
  private onPlayerWeaponSwitch?: (data: any) => void;
  private onPlayerDamage?: (data: any) => void;
  private onPlayerDeath?: (data: any) => void;
  private onPlayerRespawn?: (data: any) => void;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public async initialize(): Promise<void> {
    console.log("🎮 NetworkManager initializing...");

    // Initialize voice chat system
    await this.initVoiceChat();

    console.log("✅ NetworkManager initialized");
  }

  public setServerURL(url: string): void {
    this.currentServerURL = this.normalizeServerURL(url);
  }

  /**
   * Normalize the server URL to handle HTTPS/WSS conversion and port management
   *
   * This method automatically:
   * - Detects if the current page is served over HTTPS
   * - Converts HTTP URLs to HTTPS for production (non-localhost) environments
   * - Removes port numbers for HTTPS production deployments (uses default HTTPS port 443)
   * - Maintains backward compatibility with development environments
   *
   * Examples:
   * - Input: "doom-server.example.com:3000" on HTTPS → Output: "https://doom-server.example.com"
   * - Input: "localhost:3000" on HTTPS → Output: "http://localhost:3000" (development)
   * - Input: "192.168.1.100:3000" on HTTP → Output: "http://192.168.1.100:3000" (LAN)
   */
  private normalizeServerURL(inputUrl: string): string {
    let normalizedUrl = inputUrl.trim();

    // Check if we're running on HTTPS
    const isHTTPS = window.location.protocol === "https:";
    const isLocalhost =
      normalizedUrl.includes("localhost") ||
      normalizedUrl.includes("127.0.0.1");

    console.log("🔍 Normalizing server URL:", {
      input: inputUrl,
      isHTTPS,
      isLocalhost,
      windowProtocol: window.location.protocol,
      windowHost: window.location.host,
    });

    // Handle different URL formats
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://") &&
      !normalizedUrl.startsWith("ws://") &&
      !normalizedUrl.startsWith("wss://")
    ) {
      // No protocol specified, add appropriate one
      if (isHTTPS && !isLocalhost) {
        // Production HTTPS environment - use HTTPS and remove port
        const urlWithoutPort = normalizedUrl.replace(/:\d+$/, "");
        normalizedUrl = `https://${urlWithoutPort}`;
      } else {
        // Development environment or localhost - keep existing behavior
        normalizedUrl = `http://${normalizedUrl}`;
      }
    } else if (normalizedUrl.startsWith("http://")) {
      // HTTP specified
      if (isHTTPS && !isLocalhost) {
        // Convert to HTTPS for production and remove port
        const urlPart = normalizedUrl
          .replace("http://", "")
          .replace(/:\d+$/, "");
        normalizedUrl = `https://${urlPart}`;
      }
      // Keep HTTP for localhost/development
    } else if (normalizedUrl.startsWith("https://")) {
      // HTTPS specified
      if (!isLocalhost) {
        // Remove port for production HTTPS
        normalizedUrl = normalizedUrl.replace(/:\d+$/, "");
      }
    }

    console.log("✅ Normalized server URL:", normalizedUrl);
    return normalizedUrl;
  }

  /**
   * Attempt fallback connection for Google App Engine using polling-only
   */
  private attemptFallbackConnection(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    console.log(
      "🔄 Attempting fallback connection with polling-only for GAE..."
    );

    try {
      // Fallback options - polling only
      const fallbackOptions: any = {
        timeout: 30000, // Very long timeout for GAE
        transports: ["polling"], // Polling only
        upgrade: false, // Don't try to upgrade to websocket
        forceNew: true,
        reconnectionDelay: 3000,
        maxReconnectionAttempts: 3,
      };

      const isHTTPS = window.location.protocol === "https:";
      if (isHTTPS) {
        fallbackOptions.secure = true;
        fallbackOptions.rejectUnauthorized = false;
      }

      console.log("🌩️ GAE Fallback connection options:", fallbackOptions);
      this.socket = io(this.currentServerURL, fallbackOptions);
      this.setupSocketEvents();

      this.updateConnectionStatus("🔄 Retrying with polling-only mode...");
    } catch (error) {
      console.error("Failed fallback connection:", error);
      this.updateConnectionStatus("🔴 Fallback connection failed");
    }
  }

  public connectToServer(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Check if io (Socket.IO) is available
    if (typeof io === "undefined") {
      console.error(
        "Socket.IO not loaded! Multiplayer features will not work."
      );
      this.updateConnectionStatus("🔴 Socket.IO not available");
      return;
    }

    // For GAE, test basic connectivity first
    if (this.currentServerURL.includes("appspot.com")) {
      this.testServerConnectivity().then((isReachable) => {
        if (!isReachable) {
          this.updateConnectionStatus("🔴 Server not reachable");
          return;
        }
        this.performConnection();
      });
    } else {
      this.performConnection();
    }
  }

  /**
   * Test basic server connectivity for GAE
   */
  private async testServerConnectivity(): Promise<boolean> {
    try {
      console.log("🧪 Testing server connectivity...");
      this.updateConnectionStatus("🔄 Testing server connectivity...");

      // First try the health endpoint
      const healthUrl = `${this.currentServerURL}/health`;
      let response = await fetch(healthUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
      });

      if (response.ok) {
        const healthData = await response.json();
        console.log("🧪 Server health check passed:", healthData);
        return true;
      }

      // Fallback to Socket.IO endpoint test
      console.log("🧪 Health check failed, trying Socket.IO endpoint...");
      const testUrl = `${this.currentServerURL}/socket.io/`;
      response = await fetch(testUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
      });

      console.log("🧪 Socket.IO endpoint test response:", response.status);
      return response.status < 500; // Accept redirects and client errors, but not server errors
    } catch (error) {
      console.error("🧪 Server connectivity test failed:", error);
      return false;
    }
  }

  /**
   * Perform the actual Socket.IO connection
   */
  private performConnection(): void {
    try {
      // Determine if we need secure connection
      const isHTTPS = window.location.protocol === "https:";
      const isLocalhost =
        this.currentServerURL.includes("localhost") ||
        this.currentServerURL.includes("127.0.0.1");

      // Socket.IO connection options
      const socketOptions: any = {
        timeout: 15000, // 15 second timeout (increased for GAE)
        transports: ["websocket", "polling"], // Try websocket first, fallback to polling
        upgrade: true, // Allow transport upgrades
        rememberUpgrade: false, // Don't remember transport choice for GAE compatibility
      };

      // Force secure connection for HTTPS sites (except localhost)
      if (isHTTPS && !isLocalhost) {
        socketOptions.secure = true;
        socketOptions.rejectUnauthorized = false; // For development/testing with self-signed certs

        // Special configuration for Google App Engine
        if (this.currentServerURL.includes("appspot.com")) {
          console.log(
            "🌩️ Detected Google App Engine - using polling-first strategy"
          );
          socketOptions.transports = ["polling", "websocket"]; // Polling first for GAE
          socketOptions.forceNew = true; // Force new connection each time
          socketOptions.reconnectionDelay = 2000; // Delay between reconnection attempts
          socketOptions.timeout = 20000; // Longer timeout for GAE
        }

        console.log(
          "🔒 Using secure connection (HTTPS/WSS) for production environment"
        );
      } else {
        console.log("🔓 Using regular connection (HTTP/WS) for development");
      }

      console.log("🔗 Connecting to server:", {
        url: this.currentServerURL,
        isHTTPS,
        isLocalhost,
        secure: socketOptions.secure,
        options: socketOptions,
      });

      this.socket = io(this.currentServerURL, socketOptions);
    } catch (error) {
      console.error("Failed to initialize Socket.IO:", error);
      this.updateConnectionStatus("🔴 Connection failed");
      return;
    }

    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log(`🔥 Connected to Hell Server: ${this.currentServerURL}`);
      this.isConnected = true;
      this.updateConnectionStatus(
        `🟢 Connected to Hell (${this.currentServerURL})`
      );

      // Set player name on connection if available
      const playerName = this.getPlayerName();
      if (playerName && this.socket) {
        this.socket.emit("user:joined", { name: playerName });
        console.log(`👹 Player name set to: ${playerName}`);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("💀 Disconnected from Hell Server");
      this.isConnected = false;
      this.updateConnectionStatus("🔴 Disconnected from Hell");
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      this.isConnected = false;

      // Provide more specific error messages for common issues
      let errorMessage = error.message || "Unknown error";
      if (
        errorMessage.includes("mixed content") ||
        errorMessage.includes("insecure")
      ) {
        errorMessage =
          "Mixed content error - server must use HTTPS/WSS for HTTPS sites";
      } else if (errorMessage.includes("CORS")) {
        errorMessage = "CORS policy error - server configuration issue";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "Connection timeout - check server URL and network";
      } else if (this.currentServerURL.includes("appspot.com")) {
        errorMessage =
          "Google App Engine connection failed - trying fallback method";
        console.log("🔄 Attempting fallback connection strategy for GAE...");
        // Try to reconnect with polling-only after a short delay
        setTimeout(() => {
          this.attemptFallbackConnection();
        }, 2000);
      }

      this.updateConnectionStatus(`🔴 Connection failed: ${errorMessage}`);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.updateConnectionStatus(
        `🟢 Reconnected to Hell (${this.currentServerURL})`
      );
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ Reconnection failed:", error);
      this.updateConnectionStatus("🔴 Reconnection failed");
    });

    // Room events
    this.socket.on("room:created", (data) => {
      console.log("🏰 Room created:", data);
      this.currentRoom = data.room;
      this.isRoomLeader = data.isLeader;
      this.isPlayerReady = false;

      if (this.onPartyMembersUpdate) {
        // Use players data from server if available, otherwise create from local data
        if (data.players) {
          this.onPartyMembersUpdate(data.players);
        } else {
          const playerName = this.getPlayerName();
          if (playerName) {
            const currentPlayer = {
              id: this.socket!.id,
              name: playerName,
              ready: false,
              isLeader: true,
            };
            this.onPartyMembersUpdate([currentPlayer]);
          }
        }
      }
    });

    this.socket.on("room:joined", (data) => {
      console.log("👹 Joined room:", data);
      this.currentRoom = data.room;
      this.isRoomLeader = data.isLeader;
      this.isPlayerReady = false;

      // Store initial players list
      if (data.players) {
        this.currentPlayers = data.players;
      }

      if (this.onPartyMembersUpdate) {
        this.onPartyMembersUpdate(data.players);
      }
    });

    this.socket.on("room:list", (rooms) => {
      console.log(`📋 Received room list: ${rooms.length} chambers available`);
      if (this.onRoomListUpdate) {
        this.onRoomListUpdate(rooms);
      }
    });

    this.socket.on("room:full", () => {
      alert("🔥 Chamber is full! Try another one.");
    });

    this.socket.on("room:not_found", () => {
      alert("👹 Chamber not found! It may have been destroyed.");
    });

    // Party events
    this.socket.on("party:member_joined", (data) => {
      console.log("👹 New demon joined:", data.player);
      if (this.onChatMessage) {
        this.onChatMessage("system", `${data.player.name} entered the chamber`);
      }
      // Update party members list
      if (this.onPartyMembersUpdate && data.players) {
        this.onPartyMembersUpdate(data.players);
      }
    });

    this.socket.on("party:member_left", (data) => {
      console.log("👹 Demon left:", data);
      if (this.onChatMessage) {
        this.onChatMessage("system", `${data.playerName} left the chamber`);
      }
      // Update party members list
      if (this.onPartyMembersUpdate && data.players) {
        this.onPartyMembersUpdate(data.players);
      }
    });

    this.socket.on("party:leader_changed", (data) => {
      console.log("👑 New leader:", data);
      this.isRoomLeader = data.newLeaderId === this.socket!.id;
      if (this.onChatMessage) {
        this.onChatMessage(
          "system",
          `${data.newLeaderName} is now the chamber leader`
        );
      }
      // Update party members list
      if (this.onPartyMembersUpdate && data.players) {
        this.onPartyMembersUpdate(data.players);
      }
    });

    this.socket.on("party:ready_state", (data) => {
      console.log("Player ready state:", data);
      console.log("🔧 Processing ready state update:", {
        hasPlayersArray: !!data.players,
        playersCount: data.players?.length,
        playerId: data.playerId,
        ready: data.ready,
        entireData: data,
      });

      // Update this player's ready state if it's us
      if (data.playerId === this.socket!.id) {
        this.isPlayerReady = data.ready;
        console.log("🎭 Updated local player ready state:", this.isPlayerReady);
      }

      // Update party members list with new ready states
      if (this.onPartyMembersUpdate && data.players) {
        console.log(
          "🎪 Calling onPartyMembersUpdate with players:",
          data.players
        );
        this.currentPlayers = data.players;
        this.onPartyMembersUpdate(data.players);
      } else {
        console.warn(
          "❗️ Cannot update party members - missing callback or players data"
        );

        // Backup: Update ready state in our local players list
        if (this.currentPlayers.length > 0) {
          console.log("🔧 Using backup player list update");
          const playerIndex = this.currentPlayers.findIndex(
            (p) => p.id === data.playerId
          );
          if (playerIndex !== -1) {
            this.currentPlayers[playerIndex].ready = data.ready;
            console.log(
              "✅ Updated player in backup list:",
              this.currentPlayers[playerIndex]
            );

            if (this.onPartyMembersUpdate) {
              console.log(
                "🎪 Calling onPartyMembersUpdate with backup players:",
                this.currentPlayers
              );
              this.onPartyMembersUpdate([...this.currentPlayers]);
            }
          }
        }
      }
    });

    this.socket.on("party:all_ready", (data) => {
      console.log("All players ready:", data);
      console.log("🔧 Processing all ready update:", {
        hasPlayersArray: !!data.players,
        playersCount: data.players?.length,
        canStart: data.canStart,
        entireData: data,
      });

      // Update UI to reflect all players are ready
      if (this.onPartyMembersUpdate && data.players) {
        console.log(
          "🎪 Calling onPartyMembersUpdate with players:",
          data.players
        );
        this.currentPlayers = data.players;
        this.onPartyMembersUpdate(data.players);
      } else {
        console.warn(
          "❗️ Cannot update party members - missing callback or players data"
        );

        // Backup: Mark all players as ready in local list
        if (this.currentPlayers.length > 0) {
          console.log("🔧 Using backup - marking all players ready");
          this.currentPlayers = this.currentPlayers.map((p) => ({
            ...p,
            ready: true,
          }));

          if (this.onPartyMembersUpdate) {
            console.log(
              "🎪 Calling onPartyMembersUpdate with backup players:",
              this.currentPlayers
            );
            this.onPartyMembersUpdate([...this.currentPlayers]);
          }
        }
      }
    });

    // Chat events
    this.socket.on("chat:lobby_message", (data) => {
      if (this.onChatMessage) {
        this.onChatMessage("player", data.message, data.playerName);
      }
    });

    this.socket.on("chat:game_message", (data) => {
      if (this.onChatMessage) {
        this.onChatMessage("player", data.message, data.playerName);
      }
    });

    // Game events
    this.socket.on("game:start", (data) => {
      console.log("🎮 Game starting:", data);
      this.isMultiplayer = true;
      if (this.onGameStart) {
        this.onGameStart(data);
      }
    });

    // World/Demon synchronization events
    this.socket.on("world:wave:start", (data) => {
      console.log("🌊 Wave starting:", data);
      if (this.onWaveStart) {
        this.onWaveStart(data);
      }
    });

    this.socket.on("world:demon:spawn", (data) => {
      console.log("👹 Demon spawned by server:", data);
      if (this.onDemonSpawn) {
        this.onDemonSpawn(data);
      }
    });

    this.socket.on("world:demon:death", (data) => {
      console.log("💀 Demon killed:", data);
      console.log("🔧 Death event data:", {
        demonId: data.demonId,
        killerId: data.killerId,
        killerName: data.killerName,
        position: data.position,
        currentSocketId: this.socket?.id,
      });

      if (this.onDemonDeath) {
        this.onDemonDeath(data);
      } else {
        console.warn("❗️ No demon death handler registered");
      }
    });

    this.socket.on("world:demon:update", (data) => {
      if (this.onDemonUpdate) {
        this.onDemonUpdate(data);
      }
    });

    this.socket.on("world:wave:complete", (data) => {
      console.log("✅ Wave complete:", data);
      if (this.onWaveComplete) {
        this.onWaveComplete(data);
      }
    });

    // Player synchronization
    this.socket.on("player:position", (data) => {
      if (this.onPlayerPosition) {
        this.onPlayerPosition(data);
      }
    });

    // Player action synchronization
    this.socket.on("player:shooting", (data) => {
      console.log("👤🔫 Player shooting event:", data);
      if (this.onPlayerShooting) {
        this.onPlayerShooting(data);
      }
    });

    this.socket.on("player:weapon_switch", (data) => {
      console.log("👤🔧 Player weapon switch event:", data);
      if (this.onPlayerWeaponSwitch) {
        this.onPlayerWeaponSwitch(data);
      }
    });

    this.socket.on("player:damage", (data) => {
      console.log("👤💥 Player damage event:", data);
      if (this.onPlayerDamage) {
        this.onPlayerDamage(data);
      }
    });

    this.socket.on("player:death", (data) => {
      console.log("👤💀 Player death event:", data);
      if (this.onPlayerDeath) {
        this.onPlayerDeath(data);
      }
    });

    this.socket.on("player:respawn", (data) => {
      console.log("👤🔄 Player respawn event:", data);
      if (this.onPlayerRespawn) {
        this.onPlayerRespawn(data);
      }
    });

    // Voice chat events
    this.socket.on("voice:message", (data) => {
      if (this.onChatMessage) {
        this.onChatMessage("voice", data.message, data.playerName);
      }
    });

    this.socket.on("voice:data", (data) => {
      this.handleVoiceData(data);
    });
  }

  // Room management methods
  public createRoom(
    roomName: string,
    maxPlayers: number,
    mapType: string
  ): void {
    if (!this.socket || !this.isConnected) {
      console.warn("Not connected to server");
      return;
    }

    const playerName = this.getPlayerName();
    if (!playerName) {
      alert("Please enter your demon name first!");
      return;
    }

    // First set the player name on the server
    this.socket.emit("user:joined", { name: playerName });

    // Then create the room
    this.socket.emit("room:create", {
      name: roomName,
      maxPlayers: maxPlayers,
      mapType: mapType,
      playerName: playerName,
    });
  }

  public joinRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn("Not connected to server");
      return;
    }

    const playerName = this.getPlayerName();
    if (!playerName) {
      alert("Please enter your demon name first!");
      return;
    }

    // First set the player name on the server
    this.socket.emit("user:joined", { name: playerName });

    // Then join the room
    this.socket.emit("room:join", {
      roomId: roomId,
      playerName: playerName,
    });
  }

  public leaveRoom(): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit("room:leave");
    this.currentRoom = null;
    this.isRoomLeader = false;
    this.isPlayerReady = false;
  }

  public refreshRooms(): void {
    if (!this.socket || !this.isConnected) {
      console.warn("Not connected to server");
      return;
    }

    this.socket.emit("room:list");
  }

  public toggleReady(): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.isPlayerReady = !this.isPlayerReady;
    console.log("🔄 Toggling ready state to:", this.isPlayerReady);

    if (this.isPlayerReady) {
      this.socket.emit("player:ready");
    } else {
      this.socket.emit("player:not_ready");
    }
  }

  public startGame(): void {
    if (!this.socket || !this.isConnected || !this.isRoomLeader) {
      return;
    }

    this.socket.emit("game:start");
  }

  // Chat methods
  public sendChatMessage(message: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    const playerName = this.getPlayerName();
    if (!playerName || !message.trim()) {
      return;
    }

    this.socket.emit("chat:lobby_message", {
      message: message.trim(),
      playerName: playerName,
    });
  }

  public sendGameChatMessage(message: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    const playerName = this.getPlayerName();
    if (!playerName || !message.trim()) {
      return;
    }

    this.socket.emit("chat:game_message", {
      message: message.trim(),
      playerName: playerName,
    });
  }

  // Player position sync with optimization
  public sendPlayerPosition(
    position: THREE.Vector3,
    rotation: THREE.Euler,
    forceUpdate: boolean = false
  ): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    const currentTime = Date.now();

    // Check if enough time has passed since last update
    if (
      !forceUpdate &&
      currentTime - this.lastPositionSendTime < this.MIN_SYNC_INTERVAL
    ) {
      return;
    }

    // Check if position or rotation has changed significantly
    let shouldUpdate = forceUpdate;

    if (!shouldUpdate) {
      if (this.lastSentPosition && this.lastSentRotation) {
        const positionDelta = position.distanceTo(this.lastSentPosition);
        const rotationDelta = Math.abs(rotation.y - this.lastSentRotation.y); // Primary rotation axis

        shouldUpdate =
          positionDelta > this.POSITION_THRESHOLD ||
          rotationDelta > this.ROTATION_THRESHOLD ||
          currentTime - this.lastPositionSendTime > this.MAX_SYNC_INTERVAL;
      } else {
        // First time sending position
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      this.socket.emit("player:position", {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      });

      // Update tracking variables
      this.lastSentPosition = position.clone();
      this.lastSentRotation = rotation.clone();
      this.lastPositionSendTime = currentTime;

      // Debug logging (only log occasionally to avoid spam)
      if (Math.random() < 0.05 || forceUpdate) {
        // 5% chance or forced updates
        const reason = forceUpdate
          ? "FORCED"
          : this.lastSentPosition
          ? "MOVEMENT"
          : "INITIAL";
        console.log(`📡 Position sent (${reason}):`, {
          pos: `(${position.x.toFixed(2)}, ${position.z.toFixed(2)})`,
          rot: `${((rotation.y * 180) / Math.PI).toFixed(1)}°`,
          timeSinceLastSend: currentTime - this.lastPositionSendTime,
        });
      }
    }
  }

  // Voice chat methods
  private async initVoiceChat(): Promise<void> {
    console.log("Initializing voice chat system...");

    try {
      if (this.voiceChat.settings.mode !== "disabled") {
        this.voiceChat.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1, // Use mono audio to reduce bandwidth
          },
        });

        // Create audio context for processing
        try {
          this.voiceChat.audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();

          // Handle audio context state changes
          this.voiceChat.audioContext.addEventListener("statechange", () => {
            console.log(
              "AudioContext state:",
              this.voiceChat.audioContext?.state
            );
            if (this.voiceChat.audioContext?.state === "suspended") {
              // Try to resume when user interaction occurs
              document.addEventListener(
                "click",
                this.resumeAudioContext.bind(this),
                {
                  once: true,
                }
              );
            }
          });
        } catch (audioError) {
          console.warn("AudioContext creation failed:", audioError);
          this.voiceChat.audioContext = null;
        }
      }

      console.log("Voice chat initialized successfully");
    } catch (error) {
      console.error("Failed to initialize voice chat:", error);
    }
  }

  private resumeAudioContext(): void {
    if (this.voiceChat.audioContext?.state === "suspended") {
      this.voiceChat.audioContext.resume();
    }
  }

  public startVoiceRecording(): void {
    if (this.voiceChat.settings.mode === "push-to-talk") {
      this.startVoiceTransmission();
    }
  }

  public stopVoiceRecording(): void {
    if (this.voiceChat.isRecording && this.voiceChat.mediaRecorder) {
      this.voiceChat.mediaRecorder.stop();
      this.voiceChat.isRecording = false;
    }
  }

  private startVoiceTransmission(): void {
    if (!this.voiceChat.audioStream) {
      console.error("No audio stream available");
      this.stopVoiceRecording();
      return;
    }

    this.voiceChat.audioChunks = [];

    try {
      this.voiceChat.mediaRecorder = new MediaRecorder(
        this.voiceChat.audioStream,
        {
          mimeType: "audio/webm;codecs=opus",
        }
      );

      this.voiceChat.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.voiceChat.audioChunks.push(event.data);
        }
      };

      this.voiceChat.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.voiceChat.audioChunks, {
          type: "audio/webm;codecs=opus",
        });
        this.sendVoiceData(audioBlob);
      };

      this.voiceChat.mediaRecorder.start(100); // Collect data every 100ms
      this.voiceChat.isRecording = true;
    } catch (error) {
      console.error("Failed to start voice transmission:", error);
      this.stopVoiceRecording();
    }
  }

  private sendVoiceData(audioBlob: Blob): void {
    const playerName = this.getPlayerName();

    // In single player mode, just show a test message
    if (!this.isMultiplayer) {
      console.log(
        "🎤 Voice audio recorded (single player):",
        audioBlob.size,
        "bytes"
      );
      if (this.onChatMessage) {
        this.onChatMessage(
          "voice",
          "🎤 Voice recording test (audio mode)",
          playerName || "Player"
        );
      }
      return;
    }

    // In multiplayer mode, send to server
    if (!this.socket || !this.socket.connected) {
      console.warn("Not connected to server");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const voiceData = {
        type: "voice-transmission",
        audioData: reader.result,
        playerId: this.socket!.id,
        playerName: playerName,
        timestamp: Date.now(),
      };

      this.socket!.emit("voice:data", voiceData);
    };

    reader.readAsArrayBuffer(audioBlob);
  }

  private async handleVoiceData(data: any): Promise<void> {
    if (data.type === "voice-transmission" && data.audioData) {
      try {
        // Check if audio context is available and ready
        if (!this.voiceChat.audioContext) {
          console.warn("AudioContext not available for voice playback");
          return;
        }

        // Resume audio context if suspended
        if (this.voiceChat.audioContext.state === "suspended") {
          await this.voiceChat.audioContext.resume();
        }

        // Create audio buffer from received data
        const audioBuffer = await this.voiceChat.audioContext.decodeAudioData(
          data.audioData
        );

        // Play the audio
        const source = this.voiceChat.audioContext.createBufferSource();
        const gainNode = this.voiceChat.audioContext.createGain();

        source.buffer = audioBuffer;
        gainNode.gain.value = this.voiceChat.settings.voiceVolume / 100;

        source.connect(gainNode);
        gainNode.connect(this.voiceChat.audioContext.destination);

        source.start();

        // Add visual indication in chat
        if (this.onChatMessage) {
          this.onChatMessage("voice", "🎤 Voice message", data.playerName);
        }
      } catch (error) {
        console.error("Failed to play voice data:", error);
        // Fallback: just show text indication
        if (this.onChatMessage) {
          this.onChatMessage(
            "voice",
            "🎤 Voice message (audio playback failed)",
            data.playerName
          );
        }
      }
    }
  }

  // Callback setters
  public setOnConnectionStatusUpdate(callback: (status: string) => void): void {
    this.onConnectionStatusUpdate = callback;
  }

  public setOnRoomListUpdate(callback: (rooms: any[]) => void): void {
    this.onRoomListUpdate = callback;
  }

  public setOnPartyMembersUpdate(callback: (members: any[]) => void): void {
    this.onPartyMembersUpdate = callback;
  }

  public setOnChatMessage(
    callback: (type: string, message: string, sender?: string) => void
  ): void {
    this.onChatMessage = callback;
  }

  public setOnGameStart(callback: (gameData: any) => void): void {
    this.onGameStart = callback;
  }

  public setOnPlayerPosition(callback: (data: any) => void): void {
    this.onPlayerPosition = callback;
  }

  public setOnDemonSpawn(callback: (data: any) => void): void {
    this.onDemonSpawn = callback;
  }

  public setOnDemonDeath(callback: (data: any) => void): void {
    this.onDemonDeath = callback;
  }

  public setOnDemonUpdate(callback: (data: any) => void): void {
    this.onDemonUpdate = callback;
  }

  public setOnWaveStart(callback: (data: any) => void): void {
    this.onWaveStart = callback;
  }

  public setOnWaveComplete(callback: (data: any) => void): void {
    this.onWaveComplete = callback;
  }

  public setOnPlayerShooting(callback: (data: any) => void): void {
    this.onPlayerShooting = callback;
  }

  public setOnPlayerWeaponSwitch(callback: (data: any) => void): void {
    this.onPlayerWeaponSwitch = callback;
  }

  public setOnPlayerDamage(callback: (data: any) => void): void {
    this.onPlayerDamage = callback;
  }

  public setOnPlayerDeath(callback: (data: any) => void): void {
    this.onPlayerDeath = callback;
  }

  public setOnPlayerRespawn(callback: (data: any) => void): void {
    this.onPlayerRespawn = callback;
  }

  // Utility methods
  private updateConnectionStatus(status: string): void {
    if (this.onConnectionStatusUpdate) {
      this.onConnectionStatusUpdate(status);
    }
  }

  private getPlayerName(): string | null {
    // This should get the player name from UI
    const playerNameInput = document.getElementById(
      "playerName"
    ) as HTMLInputElement;
    return playerNameInput?.value.trim() || null;
  }

  // Player model creation and management
  public createRemotePlayer(
    playerData: PlayerData,
    scene: THREE.Scene
  ): THREE.Group | null {
    try {
      // Generate a unique color for this player based on their ID or index
      const playerIndex = Array.from(this.remotePlayers.keys()).length;
      const colorScheme = this.getPlayerColor(playerIndex);

      // Create a demon-style player model with unique colors
      const playerMesh = this.createPlayerModel(colorScheme, playerData.name);

      // Enhanced name tag with player color and emoji
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return null;

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

      // Convert camera position to foot-level position for proper player rendering
      // Camera is at head level (1.6), player model should be positioned so feet are on ground
      const footLevelY = Math.max(0, playerData.position.y - 1.6); // Subtract camera height offset

      playerMesh.position.set(
        playerData.position.x,
        footLevelY,
        playerData.position.z
      );

      // Scale player model to be slightly larger than demons for visibility
      playerMesh.scale.setScalar(1.2);

      // Create and attach initial weapon (default shotgun)
      const weaponMesh = this.createRemotePlayerWeapon("shotgun");
      if (weaponMesh) {
        playerMesh.add(weaponMesh);
      }

      // Store player data
      const playerInfo = {
        mesh: playerMesh,
        data: playerData,
        colorScheme: colorScheme,
        currentWeapon: "shotgun",
        weaponMesh: weaponMesh,
        isDead: false,
      };

      this.remotePlayers.set(playerData.id, playerInfo);
      scene.add(playerMesh);

      console.log(
        `👹 Created remote player: ${playerData.name} (${
          colorScheme.name
        }) at foot level Y: ${footLevelY.toFixed(2)}`
      );
      return playerMesh;
    } catch (error) {
      console.error("Failed to create remote player:", error);
      return null;
    }
  }

  public updateRemotePlayerPosition(data: any): void {
    const player = this.remotePlayers.get(data.playerId);
    if (player) {
      // Convert camera position to foot-level position for proper player rendering
      // Camera is at head level (1.6), player model should be positioned so feet are on ground
      const footLevelY = Math.max(0, data.position.y - 1.6); // Subtract camera height offset

      // Smooth interpolation with foot-level positioning
      player.mesh.position.lerp(
        new THREE.Vector3(data.position.x, footLevelY, data.position.z),
        0.1
      );
      player.mesh.rotation.set(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
      );

      // Only log position updates occasionally to avoid spam
      if (Math.random() < 0.01) {
        // Log ~1% of position updates
        console.log(
          `👤 Updated player ${data.playerId} position (foot level):`,
          {
            x: data.position.x.toFixed(2),
            y: footLevelY.toFixed(2),
            z: data.position.z.toFixed(2),
            originalY: data.position.y.toFixed(2),
          }
        );
      }
    } else {
      console.warn(`❗️ Cannot find remote player with ID: ${data.playerId}`);
      console.log(
        `Available remote players:`,
        Array.from(this.remotePlayers.keys())
      );
    }
  }

  public updateRemotePlayerWeapon(playerId: string, weaponType: string): void {
    const player = this.remotePlayers.get(playerId);
    if (player && player.weaponMesh && player.currentWeapon !== weaponType) {
      // Remove old weapon
      player.mesh.remove(player.weaponMesh);

      // Create and attach new weapon
      const newWeaponMesh = this.createRemotePlayerWeapon(weaponType);
      if (newWeaponMesh) {
        player.mesh.add(newWeaponMesh);
        player.weaponMesh = newWeaponMesh;
        player.currentWeapon = weaponType;

        console.log(`🔧 Updated ${player.data.name}'s weapon to ${weaponType}`);
      }
    }
  }

  public showRemotePlayerShooting(data: any): void {
    const player = this.remotePlayers.get(data.playerId);
    if (player) {
      // Create a temporary muzzle flash effect
      const flashGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8,
      });
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);

      // Position flash near weapon
      flash.position.copy(player.mesh.position);
      flash.position.add(new THREE.Vector3(0.4, 0.5, 0.3));

      // Add to scene temporarily
      const scene = player.mesh.parent;
      if (scene) {
        scene.add(flash);

        // Remove flash after short duration
        setTimeout(() => {
          scene.remove(flash);
        }, 100);
      }

      console.log(`🔫 ${player.data.name} is shooting with ${data.weaponType}`);
    }
  }

  public hideDeadPlayer(playerId: string): void {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      player.mesh.visible = false;
      player.isDead = true;
      console.log(`👻 Hidden dead player: ${player.data.name}`);
    }
  }

  public showRespawnedPlayer(playerId: string, position: any): void {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      player.mesh.visible = true;
      player.isDead = false;

      // Update position
      player.mesh.position.set(position.x, position.y, position.z);

      console.log(`🔄 Showed respawned player: ${player.data.name}`);
    }
  }

  public removeRemotePlayer(playerId: string, scene: THREE.Scene): void {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      scene.remove(player.mesh);
      this.remotePlayers.delete(playerId);
      console.log(`👹 Removed remote player: ${playerId}`);
    }
  }

  public createPlayerModel(colorScheme: any, playerName: string): THREE.Group {
    const playerGroup = new THREE.Group();

    // Create model based on type with enhanced features
    this.createPlayerBodyByType(playerGroup, colorScheme);

    // Add universal features that all players have
    this.addPlayerIdentificationFeatures(playerGroup, colorScheme);
    this.addPlayerNameTag(playerGroup, colorScheme, playerName);

    // Enable shadows
    playerGroup.traverse(function (child) {
      if ((child as THREE.Mesh).isMesh) {
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

  private createPlayerBodyByType(
    playerGroup: THREE.Group,
    colorScheme: any
  ): void {
    const modelType = colorScheme.modelType || "warrior";
    const pattern = colorScheme.pattern || "solid";

    switch (modelType) {
      case "pudding":
        this.createPuddingModel(playerGroup, colorScheme);
        break;
      case "dragon":
        this.createDragonModel(playerGroup, colorScheme);
        break;
      case "spirit":
        this.createSpiritModel(playerGroup, colorScheme);
        break;
      case "electric":
        this.createElectricModel(playerGroup, colorScheme);
        break;
      case "ice":
        this.createIceModel(playerGroup, colorScheme);
        break;
      case "golem":
        this.createGolemModel(playerGroup, colorScheme);
        break;
      case "ninja":
        this.createNinjaModel(playerGroup, colorScheme);
        break;
      case "mage":
        this.createMageModel(playerGroup, colorScheme);
        break;
      case "clockwork":
        this.createClockworkModel(playerGroup, colorScheme);
        break;
      case "cyber":
        this.createCyberModel(playerGroup, colorScheme);
        break;
      case "marine":
        this.createMarineModel(playerGroup, colorScheme);
        break;
      case "cosmic":
        this.createCosmicModel(playerGroup, colorScheme);
        break;
      case "crystal":
        this.createCrystalModel(playerGroup, colorScheme);
        break;
      case "giant":
        this.createGiantModel(playerGroup, colorScheme);
        break;
      case "oracle":
        this.createOracleModel(playerGroup, colorScheme);
        break;
      case "solar":
        this.createSolarModel(playerGroup, colorScheme);
        break;
      case "void":
        this.createVoidModel(playerGroup, colorScheme);
        break;
      case "knight":
        this.createKnightModel(playerGroup, colorScheme);
        break;
      case "dancer":
        this.createDancerModel(playerGroup, colorScheme);
        break;
      default:
        this.createStandardModel(playerGroup, colorScheme);
        break;
    }
  }

  private createStandardModel(
    playerGroup: THREE.Group,
    colorScheme: any
  ): void {
    // Standard humanoid model (warriors, sentinels, guardians, etc.)

    // Body (main torso)
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    playerGroup.add(body);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.head,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    playerGroup.add(head);

    // Eyes
    this.addPlayerEyes(playerGroup, colorScheme, head);

    // Arms and legs
    this.addStandardLimbs(playerGroup, colorScheme);
  }

  private createPuddingModel(playerGroup: THREE.Group, colorScheme: any): void {
    // Soft, rounded character inspired by slime-like creatures

    // Body - more rounded and soft
    const bodyGeometry = new THREE.SphereGeometry(0.6, 12, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
      transparent: true,
      opacity: 0.9,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.scale.set(1, 1.5, 1); // Stretch vertically
    playerGroup.add(body);

    // Head - smaller, cuter
    const headGeometry = new THREE.SphereGeometry(0.25, 10, 8);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.head,
      transparent: true,
      opacity: 0.95,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.3;
    playerGroup.add(head);

    // Large cute eyes
    this.addCuteEyes(playerGroup, colorScheme, head);

    // Stub arms (more blob-like)
    this.addBlobLimbs(playerGroup, colorScheme);
  }

  private createDragonModel(playerGroup: THREE.Group, colorScheme: any): void {
    // Dragon-inspired character with elongated features

    // Body - more elongated and scaled
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    playerGroup.add(body);

    // Dragon head - more angular
    const headGeometry = new THREE.ConeGeometry(0.3, 0.5, 6);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.head,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.rotation.x = Math.PI; // Point forward
    playerGroup.add(head);

    // Dragon eyes
    this.addDragonEyes(playerGroup, colorScheme, head);

    // Wings (decorative)
    this.addDragonWings(playerGroup, colorScheme);

    // Standard limbs but more angular
    this.addAngularLimbs(playerGroup, colorScheme);
  }

  private createNinjaModel(playerGroup: THREE.Group, colorScheme: any): void {
    // Stealthy, sleek ninja character

    // Slim, agile body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.3, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.65;
    playerGroup.add(body);

    // Masked head
    const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.head,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    playerGroup.add(head);

    // Ninja mask details
    this.addNinjaMask(playerGroup, colorScheme, head);

    // Agile limbs
    this.addSlenderLimbs(playerGroup, colorScheme);
  }

  private createMageModel(playerGroup: THREE.Group, colorScheme: any): void {
    // Mystical mage with flowing robes

    // Robe-like body (wider at bottom)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    playerGroup.add(body);

    // Wizard hat head
    const headGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.head,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    playerGroup.add(head);

    // Mystical eyes
    this.addMysticalEyes(playerGroup, colorScheme, head);

    // Add magical orb
    this.addMagicalOrb(playerGroup, colorScheme);

    // Flowing robe arms
    this.addRobeArms(playerGroup, colorScheme);
  }

  private createCyberModel(playerGroup: THREE.Group, colorScheme: any): void {
    // Futuristic cyber character with digital effects

    // Segmented cyber body
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1.1, 0.35);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
      emissive: new THREE.Color(colorScheme.body),
      emissiveIntensity: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.55;
    playerGroup.add(body);

    // Cyber helmet
    const headGeometry = new THREE.BoxGeometry(0.45, 0.4, 0.4);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.head,
      emissive: new THREE.Color(colorScheme.head),
      emissiveIntensity: 0.2,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.35;
    playerGroup.add(head);

    // Cyber visor eyes
    this.addCyberEyes(playerGroup, colorScheme, head);

    // Cyber limbs with joints
    this.addCyberLimbs(playerGroup, colorScheme);

    // Add antenna array
    this.addCyberAntenna(playerGroup, colorScheme);
  }

  // Helper methods for adding features
  private addPlayerEyes(
    playerGroup: THREE.Group,
    colorScheme: any,
    head: THREE.Mesh
  ): void {
    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: colorScheme.eyes,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.45, 0.15);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.45, 0.15);
    head.add(rightEye);
  }

  private addCuteEyes(
    playerGroup: THREE.Group,
    colorScheme: any,
    head: THREE.Mesh
  ): void {
    // Larger, more expressive eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: colorScheme.eyes,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.32, 0.2);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.32, 0.2);
    head.add(rightEye);

    // Add sparkle effect
    const sparkleGeometry = new THREE.SphereGeometry(0.03, 6, 6);
    const sparkleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const leftSparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
    leftSparkle.position.set(-0.08, 1.35, 0.22);
    head.add(leftSparkle);

    const rightSparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
    rightSparkle.position.set(0.12, 1.35, 0.22);
    head.add(rightSparkle);
  }

  private addDragonEyes(
    playerGroup: THREE.Group,
    colorScheme: any,
    head: THREE.Mesh
  ): void {
    // Elongated dragon eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.eyes,
      emissive: new THREE.Color(colorScheme.eyes),
      emissiveIntensity: 0.3,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 1.52, 0.25);
    leftEye.scale.set(1.5, 0.8, 1);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 1.52, 0.25);
    rightEye.scale.set(1.5, 0.8, 1);
    head.add(rightEye);
  }

  private addCyberEyes(
    playerGroup: THREE.Group,
    colorScheme: any,
    head: THREE.Mesh
  ): void {
    // Cyber visor spanning across face
    const visorGeometry = new THREE.BoxGeometry(0.4, 0.08, 0.05);
    const visorMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.eyes,
      emissive: new THREE.Color(colorScheme.eyes),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, 1.38, 0.18);
    head.add(visor);
  }

  private addStandardLimbs(playerGroup: THREE.Group, colorScheme: any): void {
    // Standard arms and legs
    const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const limbMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
    });

    // Arms
    const leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    leftArm.position.set(-0.5, 0.8, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    rightArm.position.set(0.5, 0.8, 0);
    playerGroup.add(rightArm);

    // Legs
    const leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
    leftLeg.position.set(-0.15, -0.4, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
    rightLeg.position.set(0.15, -0.4, 0);
    playerGroup.add(rightLeg);
  }

  private addBlobLimbs(playerGroup: THREE.Group, colorScheme: any): void {
    // Soft, blob-like appendages
    const armGeometry = new THREE.SphereGeometry(0.12, 8, 6);
    const legGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const limbMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
      transparent: true,
      opacity: 0.8,
    });

    // Stub arms
    const leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    leftArm.position.set(-0.4, 0.7, 0);
    leftArm.scale.set(1, 0.6, 1);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    rightArm.position.set(0.4, 0.7, 0);
    rightArm.scale.set(1, 0.6, 1);
    playerGroup.add(rightArm);

    // Blob feet
    const leftFoot = new THREE.Mesh(legGeometry, limbMaterial);
    leftFoot.position.set(-0.2, -0.1, 0);
    leftFoot.scale.set(1, 0.4, 1.2);
    playerGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(legGeometry, limbMaterial);
    rightFoot.position.set(0.2, -0.1, 0);
    rightFoot.scale.set(1, 0.4, 1.2);
    playerGroup.add(rightFoot);
  }

  private addPlayerIdentificationFeatures(
    playerGroup: THREE.Group,
    colorScheme: any
  ): void {
    // Add helmet/headgear to make players more distinct
    const helmetGeometry = new THREE.BoxGeometry(0.45, 0.15, 0.45);
    const helmetMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.weapon,
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 1.6;
    playerGroup.add(helmet);

    // Add team identification antenna/marker
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
    const antennaMaterial = new THREE.MeshBasicMaterial({
      color: colorScheme.eyes,
    });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 1.9;
    playerGroup.add(antenna);
  }

  private addPlayerNameTag(
    playerGroup: THREE.Group,
    colorScheme: any,
    playerName: string
  ): void {
    // This will be handled in the createRemotePlayer method as before
    // Just a placeholder for future enhancements
  }

  // Placeholder methods for additional character types - these can be implemented later
  private createSpiritModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createElectricModel(
    playerGroup: THREE.Group,
    colorScheme: any
  ): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createIceModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createGolemModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createClockworkModel(
    playerGroup: THREE.Group,
    colorScheme: any
  ): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createMarineModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createCosmicModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createCrystalModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createGiantModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createOracleModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createSolarModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createVoidModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createKnightModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }
  private createDancerModel(playerGroup: THREE.Group, colorScheme: any): void {
    this.createStandardModel(playerGroup, colorScheme);
  }

  // Placeholder methods for additional features
  private addDragonWings(playerGroup: THREE.Group, colorScheme: any): void {}
  private addAngularLimbs(playerGroup: THREE.Group, colorScheme: any): void {
    this.addStandardLimbs(playerGroup, colorScheme);
  }
  private addNinjaMask(
    playerGroup: THREE.Group,
    colorScheme: any,
    head: THREE.Mesh
  ): void {}
  private addSlenderLimbs(playerGroup: THREE.Group, colorScheme: any): void {
    this.addStandardLimbs(playerGroup, colorScheme);
  }
  private addMysticalEyes(
    playerGroup: THREE.Group,
    colorScheme: any,
    head: THREE.Mesh
  ): void {
    this.addPlayerEyes(playerGroup, colorScheme, head);
  }
  private addMagicalOrb(playerGroup: THREE.Group, colorScheme: any): void {}
  private addRobeArms(playerGroup: THREE.Group, colorScheme: any): void {
    this.addStandardLimbs(playerGroup, colorScheme);
  }
  private addCyberLimbs(playerGroup: THREE.Group, colorScheme: any): void {
    this.addStandardLimbs(playerGroup, colorScheme);
  }
  private addCyberAntenna(playerGroup: THREE.Group, colorScheme: any): void {}

  private createRemotePlayerWeapon(weaponType: string): THREE.Group | null {
    const weaponGroup = new THREE.Group();

    switch (weaponType) {
      case "shotgun":
        // Double-barrel shotgun for remote players
        const shotgunBarrel1 = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
        const shotgunBarrel2 = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
        const shotgunMaterial = new THREE.MeshLambertMaterial({
          color: 0x2a2a2a,
        });

        const barrel1 = new THREE.Mesh(shotgunBarrel1, shotgunMaterial);
        barrel1.rotation.z = Math.PI / 2;
        barrel1.position.set(0, 0.02, 0);
        weaponGroup.add(barrel1);

        const barrel2 = new THREE.Mesh(shotgunBarrel2, shotgunMaterial);
        barrel2.rotation.z = Math.PI / 2;
        barrel2.position.set(0, -0.02, 0);
        weaponGroup.add(barrel2);

        // Add stock
        const stockGeometry = new THREE.BoxGeometry(0.03, 0.06, 0.12);
        const stockMaterial = new THREE.MeshLambertMaterial({
          color: 0x8b4513,
        });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0, -0.03, -0.2);
        weaponGroup.add(stock);
        break;

      case "chaingun":
        // Multi-barrel chaingun for remote players
        const chaingunBody = new THREE.BoxGeometry(0.05, 0.04, 0.25);
        const chaingunMaterial = new THREE.MeshLambertMaterial({
          color: 0x1a1a1a,
        });
        const chaingunMesh = new THREE.Mesh(chaingunBody, chaingunMaterial);
        weaponGroup.add(chaingunMesh);

        // Add rotating barrels
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const barrelGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4);
          const barrelMesh = new THREE.Mesh(
            barrelGeom,
            new THREE.MeshLambertMaterial({ color: 0x404040 })
          );
          barrelMesh.rotation.z = Math.PI / 2;
          barrelMesh.position.set(
            Math.cos(angle) * 0.02,
            Math.sin(angle) * 0.02,
            0.05
          );
          weaponGroup.add(barrelMesh);
        }
        break;

      case "rocket":
        // Rocket launcher for remote players
        const rocketTube = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
        const rocketMaterial = new THREE.MeshLambertMaterial({
          color: 0x2f4f4f,
        });
        const rocketMesh = new THREE.Mesh(rocketTube, rocketMaterial);
        rocketMesh.rotation.z = Math.PI / 2;
        weaponGroup.add(rocketMesh);

        // Add rocket inside tube
        const rocketGeom = new THREE.CylinderGeometry(0.025, 0.02, 0.25, 6);
        const rocketInsideMaterial = new THREE.MeshLambertMaterial({
          color: 0x8b0000,
          emissive: 0x220000,
        });
        const rocketInside = new THREE.Mesh(rocketGeom, rocketInsideMaterial);
        rocketInside.rotation.z = Math.PI / 2;
        rocketInside.position.set(0, 0, -0.05);
        weaponGroup.add(rocketInside);
        break;

      case "plasma":
        // Plasma rifle for remote players
        const plasmaBody = new THREE.BoxGeometry(0.04, 0.05, 0.35);
        const plasmaMaterial = new THREE.MeshLambertMaterial({
          color: 0x000080,
          emissive: 0x000020,
        });
        const plasmaMesh = new THREE.Mesh(plasmaBody, plasmaMaterial);
        weaponGroup.add(plasmaMesh);

        // Add plasma chamber
        const chamberGeom = new THREE.SphereGeometry(0.025, 8, 6);
        const chamberMaterial = new THREE.MeshLambertMaterial({
          color: 0x00ffff,
          emissive: 0x0080ff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.8,
        });
        const chamber = new THREE.Mesh(chamberGeom, chamberMaterial);
        chamber.position.set(0, 0.02, -0.1);
        weaponGroup.add(chamber);
        break;

      default:
        return null;
    }

    // Position weapon in front of player's right hand, similar to old client
    weaponGroup.position.set(0.5, 0.7, -0.4); // Move to front-right of player like old client
    weaponGroup.rotation.set(-0.2, 0, 0); // Point slightly downward like holding weapon
    weaponGroup.scale.setScalar(1.0); // Match body proportions

    return weaponGroup;
  }

  public getPlayerColor(index: number): any {
    const playerColors = [
      // Original Warriors
      {
        name: "Crimson Warrior",
        emoji: "🔥",
        body: 0x8b0000,
        head: 0xa52a2a,
        eyes: 0xff0000,
        weapon: 0x4a4a4a,
        modelType: "warrior",
        pattern: "solid",
      },
      {
        name: "Azure Sentinel",
        emoji: "💙",
        body: 0x000080,
        head: 0x4169e1,
        eyes: 0x00bfff,
        weapon: 0x2f4f4f,
        modelType: "sentinel",
        pattern: "solid",
      },
      {
        name: "Emerald Guardian",
        emoji: "💚",
        body: 0x006400,
        head: 0x228b22,
        eyes: 0x00ff00,
        weapon: 0x556b2f,
        modelType: "guardian",
        pattern: "solid",
      },
      {
        name: "Golden Crusader",
        emoji: "💛",
        body: 0xb8860b,
        head: 0xffd700,
        eyes: 0xffff00,
        weapon: 0x8b7355,
        modelType: "crusader",
        pattern: "solid",
      },
      {
        name: "Violet Phantom",
        emoji: "💜",
        body: 0x4b0082,
        head: 0x8a2be2,
        eyes: 0x9400d3,
        weapon: 0x483d8b,
        modelType: "phantom",
        pattern: "solid",
      },
      {
        name: "Orange Berserker",
        emoji: "🧡",
        body: 0xff4500,
        head: 0xffa500,
        eyes: 0xff6347,
        weapon: 0x8b4513,
        modelType: "berserker",
        pattern: "solid",
      },
      // New Diverse Characters - Cute/Colorful Style
      {
        name: "Pink Pudding",
        emoji: "🌸",
        body: 0xff69b4,
        head: 0xffb6c1,
        eyes: 0xff1493,
        weapon: 0xc71585,
        modelType: "pudding",
        pattern: "soft",
      },
      {
        name: "Sky Dragon",
        emoji: "🐉",
        body: 0x87ceeb,
        head: 0x4169e1,
        eyes: 0x00bfff,
        weapon: 0x1e90ff,
        modelType: "dragon",
        pattern: "scales",
      },
      {
        name: "Forest Spirit",
        emoji: "🍃",
        body: 0x32cd32,
        head: 0x90ee90,
        eyes: 0x00ff7f,
        weapon: 0x228b22,
        modelType: "spirit",
        pattern: "leaf",
      },
      {
        name: "Lightning Bolt",
        emoji: "⚡",
        body: 0xffff00,
        head: 0xffd700,
        eyes: 0xffffff,
        weapon: 0xdaa520,
        modelType: "electric",
        pattern: "zigzag",
      },
      {
        name: "Ice Crystal",
        emoji: "❄️",
        body: 0xb0e0e6,
        head: 0xe0ffff,
        eyes: 0x00ffff,
        weapon: 0x4682b4,
        modelType: "ice",
        pattern: "crystal",
      },
      {
        name: "Lava Golem",
        emoji: "🌋",
        body: 0x8b0000,
        head: 0xff4500,
        eyes: 0xff6347,
        weapon: 0x654321,
        modelType: "golem",
        pattern: "rocky",
      },
      {
        name: "Shadow Ninja",
        emoji: "🥷",
        body: 0x2f2f2f,
        head: 0x404040,
        eyes: 0x8b0000,
        weapon: 0x000000,
        modelType: "ninja",
        pattern: "stealth",
      },
      {
        name: "Rainbow Mage",
        emoji: "🌈",
        body: 0x9370db,
        head: 0xdda0dd,
        eyes: 0x7b68ee,
        weapon: 0x483d8b,
        modelType: "mage",
        pattern: "magical",
      },
      {
        name: "Copper Clockwork",
        emoji: "⚙️",
        body: 0xb87333,
        head: 0xcd853f,
        eyes: 0xffa500,
        weapon: 0x8b4513,
        modelType: "clockwork",
        pattern: "mechanical",
      },
      {
        name: "Neon Cyber",
        emoji: "🤖",
        body: 0x00ff41,
        head: 0x39ff14,
        eyes: 0x00ffff,
        weapon: 0x008080,
        modelType: "cyber",
        pattern: "digital",
      },
      {
        name: "Coral Marine",
        emoji: "🐠",
        body: 0xff7f50,
        head: 0xffa07a,
        eyes: 0x40e0d0,
        weapon: 0x2e8b57,
        modelType: "marine",
        pattern: "aquatic",
      },
      {
        name: "Starlight Cosmic",
        emoji: "⭐",
        body: 0x191970,
        head: 0x4b0082,
        eyes: 0x9400d3,
        weapon: 0x663399,
        modelType: "cosmic",
        pattern: "starry",
      },
      {
        name: "Autumn Leaf",
        emoji: "🍂",
        body: 0xd2691e,
        head: 0xdaa520,
        eyes: 0xff8c00,
        weapon: 0x8b4513,
        modelType: "nature",
        pattern: "organic",
      },
      {
        name: "Crystal Guardian",
        emoji: "💎",
        body: 0x9acd32,
        head: 0x7fff00,
        eyes: 0x32cd32,
        weapon: 0x556b2f,
        modelType: "crystal",
        pattern: "geometric",
      },
      {
        name: "Desert Mirage",
        emoji: "🏜️",
        body: 0xf4a460,
        head: 0xdeb887,
        eyes: 0xffd700,
        weapon: 0xcd853f,
        modelType: "desert",
        pattern: "sandy",
      },
      {
        name: "Frost Giant",
        emoji: "🧊",
        body: 0x4682b4,
        head: 0x87ceeb,
        eyes: 0xb0e0e6,
        weapon: 0x708090,
        modelType: "giant",
        pattern: "icy",
      },
      {
        name: "Mystic Oracle",
        emoji: "🔮",
        body: 0x8a2be2,
        head: 0x9932cc,
        eyes: 0xda70d6,
        weapon: 0x663399,
        modelType: "oracle",
        pattern: "mystical",
      },
      {
        name: "Solar Flare",
        emoji: "☀️",
        body: 0xffa500,
        head: 0xffd700,
        eyes: 0xffff00,
        weapon: 0xff8c00,
        modelType: "solar",
        pattern: "radiant",
      },
      {
        name: "Void Walker",
        emoji: "🌌",
        body: 0x301934,
        head: 0x483d8b,
        eyes: 0x8a2be2,
        weapon: 0x2f2f2f,
        modelType: "void",
        pattern: "ethereal",
      },
      {
        name: "Emerald Knight",
        emoji: "🛡️",
        body: 0x50c878,
        head: 0x00fa9a,
        eyes: 0x32cd32,
        weapon: 0x2e8b57,
        modelType: "knight",
        pattern: "armored",
      },
      {
        name: "Prism Dancer",
        emoji: "💃",
        body: 0xf0e68c,
        head: 0xffefd5,
        eyes: 0xffc0cb,
        weapon: 0xdda0dd,
        modelType: "dancer",
        pattern: "prismatic",
      },
    ];

    return playerColors[index % playerColors.length];
  }

  // Position sync methods with intelligent throttling
  public startPositionSync(
    getPlayerPosition: () => { position: THREE.Vector3; rotation: THREE.Euler }
  ): void {
    if (!this.socket || !this.isMultiplayer) return;

    // Clear any existing interval
    if (this.positionSyncInterval) {
      clearInterval(this.positionSyncInterval);
    }

    // More frequent checks but intelligent sending
    this.positionSyncInterval = setInterval(() => {
      if (this.socket?.connected && this.isMultiplayer) {
        const playerData = getPlayerPosition();
        // Let sendPlayerPosition decide whether to actually send
        this.sendPlayerPosition(playerData.position, playerData.rotation);
      }
    }, 33); // ~30 FPS checks, but smart sending

    console.log(
      "🎯 Optimized position sync started - only sends when player moves"
    );
  }

  public stopPositionSync(): void {
    if (this.positionSyncInterval) {
      clearInterval(this.positionSyncInterval);
      this.positionSyncInterval = null;
      console.log("🛑 Position sync stopped");
    }
  }

  public forcePositionUpdate(
    position: THREE.Vector3,
    rotation: THREE.Euler
  ): void {
    // Force an immediate position update regardless of thresholds
    this.sendPlayerPosition(position, rotation, true);
  }

  // Clean up all remote players
  public clearRemotePlayers(scene: THREE.Scene): void {
    this.remotePlayers.forEach((player) => {
      scene.remove(player.mesh);
    });
    this.remotePlayers.clear();
    console.log("🧹 Cleared all remote players");
  }

  // Demon synchronization methods
  public handleServerWaveStart(
    data: any,
    onWaveStart: (waveData: any) => void
  ): void {
    console.log(
      `🌊 Starting server-synchronized wave ${data.wave} with ${data.demonsCount} demons`
    );
    onWaveStart(data);
  }

  public handleServerDemonSpawn(
    data: any,
    createDemonCallback: (demonData: any) => any
  ): any {
    try {
      const demon = createDemonCallback(data.demon);
      if (!demon) return null;

      // Set position and rotation from server, but ensure proper ground height
      // Note: Server should ideally send correct Y position, but we fix it locally for now
      const spawnPosition = new THREE.Vector3(
        data.demon.position.x,
        0, // Temporary Y position
        data.demon.position.z
      );
      const groundHeight = this.calculateTerrainAwareGroundHeight(
        data.demon.type,
        spawnPosition
      );
      demon.position.set(
        data.demon.position.x,
        data.demon.position.y || groundHeight, // Use server Y or calculate proper height
        data.demon.position.z
      );
      demon.rotation.set(
        data.demon.rotation.x,
        data.demon.rotation.y,
        data.demon.rotation.z
      );

      // Initialize complete userData for server demons (matching original client demon structure)
      demon.userData = {
        serverId: data.demon.id,
        serverHealth: data.demon.health,
        maxHealth: data.demon.maxHealth,
        isServerControlled: true,
        demonType: data.demon.type,

        // AI properties needed for client-side behavior
        walkSpeed: 0.3,
        rotationSpeed: 0.01 + Math.random() * 0.02,
        wanderDirection: Math.random() * Math.PI * 2,
        wanderTimer: Math.random() * 100,
        attackCooldown: 0,
        isAttacking: false,
        hasAttacked: false,
        originalScale: 1.0,
        attackScaleSet: false,

        // Type-specific properties (use defaults if not available)
        detectRange: 60,
        attackRange: 3.5,
        chaseRange: 8,
        attackDamage: 10,

        // State flags
        isDead: false,
        isFalling: false,
        fallSpeed: 0,
        markedForRemoval: false,
      };

      console.log(
        `👹 Spawned server demon ${data.demon.id} of type ${
          data.demon.type
        } at (${data.demon.position.x.toFixed(
          2
        )}, ${data.demon.position.z.toFixed(2)})`
      );

      return demon;
    } catch (error) {
      console.error("Failed to spawn server demon:", error);
      return null;
    }
  }

  public handleServerDemonDeath(
    data: any,
    demons: any[],
    scene: THREE.Scene,
    createEffectsCallback: (position: THREE.Vector3) => void,
    updateKillCountCallback?: () => void
  ): void {
    // Find the demon by server ID
    const demonIndex = demons.findIndex(
      (demon) => demon.userData && demon.userData.serverId === data.demonId
    );

    if (demonIndex !== -1) {
      const demon = demons[demonIndex];

      // Create death effects
      createEffectsCallback(demon.position);

      // Mark demon as dead immediately to remove from radar
      if (demon.userData) {
        demon.userData.isDead = true;
        demon.userData.markedForRemoval = true;
        demon.userData.serverHealth = 0;
      }

      // Remove from scene immediately
      scene.remove(demon);

      // Remove from demons array immediately
      demons.splice(demonIndex, 1);

      // Update kill count if this player killed it
      if (data.killerId === this.socket?.id && updateKillCountCallback) {
        updateKillCountCallback();
      }

      console.log(
        `💀 Removed server demon ${data.demonId}, killed by ${
          data.killerName || "unknown"
        }`
      );
    } else {
      console.warn(
        `Cannot find demon with serverId: ${data.demonId} for removal`
      );
    }
  }

  public handleServerDemonUpdate(data: any, demons: any[]): void {
    // Find the demon by server ID and update its state
    // Add safety checks to prevent accessing undefined properties
    const demon = demons.find(
      (demon) =>
        demon && demon.userData && demon.userData.serverId === data.demonId
    );

    if (demon) {
      // Update position with smooth interpolation
      demon.position.lerp(
        new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        0.1
      );

      // Update rotation
      demon.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);

      // Update health if provided
      if (data.health !== undefined) {
        demon.userData.serverHealth = data.health;
      }

      // Update AI state if provided
      if (data.aiState) {
        Object.assign(demon.userData, data.aiState);
      }
    } else {
      console.warn(
        `Cannot find demon with serverId: ${data.demonId} in demons array`
      );
    }
  }

  public handleServerWaveComplete(
    data: any,
    onWaveComplete: (waveData: any) => void
  ): void {
    console.log(
      `✅ Wave ${data.wave} complete! ${data.totalKills} demons eliminated`
    );
    onWaveComplete(data);
  }

  // Send demon interaction events to server
  public sendDemonDeath(demonId: string): void {
    console.log(
      `🔍 sendDemonDeath called for ${demonId}, checking conditions:`,
      {
        hasSocket: !!this.socket,
        isConnected: this.isConnected,
        socketConnected: this.socket?.connected,
        isMultiplayer: this.isMultiplayer,
        currentServerURL: this.currentServerURL,
      }
    );

    // Use the same connection check as voice system for consistency
    if (!this.socket || !this.socket.connected) {
      console.warn("🔴 Socket not connected, cannot send demon death event", {
        hasSocket: !!this.socket,
        socketConnected: this.socket?.connected,
        isConnected: this.isConnected,
        isMultiplayer: this.isMultiplayer,
      });
      return;
    }

    if (!this.isMultiplayer) {
      console.warn("🔴 Not in multiplayer mode, cannot send demon death event");
      return;
    }

    console.log(`📤 Sending demon death to server: ${demonId}`);
    // Use the correct event name that matches the server expectation
    this.socket.emit("world:demon:death", {
      demonId: demonId,
    });
    console.log(`✅ Demon death event sent for ${demonId}`);
  }

  // Game state synchronization
  public sendPlayerHealthUpdate(health: number): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("player:health", {
      health: health,
      timestamp: Date.now(),
    });
  }

  public sendPlayerScore(score: number, kills: number): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("player:score", {
      score: score,
      kills: kills,
      timestamp: Date.now(),
    });
  }

  // Weapon and shooting synchronization
  public sendShootingEvent(
    weaponType: string,
    position: THREE.Vector3,
    direction: THREE.Vector3
  ): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    const playerName = this.getPlayerName();
    this.socket.emit("player:shooting", {
      playerId: this.socket.id,
      playerName: playerName,
      weaponType: weaponType,
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      timestamp: Date.now(),
    });
  }

  public sendWeaponSwitch(weaponType: string): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    const playerName = this.getPlayerName();
    this.socket.emit("player:weapon_switch", {
      playerId: this.socket.id,
      playerName: playerName,
      weaponType: weaponType,
      timestamp: Date.now(),
    });
  }

  public sendPlayerDamage(
    targetPlayerId: string,
    damage: number,
    weaponType: string
  ): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    const playerName = this.getPlayerName();
    this.socket.emit("player:damage", {
      attackerId: this.socket.id,
      attackerName: playerName,
      targetPlayerId: targetPlayerId,
      damage: damage,
      weaponType: weaponType,
      timestamp: Date.now(),
    });
  }

  public sendPlayerRespawn(): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    const playerName = this.getPlayerName();
    this.socket.emit("player:respawn", {
      playerId: this.socket.id,
      playerName: playerName,
      timestamp: Date.now(),
    });
  }

  public sendItemPickup(itemType: string, itemId: string): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("item:pickup", {
      itemType: itemType,
      itemId: itemId,
      timestamp: Date.now(),
    });
  }

  public update(_deltaTime: number): void {
    // Update network state if needed
  }

  public joinGame(): void {
    console.log("Joining multiplayer game");
    this.isMultiplayer = true;
  }

  public leaveGame(): void {
    this.isMultiplayer = false;
    this.leaveRoom();
  }

  public disconnect(): void {
    // Stop position sync before disconnecting
    this.stopPositionSync();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentRoom = null;
    this.isRoomLeader = false;
    this.isPlayerReady = false;
    this.isMultiplayer = false;

    // Reset position tracking
    this.lastSentPosition = null;
    this.lastSentRotation = null;
    this.lastPositionSendTime = 0;
  }

  public debugConnectionStatus(): void {
    console.log("🔍 NetworkManager Connection Debug Status:", {
      hasSocket: !!this.socket,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
      isConnected: this.isConnected,
      isMultiplayer: this.isMultiplayer,
      currentServerURL: this.currentServerURL,
      currentRoom: this.currentRoom?.name,
      isRoomLeader: this.isRoomLeader,
      isPlayerReady: this.isPlayerReady,
      windowProtocol: window.location.protocol,
      windowHost: window.location.host,
    });
  }

  /**
   * Test URL normalization for debugging
   */
  public testURLNormalization(testUrl: string): string {
    console.log("🧪 Testing URL normalization for:", testUrl);
    const result = this.normalizeServerURL(testUrl);
    console.log("🧪 Result:", result);
    return result;
  }

  /**
   * Test connection to a specific server URL
   */
  public async testConnection(url: string): Promise<void> {
    console.log("🧪 Testing connection to:", url);
    const originalURL = this.currentServerURL;

    try {
      this.setServerURL(url);

      // Test basic connectivity first
      const isReachable = await this.testServerConnectivity();
      console.log("🧪 Server reachable:", isReachable);

      if (isReachable) {
        console.log("🧪 Attempting Socket.IO connection...");
        this.connectToServer();
      } else {
        console.log("🧪 Server not reachable - skipping Socket.IO test");
      }
    } catch (error) {
      console.error("🧪 Connection test failed:", error);
    } finally {
      // Restore original URL
      this.currentServerURL = originalURL;
    }
  }

  /**
   * Calculate the proper ground height for a demon based on its geometry
   * to ensure feet touch the ground instead of body center
   */
  private calculateDemonGroundHeight(demonType: string): number {
    switch (demonType) {
      case "CACODEMON":
        // Cacodemon floats, so keep it slightly above ground
        return 0.5;
      case "BARON":
        // Baron has legs that extend to -0.4 - 0.5 (leg height/2), so need to offset upward
        return 0.9; // 0.4 (leg bottom) + 0.5 (leg height/2) = 0.9
      case "ARCHVILE":
        // Similar to other humanoid demons but slightly taller
        return 0.8;
      case "DEMON":
      case "IMP":
      default:
        // Standard humanoid demons: legs extend to -0.4 - 0.4 (leg height/2)
        return 0.8; // 0.4 (leg bottom) + 0.4 (leg height/2) = 0.8
    }
  }

  /**
   * Enhanced ground height calculation with terrain awareness and movement constraints
   */
  private calculateTerrainAwareGroundHeight(
    demonType: string,
    position: THREE.Vector3,
    currentHeight?: number,
    bodyType?: string
  ): number {
    const baseHeight = this.calculateDemonGroundHeight(
      bodyType === "floating" ? "CACODEMON" : demonType
    );

    // Special handling for floating demons
    if (demonType === "CACODEMON" || bodyType === "floating") {
      // Floating demons can have slight variation but stay near ground
      const minFloat = 0.3;
      const maxFloat = 1.2;
      const targetFloat = baseHeight;

      // If we have current height, smoothly adjust toward target
      if (currentHeight !== undefined) {
        const heightDiff = Math.abs(currentHeight - targetFloat);
        if (heightDiff > 0.1) {
          // Gradually move toward target height
          const adjustSpeed = 0.02;
          if (currentHeight > targetFloat) {
            return Math.max(targetFloat, currentHeight - adjustSpeed);
          } else {
            return Math.min(targetFloat, currentHeight + adjustSpeed);
          }
        }
      }

      return Math.max(minFloat, Math.min(maxFloat, targetFloat));
    }

    // For ground-based demons, enforce strict ground contact
    const groundLevel = 0.0; // Scene ground level
    const minHeight = groundLevel + baseHeight * 0.9; // Allow slight ground penetration tolerance
    const maxHeight = groundLevel + baseHeight * 1.1; // Prevent excessive floating

    // If we have current height, prevent rapid height changes
    if (currentHeight !== undefined) {
      const maxHeightChange = 0.05; // Maximum height change per frame
      const targetHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight));
      const heightDiff = targetHeight - currentHeight;

      if (Math.abs(heightDiff) > maxHeightChange) {
        // Gradually adjust height to prevent jumping
        return currentHeight + Math.sign(heightDiff) * maxHeightChange;
      }
    }

    return Math.max(minHeight, Math.min(maxHeight, baseHeight));
  }
}

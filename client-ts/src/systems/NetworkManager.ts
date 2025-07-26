import * as THREE from "three";
import { io, Socket } from "socket.io-client";
import { NetworkState, PlayerData, RoomData } from "@/types/network";

export class NetworkManager implements NetworkState {
  public socket: Socket | null = null;
  public isConnected = false;
  public currentRoom: RoomData | null = null;
  public localPlayer: PlayerData | null = null;
  public remotePlayers = new Map<string, any>();
  public isRoomLeader = false;
  public isMultiplayer = false;
  public isPlayerReady = false;

  // Server connection
  private currentServerURL = "http://localhost:3000";

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

  public async initialize(): Promise<void> {
    console.log("🎮 NetworkManager initializing...");

    // Initialize voice chat system
    await this.initVoiceChat();

    console.log("✅ NetworkManager initialized");
  }

  public setServerURL(url: string): void {
    this.currentServerURL = url;
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

    try {
      this.socket = io(this.currentServerURL, {
        timeout: 10000, // 10 second timeout
        transports: ["websocket", "polling"], // Try websocket first, fallback to polling
      });
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
      this.updateConnectionStatus(
        `🔴 Connection failed: ${error.message || "Unknown error"}`
      );
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
      if (this.onPartyMembersUpdate) {
        this.onPartyMembersUpdate(data.players);
      }
    });

    this.socket.on("room:list", (rooms) => {
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
      // Update party members list with new ready states
      if (this.onPartyMembersUpdate && data.players) {
        this.onPartyMembersUpdate(data.players);
      }
    });

    this.socket.on("party:all_ready", (data) => {
      console.log("All players ready:", data);
      // Update UI to reflect all players are ready
      if (this.onPartyMembersUpdate && data.players) {
        this.onPartyMembersUpdate(data.players);
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
      if (this.onDemonDeath) {
        this.onDemonDeath(data);
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

  // Player position sync
  public sendPlayerPosition(
    position: THREE.Vector3,
    rotation: THREE.Euler
  ): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("player:position", {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
    });
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
      playerMesh.position.set(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
      );

      // Scale player model to be slightly larger than demons for visibility
      playerMesh.scale.setScalar(1.2);

      // Store player data
      const playerInfo = {
        mesh: playerMesh,
        data: playerData,
        colorScheme: colorScheme,
      };

      this.remotePlayers.set(playerData.id, playerInfo);
      scene.add(playerMesh);

      console.log(
        `👹 Created remote player: ${playerData.name} (${colorScheme.name})`
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
      // Smooth interpolation
      player.mesh.position.lerp(
        new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        0.1
      );
      player.mesh.rotation.set(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
      );
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

  private createPlayerModel(colorScheme: any, playerName: string): THREE.Group {
    const playerGroup = new THREE.Group();

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

    // Eyes (glowing to make players distinct from demons)
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

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMaterial = new THREE.MeshLambertMaterial({
      color: colorScheme.body,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.8, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.8, 0);
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

  private getPlayerColor(index: number): any {
    const playerColors = [
      {
        name: "Crimson Warrior",
        emoji: "🔥",
        body: 0x8b0000,
        head: 0xa52a2a,
        eyes: 0xff0000,
        weapon: 0x4a4a4a,
      },
      {
        name: "Azure Sentinel",
        emoji: "💙",
        body: 0x000080,
        head: 0x4169e1,
        eyes: 0x00bfff,
        weapon: 0x2f4f4f,
      },
      {
        name: "Emerald Guardian",
        emoji: "💚",
        body: 0x006400,
        head: 0x228b22,
        eyes: 0x00ff00,
        weapon: 0x556b2f,
      },
      {
        name: "Golden Crusader",
        emoji: "💛",
        body: 0xb8860b,
        head: 0xffd700,
        eyes: 0xffff00,
        weapon: 0x8b7355,
      },
      {
        name: "Violet Phantom",
        emoji: "💜",
        body: 0x4b0082,
        head: 0x8a2be2,
        eyes: 0x9400d3,
        weapon: 0x483d8b,
      },
      {
        name: "Orange Berserker",
        emoji: "🧡",
        body: 0xff4500,
        head: 0xffa500,
        eyes: 0xff6347,
        weapon: 0x8b4513,
      },
    ];

    return playerColors[index % playerColors.length];
  }

  // Position sync methods
  public startPositionSync(
    getPlayerPosition: () => { position: THREE.Vector3; rotation: THREE.Euler }
  ): void {
    if (!this.socket || !this.isMultiplayer) return;

    setInterval(() => {
      if (this.socket?.connected && this.isMultiplayer) {
        const playerData = getPlayerPosition();
        this.sendPlayerPosition(playerData.position, playerData.rotation);
      }
    }, 50); // 20 FPS position updates
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

      // Initialize complete userData for server demons
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

        // State flags
        isDead: false,
        isFalling: false,
        fallSpeed: 0,
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
      (demon) => demon.userData.serverId === data.demonId
    );

    if (demonIndex !== -1) {
      const demon = demons[demonIndex];

      // Create death effects
      createEffectsCallback(demon.position);

      // Remove from scene and array
      scene.remove(demon);
      demons.splice(demonIndex, 1);

      // Update kill count if this player killed it
      if (data.killerId === this.socket?.id && updateKillCountCallback) {
        updateKillCountCallback();
      }

      console.log(
        `💀 Removed server demon ${data.demonId}, killed by ${data.killerName}`
      );
    }
  }

  public handleServerDemonUpdate(data: any, demons: any[]): void {
    // Find the demon by server ID and update its state
    const demon = demons.find(
      (demon) => demon.userData.serverId === data.demonId
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
  public sendDemonHit(
    demonId: string,
    damage: number,
    weaponType: string
  ): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("demon:hit", {
      demonId: demonId,
      damage: damage,
      weaponType: weaponType,
      timestamp: Date.now(),
    });
  }

  public sendDemonKill(demonId: string, weaponType: string): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("demon:kill", {
      demonId: demonId,
      weaponType: weaponType,
      timestamp: Date.now(),
    });
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

  // Weapon and item synchronization
  public sendWeaponSwitch(weaponType: string): void {
    if (!this.socket || !this.isConnected || !this.isMultiplayer) {
      return;
    }

    this.socket.emit("player:weapon", {
      weapon: weaponType,
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
  }

  public leaveGame(): void {
    this.isMultiplayer = false;
    this.leaveRoom();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentRoom = null;
    this.isRoomLeader = false;
    this.isPlayerReady = false;
    this.isMultiplayer = false;
  }
}

import express from "express";
import * as http from "http";
import * as os from "os";
import { Server as SocketIO } from "socket.io";
import { GAME_EVENTS } from "./events";
import cors from "cors";

const app = express();
const server = http.createServer(app);

// Allow connections from any origin for LAN play
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
      ]
    : true; // Allow all origins in development for LAN access

// Configure CORS for Express
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = new SocketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all network interfaces

type Player = {
  id: string;
  userId: string;
  name: string;
  kills: number;
  deaths: number;
  score: number;
  health: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  weapon: string;
  ready: boolean;
  roomId?: string;
};

type Demon = {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  isAlive: boolean;
  spawnTime: number;
};

type GameState = {
  currentWave: number;
  demons: Map<string, Demon>;
  waveInProgress: boolean;
  waveStartTime: number;
  demonsSpawnedThisWave: number;
  demonsKilledThisWave: number;
  aiInterval?: NodeJS.Timeout;
};

type Room = {
  id: string;
  name: string;
  maxPlayers: number;
  mapType: string;
  players: Player[];
  isActive: boolean;
  leaderId: string;
  gameStarted: boolean;
  createdAt: Date;
  gameState?: GameState;
};

type LeaderBoard = Record<string, Player>;

let activePlayers: Map<string, Player> = new Map();
let rooms: Map<string, Room> = new Map();
const leaderBoard: LeaderBoard = {};

// Helper functions
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoomsList() {
  return Array.from(rooms.values())
    .filter((room) => room.isActive && !room.gameStarted)
    .map((room) => ({
      id: room.id,
      name: room.name,
      players: room.players.length,
      maxPlayers: room.maxPlayers,
      mapType: room.mapType,
      createdAt: room.createdAt,
    }));
}

function broadcastToRoom(
  roomId: string,
  event: string,
  data: any,
  excludeSocket?: string
) {
  if (excludeSocket) {
    // Broadcast to all sockets in room except the excluded one
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      room.forEach((socketId) => {
        if (socketId !== excludeSocket) {
          io.to(socketId).emit(event, data);
        }
      });
    }
  } else {
    io.to(roomId).emit(event, data);
  }
}

// Demon type definitions (matching client-side)
const DEMON_TYPES = {
  IMP: {
    name: "Imp",
    health: 1,
    speed: 1.0,
    scale: 1.0,
    spawnWeight: 100,
    attackDamage: 10,
  },
  DEMON: {
    name: "Demon",
    health: 2,
    speed: 1.8,
    scale: 0.9,
    spawnWeight: 60,
    attackDamage: 15,
  },
  CACODEMON: {
    name: "Cacodemon",
    health: 4,
    speed: 0.8,
    scale: 1.6,
    spawnWeight: 30,
    attackDamage: 20,
  },
  BARON: {
    name: "Baron of Hell",
    health: 8,
    speed: 0.6,
    scale: 2.2,
    spawnWeight: 5,
    attackDamage: 35,
  },
};

function generateDemonId(): string {
  return Math.random().toString(36).substring(2, 12);
}

function getRandomSpawnPosition(): { x: number; y: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * 20; // Spawn 30-50 units away
  return {
    x: Math.cos(angle) * distance,
    y: 0,
    z: Math.sin(angle) * distance,
  };
}

function selectDemonType(waveNumber: number): string {
  const availableTypes = [];

  // Add demons based on wave progression
  if (waveNumber >= 1)
    availableTypes.push(...Array(DEMON_TYPES.IMP.spawnWeight).fill("IMP"));
  if (waveNumber >= 2)
    availableTypes.push(...Array(DEMON_TYPES.DEMON.spawnWeight).fill("DEMON"));
  if (waveNumber >= 4)
    availableTypes.push(
      ...Array(DEMON_TYPES.CACODEMON.spawnWeight).fill("CACODEMON")
    );
  if (waveNumber >= 7)
    availableTypes.push(...Array(DEMON_TYPES.BARON.spawnWeight).fill("BARON"));

  return (
    availableTypes[Math.floor(Math.random() * availableTypes.length)] || "IMP"
  );
}

function spawnDemon(room: Room): Demon | null {
  if (!room.gameState) return null;

  const demonType = selectDemonType(room.gameState.currentWave);
  const typeData = DEMON_TYPES[demonType as keyof typeof DEMON_TYPES];

  const demon: Demon = {
    id: generateDemonId(),
    type: demonType,
    position: getRandomSpawnPosition(),
    rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
    health: typeData.health,
    maxHealth: typeData.health,
    isAlive: true,
    spawnTime: Date.now(),
  };

  room.gameState.demons.set(demon.id, demon);
  room.gameState.demonsSpawnedThisWave++;

  return demon;
}

function initializeGameState(room: Room): void {
  room.gameState = {
    currentWave: 1,
    demons: new Map(),
    waveInProgress: false,
    waveStartTime: Date.now(),
    demonsSpawnedThisWave: 0,
    demonsKilledThisWave: 0,
  };
}

function startWave(room: Room): void {
  if (!room.gameState) return;

  room.gameState.waveInProgress = true;
  room.gameState.waveStartTime = Date.now();
  room.gameState.demonsSpawnedThisWave = 0;
  room.gameState.demonsKilledThisWave = 0;

  // Calculate demons for this wave
  const demonsThisWave = Math.min(5 + room.gameState.currentWave * 2, 20);

  // Broadcast wave start
  broadcastToRoom(room.id, GAME_EVENTS.WORLD.WAVE_START, {
    wave: room.gameState.currentWave,
    demonsCount: demonsThisWave,
  });

  // Spawn demons over time
  const spawnInterval = setInterval(() => {
    if (
      !room.gameState ||
      !room.gameState.waveInProgress ||
      room.gameState.demonsSpawnedThisWave >= demonsThisWave
    ) {
      clearInterval(spawnInterval);
      return;
    }

    const demon = spawnDemon(room);
    if (demon) {
      broadcastToRoom(room.id, GAME_EVENTS.WORLD.DEMON_SPAWN, {
        demon: {
          id: demon.id,
          type: demon.type,
          position: demon.position,
          rotation: demon.rotation,
          health: demon.health,
          maxHealth: demon.maxHealth,
        },
      });
    }
  }, 2000); // Spawn every 2 seconds

  // Start demon AI update loop for this room
  startDemonAI(room);
}

function getPlayersByRoom(roomId: string): Player[] {
  const room = rooms.get(roomId);
  return room ? room.players : [];
}

// Server-side demon AI system
function startDemonAI(room: Room): void {
  if (!room.gameState || room.gameState.aiInterval) return;

  // Update demon AI every 100ms
  room.gameState.aiInterval = setInterval(() => {
    if (
      !room.gameState ||
      !room.gameState.waveInProgress ||
      room.players.length === 0
    ) {
      return;
    }

    updateDemonAI(room);
  }, 100);
}

function updateDemonAI(room: Room): void {
  if (!room.gameState) return;

  const players = room.players;
  if (players.length === 0) return;

  room.gameState.demons.forEach((demon, demonId) => {
    if (!demon.isAlive) return;

    // Find closest player
    let closestPlayer = null;
    let closestDistance = Infinity;

    for (const player of players) {
      const dx = player.position.x - demon.position.x;
      const dz = player.position.z - demon.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlayer = player;
      }
    }

    if (!closestPlayer) return;

    const typeData = DEMON_TYPES[demon.type as keyof typeof DEMON_TYPES];
    const detectRange = typeData ? 60 : 60; // Default detection range
    const attackRange = typeData ? 3.5 : 3.5; // Default attack range
    const speed = typeData ? typeData.speed * 0.02 : 0.02; // Movement speed

    // If player is within detection range
    if (closestDistance < detectRange) {
      // Calculate direction to player
      const dx = closestPlayer.position.x - demon.position.x;
      const dz = closestPlayer.position.z - demon.position.z;
      const direction = Math.atan2(dx, dz);

      // Update demon rotation to face player
      demon.rotation.y = direction;

      // If within attack range, deal damage
      if (closestDistance < attackRange) {
        // Attack player (damage handling will be done client-side)
        const attackDamage = typeData ? typeData.attackDamage || 10 : 10;

        // Broadcast demon attack to all clients
        broadcastToRoom(room.id, GAME_EVENTS.COMBAT.DAMAGE, {
          demonId: demon.id,
          playerId: closestPlayer.id,
          damage: attackDamage,
          position: demon.position,
          timestamp: Date.now(),
        });
      } else {
        // Move towards player
        const normalizedX = dx / closestDistance;
        const normalizedZ = dz / closestDistance;

        demon.position.x += normalizedX * speed;
        demon.position.z += normalizedZ * speed;

        // Keep demon within bounds
        demon.position.x = Math.max(-45, Math.min(45, demon.position.x));
        demon.position.z = Math.max(-45, Math.min(45, demon.position.z));
      }

      // Broadcast position update to all clients
      broadcastToRoom(room.id, GAME_EVENTS.WORLD.DEMON_UPDATE, {
        demonId: demon.id,
        position: demon.position,
        rotation: demon.rotation,
        timestamp: Date.now(),
      });
    }
  });
}

function stopDemonAI(room: Room): void {
  if (room.gameState && room.gameState.aiInterval) {
    clearInterval(room.gameState.aiInterval);
    room.gameState.aiInterval = undefined;
  }
}

server.listen(Number(PORT), HOST, () => {
  console.log(`✅ Doom Protocol Server listening on ${HOST}:${PORT}`);
  console.log(`🌐 LAN Access: Connect clients to http://<your-ip>:${PORT}`);

  // Try to display the actual IP address
  const networkInterfaces = os.networkInterfaces();
  const lanIPs: string[] = [];

  for (const interfaceName of Object.keys(networkInterfaces)) {
    const networkInterface = networkInterfaces[interfaceName];
    if (networkInterface) {
      for (const address of networkInterface) {
        if (address.family === "IPv4" && !address.internal) {
          lanIPs.push(address.address);
        }
      }
    }
  }

  if (lanIPs.length > 0) {
    console.log(`🏠 Your LAN IP(s): ${lanIPs.join(", ")}`);
    console.log(`🎮 Players can connect to: http://${lanIPs[0]}:${PORT}`);
  }
});

app.get("/", (req, res) => {
  res.send("<h1>🔥 Doom Protocol Server 🔥</h1>");
});

app.get("/leaderboard", (req, res) => {
  res.send(leaderBoard);
});

app.get("/rooms", (req, res) => {
  res.json(getRoomsList());
});

io.on("connection", (socket) => {
  console.log("🔥 Demon connected:", socket.id);

  // Initialize player
  const player: Player = {
    id: socket.id,
    userId: socket.id,
    name: `Demon-${socket.id.substring(0, 5)}`,
    kills: 0,
    deaths: 0,
    score: 0,
    health: 100,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    weapon: "shotgun",
    ready: false,
  };

  activePlayers.set(socket.id, player);

  socket.broadcast.emit(GAME_EVENTS.USER.CONNECTED, {
    id: socket.id,
    userId: socket.id,
    message: "A demon has entered Hell",
  });

  // Handle user joining
  socket.on(GAME_EVENTS.USER.JOINED, (payload) => {
    const player = activePlayers.get(socket.id);
    if (player) {
      player.name = payload.name || player.name;
      activePlayers.set(socket.id, player);

      // Add to leaderboard
      leaderBoard[socket.id] = {
        id: socket.id,
        userId: socket.id,
        name: player.name,
        kills: 0,
        deaths: 0,
        score: 0,
        health: 100,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        weapon: "shotgun",
        ready: false,
      };

      socket.broadcast.emit(GAME_EVENTS.USER.JOINED, {
        id: socket.id,
        userId: socket.id,
        name: player.name,
      });
    }
  });

  // Room Management
  socket.on(GAME_EVENTS.ROOM.CREATE, (payload) => {
    const roomId = generateRoomId();
    const player = activePlayers.get(socket.id);

    if (!player) return;

    const room: Room = {
      id: roomId,
      name: payload.name || `${player.name}'s Chamber`,
      maxPlayers: payload.maxPlayers || 4,
      mapType: payload.mapType || "hellscape",
      players: [player],
      isActive: true,
      leaderId: socket.id,
      gameStarted: false,
      createdAt: new Date(),
    };

    player.roomId = roomId;
    rooms.set(roomId, room);
    socket.join(roomId);

    socket.emit(GAME_EVENTS.ROOM.CREATED, {
      room: {
        id: room.id,
        name: room.name,
        maxPlayers: room.maxPlayers,
        mapType: room.mapType,
      },
      isLeader: true,
      players: [
        {
          id: player.id,
          name: player.name,
          ready: player.ready,
          isLeader: true,
        },
      ],
    });

    console.log(`🏰 Room created: ${roomId} by ${player.name}`);
  });

  socket.on(GAME_EVENTS.ROOM.JOIN, (payload) => {
    const roomId = payload.roomId;
    const room = rooms.get(roomId);
    const player = activePlayers.get(socket.id);

    if (!room || !player) {
      socket.emit(GAME_EVENTS.ROOM.NOT_FOUND);
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit(GAME_EVENTS.ROOM.FULL);
      return;
    }

    if (room.gameStarted) {
      socket.emit(GAME_EVENTS.ROOM.STARTED);
      return;
    }

    // Add player to room
    player.roomId = roomId;
    room.players.push(player);
    socket.join(roomId);

    // Notify player they joined
    socket.emit(GAME_EVENTS.ROOM.JOINED, {
      room: {
        id: room.id,
        name: room.name,
        maxPlayers: room.maxPlayers,
        mapType: room.mapType,
      },
      isLeader: room.leaderId === socket.id,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isLeader: p.id === room.leaderId,
      })),
    });

    // Notify other players in room
    socket.to(roomId).emit(GAME_EVENTS.PARTY.MEMBER_JOINED, {
      player: {
        id: player.id,
        name: player.name,
        ready: player.ready,
        isLeader: false,
      },
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isLeader: p.id === room.leaderId,
      })),
    });

    console.log(`👹 ${player.name} joined room ${roomId}`);
  });

  socket.on(GAME_EVENTS.ROOM.LIST, () => {
    socket.emit(GAME_EVENTS.ROOM.LIST, getRoomsList());
  });

  socket.on(GAME_EVENTS.ROOM.LEAVE, () => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.leave(player.roomId);

    // Notify other players
    socket.to(player.roomId).emit(GAME_EVENTS.PARTY.MEMBER_LEFT, {
      playerId: socket.id,
      playerName: player.name,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isLeader: p.id === room.leaderId,
      })),
    });

    // If room is empty or leader left, handle room cleanup
    if (room.players.length === 0) {
      // Stop demon AI when room is empty
      stopDemonAI(room);
      rooms.delete(player.roomId);
      console.log(`🏰 Room ${player.roomId} destroyed (empty)`);
    } else if (room.leaderId === socket.id) {
      // Transfer leadership to next player
      room.leaderId = room.players[0].id;
      broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.LEADER_CHANGED, {
        newLeaderId: room.leaderId,
        newLeaderName: room.players[0].name,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          ready: p.ready,
          isLeader: p.id === room.leaderId,
        })),
      });
    }

    player.roomId = undefined;
    console.log(`👹 ${player.name} left room`);
  });

  // Chat system
  socket.on(GAME_EVENTS.CHAT.LOBBY_MESSAGE, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    broadcastToRoom(player.roomId, GAME_EVENTS.CHAT.LOBBY_MESSAGE, {
      playerId: socket.id,
      playerName: player.name,
      message: payload.message,
      timestamp: new Date(),
    });
  });

  socket.on(GAME_EVENTS.CHAT.GAME_MESSAGE, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    broadcastToRoom(player.roomId, GAME_EVENTS.CHAT.GAME_MESSAGE, {
      playerId: socket.id,
      playerName: player.name,
      message: payload.message,
      timestamp: new Date(),
    });
  });

  // Voice chat system
  socket.on(GAME_EVENTS.VOICE.MESSAGE, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    // Broadcast voice message to all other players in the room
    broadcastToRoom(
      player.roomId,
      GAME_EVENTS.VOICE.MESSAGE,
      {
        playerId: socket.id,
        playerName: player.name,
        type: payload.type,
        message: payload.message,
        timestamp: new Date(),
      },
      socket.id
    ); // Exclude sender
  });

  socket.on(GAME_EVENTS.VOICE.DATA, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    // Broadcast voice data to all other players in the room
    broadcastToRoom(
      player.roomId,
      GAME_EVENTS.VOICE.DATA,
      {
        playerId: socket.id,
        playerName: player.name,
        type: payload.type,
        audioData: payload.audioData,
        timestamp: new Date(),
      },
      socket.id
    ); // Exclude sender
  });

  // Player ready state
  socket.on(GAME_EVENTS.PLAYER.READY, () => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    player.ready = true;
    const room = rooms.get(player.roomId);
    if (!room) return;

    broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.READY_STATE, {
      playerId: socket.id,
      ready: true,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isLeader: p.id === room.leaderId,
      })),
    });

    // Check if all players are ready
    const allReady = room.players.every((p) => p.ready);
    if (allReady && room.players.length >= 2) {
      broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.ALL_READY, {
        canStart: true,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          ready: p.ready,
          isLeader: p.id === room.leaderId,
        })),
      });
    }
  });

  socket.on(GAME_EVENTS.PLAYER.NOT_READY, () => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    player.ready = false;
    const room = rooms.get(player.roomId);
    if (!room) return;

    broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.READY_STATE, {
      playerId: socket.id,
      ready: false,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isLeader: p.id === room.leaderId,
      })),
    });
  });

  // Game start
  socket.on(GAME_EVENTS.GAME.START, () => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    const room = rooms.get(player.roomId);
    if (!room || room.leaderId !== socket.id) return;

    room.gameStarted = true;

    // Initialize game state
    initializeGameState(room);

    broadcastToRoom(player.roomId, GAME_EVENTS.GAME.START, {
      roomId: player.roomId,
      mapType: room.mapType,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        rotation: p.rotation,
      })),
    });

    console.log(`🎮 Game started in room ${player.roomId}`);

    // Start first wave after a short delay
    setTimeout(() => {
      if (room.gameState) {
        startWave(room);
      }
    }, 3000);
  });

  // Game state synchronization
  socket.on(GAME_EVENTS.PLAYER.POSITION, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    player.position = payload.position;
    player.rotation = payload.rotation;

    socket.to(player.roomId).emit(GAME_EVENTS.PLAYER.POSITION, {
      playerId: socket.id,
      position: payload.position,
      rotation: payload.rotation,
      timestamp: Date.now(),
    });
  });

  socket.on(GAME_EVENTS.WEAPON.SHOOT, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    socket.to(player.roomId).emit(GAME_EVENTS.WEAPON.SHOOT, {
      playerId: socket.id,
      weapon: payload.weapon,
      origin: payload.origin,
      direction: payload.direction,
      timestamp: Date.now(),
    });
  });

  socket.on(GAME_EVENTS.COMBAT.HIT, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    socket.to(player.roomId).emit(GAME_EVENTS.COMBAT.HIT, {
      playerId: socket.id,
      targetId: payload.targetId,
      damage: payload.damage,
      weapon: payload.weapon,
      timestamp: Date.now(),
    });
  });

  // Handle demon death
  socket.on(GAME_EVENTS.WORLD.DEMON_DEATH, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    const room = rooms.get(player.roomId);
    if (!room || !room.gameState) return;

    const demon = room.gameState.demons.get(payload.demonId);
    if (demon && demon.isAlive) {
      demon.isAlive = false;
      room.gameState.demonsKilledThisWave++;

      // Update player stats
      player.kills++;
      player.score += 100;

      // Broadcast demon death to all players
      broadcastToRoom(player.roomId, GAME_EVENTS.WORLD.DEMON_DEATH, {
        demonId: payload.demonId,
        killerId: socket.id,
        killerName: player.name,
        position: demon.position,
      });

      // Check if wave is complete
      const demonsThisWave = Math.min(5 + room.gameState.currentWave * 2, 20);
      if (room.gameState.demonsKilledThisWave >= demonsThisWave) {
        // Wave complete
        room.gameState.waveInProgress = false;
        room.gameState.currentWave++;

        broadcastToRoom(player.roomId, GAME_EVENTS.WORLD.WAVE_COMPLETE, {
          wave: room.gameState.currentWave - 1,
          nextWave: room.gameState.currentWave,
          playersStats: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            kills: p.kills,
            score: p.score,
          })),
        });

        // Start next wave after delay
        setTimeout(() => {
          if (room.gameState && room.gameStarted) {
            startWave(room);
          }
        }, 5000);
      }
    }
  });

  // Handle demon position updates (for AI movement sync)
  socket.on(GAME_EVENTS.WORLD.DEMON_UPDATE, (payload) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    const room = rooms.get(player.roomId);
    if (!room || !room.gameState) return;

    const demon = room.gameState.demons.get(payload.demonId);
    if (demon && demon.isAlive) {
      demon.position = payload.position;
      demon.rotation = payload.rotation;

      // Broadcast to other players (but not the sender)
      socket.to(player.roomId).emit(GAME_EVENTS.WORLD.DEMON_UPDATE, {
        demonId: payload.demonId,
        position: payload.position,
        rotation: payload.rotation,
        timestamp: Date.now(),
      });
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("👹 Demon disconnected:", socket.id);

    const player = activePlayers.get(socket.id);
    if (player && player.roomId) {
      const room = rooms.get(player.roomId);
      if (room) {
        // Remove player from room
        room.players = room.players.filter((p) => p.id !== socket.id);

        // Notify other players
        socket.to(player.roomId).emit(GAME_EVENTS.PARTY.MEMBER_LEFT, {
          playerId: socket.id,
          playerName: player.name,
        });

        // Handle room cleanup
        if (room.players.length === 0) {
          rooms.delete(player.roomId);
        } else if (room.leaderId === socket.id && room.players.length > 0) {
          room.leaderId = room.players[0].id;
          broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.LEADER_CHANGED, {
            newLeaderId: room.leaderId,
            newLeaderName: room.players[0].name,
          });
        }
      }
    }

    activePlayers.delete(socket.id);
    delete leaderBoard[socket.id];

    socket.broadcast.emit(GAME_EVENTS.USER.DISCONNECTED, {
      id: socket.id,
      userId: socket.id,
      message: "A demon has left Hell",
    });
  });
});

// Cleanup empty rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    // Remove rooms that are empty for more than 5 minutes
    if (
      room.players.length === 0 &&
      now - room.createdAt.getTime() > 5 * 60 * 1000
    ) {
      rooms.delete(roomId);
      console.log(`🧹 Cleaned up empty room: ${roomId}`);
    }
  }
}, 60000); // Check every minute

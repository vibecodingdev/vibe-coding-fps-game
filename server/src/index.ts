import express from "express";
import * as http from "http";
import { Server as SocketIO } from "socket.io";
import { GAME_EVENTS } from "./events";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const allowedOrigins = ["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"];

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
    .filter(room => room.isActive && !room.gameStarted)
    .map(room => ({
      id: room.id,
      name: room.name,
      players: room.players.length,
      maxPlayers: room.maxPlayers,
      mapType: room.mapType,
      createdAt: room.createdAt,
    }));
}

function broadcastToRoom(roomId: string, event: string, data: any) {
  io.to(roomId).emit(event, data);
}

function getPlayersByRoom(roomId: string): Player[] {
  const room = rooms.get(roomId);
  return room ? room.players : [];
}

server.listen(PORT, () => {
  console.log(`✅ Doom Protocol Server listening on port ${PORT}`);
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
      players: room.players.map(p => ({
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
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(player.roomId);

    // Notify other players
    socket.to(player.roomId).emit(GAME_EVENTS.PARTY.MEMBER_LEFT, {
      playerId: socket.id,
      playerName: player.name,
    });

    // If room is empty or leader left, handle room cleanup
    if (room.players.length === 0) {
      rooms.delete(player.roomId);
      console.log(`🏰 Room ${player.roomId} destroyed (empty)`);
    } else if (room.leaderId === socket.id) {
      // Transfer leadership to next player
      room.leaderId = room.players[0].id;
      broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.LEADER_CHANGED, {
        newLeaderId: room.leaderId,
        newLeaderName: room.players[0].name,
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
    });

    // Check if all players are ready
    const allReady = room.players.every(p => p.ready);
    if (allReady && room.players.length >= 2) {
      broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.ALL_READY, {
        canStart: true,
      });
    }
  });

  socket.on(GAME_EVENTS.PLAYER.NOT_READY, () => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    player.ready = false;
    broadcastToRoom(player.roomId, GAME_EVENTS.PARTY.READY_STATE, {
      playerId: socket.id,
      ready: false,
    });
  });

  // Game start
  socket.on(GAME_EVENTS.GAME.START, () => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.roomId) return;

    const room = rooms.get(player.roomId);
    if (!room || room.leaderId !== socket.id) return;

    room.gameStarted = true;
    broadcastToRoom(player.roomId, GAME_EVENTS.GAME.START, {
      roomId: player.roomId,
      mapType: room.mapType,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        rotation: p.rotation,
      })),
    });

    console.log(`🎮 Game started in room ${player.roomId}`);
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

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("👹 Demon disconnected:", socket.id);

    const player = activePlayers.get(socket.id);
    if (player && player.roomId) {
      const room = rooms.get(player.roomId);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
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
    if (room.players.length === 0 && 
        now - room.createdAt.getTime() > 5 * 60 * 1000) {
      rooms.delete(roomId);
      console.log(`🧹 Cleaned up empty room: ${roomId}`);
    }
  }
}, 60000); // Check every minute

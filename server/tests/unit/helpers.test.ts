import { GAME_EVENTS } from "../../src/events";

// Mock helper functions that would be in the main server file
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoomsList(rooms: Map<string, any>) {
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

function getPlayersByRoom(roomId: string, rooms: Map<string, any>) {
  const room = rooms.get(roomId);
  return room ? room.players : [];
}

describe("Helper Functions", () => {
  describe("generateRoomId", () => {
    it("should generate a room ID", () => {
      const roomId = generateRoomId();
      expect(typeof roomId).toBe("string");
      expect(roomId.length).toBe(6);
      expect(roomId).toMatch(/^[A-Z0-9]+$/);
    });

    it("should generate unique room IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRoomId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("getRoomsList", () => {
    let rooms: Map<string, any>;

    beforeEach(() => {
      rooms = new Map();
    });

    it("should return empty array when no rooms exist", () => {
      const result = getRoomsList(rooms);
      expect(result).toEqual([]);
    });

    it("should return active rooms that have not started", () => {
      const room1 = {
        id: "ROOM1",
        name: "Test Room 1",
        maxPlayers: 4,
        mapType: "hellscape",
        players: [{ id: "player1" }],
        isActive: true,
        gameStarted: false,
        createdAt: new Date(),
      };

      const room2 = {
        id: "ROOM2",
        name: "Test Room 2",
        maxPlayers: 2,
        mapType: "arena",
        players: [],
        isActive: true,
        gameStarted: true, // Game started, should be filtered out
        createdAt: new Date(),
      };

      const room3 = {
        id: "ROOM3",
        name: "Test Room 3",
        maxPlayers: 4,
        mapType: "hellscape",
        players: [{ id: "player2" }, { id: "player3" }],
        isActive: false, // Not active, should be filtered out
        gameStarted: false,
        createdAt: new Date(),
      };

      rooms.set("ROOM1", room1);
      rooms.set("ROOM2", room2);
      rooms.set("ROOM3", room3);

      const result = getRoomsList(rooms);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "ROOM1",
        name: "Test Room 1",
        players: 1,
        maxPlayers: 4,
        mapType: "hellscape",
        createdAt: room1.createdAt,
      });
    });
  });

  describe("getPlayersByRoom", () => {
    let rooms: Map<string, any>;

    beforeEach(() => {
      rooms = new Map();
    });

    it("should return empty array for non-existent room", () => {
      const result = getPlayersByRoom("NONEXISTENT", rooms);
      expect(result).toEqual([]);
    });

    it("should return players for existing room", () => {
      const players = [
        { id: "player1", name: "Player 1" },
        { id: "player2", name: "Player 2" },
      ];

      const room = {
        id: "ROOM1",
        players,
        isActive: true,
        gameStarted: false,
      };

      rooms.set("ROOM1", room);

      const result = getPlayersByRoom("ROOM1", rooms);
      expect(result).toEqual(players);
    });
  });

  describe("GAME_EVENTS", () => {
    it("should have all required event categories", () => {
      expect(GAME_EVENTS.USER).toBeDefined();
      expect(GAME_EVENTS.ROOM).toBeDefined();
      expect(GAME_EVENTS.PARTY).toBeDefined();
      expect(GAME_EVENTS.CHAT).toBeDefined();
      expect(GAME_EVENTS.PLAYER).toBeDefined();
      expect(GAME_EVENTS.WEAPON).toBeDefined();
      expect(GAME_EVENTS.COMBAT).toBeDefined();
      expect(GAME_EVENTS.WORLD).toBeDefined();
      expect(GAME_EVENTS.GAME).toBeDefined();
    });

    it("should have correct user events", () => {
      expect(GAME_EVENTS.USER.CONNECTED).toBe("user:connected");
      expect(GAME_EVENTS.USER.JOINED).toBe("user:joined");
      expect(GAME_EVENTS.USER.DISCONNECTED).toBe("user:disconnected");
    });

    it("should have correct room events", () => {
      expect(GAME_EVENTS.ROOM.CREATE).toBe("room:create");
      expect(GAME_EVENTS.ROOM.JOIN).toBe("room:join");
      expect(GAME_EVENTS.ROOM.LEAVE).toBe("room:leave");
      expect(GAME_EVENTS.ROOM.LIST).toBe("room:list");
    });
  });
});

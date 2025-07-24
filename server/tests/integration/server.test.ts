import request from "supertest";
import { GAME_EVENTS } from "../../src/events";
import {
  createTestServer,
  createTestClient,
  waitForEvent,
  mockRoom,
  sleep,
} from "../utils/test-helpers";
import type { TestServer, TestClient } from "../utils/test-helpers";

describe("Server Integration Tests", () => {
  let testServer: TestServer;

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await testServer.close();
  });

  describe("HTTP Routes", () => {
    it("should respond to GET /", async () => {
      const response = await request(testServer.httpServer)
        .get("/")
        .expect(200);

      expect(response.text).toContain("Doom Protocol Server");
    });

    it("should respond to GET /leaderboard", async () => {
      const response = await request(testServer.httpServer)
        .get("/leaderboard")
        .expect(200);

      expect(typeof response.body).toBe("object");
    });

    it("should respond to GET /rooms", async () => {
      const response = await request(testServer.httpServer)
        .get("/rooms")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("WebSocket Connection", () => {
    let client: TestClient;

    afterEach(async () => {
      if (client) {
        client.disconnect();
      }
    });

    it("should handle client connection", async () => {
      client = await createTestClient(testServer.url);
      expect(client.socket.connected).toBe(true);
    });

    it("should handle client disconnection", async () => {
      client = await createTestClient(testServer.url);
      expect(client.socket.connected).toBe(true);

      client.disconnect();
      await sleep(100);
      expect(client.socket.connected).toBe(false);
    });
  });

  describe("User Management", () => {
    let client: TestClient;

    beforeEach(async () => {
      client = await createTestClient(testServer.url);
    });

    afterEach(() => {
      if (client) {
        client.disconnect();
      }
    });

    it("should handle user joining", async () => {
      const joinData = { name: "TestPlayer" };
      client.socket.emit(GAME_EVENTS.USER.JOINED, joinData);

      // Wait a bit for server processing
      await sleep(100);

      // Should not throw an error
      expect(client.socket.connected).toBe(true);
    });

    it("should broadcast user connection to other clients", async () => {
      const client2 = await createTestClient(testServer.url);

      const connectionPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.USER.CONNECTED
      );

      // Create a third client to trigger the broadcast
      const client3 = await createTestClient(testServer.url);

      const connectionData = await connectionPromise;
      expect(connectionData.id).toBeDefined();
      expect(connectionData.message).toContain("demon has entered Hell");

      client2.disconnect();
      client3.disconnect();
    });
  });

  describe("Room Management", () => {
    let client: TestClient;

    beforeEach(async () => {
      client = await createTestClient(testServer.url);
      // Join as user first
      client.socket.emit(GAME_EVENTS.USER.JOINED, { name: "TestPlayer" });
      await sleep(100);
    });

    afterEach(() => {
      if (client) {
        client.disconnect();
      }
    });

    it("should create a room", async () => {
      const roomCreatedPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.CREATED
      );

      client.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);

      const roomData = await roomCreatedPromise;
      expect(roomData.room.name).toBe(mockRoom.name);
      expect(roomData.room.maxPlayers).toBe(mockRoom.maxPlayers);
      expect(roomData.room.mapType).toBe(mockRoom.mapType);
      expect(roomData.isLeader).toBe(true);
    });

    it("should join an existing room", async () => {
      // Create room with first client
      const roomCreatedPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);
      const roomData = await roomCreatedPromise;

      // Create second client and join room
      const client2 = await createTestClient(testServer.url);
      client2.socket.emit(GAME_EVENTS.USER.JOINED, { name: "TestPlayer2" });
      await sleep(100);

      const roomJoinedPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.ROOM.JOINED
      );
      const memberJoinedPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.PARTY.MEMBER_JOINED
      );

      client2.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId: roomData.room.id });

      const [joinedData, memberData] = await Promise.all([
        roomJoinedPromise,
        memberJoinedPromise,
      ]);

      expect(joinedData.room.id).toBe(roomData.room.id);
      expect(joinedData.isLeader).toBe(false);
      expect(memberData.player.name).toBe("TestPlayer2");

      client2.disconnect();
    });

    it("should handle room not found", async () => {
      const notFoundPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.NOT_FOUND
      );

      client.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId: "NONEXISTENT" });

      await notFoundPromise;
      // Test passes if we receive the not found event
    });

    it("should list available rooms", async () => {
      // Create a room first
      const roomCreatedPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);
      await roomCreatedPromise;

      const roomListPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.LIST
      );
      client.socket.emit(GAME_EVENTS.ROOM.LIST);

      const roomsList = await roomListPromise;
      expect(Array.isArray(roomsList)).toBe(true);
      expect(roomsList.length).toBeGreaterThan(0);
      expect(roomsList[0].name).toBe(mockRoom.name);
    });

    it("should handle room leave", async () => {
      // Create room
      const roomCreatedPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);
      await roomCreatedPromise;

      // Leave room
      client.socket.emit(GAME_EVENTS.ROOM.LEAVE);

      // Wait for server processing
      await sleep(100);

      // Should not throw an error
      expect(client.socket.connected).toBe(true);
    });
  });

  describe("Chat System", () => {
    let client1: TestClient;
    let client2: TestClient;
    let roomId: string;

    beforeEach(async () => {
      // Setup two clients in the same room
      client1 = await createTestClient(testServer.url);
      client2 = await createTestClient(testServer.url);

      client1.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player1" });
      client2.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player2" });
      await sleep(100);

      // Create room with client1
      const roomCreatedPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client1.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);
      const roomData = await roomCreatedPromise;
      roomId = roomData.room.id;

      // Join room with client2
      const roomJoinedPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.ROOM.JOINED
      );
      client2.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId });
      await roomJoinedPromise;
    });

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it("should handle lobby messages", async () => {
      const messagePromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.CHAT.LOBBY_MESSAGE
      );

      client1.socket.emit(GAME_EVENTS.CHAT.LOBBY_MESSAGE, {
        message: "Hello lobby!",
      });

      const messageData = await messagePromise;
      expect(messageData.playerName).toBe("Player1");
      expect(messageData.message).toBe("Hello lobby!");
      expect(messageData.timestamp).toBeDefined();
    });

    it("should handle game messages", async () => {
      const messagePromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.CHAT.GAME_MESSAGE
      );

      client1.socket.emit(GAME_EVENTS.CHAT.GAME_MESSAGE, {
        message: "Game message!",
      });

      const messageData = await messagePromise;
      expect(messageData.playerName).toBe("Player1");
      expect(messageData.message).toBe("Game message!");
      expect(messageData.timestamp).toBeDefined();
    });
  });

  describe("Player Ready State", () => {
    let client1: TestClient;
    let client2: TestClient;
    let roomId: string;

    beforeEach(async () => {
      // Setup two clients in the same room
      client1 = await createTestClient(testServer.url);
      client2 = await createTestClient(testServer.url);

      client1.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player1" });
      client2.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player2" });
      await sleep(100);

      // Create room with client1
      const roomCreatedPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client1.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);
      const roomData = await roomCreatedPromise;
      roomId = roomData.room.id;

      // Join room with client2
      const roomJoinedPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.ROOM.JOINED
      );
      client2.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId });
      await roomJoinedPromise;
    });

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it("should handle player ready state", async () => {
      const readyStatePromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.PARTY.READY_STATE
      );

      client1.socket.emit(GAME_EVENTS.PLAYER.READY);

      const readyData = await readyStatePromise;
      expect(readyData.ready).toBe(true);
    });

    it("should detect when all players are ready", async () => {
      const allReadyPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.PARTY.ALL_READY
      );

      // Both players become ready
      client1.socket.emit(GAME_EVENTS.PLAYER.READY);
      client2.socket.emit(GAME_EVENTS.PLAYER.READY);

      const allReadyData = await allReadyPromise;
      expect(allReadyData.canStart).toBe(true);
    });

    it("should handle player not ready state", async () => {
      // First make player ready
      client1.socket.emit(GAME_EVENTS.PLAYER.READY);
      await sleep(100);

      const notReadyPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.PARTY.READY_STATE
      );

      client1.socket.emit(GAME_EVENTS.PLAYER.NOT_READY);

      const notReadyData = await notReadyPromise;
      expect(notReadyData.ready).toBe(false);
    });
  });

  describe("Game Flow", () => {
    let client1: TestClient;
    let client2: TestClient;
    let roomId: string;

    beforeEach(async () => {
      // Setup two clients in the same room, both ready
      client1 = await createTestClient(testServer.url);
      client2 = await createTestClient(testServer.url);

      client1.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player1" });
      client2.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player2" });
      await sleep(100);

      // Create room with client1 (leader)
      const roomCreatedPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client1.socket.emit(GAME_EVENTS.ROOM.CREATE, mockRoom);
      const roomData = await roomCreatedPromise;
      roomId = roomData.room.id;

      // Join room with client2
      const roomJoinedPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.ROOM.JOINED
      );
      client2.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId });
      await roomJoinedPromise;

      // Both players become ready
      client1.socket.emit(GAME_EVENTS.PLAYER.READY);
      client2.socket.emit(GAME_EVENTS.PLAYER.READY);
      await sleep(100);
    });

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it("should start game when leader initiates", async () => {
      const gameStartPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.GAME.START
      );

      client1.socket.emit(GAME_EVENTS.GAME.START);

      const gameStartData = await gameStartPromise;
      expect(gameStartData.roomId).toBe(roomId);
      expect(gameStartData.mapType).toBe(mockRoom.mapType);
      expect(Array.isArray(gameStartData.players)).toBe(true);
    });

    it("should handle player position updates", async () => {
      // Start game first
      client1.socket.emit(GAME_EVENTS.GAME.START);
      await sleep(100);

      const positionPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.PLAYER.POSITION
      );

      const positionData = {
        position: { x: 10, y: 5, z: 0 },
        rotation: { x: 0, y: 45, z: 0 },
      };

      client1.socket.emit(GAME_EVENTS.PLAYER.POSITION, positionData);

      const receivedPosition = await positionPromise;
      expect(receivedPosition.position).toEqual(positionData.position);
      expect(receivedPosition.rotation).toEqual(positionData.rotation);
    });

    it("should handle weapon shooting", async () => {
      // Start game first
      client1.socket.emit(GAME_EVENTS.GAME.START);
      await sleep(100);

      const shootPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.WEAPON.SHOOT
      );

      const shootData = {
        weapon: "shotgun",
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 1, y: 0, z: 0 },
      };

      client1.socket.emit(GAME_EVENTS.WEAPON.SHOOT, shootData);

      const receivedShoot = await shootPromise;
      expect(receivedShoot.weapon).toBe(shootData.weapon);
      expect(receivedShoot.origin).toEqual(shootData.origin);
      expect(receivedShoot.direction).toEqual(shootData.direction);
    });

    it("should handle combat hits", async () => {
      // Start game first
      client1.socket.emit(GAME_EVENTS.GAME.START);
      await sleep(100);

      const hitPromise = waitForEvent(client2.socket, GAME_EVENTS.COMBAT.HIT);

      const hitData = {
        targetId: client2.socket.id,
        damage: 25,
        weapon: "shotgun",
      };

      client1.socket.emit(GAME_EVENTS.COMBAT.HIT, hitData);

      const receivedHit = await hitPromise;
      expect(receivedHit.targetId).toBe(hitData.targetId);
      expect(receivedHit.damage).toBe(hitData.damage);
      expect(receivedHit.weapon).toBe(hitData.weapon);
    });
  });
});

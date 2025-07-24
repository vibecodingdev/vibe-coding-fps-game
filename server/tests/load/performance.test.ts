import {
  createTestServer,
  createTestClient,
  waitForEvent,
  sleep,
} from "../utils/test-helpers";
import { GAME_EVENTS } from "../../src/events";
import type { TestServer, TestClient } from "../utils/test-helpers";

describe("Performance and Load Tests", () => {
  let testServer: TestServer;

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await testServer.close();
  });

  describe("Connection Load", () => {
    it("should handle multiple simultaneous connections", async () => {
      const NUM_CLIENTS = 10;
      const clients: TestClient[] = [];

      try {
        // Create multiple clients simultaneously
        const connectionPromises = Array.from({ length: NUM_CLIENTS }, () =>
          createTestClient(testServer.url)
        );

        const startTime = Date.now();
        const connectedClients = await Promise.all(connectionPromises);
        const connectionTime = Date.now() - startTime;

        expect(connectedClients).toHaveLength(NUM_CLIENTS);
        expect(connectionTime).toBeLessThan(5000); // Should connect within 5 seconds

        clients.push(...connectedClients);

        // Verify all clients are connected
        for (const client of clients) {
          expect(client.socket.connected).toBe(true);
        }
      } finally {
        // Cleanup
        clients.forEach((client) => client.disconnect());
      }
    });

    it("should handle rapid connect/disconnect cycles", async () => {
      const NUM_CYCLES = 20;

      for (let i = 0; i < NUM_CYCLES; i++) {
        const client = await createTestClient(testServer.url);
        expect(client.socket.connected).toBe(true);

        client.disconnect();
        await sleep(10); // Small delay between cycles
      }
    });
  });

  describe("Room Load", () => {
    it("should handle multiple rooms creation", async () => {
      const NUM_ROOMS = 5;
      const clients: TestClient[] = [];

      try {
        // Create clients
        for (let i = 0; i < NUM_ROOMS; i++) {
          const client = await createTestClient(testServer.url);
          client.socket.emit(GAME_EVENTS.USER.JOINED, {
            name: `TestPlayer${i}`,
          });
          clients.push(client);
        }

        await sleep(100);

        // Create rooms simultaneously
        const roomPromises = clients.map((client, index) => {
          const roomCreatedPromise = waitForEvent(
            client.socket,
            GAME_EVENTS.ROOM.CREATED
          );
          client.socket.emit(GAME_EVENTS.ROOM.CREATE, {
            name: `LoadTestRoom${index}`,
            maxPlayers: 4,
            mapType: "hellscape",
          });
          return roomCreatedPromise;
        });

        const rooms = await Promise.all(roomPromises);
        expect(rooms).toHaveLength(NUM_ROOMS);

        // Verify all rooms are unique
        const roomIds = rooms.map((room) => room.room.id);
        const uniqueIds = new Set(roomIds);
        expect(uniqueIds.size).toBe(NUM_ROOMS);
      } finally {
        clients.forEach((client) => client.disconnect());
      }
    });

    it("should handle room with maximum players", async () => {
      const MAX_PLAYERS = 4;
      const clients: TestClient[] = [];
      let roomId: string;

      try {
        // Create room with first client
        const client1 = await createTestClient(testServer.url);
        client1.socket.emit(GAME_EVENTS.USER.JOINED, { name: "RoomLeader" });
        clients.push(client1);
        await sleep(100);

        const roomCreatedPromise = waitForEvent(
          client1.socket,
          GAME_EVENTS.ROOM.CREATED
        );
        client1.socket.emit(GAME_EVENTS.ROOM.CREATE, {
          name: "FullRoomTest",
          maxPlayers: MAX_PLAYERS,
          mapType: "hellscape",
        });
        const roomData = await roomCreatedPromise;
        roomId = roomData.room.id;

        // Add remaining players
        for (let i = 1; i < MAX_PLAYERS; i++) {
          const client = await createTestClient(testServer.url);
          client.socket.emit(GAME_EVENTS.USER.JOINED, { name: `Player${i}` });
          clients.push(client);
          await sleep(50);

          const joinPromise = waitForEvent(
            client.socket,
            GAME_EVENTS.ROOM.JOINED
          );
          client.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId });
          await joinPromise;
        }

        expect(clients).toHaveLength(MAX_PLAYERS);

        // Try to add one more player (should fail)
        const extraClient = await createTestClient(testServer.url);
        extraClient.socket.emit(GAME_EVENTS.USER.JOINED, {
          name: "ExtraPlayer",
        });
        await sleep(100);

        const fullPromise = waitForEvent(
          extraClient.socket,
          GAME_EVENTS.ROOM.FULL
        );
        extraClient.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId });
        await fullPromise;

        extraClient.disconnect();
      } finally {
        clients.forEach((client) => client.disconnect());
      }
    });
  });

  describe("Message Load", () => {
    let client1: TestClient;
    let client2: TestClient;
    let roomId: string;

    beforeEach(async () => {
      client1 = await createTestClient(testServer.url);
      client2 = await createTestClient(testServer.url);

      // Setup room
      client1.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player1" });
      client2.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player2" });
      await sleep(100);

      const roomCreatedPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client1.socket.emit(GAME_EVENTS.ROOM.CREATE, {
        name: "MessageLoadTest",
        maxPlayers: 4,
        mapType: "hellscape",
      });
      const roomData = await roomCreatedPromise;
      roomId = roomData.room.id;

      const joinPromise = waitForEvent(client2.socket, GAME_EVENTS.ROOM.JOINED);
      client2.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId });
      await joinPromise;
    });

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it("should handle rapid chat messages", async () => {
      const NUM_MESSAGES = 10;
      let receivedCount = 0;

      client2.socket.on(GAME_EVENTS.CHAT.LOBBY_MESSAGE, () => {
        receivedCount++;
      });

      // Send messages rapidly
      for (let i = 0; i < NUM_MESSAGES; i++) {
        client1.socket.emit(GAME_EVENTS.CHAT.LOBBY_MESSAGE, {
          message: `Message ${i}`,
        });
        await sleep(10); // Small delay to avoid overwhelming
      }

      // Wait for all messages to be received
      await sleep(500);
      expect(receivedCount).toBe(NUM_MESSAGES);
    });

    it("should handle rapid position updates", async () => {
      // Start game first
      client1.socket.emit(GAME_EVENTS.PLAYER.READY);
      client2.socket.emit(GAME_EVENTS.PLAYER.READY);
      await sleep(100);
      client1.socket.emit(GAME_EVENTS.GAME.START);
      await sleep(100);

      const NUM_UPDATES = 20;
      let receivedCount = 0;

      client2.socket.on(GAME_EVENTS.PLAYER.POSITION, () => {
        receivedCount++;
      });

      const startTime = Date.now();

      // Send position updates rapidly (simulating 60fps)
      for (let i = 0; i < NUM_UPDATES; i++) {
        client1.socket.emit(GAME_EVENTS.PLAYER.POSITION, {
          position: { x: i, y: 0, z: 0 },
          rotation: { x: 0, y: i * 10, z: 0 },
        });
        await sleep(16); // ~60fps
      }

      const updateTime = Date.now() - startTime;

      // Wait for all updates to be received
      await sleep(200);

      expect(receivedCount).toBe(NUM_UPDATES);
      expect(updateTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Memory and Resource Tests", () => {
    it("should clean up disconnected clients", async () => {
      const NUM_CLIENTS = 5;
      const clients: TestClient[] = [];

      // Create clients and join them to a room
      for (let i = 0; i < NUM_CLIENTS; i++) {
        const client = await createTestClient(testServer.url);
        client.socket.emit(GAME_EVENTS.USER.JOINED, { name: `TempPlayer${i}` });
        clients.push(client);
      }

      await sleep(100);

      // Create a room and add all clients
      const roomCreatedPromise = waitForEvent(
        clients[0].socket,
        GAME_EVENTS.ROOM.CREATED
      );
      clients[0].socket.emit(GAME_EVENTS.ROOM.CREATE, {
        name: "CleanupTest",
        maxPlayers: 10,
        mapType: "hellscape",
      });
      const roomData = await roomCreatedPromise;

      // Join all other clients to the room
      for (let i = 1; i < NUM_CLIENTS; i++) {
        const joinPromise = waitForEvent(
          clients[i].socket,
          GAME_EVENTS.ROOM.JOINED
        );
        clients[i].socket.emit(GAME_EVENTS.ROOM.JOIN, {
          roomId: roomData.room.id,
        });
        await joinPromise;
      }

      // Disconnect all clients
      clients.forEach((client) => client.disconnect());

      // Wait for cleanup
      await sleep(500);

      // Server should continue functioning (no memory leaks or crashes)
      const newClient = await createTestClient(testServer.url);
      expect(newClient.socket.connected).toBe(true);
      newClient.disconnect();
    });
  });
});

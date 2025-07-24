import { createTestClient, waitForEvent, sleep } from "../utils/test-helpers";
import { GAME_EVENTS } from "../../src/events";
import type { TestClient } from "../utils/test-helpers";

// This test file tests against a real server instance
// Run the server in test mode first: npm run dev
describe("Real Server Instance Tests", () => {
  const SERVER_URL = "http://localhost:3000";
  let serverAvailable = false;

  // Check if server is running before all tests
  beforeAll(async () => {
    try {
      const testClient = await createTestClient(SERVER_URL);
      testClient.disconnect();
      serverAvailable = true;
    } catch (error) {
      console.log(
        "⚠️  Server not running on port 3000, skipping integration tests"
      );
      console.log("   Start server with: npm run dev");
      serverAvailable = false;
    }
  });

  describe("Connection and Basic Flow", () => {
    let client: TestClient;

    afterEach(() => {
      if (client) {
        client.disconnect();
      }
    });

    it("should connect to running server", async () => {
      if (!serverAvailable) {
        console.log("Server not available, skipping test");
        return;
      }

      client = await createTestClient(SERVER_URL);
      expect(client.socket.connected).toBe(true);
    });

    it("should handle complete user flow", async () => {
      if (!serverAvailable) {
        console.log("Server not available, skipping test");
        return;
      }

      client = await createTestClient(SERVER_URL);

      // Join as user
      client.socket.emit(GAME_EVENTS.USER.JOINED, {
        name: "IntegrationTestPlayer",
      });
      await sleep(100);

      // Create room
      const roomCreatedPromise = waitForEvent(
        client.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client.socket.emit(GAME_EVENTS.ROOM.CREATE, {
        name: "Integration Test Room",
        maxPlayers: 4,
        mapType: "hellscape",
      });

      const roomData = await roomCreatedPromise;
      expect(roomData.room.name).toBe("Integration Test Room");
      expect(roomData.isLeader).toBe(true);

      // Get ready
      client.socket.emit(GAME_EVENTS.PLAYER.READY);
      await sleep(100);

      // Leave room
      client.socket.emit(GAME_EVENTS.ROOM.LEAVE);
      await sleep(100);

      expect(client.socket.connected).toBe(true);
    });
  });

  describe("Multiple Clients", () => {
    let client1: TestClient;
    let client2: TestClient;

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it("should handle multiple clients in same room", async () => {
      if (!serverAvailable) {
        console.log("Server not available, skipping test");
        return;
      }

      client1 = await createTestClient(SERVER_URL);
      client2 = await createTestClient(SERVER_URL);

      // Setup users
      client1.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player1" });
      client2.socket.emit(GAME_EVENTS.USER.JOINED, { name: "Player2" });
      await sleep(100);

      // Create room with client1
      const roomCreatedPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.ROOM.CREATED
      );
      client1.socket.emit(GAME_EVENTS.ROOM.CREATE, {
        name: "Multi-Client Test Room",
        maxPlayers: 4,
        mapType: "hellscape",
      });
      const roomData = await roomCreatedPromise;

      // Join room with client2
      const roomJoinedPromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.ROOM.JOINED
      );
      const memberJoinedPromise = waitForEvent(
        client1.socket,
        GAME_EVENTS.PARTY.MEMBER_JOINED
      );

      client2.socket.emit(GAME_EVENTS.ROOM.JOIN, { roomId: roomData.room.id });

      const [joinedData, memberData] = await Promise.all([
        roomJoinedPromise,
        memberJoinedPromise,
      ]);

      expect(joinedData.room.id).toBe(roomData.room.id);
      expect(memberData.player.name).toBe("Player2");

      // Test chat
      const messagePromise = waitForEvent(
        client2.socket,
        GAME_EVENTS.CHAT.LOBBY_MESSAGE
      );
      client1.socket.emit(GAME_EVENTS.CHAT.LOBBY_MESSAGE, {
        message: "Hello from Player1!",
      });

      const messageData = await messagePromise;
      expect(messageData.playerName).toBe("Player1");
      expect(messageData.message).toBe("Hello from Player1!");
    });
  });
});

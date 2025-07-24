import { Server as SocketIO } from "socket.io";
import { io as Client, Socket } from "socket.io-client";
import * as http from "http";
import express = require("express");
import cors = require("cors");

export interface TestServer {
  httpServer: http.Server;
  io: SocketIO;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export interface TestClient {
  socket: Socket;
  disconnect: () => void;
}

export function createTestServer(): Promise<TestServer> {
  return new Promise((resolve) => {
    const app = express();
    const httpServer = http.createServer(app);

    app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      })
    );

    const io = new SocketIO(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    httpServer.listen(0, () => {
      const address = httpServer.address();
      const port = typeof address === "object" && address ? address.port : 3000;
      const url = `http://localhost:${port}`;

      resolve({
        httpServer,
        io,
        port,
        url,
        close: () => {
          return new Promise((resolveClose) => {
            io.close();
            httpServer.close(() => resolveClose());
          });
        },
      });
    });
  });
}

export function createTestClient(serverUrl: string): Promise<TestClient> {
  return new Promise((resolve, reject) => {
    const socket = Client(serverUrl, {
      forceNew: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      resolve({
        socket,
        disconnect: () => {
          socket.disconnect();
        },
      });
    });

    socket.on("connect_error", (error) => {
      reject(error);
    });

    // Timeout for connection
    setTimeout(() => {
      if (!socket.connected) {
        socket.disconnect();
        reject(new Error("Connection timeout"));
      }
    }, 5000);
  });
}

export function waitForEvent(
  socket: Socket,
  event: string,
  timeout = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockPlayer = {
  id: "test-player-1",
  userId: "test-player-1",
  name: "TestPlayer",
  kills: 0,
  deaths: 0,
  score: 0,
  health: 100,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  weapon: "shotgun",
  ready: false,
};

export const mockRoom = {
  name: "Test Room",
  maxPlayers: 4,
  mapType: "hellscape",
};

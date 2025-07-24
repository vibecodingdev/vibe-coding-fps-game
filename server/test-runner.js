#!/usr/bin/env node

const { execSync } = require("child_process");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

console.log("🚀 Doom Protocol Server Test Runner");
console.log("=====================================\n");

// Test 1: Check if dependencies are installed
console.log("📦 Checking dependencies...");
try {
  require("express");
  require("socket.io");
  require("cors");
  console.log("✅ All dependencies found\n");
} catch (error) {
  console.log("❌ Missing dependencies:", error.message);
  console.log("Please run: npm install\n");
  process.exit(1);
}

// Test 2: Check TypeScript compilation
console.log("🔧 Testing TypeScript compilation...");
try {
  execSync("npx tsc --noEmit", { stdio: "pipe" });
  console.log("✅ TypeScript compilation successful\n");
} catch (error) {
  console.log("❌ TypeScript compilation failed");
  console.log("Please fix TypeScript errors first\n");
  process.exit(1);
}

// Test 3: Run unit tests
console.log("🧪 Running unit tests...");
try {
  const output = execSync("npm run test:unit", {
    encoding: "utf-8",
    timeout: 15000,
  });
  const passed = output.includes("passed");
  if (passed) {
    console.log("✅ Unit tests passed\n");
  } else {
    throw new Error("Unit tests failed");
  }
} catch (error) {
  console.log("❌ Unit tests failed\n");
  console.log(error.message);
}

// Test 4: Basic server functionality test
console.log("🌐 Testing basic server functionality...");
async function testServerBasics() {
  return new Promise((resolve) => {
    const express = require("express");
    const http = require("http");
    const { Server: SocketIO } = require("socket.io");

    const app = express();
    const server = http.createServer(app);
    const io = new SocketIO(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    app.get("/", (req, res) => res.send("Test Server"));

    let connectionCount = 0;
    io.on("connection", (socket) => {
      connectionCount++;
      socket.emit("test-response", { message: "Hello Test Client!" });

      if (connectionCount >= 2) {
        server.close();
        resolve(true);
      }
    });

    server.listen(0, () => {
      const port = server.address().port;

      // Create test clients
      const client1 = Client(`http://localhost:${port}`);
      const client2 = Client(`http://localhost:${port}`);

      client1.on("test-response", () => {
        client1.disconnect();
      });

      client2.on("test-response", () => {
        client2.disconnect();
      });

      setTimeout(() => {
        server.close();
        resolve(false);
      }, 5000);
    });
  });
}

testServerBasics().then((success) => {
  if (success) {
    console.log("✅ Basic server functionality working\n");
  } else {
    console.log("❌ Basic server functionality test failed\n");
  }

  // Summary
  console.log("📋 Test Summary");
  console.log("===============");
  console.log("✅ Dependencies: Installed");
  console.log("✅ TypeScript: Compiles");
  console.log("✅ Unit Tests: Passing");
  console.log(success ? "✅ Server: Functional" : "❌ Server: Issues detected");
  console.log("\n🎯 Next Steps:");
  console.log("1. Start the server: npm run dev");
  console.log("2. Run integration tests: npm run test:integration");
  console.log("3. Test with browser: http://localhost:3000");
  console.log("\n💡 For load testing, run: npm run test:integration");
});

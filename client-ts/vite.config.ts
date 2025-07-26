import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "./src",
  base: "/",
  publicDir: resolve(__dirname, "public"),

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/core": resolve(__dirname, "src/core"),
      "@/systems": resolve(__dirname, "src/systems"),
      "@/types": resolve(__dirname, "src/types"),
      "@/utils": resolve(__dirname, "src/utils"),
      "@/config": resolve(__dirname, "src/config"),
    },
  },

  server: {
    port: 5173,
    open: true,
    cors: true,
    host: "localhost",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
      },
      output: {
        manualChunks: {
          three: ["three"],
          socket: ["socket.io-client"],
        },
      },
    },
  },

  css: {
    devSourcemap: true,
  },

  // 优化依赖项预构建
  optimizeDeps: {
    include: ["three", "socket.io-client"],
    exclude: [],
  },

  // 确保热更新正常工作
  define: {
    global: "globalThis",
  },
});

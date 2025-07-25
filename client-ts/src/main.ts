import "./styles/main.css";
import { Game } from "./core/Game";

console.log("🔥 DOOM PROTOCOL - TypeScript Client Starting 🔥");

async function initializeGame(): Promise<void> {
  try {
    const game = Game.getInstance();
    await game.initialize();

    console.log("Game ready! Click to start...");

    // Show main menu (basic implementation for now)
    showMainMenu(game);
  } catch (error) {
    console.error("Failed to initialize game:", error);
    showErrorMessage("Failed to initialize game. Please refresh the page.");
  }
}

function showMainMenu(game: Game): void {
  const menuElement = document.getElementById("mainMenu");
  if (menuElement) {
    menuElement.style.display = "flex";

    // Add event listeners for menu buttons
    const singlePlayerBtn = document.getElementById("singlePlayerBtn");
    const multiPlayerBtn = document.getElementById("multiPlayerBtn");

    if (singlePlayerBtn) {
      singlePlayerBtn.addEventListener("click", () => {
        menuElement.style.display = "none";

        // 尝试进入全屏模式
        requestFullscreen();

        // 开始游戏
        game.startGame(false);

        // 延迟触发pointer lock，让用户准备好
        setTimeout(() => {
          document.addEventListener("click", requestPointerLock);

          function requestPointerLock() {
            const controls = game["playerController"]?.getControls();
            if (controls && !controls.isLocked) {
              controls.lock();
            }
            document.removeEventListener("click", requestPointerLock);
          }
        }, 100);
      });
    }

    if (multiPlayerBtn) {
      multiPlayerBtn.addEventListener("click", () => {
        menuElement.style.display = "none";
        game.startGame(true);
      });
    }
  }
}

function showErrorMessage(message: string): void {
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(139, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    font-family: 'Orbitron', monospace;
    font-size: 18px;
    text-align: center;
    z-index: 9999;
    border: 2px solid #ff4400;
    box-shadow: 0 0 20px rgba(255, 68, 0, 0.5);
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
}

function requestFullscreen(): void {
  try {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
    }
  } catch (error) {
    console.warn("无法进入全屏模式:", error);
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", initializeGame);

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  const game = Game.getInstance();
  if (document.hidden) {
    game.pauseGame();
  } else {
    game.resumeGame();
  }
});

// Export game instance for debugging
(window as any).game = Game.getInstance();

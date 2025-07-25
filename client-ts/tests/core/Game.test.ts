import { Game } from "@/core/Game";

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    // Get fresh instance for each test
    game = Game.getInstance();
  });

  afterEach(() => {
    // Reset singleton for clean tests
    (Game as any).instance = null;
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const game1 = Game.getInstance();
      const game2 = Game.getInstance();
      expect(game1).toBe(game2);
    });
  });

  describe("Game State", () => {
    it("should initialize with mainMenu state", () => {
      expect(game.getGameState()).toBe("mainMenu");
    });

    it("should transition to playing state when starting game", () => {
      game.startGame(false);
      expect(game.getGameState()).toBe("playing");
    });

    it("should transition to paused state when pausing", () => {
      game.startGame(false);
      game.pauseGame();
      expect(game.getGameState()).toBe("paused");
    });

    it("should transition to gameOver state when ending game", () => {
      game.startGame(false);
      game.endGame();
      expect(game.getGameState()).toBe("gameOver");
    });
  });

  describe("Player State", () => {
    beforeEach(async () => {
      await game.initialize();
    });

    it("should initialize player with full health", () => {
      const playerState = game.getPlayerState();
      expect(playerState.health).toBe(100);
      expect(playerState.isAlive).toBe(true);
    });

    it("should reset player state when resetting game", () => {
      game.resetGameState();
      const playerState = game.getPlayerState();
      expect(playerState.health).toBe(100);
      expect(playerState.position.x).toBe(0);
      expect(playerState.position.y).toBe(1.8);
      expect(playerState.position.z).toBe(0);
    });
  });

  describe("Game Stats", () => {
    beforeEach(async () => {
      await game.initialize();
    });

    it("should initialize with zero stats", () => {
      const gameStats = game.getGameStats();
      expect(gameStats.demonKills).toBe(0);
      expect(gameStats.currentWave).toBe(1);
      expect(gameStats.score).toBe(0);
      expect(gameStats.accuracy).toBe(0);
    });
  });

  describe("System Access", () => {
    beforeEach(async () => {
      await game.initialize();
    });

    it("should provide access to scene manager", () => {
      const sceneManager = game.getSceneManager();
      expect(sceneManager).toBeDefined();
    });

    it("should provide access to weapon system", () => {
      const weaponSystem = game.getWeaponSystem();
      expect(weaponSystem).toBeDefined();
    });

    it("should provide access to demon system", () => {
      const demonSystem = game.getDemonSystem();
      expect(demonSystem).toBeDefined();
    });

    it("should provide access to audio system", () => {
      const audioSystem = game.getAudioSystem();
      expect(audioSystem).toBeDefined();
    });
  });
});

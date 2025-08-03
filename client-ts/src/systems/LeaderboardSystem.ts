import {
  GameSessionData,
  AuthResponse,
  LeaderboardSubmissionResponse,
} from "@/types/leaderboard";

export class LeaderboardSystem {
  private static instance: LeaderboardSystem | null = null;
  private websiteBaseUrl = "https://www.tinyvideogame.com";
  private isAuthenticated = false;
  private currentUser: any = null;
  private sessionStartTime: number = 0;
  private sessionData: Partial<GameSessionData> = {};

  private constructor() {}

  public static getInstance(): LeaderboardSystem {
    if (!LeaderboardSystem.instance) {
      LeaderboardSystem.instance = new LeaderboardSystem();
    }
    return LeaderboardSystem.instance;
  }

  /**
   * Check if user is authenticated with the main website
   */
  public async checkAuthentication(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.websiteBaseUrl}/api/auth/verify`, {
        method: "GET",
        credentials: "include", // Include cookies for cross-domain auth
        headers: {
          "Content-Type": "application/json",
        },
      });

      const authData: AuthResponse = await response.json();

      if (authData.authenticated && authData.user) {
        this.isAuthenticated = true;
        this.currentUser = authData.user;
        console.log(
          "✅ User authenticated for leaderboard:",
          authData.user.email
        );
      } else {
        this.isAuthenticated = false;
        this.currentUser = null;
        console.log("❌ User not authenticated for leaderboard");
      }

      return authData;
    } catch (error) {
      console.error("❌ Failed to check authentication:", error);
      this.isAuthenticated = false;
      this.currentUser = null;
      return {
        authenticated: false,
        user: null,
        error: "Failed to verify authentication",
      };
    }
  }

  /**
   * Start tracking a new game session
   */
  public startSession(
    gameMode: "single_player" | "multiplayer",
    mapType?: string
  ): void {
    try {
      this.sessionStartTime = Date.now();
      this.sessionData = {
        session_start: new Date().toISOString(),
        game_mode: gameMode,
        map_type: mapType,
        wave_level: 1,
        total_demon_kills: 0,
        player_deaths: 0,
        health_packs_collected: 0,
        ammo_packs_collected: 0,
        player_kills: 0,
        demons_created: 0,
        final_score: 0,
        accuracy_percentage: 0,
        shots_fired: 0,
        shots_hit: 0,
        session_completed: false,
      };

      console.log("🎮 Started tracking game session:", { gameMode, mapType });
    } catch (error) {
      console.warn("⚠️ Failed to start leaderboard session:", error);
    }
  }

  /**
   * Update session statistics
   */
  public updateStats(updates: Partial<GameSessionData>): void {
    try {
      this.sessionData = { ...this.sessionData, ...updates };
    } catch (error) {
      console.warn("⚠️ Failed to update leaderboard stats:", error);
    }
  }

  /**
   * Increment specific counters
   */
  public incrementDemonKills(): void {
    try {
      this.sessionData.total_demon_kills =
        (this.sessionData.total_demon_kills || 0) + 1;
    } catch (error) {
      console.warn("⚠️ Failed to increment demon kills:", error);
    }
  }

  public incrementPlayerDeaths(): void {
    try {
      this.sessionData.player_deaths =
        (this.sessionData.player_deaths || 0) + 1;
    } catch (error) {
      console.warn("⚠️ Failed to increment player deaths:", error);
    }
  }

  public incrementHealthPacksCollected(): void {
    try {
      this.sessionData.health_packs_collected =
        (this.sessionData.health_packs_collected || 0) + 1;
    } catch (error) {
      console.warn("⚠️ Failed to increment health packs collected:", error);
    }
  }

  public incrementAmmoPacksCollected(): void {
    try {
      this.sessionData.ammo_packs_collected =
        (this.sessionData.ammo_packs_collected || 0) + 1;
    } catch (error) {
      console.warn("⚠️ Failed to increment ammo packs collected:", error);
    }
  }

  public incrementPlayerKills(): void {
    try {
      this.sessionData.player_kills = (this.sessionData.player_kills || 0) + 1;
    } catch (error) {
      console.warn("⚠️ Failed to increment player kills:", error);
    }
  }

  public incrementDemonsCreated(): void {
    try {
      this.sessionData.demons_created =
        (this.sessionData.demons_created || 0) + 1;
    } catch (error) {
      console.warn("⚠️ Failed to increment demons created:", error);
    }
  }

  public updateWaveLevel(wave: number): void {
    try {
      this.sessionData.wave_level = Math.max(
        this.sessionData.wave_level || 1,
        wave
      );
    } catch (error) {
      console.warn("⚠️ Failed to update wave level:", error);
    }
  }

  public updateScore(score: number): void {
    try {
      this.sessionData.final_score = Math.max(
        this.sessionData.final_score || 0,
        score
      );
    } catch (error) {
      console.warn("⚠️ Failed to update score:", error);
    }
  }

  public updateAccuracy(shotsFired: number, shotsHit: number): void {
    try {
      this.sessionData.shots_fired = shotsFired;
      this.sessionData.shots_hit = shotsHit;
      this.sessionData.accuracy_percentage =
        shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;
    } catch (error) {
      console.warn("⚠️ Failed to update accuracy:", error);
    }
  }

  /**
   * End the current session and submit to leaderboard if authenticated
   */
  public async endSession(
    completed: boolean = false
  ): Promise<LeaderboardSubmissionResponse | null> {
    if (!this.sessionStartTime) {
      console.warn("⚠️ No active session to end");
      return null;
    }

    const sessionEnd = new Date().toISOString();
    const sessionDuration = Math.floor(
      (Date.now() - this.sessionStartTime) / 1000
    );

    const finalSessionData: GameSessionData = {
      ...this.sessionData,
      session_end: sessionEnd,
      session_duration_seconds: sessionDuration,
      session_completed: completed,
    } as GameSessionData;

    console.log("🏁 Ending game session:", finalSessionData);

    // Reset session tracking
    this.sessionStartTime = 0;
    this.sessionData = {};

    // Only submit if user is authenticated
    if (!this.isAuthenticated) {
      console.log(
        "📊 Session ended but not submitted (user not authenticated)"
      );
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    return await this.submitSession(finalSessionData);
  }

  /**
   * Submit session data to the leaderboard API
   */
  private async submitSession(
    sessionData: GameSessionData
  ): Promise<LeaderboardSubmissionResponse> {
    try {
      const response = await fetch(`${this.websiteBaseUrl}/api/game/sessions`, {
        method: "POST",
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      const result: LeaderboardSubmissionResponse = await response.json();

      if (result.success) {
        console.log("✅ Session submitted to leaderboard:", result.session_id);
      } else {
        console.error("❌ Failed to submit session:", result.error);
      }

      return result;
    } catch (error) {
      console.error("❌ Error submitting session to leaderboard:", error);
      return {
        success: false,
        error: "Failed to submit session data",
      };
    }
  }

  /**
   * Get current authentication status
   */
  public getAuthStatus(): { isAuthenticated: boolean; user: any } {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
    };
  }

  /**
   * Manual submission for testing
   */
  public async submitTestSession(): Promise<LeaderboardSubmissionResponse | null> {
    if (!this.isAuthenticated) {
      console.warn("⚠️ Cannot submit test session - user not authenticated");
      return null;
    }

    const testSession: GameSessionData = {
      session_start: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      session_end: new Date().toISOString(),
      session_duration_seconds: 300,
      game_mode: "single_player",
      map_type: "hell_theme",
      wave_level: 5,
      total_demon_kills: 25,
      player_deaths: 2,
      health_packs_collected: 3,
      ammo_packs_collected: 2,
      player_kills: 0,
      demons_created: 1,
      final_score: 2500,
      accuracy_percentage: 75.5,
      shots_fired: 100,
      shots_hit: 75,
      session_completed: true,
    };

    console.log("🧪 Submitting test session:", testSession);
    return await this.submitSession(testSession);
  }
}

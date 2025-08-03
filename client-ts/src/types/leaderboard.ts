export interface GameSessionData {
  session_start: string;
  session_end?: string;
  session_duration_seconds?: number;
  game_mode: "single_player" | "multiplayer";
  map_type?: string;
  wave_level: number;
  total_demon_kills: number;
  player_deaths: number;
  health_packs_collected: number;
  ammo_packs_collected: number;
  player_kills: number;
  demons_created: number;
  final_score: number;
  accuracy_percentage: number;
  shots_fired: number;
  shots_hit: number;
  session_completed: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user: AuthUser | null;
  error?: string;
}

export interface LeaderboardSubmissionResponse {
  success: boolean;
  session_id?: string;
  message?: string;
  error?: string;
}

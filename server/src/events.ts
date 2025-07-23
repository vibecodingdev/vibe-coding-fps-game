export const GAME_EVENTS = {
  USER: {
    CONNECTED: "user:connected",
    JOINED: "user:joined",
    DISCONNECTED: "user:disconnected",
  },
  PLAYER: {
    POSITION: "player:position",
    STATUS: "player:status",
  },
  WEAPON: {
    SHOOT: "weapon:shoot",
    RELOAD: "weapon:reload",
    SWITCH: "weapon:switch",
    PICKUP: "weapon:pickup",
    DROP: "weapon:drop",
  },
  COMBAT: {
    HIT: "combat:hit",
    DAMAGE: "combat:damage",
    KILL: "combat:kill",
  },
} as const;

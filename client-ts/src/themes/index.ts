export { BaseSceneTheme, type SceneThemeConfig } from "../core/SceneTheme";
export { HellTheme } from "./HellTheme";
export { IceTheme } from "./IceTheme";
export { ToxicTheme } from "./ToxicTheme";
export { IndustrialTheme } from "./IndustrialTheme";
export { DoomMapTheme } from "./DoomMapTheme";
export { BSPMapTheme } from "./BSPMapTheme";

import { HellTheme } from "./HellTheme";
import { IceTheme } from "./IceTheme";
import { ToxicTheme } from "./ToxicTheme";
import { IndustrialTheme } from "./IndustrialTheme";
import { DoomMapTheme } from "./DoomMapTheme";
import { BSPMapTheme } from "./BSPMapTheme";

// Theme registry for easy access
export const SCENE_THEMES = {
  hell: HellTheme,
  ice: IceTheme,
  toxic: ToxicTheme,
  industrial: IndustrialTheme,
  doomMap: DoomMapTheme,
  bspMap: BSPMapTheme,
} as const;

export type SceneThemeName = keyof typeof SCENE_THEMES;

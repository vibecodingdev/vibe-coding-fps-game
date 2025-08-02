import { MonsterConfig } from "@/types/monster";

export function downloadJSON(data: any, filename: string) {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", filename);
  linkElement.click();
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function validateMonsterConfig(config: any): boolean {
  try {
    // Basic validation
    if (!config || typeof config !== "object") return false;
    if (!config.id || !config.name || !config.emoji) return false;
    if (!config.colors || !config.behavior || !config.appearance) return false;

    // Validate colors
    const colors = config.colors;
    if (!colors.primary || !colors.head || !colors.eyes) return false;

    // Validate hex colors
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (
      !hexRegex.test(colors.primary) ||
      !hexRegex.test(colors.head) ||
      !hexRegex.test(colors.eyes)
    ) {
      return false;
    }

    // Validate behavior
    const behavior = config.behavior;
    if (
      typeof behavior.detectRange !== "number" ||
      typeof behavior.attackRange !== "number" ||
      typeof behavior.chaseRange !== "number" ||
      typeof behavior.attackDamage !== "number" ||
      typeof behavior.spawnWeight !== "number"
    ) {
      return false;
    }

    // Validate appearance
    const validBodyTypes = [
      "humanoid",
      "quadruped",
      "dragon",
      "small_biped",
      "floating",
    ];
    if (!validBodyTypes.includes(config.appearance.bodyType)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function generateMonsterPreview(monster: MonsterConfig): string {
  const features = monster.appearance.visualFeatures;
  const featureList = features
    ? Object.entries(features)
        .filter(([_, value]) => value === true)
        .map(([key]) => key.replace("has", "").toLowerCase())
        .join(", ")
    : "";

  return (
    `${monster.name} (${monster.emoji}) - ${monster.description || "A custom demon"}\n` +
    `Health: ${monster.health}, Speed: ${monster.speed}, Damage: ${monster.behavior.attackDamage}\n` +
    `Body: ${monster.appearance.bodyType}${featureList ? `, Features: ${featureList}` : ""}`
  );
}

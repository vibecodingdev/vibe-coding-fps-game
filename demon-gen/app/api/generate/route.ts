import { NextRequest, NextResponse } from "next/server";
import {
  MonsterConfig,
  GenerationRequest,
  GenerationResponse,
} from "@/types/monster";

const API_ENDPOINT = "https://api.opensota.ai/openai/v1/chat/completions";

// Enhanced generation prompt template based on the JSON demon system with client-ts diversity
const GENERATION_PROMPT = `Generate a complete JSON demon configuration for a DOOM-style FPS game based on the user's description.

Requirements:
1. Output ONLY valid JSON format
2. Use the exact structure provided in the template
3. All colors must be hex strings with # prefix
4. Choose appropriate bodyType from 20 available types: humanoid, quadruped, dragon, small_biped, floating, serpentine, arachnid, tentacled, insectoid, amorphous, centauroid, multi_headed, elemental, mechanical, plant_like, crystalline, swarm, giant_humanoid, winged_humanoid, or aquatic
5. Include balanced gameplay statistics with health between 1-20
6. Add theme color variations for all 4 themes (hell, ice, toxic, industrial)
7. Include relevant visual features and special features
8. Ensure all numeric values are reasonable for game balance
9. Consider diverse demon archetypes: melee fighters, ranged attackers, tanks, agile scouts
10. Use creative visual features and special abilities for uniqueness

Body Type Guidelines (20 Types for Maximum Diversity):
- humanoid: Traditional demon warriors, mages, champions (2 arms, 2 legs)
- quadruped: Beast-like demons, hounds, wolves (4 legs)
- dragon: Flying demons, wyrms, large winged beasts (wings + limbs)
- small_biped: Imp-like, agile scouts, small fighters (compact bipeds)
- floating: Ethereal demons, eye-like creatures, magical beings (levitating)
- serpentine: Snake demons, naga-like, long sinuous bodies (no legs)
- arachnid: Spider demons, scorpion-like, 6-8 legs (arthropod)
- tentacled: Octopus demons, kraken-like, flexible appendages (cephalopod)
- insectoid: Bug demons, mantis-like, segmented bodies (insect features)
- amorphous: Slime demons, shapeshifters, blob-like forms (no fixed shape)
- centauroid: Centaur demons, beast lower/humanoid upper (hybrid body)
- multi_headed: Hydra-like, cerberus-style, multiple heads (shared body)
- elemental: Pure energy beings, fire/ice/earth forms (energy constructs)
- mechanical: Cyber demons, robot-like, metallic constructs (artificial)
- plant_like: Tree demons, vine creatures, organic growth (botanical)
- crystalline: Gem demons, mineral beings, crystal structures (geological)
- swarm: Locust clouds, bat swarms, collective entities (multiple units)
- giant_humanoid: Titan demons, colossal bipeds, massive scale (oversized)
- winged_humanoid: Angel-fall demons, harpy-like, prominent wings (aerial humanoid)
- aquatic: Fish demons, sea creatures, water adaptations (marine features)

Visual Feature Ideas:
- Wings (bat, feathered, membrane, energy)
- Tails (spiked, whip-like, club, flame)
- Horns (curved, straight, multiple, glowing)
- Claws (razor, bone, metal, energy)
- Spikes (back, shoulder, defensive)
- Armor (bone, metal, magical, natural)
- Special: tentacles, multiple eyes, aura effects, elemental traits

Gameplay Balance:
- Health 1-5: Fast, agile, low-threat demons
- Health 6-10: Balanced demons with moderate threat
- Health 11-15: Strong demons, mini-bosses
- Health 16-20: Elite demons, major threats

JSON Template Structure (Enhanced with client-ts features):
{
  "id": "unique_demon_id",
  "name": "Demon Name",
  "emoji": "👹",
  "description": "Brief demon description and abilities",
  "health": 8,
  "speed": 1.2,
  "scale": 1.3,
  "colors": {
    "primary": "#8b0000",
    "head": "#cd5c5c", 
    "eyes": "#ff4500",
    "secondary": "#654321",
    "accent": "#ffd700"
  },
  "behavior": {
    "detectRange": 75,
    "attackRange": 6,
    "chaseRange": 25,
    "attackDamage": 20,
    "spawnWeight": 30,
    "isRanged": false,
    "fireballSpeed": 18.0,
    "fireballRange": 35.0,
    "attackCooldown": 120
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": true,
      "hasTail": true, 
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": true,
      "specialFeatures": ["flame_aura", "crown", "shoulder_armor", "glowing_runes"]
    }
  },
  "themes": {
    "hell": {
      "primary": "#8b0000",
      "head": "#cd5c5c",
      "eyes": "#ff4500",
      "secondary": "#2f1b14"
    },
    "ice": {
      "primary": "#4682b4", 
      "head": "#87ceeb",
      "eyes": "#00bfff",
      "secondary": "#e6e6fa"
    },
    "toxic": {
      "primary": "#228b22",
      "head": "#32cd32", 
      "eyes": "#00ff00",
      "secondary": "#9acd32"
    },
    "industrial": {
      "primary": "#696969",
      "head": "#808080",
      "eyes": "#00ff00", 
      "secondary": "#c0c0c0"
    }
  },
  "metadata": {
    "author": "AI Generator",
    "version": "1.0",
    "createdAt": "${new Date().toISOString()}",
    "tags": ["generated", "ai", "doom-style"]
  }
}

User Description: `;

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { prompt, type = "individual", count = 1 } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENSOTA_API_KEY;
    if (!apiKey) {
      console.error("OPENSOTA_API_KEY environment variable is not set");
      return NextResponse.json(
        { success: false, error: "API configuration error" },
        { status: 500 }
      );
    }

    // Prepare the prompt based on type
    let finalPrompt = GENERATION_PROMPT + prompt;

    if (type === "collection" && count > 1) {
      finalPrompt += `\n\nGenerate ${count} different demons based on this description. Return as a JSON array of demon objects.`;
    }

    // Make API call to OpenSota
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "z-ai/glm-4.5-air:free",
        messages: [
          {
            role: "user",
            content: finalPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenSota API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to generate monster" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { success: false, error: "No content generated" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      // Clean up the response - remove any markdown code blocks
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsedData = JSON.parse(cleanedContent);

      // Validate the structure
      if (Array.isArray(parsedData)) {
        // Collection of monsters
        const validatedMonsters = parsedData.map(validateMonsterConfig);
        return NextResponse.json({
          success: true,
          data: validatedMonsters,
        } as GenerationResponse);
      } else {
        // Single monster
        const validatedMonster = validateMonsterConfig(parsedData);
        return NextResponse.json({
          success: true,
          data: validatedMonster,
        } as GenerationResponse);
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Generated content:", generatedContent);
      return NextResponse.json(
        { success: false, error: "Failed to parse generated JSON" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Validate and clean monster configuration
function validateMonsterConfig(config: any): MonsterConfig {
  // Ensure required fields have valid values
  return {
    id: config.id || generateId(),
    name: config.name || "Unnamed Demon",
    emoji: config.emoji || "👹",
    description: config.description,
    health: Math.max(1, Math.min(20, config.health || 10)),
    speed: Math.max(0.1, Math.min(5.0, config.speed || 1.0)),
    scale: Math.max(0.1, Math.min(5.0, config.scale || 1.0)),
    colors: {
      primary: config.colors?.primary || "#ff0000",
      head: config.colors?.head || "#cc0000",
      eyes: config.colors?.eyes || "#ffff00",
      secondary: config.colors?.secondary,
      accent: config.colors?.accent,
    },
    behavior: {
      detectRange: Math.max(
        1,
        Math.min(50, config.behavior?.detectRange || 15)
      ),
      attackRange: Math.max(1, Math.min(20, config.behavior?.attackRange || 5)),
      chaseRange: Math.max(1, Math.min(50, config.behavior?.chaseRange || 20)),
      attackDamage: Math.max(
        1,
        Math.min(100, config.behavior?.attackDamage || 25)
      ),
      spawnWeight: Math.max(
        1,
        Math.min(100, config.behavior?.spawnWeight || 10)
      ),
      isRanged: config.behavior?.isRanged,
      fireballSpeed: config.behavior?.fireballSpeed,
      fireballRange: config.behavior?.fireballRange,
      attackCooldown: config.behavior?.attackCooldown,
    },
    appearance: {
      bodyType: [
        "humanoid",
        "quadruped",
        "dragon",
        "small_biped",
        "floating",
        "serpentine",
        "arachnid",
        "tentacled",
        "insectoid",
        "amorphous",
        "centauroid",
        "multi_headed",
        "elemental",
        "mechanical",
        "plant_like",
        "crystalline",
        "swarm",
        "giant_humanoid",
        "winged_humanoid",
        "aquatic",
      ].includes(config.appearance?.bodyType)
        ? config.appearance.bodyType
        : "humanoid",
      visualFeatures: config.appearance?.visualFeatures,
    },
    themes: config.themes,
    metadata: {
      ...config.metadata,
      createdAt: new Date().toISOString(),
      author: "AI Generator",
    },
  };
}

function generateId(): string {
  return "demon_" + Math.random().toString(36).substr(2, 9);
}

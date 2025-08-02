import { NextRequest, NextResponse } from "next/server";
import {
  MonsterConfig,
  GenerationRequest,
  GenerationResponse,
} from "@/types/monster";

const API_ENDPOINT = "https://api.opensota.ai/openai/v1/chat/completions";

// Generation prompt template based on the JSON demon system
const GENERATION_PROMPT = `Generate a complete JSON demon configuration for a DOOM-style FPS game based on the user's description.

Requirements:
1. Output ONLY valid JSON format
2. Use the exact structure provided in the template
3. All colors must be hex strings with # prefix
4. Choose appropriate bodyType: humanoid, quadruped, dragon, small_biped, or floating
5. Include balanced gameplay statistics
6. Add theme color variations for all 4 themes (hell, ice, toxic, industrial)
7. Include relevant visual features and special features
8. Ensure all numeric values are reasonable for game balance

JSON Template Structure:
{
  "id": "unique_demon_id",
  "name": "Demon Name",
  "emoji": "👹",
  "description": "Brief description",
  "health": 50,
  "speed": 1.5,
  "scale": 1.0,
  "colors": {
    "primary": "#ff0000",
    "head": "#cc0000",
    "eyes": "#ffff00",
    "secondary": "#880000",
    "accent": "#ff8800"
  },
  "behavior": {
    "detectRange": 15,
    "attackRange": 5,
    "chaseRange": 20,
    "attackDamage": 25,
    "spawnWeight": 10,
    "isRanged": false,
    "attackCooldown": 2000
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": true,
      "hasClaws": true,
      "hasSpikes": false,
      "hasArmor": false,
      "specialFeatures": ["glowing eyes", "sharp teeth"]
    }
  },
  "themes": {
    "hell": {
      "primary": "#ff0000",
      "eyes": "#ff4400"
    },
    "ice": {
      "primary": "#00aaff",
      "eyes": "#aaeeff"
    },
    "toxic": {
      "primary": "#00ff00",
      "eyes": "#88ff00"
    },
    "industrial": {
      "primary": "#666666",
      "eyes": "#ff0000"
    }
  },
  "metadata": {
    "author": "AI Generator",
    "version": "1.0",
    "createdAt": "${new Date().toISOString()}",
    "tags": ["generated", "ai"]
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
    health: Math.max(1, Math.min(100, config.health || 50)),
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

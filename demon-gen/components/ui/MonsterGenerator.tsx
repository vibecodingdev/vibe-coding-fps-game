"use client";

import { useState, useEffect } from "react";
import {
  MonsterConfig,
  GenerationRequest,
  GenerationResponse,
} from "@/types/monster";
import Button from "./Button";
import Textarea from "./Textarea";
import MonsterCard from "./MonsterCard";
import { MonsterStorage } from "@/utils/localStorage";

export default function MonsterGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedMonsters, setGeneratedMonsters] = useState<MonsterConfig[]>(
    []
  );
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  // Load monsters from localStorage on component mount
  useEffect(() => {
    const loadStoredMonsters = () => {
      try {
        const storedMonsters = MonsterStorage.loadMonsters();
        setGeneratedMonsters(storedMonsters);
        console.log(`📦 Loaded ${storedMonsters.length} monsters from storage`);
      } catch (error) {
        console.error("❌ Failed to load stored monsters:", error);
      } finally {
        setIsLoadingStorage(false);
      }
    };

    loadStoredMonsters();
  }, []);

  // Save to localStorage whenever monsters change
  useEffect(() => {
    if (!isLoadingStorage && generatedMonsters.length > 0) {
      MonsterStorage.saveMonsters(generatedMonsters);
    }
  }, [generatedMonsters, isLoadingStorage]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your monster");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const request: GenerationRequest = {
        prompt: prompt.trim(),
        type: "individual",
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data: GenerationResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      // Handle both single monster and array responses
      const monsters = Array.isArray(data.data) ? data.data : [data.data!];

      // Add to the beginning of the list and save to localStorage
      setGeneratedMonsters((prev) => {
        const newMonsters = [...monsters, ...prev];
        return newMonsters;
      });

      setPrompt(""); // Clear the input
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMonster = (monster: MonsterConfig) => {
    navigator.clipboard.writeText(JSON.stringify(monster, null, 2));
    // You could add a toast notification here
  };

  const handleDeleteMonster = (monsterId: string) => {
    setGeneratedMonsters((prev) => {
      const updated = prev.filter((m) => m.id !== monsterId);
      // Save to localStorage will happen automatically via useEffect
      return updated;
    });
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to delete all monsters? This action cannot be undone."
      )
    ) {
      setGeneratedMonsters([]);
      MonsterStorage.clearAllMonsters();
    }
  };

  const handleExportAll = () => {
    const dataStr = MonsterStorage.exportData();
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `monsters-export-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = MonsterStorage.importData(text);

        if (result.success) {
          // Reload monsters from storage
          const updatedMonsters = MonsterStorage.loadMonsters();
          setGeneratedMonsters(updatedMonsters);
          alert(`✅ Successfully imported ${result.imported} monster(s)!`);
        } else {
          alert(`❌ Import failed:\n${result.error}`);
        }
      } catch (error) {
        alert(
          `❌ Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    };
    input.click();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  const samplePrompts = [
    // Classic archetypes (original 5 body types)
    "A fierce fire dragon with massive wings, flame breath, and ancient armor plates",
    "A shadowy assassin demon with teleportation, razor claws, and stealth abilities",
    "A heavily armored tank demon with bone spikes, massive fists, and defensive stance",
    "A floating ice wraith with crystalline body, freezing aura, and ice shard projectiles",
    "A small but agile toxic imp with poison claws, acid spit, and venomous tail",

    // New diverse body types (showcasing the 15 additional types)
    "A serpentine viper demon with coiling body, hypnotic gaze, and venomous strikes",
    "An arachnid nightmare with eight razor legs, web-spinning, and paralyzing venom",
    "A tentacled kraken spawn with crushing appendages, ink clouds, and aquatic terror",
    "An insectoid mantis with scything arms, compound eyes, and lightning reflexes",
    "An amorphous slime with shapeshifting form, corrosive touch, and absorption powers",
    "A centauroid champion with horse body, warrior torso, and charging spear attacks",
    "A multi-headed hydra with regenerating heads, breath weapons, and shared rage",
    "An elemental fire being with plasma form, flame bursts, and heat aura damage",
    "A mechanical war machine with laser weapons, steel plating, and tactical systems",
    "A plant-like treant with root networks, thorn volleys, and nature's wrath",
    "A crystalline golem with gem armor, light refraction, and mineral projectiles",
    "A swarm of shadow bats with collective mind, dive attacks, and darkness clouds",
    "A giant humanoid titan with colossal strength, ground tremors, and massive reach",
    "A winged humanoid seraph with holy corruption, aerial supremacy, and light beams",
    "An aquatic leviathan with fins, sonar, and crushing water pressure attacks",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl hell-title mb-4">
          👹 DEMON GENERATOR 👹
        </h1>
        <p className="text-gaming-text-secondary text-lg font-gaming tracking-wide">
          Create custom demons for your DOOM-style FPS game using AI
        </p>
      </div>

      {/* Generation Form */}
      <div className="gaming-card mb-8">
        <h2 className="text-xl font-semibold text-gaming-primary mb-4 font-gaming tracking-wide">
          🔥 DESCRIBE YOUR DEMON 🔥
        </h2>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Describe the monster you want to create... (e.g., 'A fierce fire dragon with massive wings and flame breath attacks')"
          rows={4}
          className="mb-4"
          error={error}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gaming-text-muted font-gaming">
            Press Cmd/Ctrl + Enter to summon quickly
          </p>
          <Button
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={!prompt.trim()}
            className="gaming-button uppercase tracking-wider font-gaming"
          >
            {isLoading ? "🔥 SUMMONING..." : "⚡ SUMMON DEMON"}
          </Button>
        </div>
      </div>

      {/* Sample Prompts */}
      <div className="gaming-card mb-8">
        <h3 className="text-lg font-medium text-gaming-primary mb-3 font-gaming tracking-wide">
          💀 NEED INSPIRATION? TRY THESE HELLISH PROMPTS:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {samplePrompts.map((sample, index) => (
            <div
              key={index}
              onClick={() => {
                setPrompt(sample);
                setError("");
              }}
              className="text-left p-3 bg-gaming-bg-primary rounded border border-gaming-border hover:border-gaming-primary transition-all duration-200 text-gaming-text-muted hover:text-gaming-primary hover:shadow-gaming-glow cursor-pointer select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setPrompt(sample);
                  setError("");
                }
              }}
            >
              <span className="font-gaming">"{sample}"</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Monsters */}
      {generatedMonsters.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gaming-primary font-gaming tracking-wide hell-title">
              🔥 SUMMONED DEMONS ({generatedMonsters.length}) 🔥
            </h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="border-gaming-secondary text-gaming-secondary hover:bg-gaming-secondary hover:text-white font-gaming uppercase tracking-wide"
              >
                📥 IMPORT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                className="border-gaming-accent text-gaming-accent hover:bg-gaming-accent hover:text-white font-gaming uppercase tracking-wide"
              >
                📤 EXPORT ALL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="border-gaming-danger text-gaming-danger hover:bg-gaming-danger hover:text-white font-gaming uppercase tracking-wide"
              >
                🧹 CLEAR ALL
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {generatedMonsters.map((monster, index) => (
              <MonsterCard
                key={`${monster.id}-${index}`}
                monster={monster}
                onCopy={handleCopyMonster}
                onDelete={handleDeleteMonster}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingStorage && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-gaming-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gaming-text-muted font-gaming tracking-wide">
            Loading your summoned demons...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingStorage && generatedMonsters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-pulse-glow">👹</div>
          <h3 className="text-xl font-medium text-gaming-primary mb-2 font-gaming tracking-wide">
            NO DEMONS SUMMONED YET
          </h3>
          <p className="text-gaming-text-muted font-gaming">
            Enter a description above to begin your hellish creation!
          </p>
        </div>
      )}
    </div>
  );
}

import { MonsterConfig } from "@/types/monster";
import { useState } from "react";
import Button from "./Button";
import MonsterPreview3D from "./MonsterPreview3D";

interface MonsterCardProps {
  monster: MonsterConfig;
  onExport?: (monster: MonsterConfig) => void;
  onCopy?: (monster: MonsterConfig) => void;
  onDelete?: (monsterId: string) => void;
}

export default function MonsterCard({
  monster,
  onExport,
  onCopy,
  onDelete,
}: MonsterCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [show3D, setShow3D] = useState(true);

  const handleExport = () => {
    if (onExport) {
      onExport(monster);
    } else {
      // Default export as JSON file
      const dataStr = JSON.stringify(monster, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${monster.id}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(monster);
    } else {
      // Default copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(monster, null, 2));
    }
  };

  return (
    <div className="gaming-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl animate-pulse-glow">{monster.emoji}</span>
          <div>
            <h3 className="text-lg font-semibold text-gaming-primary font-gaming tracking-wide">
              {monster.name}
            </h3>
            <p className="text-sm text-gaming-text-muted font-mono">
              {monster.id}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShow3D(!show3D)}
            className="border-gaming-secondary text-gaming-secondary hover:bg-gaming-secondary hover:text-white font-gaming"
          >
            {show3D ? "2D" : "3D"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="border-gaming-primary text-gaming-primary hover:bg-gaming-primary hover:text-white font-gaming"
          >
            {showDetails ? "HIDE" : "DETAILS"}
          </Button>
        </div>
      </div>

      {/* Description */}
      {monster.description && (
        <p className="text-gaming-text-muted mb-4 italic font-gaming">
          "{monster.description}"
        </p>
      )}

      {/* Basic Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-2 bg-gaming-bg-primary rounded border border-gaming-border">
          <div className="text-lg font-bold text-gaming-accent font-gaming">
            {monster.health}
          </div>
          <div className="text-xs text-gaming-text-muted uppercase tracking-wide">
            Health
          </div>
        </div>
        <div className="text-center p-2 bg-gaming-bg-primary rounded border border-gaming-border">
          <div className="text-lg font-bold text-gaming-primary font-gaming">
            {monster.speed}
          </div>
          <div className="text-xs text-gaming-text-muted uppercase tracking-wide">
            Speed
          </div>
        </div>
        <div className="text-center p-2 bg-gaming-bg-primary rounded border border-gaming-border">
          <div className="text-lg font-bold text-gaming-secondary font-gaming">
            {monster.behavior.attackDamage}
          </div>
          <div className="text-xs text-gaming-text-muted uppercase tracking-wide">
            Damage
          </div>
        </div>
      </div>

      {/* 3D Model Preview or 2D Info */}
      {show3D ? (
        <div className="mb-4">
          <MonsterPreview3D monster={monster} width={280} height={200} />
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gaming-bg-primary rounded border border-gaming-border">
          <div className="text-center">
            <div className="text-4xl mb-2">{monster.emoji}</div>
            <div className="text-gaming-primary font-gaming text-lg tracking-wide">
              {monster.name}
            </div>
            <div className="text-gaming-text-muted text-sm mt-1 capitalize">
              {monster.appearance.bodyType} Demon
            </div>
          </div>
        </div>
      )}

      {/* Color Preview */}
      <div className="flex space-x-2 mb-4">
        <div
          className="w-6 h-6 rounded border border-gaming-border"
          style={{ backgroundColor: monster.colors.primary }}
          title="Primary Color"
        />
        <div
          className="w-6 h-6 rounded border border-gaming-border"
          style={{ backgroundColor: monster.colors.head }}
          title="Head Color"
        />
        <div
          className="w-6 h-6 rounded border border-gaming-border"
          style={{ backgroundColor: monster.colors.eyes }}
          title="Eye Color"
        />
        {monster.colors.secondary && (
          <div
            className="w-6 h-6 rounded border border-gaming-border"
            style={{ backgroundColor: monster.colors.secondary }}
            title="Secondary Color"
          />
        )}
        {monster.colors.accent && (
          <div
            className="w-6 h-6 rounded border border-gaming-border"
            style={{ backgroundColor: monster.colors.accent }}
            title="Accent Color"
          />
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gaming-border">
          {/* Behavior Stats */}
          <div>
            <h4 className="font-medium text-gaming-primary mb-2 font-gaming tracking-wide uppercase">
              🎯 Combat Behavior
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Detect Range:{" "}
                <span className="text-gaming-accent">
                  {monster.behavior.detectRange}
                </span>
              </div>
              <div>
                Attack Range:{" "}
                <span className="text-gaming-accent">
                  {monster.behavior.attackRange}
                </span>
              </div>
              <div>
                Chase Range:{" "}
                <span className="text-gaming-accent">
                  {monster.behavior.chaseRange}
                </span>
              </div>
              <div>
                Spawn Weight:{" "}
                <span className="text-gaming-accent">
                  {monster.behavior.spawnWeight}
                </span>
              </div>
              {monster.behavior.isRanged && (
                <>
                  <div>
                    Fireball Speed:{" "}
                    <span className="text-gaming-accent">
                      {monster.behavior.fireballSpeed}
                    </span>
                  </div>
                  <div>
                    Fireball Range:{" "}
                    <span className="text-gaming-accent">
                      {monster.behavior.fireballRange}
                    </span>
                  </div>
                </>
              )}
              {monster.behavior.attackCooldown && (
                <div>
                  Attack Cooldown:{" "}
                  <span className="text-gaming-accent">
                    {monster.behavior.attackCooldown}ms
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h4 className="font-medium text-gaming-primary mb-2 font-gaming tracking-wide uppercase">
              👾 Physical Form
            </h4>
            <div className="text-sm">
              <div>
                Body Type:{" "}
                <span className="text-gaming-accent capitalize">
                  {monster.appearance.bodyType}
                </span>
              </div>
              {monster.appearance.visualFeatures && (
                <div className="mt-2">
                  <div className="text-xs text-gaming-text-secondary mb-1">
                    Features:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(monster.appearance.visualFeatures)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-gaming-bg-primary rounded text-xs text-gaming-accent"
                        >
                          {key.replace("has", "").toLowerCase()}
                        </span>
                      ))}
                    {monster.appearance.visualFeatures.specialFeatures?.map(
                      (feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gaming-bg-primary rounded text-xs text-gaming-primary"
                        >
                          {feature}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Theme Colors */}
          {monster.themes && (
            <div>
              <h4 className="font-medium text-gaming-primary mb-2 font-gaming tracking-wide uppercase">
                🌍 Hellish Themes
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(monster.themes).map(([theme, colors]) => (
                  <div key={theme} className="flex items-center space-x-2">
                    <span className="text-xs text-gaming-text-secondary capitalize">
                      {theme}:
                    </span>
                    <div className="flex space-x-1">
                      {colors.primary && (
                        <div
                          className="w-4 h-4 rounded border border-gaming-border"
                          style={{ backgroundColor: colors.primary }}
                        />
                      )}
                      {colors.eyes && (
                        <div
                          className="w-4 h-4 rounded border border-gaming-border"
                          style={{ backgroundColor: colors.eyes }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gaming-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-gaming-border text-gaming-text-muted hover:border-gaming-primary hover:text-gaming-primary font-gaming uppercase tracking-wide"
        >
          📋 COPY
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          className="gaming-button font-gaming uppercase tracking-wide"
        >
          💾 EXPORT
        </Button>
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(monster.id)}
            className="border-gaming-danger text-gaming-danger hover:bg-gaming-danger hover:text-white font-gaming uppercase tracking-wide"
          >
            🗑️ DELETE
          </Button>
        )}
      </div>
    </div>
  );
}

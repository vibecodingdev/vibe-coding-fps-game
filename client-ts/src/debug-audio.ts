import { AudioSystem } from "@/systems/AudioSystem";
import { AUDIO_CONFIGS } from "@/config/audio";

// Debug script to test audio system
console.log("🎵 Audio System Debug Script");
console.log("Available audio configs:", Object.keys(AUDIO_CONFIGS));

// Test audio config paths
console.log("\n📁 Checking audio file paths:");
for (const [key, config] of Object.entries(AUDIO_CONFIGS)) {
  console.log(`${key}: ${config.url}`);
}

// Test essential audio files existence
const essentialSounds = [
  "bg-mystic-1",
  "weapon-shotgun",
  "weapon-machinegun",
  "weapon-single-shot",
  "demon-growl-2",
  "demon-roar-1",
];

console.log("\n✅ Essential audio files check:");
essentialSounds.forEach((sound) => {
  const config = AUDIO_CONFIGS[sound];
  if (config) {
    console.log(`✓ ${sound}: ${config.url}`);
  } else {
    console.error(`❌ Missing config for: ${sound}`);
  }
});

// Create and test audio system
async function testAudioSystem() {
  try {
    console.log("\n🔧 Testing AudioSystem initialization...");
    const audioSystem = new AudioSystem();

    // Mock DOM environment for testing
    global.document = global.document || {};
    global.window = global.window || {};

    await audioSystem.initialize();

    console.log("✅ AudioSystem initialized successfully");
    console.log("🎵 Audio sources loaded:", audioSystem.sources.size);
    console.log("🔊 Volume settings:", audioSystem.volumes);

    // Test weapon sound mapping
    console.log("\n🔫 Testing weapon sound mapping:");
    const weaponTypes = ["shotgun", "machinegun", "rifle", "pistol"];

    weaponTypes.forEach((weapon) => {
      console.log(`Testing weapon sound: ${weapon}`);
      audioSystem.playWeaponSound(weapon);
    });
  } catch (error) {
    console.error("❌ AudioSystem test failed:", error);
  }
}

// Only run if not in browser environment
if (typeof window === "undefined") {
  testAudioSystem();
}

export { testAudioSystem };

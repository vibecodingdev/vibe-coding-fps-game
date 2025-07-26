/**
 * Debug script for Voice Chat System
 *
 * Usage:
 * 1. Open browser console
 * 2. Call window.testVoiceChat() to run tests
 * 3. Call window.debugVoiceChat() to see current state
 */

declare global {
  interface Window {
    testVoiceChat: () => void;
    debugVoiceChat: () => void;
  }
}

export function setupVoiceChatDebugFunctions(): void {
  // Test voice chat functionality
  window.testVoiceChat = () => {
    console.log("🎤 Testing Voice Chat System:");
    console.log("1. Check if voice chat UI is visible in bottom-left");
    console.log("2. Open pause menu (ESC) to adjust voice settings");
    console.log("3. Hold T (or configured key) to test speech-to-text");
    console.log("4. Try switching between voice modes in settings");
    console.log("5. Check console for voice messages");

    // Test UI elements
    const voiceStatus = document.querySelector(".voice-chat-status");
    const statusIndicator = document.querySelector(".voice-status-indicator");
    const recordingIndicator = document.querySelector(
      ".voice-recording-indicator"
    );

    console.log("Voice Chat UI Status:", {
      voiceStatus: !!voiceStatus,
      statusIndicator: !!statusIndicator,
      recordingIndicator: !!recordingIndicator,
      statusVisible: statusIndicator
        ? getComputedStyle(statusIndicator).display !== "none"
        : false,
      recordingVisible: recordingIndicator
        ? getComputedStyle(recordingIndicator).display !== "none"
        : false,
    });

    // Test settings UI
    const modeSelect = document.getElementById("pauseVoiceChatMode");
    const volumeSlider = document.getElementById("pauseVoiceVolume");
    const keySelect = document.getElementById("pausePushToTalkKey");

    console.log("Voice Chat Settings UI:", {
      modeSelect: !!modeSelect,
      volumeSlider: !!volumeSlider,
      keySelect: !!keySelect,
      currentMode: modeSelect
        ? (modeSelect as HTMLSelectElement).value
        : "not found",
      currentVolume: volumeSlider
        ? (volumeSlider as HTMLInputElement).value
        : "not found",
      currentKey: keySelect
        ? (keySelect as HTMLSelectElement).value
        : "not found",
    });

    // Check browser support
    const hasWebkitSpeech = "webkitSpeechRecognition" in window;
    const hasSpeech = "SpeechRecognition" in window;
    const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia;

    console.log("Browser Support:", {
      speechRecognitionSupported: hasWebkitSpeech || hasSpeech,
      webkitSpeechRecognition: hasWebkitSpeech,
      speechRecognition: hasSpeech,
      mediaDevices: hasMediaDevices,
    });

    if (!hasWebkitSpeech && !hasSpeech) {
      console.warn("⚠️ Speech recognition not supported in this browser");
    }

    if (!hasMediaDevices) {
      console.warn("⚠️ Media devices API not available");
    }
  };

  // Debug voice chat system state
  window.debugVoiceChat = () => {
    // Try to access the voice chat system through game instance
    const game = (window as any).game;
    if (game && game.getUIManager) {
      const uiManager = game.getUIManager();
      console.log("UIManager found:", !!uiManager);

      if (uiManager && (uiManager as any).voiceChatSystem) {
        const voiceSystem = (uiManager as any).voiceChatSystem;
        if (voiceSystem.debug) {
          voiceSystem.debug();
        } else {
          console.log("Voice chat system found but no debug method");
        }
      } else {
        console.log("Voice chat system not found in UIManager");
      }
    } else {
      console.log("Game instance not found. Voice chat debug unavailable.");
      console.log(
        "Available on window:",
        Object.keys(window).filter(
          (k) => k.includes("game") || k.includes("voice")
        )
      );
    }

    // Check localStorage settings
    const savedSettings = localStorage.getItem("voiceChatSettings");
    if (savedSettings) {
      console.log("Saved voice chat settings:", JSON.parse(savedSettings));
    } else {
      console.log("No saved voice chat settings found");
    }
  };

  console.log("Voice Chat Debug Functions Setup Complete!");
  console.log("📝 Available functions:");
  console.log("  - window.testVoiceChat() - Run voice chat tests");
  console.log("  - window.debugVoiceChat() - Show debug info");
}

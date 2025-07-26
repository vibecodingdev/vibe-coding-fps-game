export interface VoiceChatSettings {
  mode: "speech-to-text" | "voice-transmission" | "disabled";
  voiceVolume: number;
  pushToTalkKey: string;
}

export class VoiceChatSystem {
  private settings: VoiceChatSettings = {
    mode: "speech-to-text",
    voiceVolume: 80,
    pushToTalkKey: "KeyT",
  };

  private isRecording: boolean = false;
  private isPushToTalkPressed: boolean = false;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private recognition: any = null; // SpeechRecognition
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private remoteAudios: HTMLAudioElement[] = [];

  // Callback for handling voice messages
  private onVoiceMessage: ((message: string, type: string) => void) | null =
    null;

  public async initialize(): Promise<void> {
    console.log("🎤 VoiceChatSystem initializing...");

    this.loadSettings();
    this.setupEventListeners();

    if (this.settings.mode === "speech-to-text") {
      this.initSpeechRecognition();
    }

    // Request microphone permission only if needed
    try {
      if (this.settings.mode !== "disabled") {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1,
          },
        });

        try {
          this.audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();

          this.audioContext.addEventListener("statechange", () => {
            console.log("AudioContext state:", this.audioContext?.state);
            if (this.audioContext?.state === "suspended") {
              document.addEventListener(
                "click",
                this.resumeAudioContext.bind(this),
                {
                  once: true,
                }
              );
            }
          });
        } catch (audioError) {
          console.warn("AudioContext creation failed:", audioError);
          this.audioContext = null;
        }
      }

      console.log("✅ Voice chat initialized successfully");
      this.updateStatus("ready");
    } catch (error) {
      console.error("Failed to initialize voice chat:", error);
      this.updateStatus("error");
    }
  }

  private resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed");
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error);
        });
    }
  }

  private loadSettings(): void {
    const savedSettings = localStorage.getItem("voiceChatSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.settings = { ...this.settings, ...settings };
    }

    // Update UI elements
    this.updateUIElements();
  }

  private updateUIElements(): void {
    const voiceChatMode = document.getElementById(
      "pauseVoiceChatMode"
    ) as HTMLSelectElement;
    const voiceVolume = document.getElementById(
      "pauseVoiceVolume"
    ) as HTMLInputElement;
    const pushToTalkKey = document.getElementById(
      "pausePushToTalkKey"
    ) as HTMLSelectElement;

    if (voiceChatMode) voiceChatMode.value = this.settings.mode;
    if (voiceVolume) voiceVolume.value = this.settings.voiceVolume.toString();
    if (pushToTalkKey) pushToTalkKey.value = this.settings.pushToTalkKey;

    // Update volume display
    const volumeDisplay = document.getElementById("voiceVolumeDisplay");
    if (volumeDisplay)
      volumeDisplay.textContent = `${this.settings.voiceVolume}%`;
  }

  private saveSettings(): void {
    localStorage.setItem("voiceChatSettings", JSON.stringify(this.settings));
  }

  private setupEventListeners(): void {
    // Mode change
    const voiceChatMode = document.getElementById("pauseVoiceChatMode");
    if (voiceChatMode) {
      voiceChatMode.addEventListener("change", (e) => {
        const newMode = (e.target as HTMLSelectElement)
          .value as VoiceChatSettings["mode"];
        const oldMode = this.settings.mode;

        this.settings.mode = newMode;
        this.saveSettings();

        if (this.isRecording) {
          this.stopRecording();
        }

        if (newMode === "speech-to-text") {
          if (oldMode !== "speech-to-text") {
            this.initSpeechRecognition();
          }
          this.updateStatus("ready");
        } else if (newMode === "disabled") {
          this.disable();
        } else {
          this.updateStatus("ready");
        }
      });
    }

    // Voice volume change
    const voiceVolume = document.getElementById("pauseVoiceVolume");
    if (voiceVolume) {
      voiceVolume.addEventListener("input", (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.settings.voiceVolume = value;
        this.saveSettings();
        this.updateVoiceVolume(value);
      });
    }

    // Master volume change
    const masterVolume = document.getElementById("pauseMasterVolume");
    if (masterVolume) {
      masterVolume.addEventListener("input", (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        const display = document.getElementById("masterVolumeDisplay");
        if (display) display.textContent = `${value}%`;
        // TODO: Implement master volume control for game audio
      });
    }

    // Push-to-talk key change
    const pushToTalkKey = document.getElementById("pausePushToTalkKey");
    if (pushToTalkKey) {
      pushToTalkKey.addEventListener("change", (e) => {
        this.settings.pushToTalkKey = (e.target as HTMLSelectElement).value;
        this.saveSettings();
        this.updatePushToTalkDisplay();
      });
    }

    // Global key event listeners
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.code === this.settings.pushToTalkKey && !event.repeat) {
      if (
        this.settings.mode !== "disabled" &&
        !this.isPushToTalkPressed &&
        !this.isRecording
      ) {
        this.isPushToTalkPressed = true;
        this.startRecording();
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.code === this.settings.pushToTalkKey) {
      if (this.isPushToTalkPressed) {
        this.isPushToTalkPressed = false;
        this.stopRecording();
      }
    }
  }

  private updateVoiceVolume(value: number): void {
    const volume = value / 100;
    this.settings.voiceVolume = value;

    this.remoteAudios.forEach((audio) => {
      audio.volume = volume;
    });

    this.saveSettings();

    const display = document.getElementById("voiceVolumeDisplay");
    if (display) display.textContent = `${value}%`;

    console.log("Voice volume:", volume);
  }

  private initSpeechRecognition(): void {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.warn("Speech recognition not supported in this browser");
      this.updateStatus("error");
      return;
    }

    if (this.recognition) {
      if (this.recognition.state === "active") {
        this.recognition.stop();
      }
      this.recognition = null;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = navigator.language || "en-US";
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            this.sendVoiceMessage(transcript, "speech-to-text");
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "audio-capture" || event.error === "not-allowed") {
          this.updateStatus("error");
        }
        this.stopRecording();
      };

      this.recognition.onstart = () => {
        console.log("Speech recognition started");
      };

      this.recognition.onend = () => {
        console.log("Speech recognition ended");
        if (this.isRecording) {
          this.stopRecording();
        }
      };

      console.log("Speech recognition initialized successfully");
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
      this.updateStatus("error");
    }
  }

  public startRecording(): void {
    if (this.settings.mode === "disabled" || this.isRecording) {
      return;
    }

    if (this.recognition && this.recognition.state === "active") {
      console.warn("Speech recognition already active, skipping start");
      return;
    }

    this.isRecording = true;
    this.updateStatus("recording");

    try {
      if (this.settings.mode === "speech-to-text") {
        this.startSpeechToText();
      } else if (this.settings.mode === "voice-transmission") {
        this.startVoiceTransmission();
      }
    } catch (error) {
      console.error("Failed to start voice recording:", error);
      this.stopRecording();
    }
  }

  public stopRecording(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;
    this.updateStatus("ready");

    try {
      if (this.recognition && this.settings.mode === "speech-to-text") {
        if (this.recognition.state === "active") {
          this.recognition.stop();
        }
      }

      if (
        this.mediaRecorder &&
        this.settings.mode === "voice-transmission" &&
        this.mediaRecorder.state === "recording"
      ) {
        this.mediaRecorder.stop();
      }
    } catch (error) {
      console.error("Error stopping voice recording:", error);
    }
  }

  private startSpeechToText(): void {
    if (!this.recognition) {
      console.warn("Speech recognition not initialized");
      this.stopRecording();
      return;
    }

    if (this.recognition.state === "active") {
      console.warn("Speech recognition already active");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      this.stopRecording();
    }
  }

  private startVoiceTransmission(): void {
    if (!this.audioStream) {
      console.error("No audio stream available");
      this.stopRecording();
      return;
    }

    this.audioChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: "audio/webm;codecs=opus",
        });
        this.sendVoiceData(audioBlob);
      };

      this.mediaRecorder.start(100);
    } catch (error) {
      console.error("Failed to start voice transmission:", error);
      this.stopRecording();
    }
  }

  private sendVoiceMessage(message: string, type: string): void {
    console.log("🎤 Voice message:", message);

    // Use callback if available, otherwise log to console
    if (this.onVoiceMessage) {
      this.onVoiceMessage(message, type);
    } else {
      console.log(`Voice Chat Message: ${message}`);
    }

    // TODO: Send to multiplayer server when implemented
    // if (socket && socket.connected) {
    //   socket.emit("voice:message", {
    //     type: type,
    //     message: message,
    //     playerId: socket.id,
    //     timestamp: Date.now(),
    //   });
    // }
  }

  private sendVoiceData(audioBlob: Blob): void {
    console.log("🎤 Voice audio recorded:", audioBlob.size, "bytes");

    // Show test message - we'll handle this differently to avoid type issues
    console.log("Voice Chat: Audio recording completed");

    // TODO: Send audio data to multiplayer server when implemented
    // const reader = new FileReader();
    // reader.onload = () => {
    //   if (socket && socket.connected) {
    //     socket.emit("voice:data", {
    //       type: "voice-transmission",
    //       audioData: reader.result,
    //       playerId: socket.id,
    //       timestamp: Date.now(),
    //     });
    //   }
    // };
    // reader.readAsArrayBuffer(audioBlob);
  }

  private updateStatus(
    status: "ready" | "recording" | "error" | "disabled"
  ): void {
    const statusIndicator = document.querySelector(
      ".voice-status-indicator"
    ) as HTMLElement;
    const recordingIndicator = document.querySelector(
      ".voice-recording-indicator"
    ) as HTMLElement;

    if (!statusIndicator || !recordingIndicator) {
      return;
    }

    if (status === "recording") {
      statusIndicator.style.display = "none";
      recordingIndicator.style.display = "flex";
    } else {
      statusIndicator.style.display = "flex";
      recordingIndicator.style.display = "none";

      const icon = statusIndicator.querySelector("i");
      const text = statusIndicator.querySelector("span");

      if (icon && text) {
        switch (status) {
          case "ready":
            icon.className = "fas fa-microphone";
            text.textContent = `Hold ${this.getPushToTalkKeyDisplay()} to speak`;
            break;
          case "error":
            icon.className = "fas fa-microphone-slash";
            text.textContent = "Voice chat unavailable";
            break;
          case "disabled":
            icon.className = "fas fa-microphone-slash";
            text.textContent = "Voice chat disabled";
            break;
        }
      }
    }
  }

  private getPushToTalkKeyDisplay(): string {
    const keyMap: { [key: string]: string } = {
      KeyT: "T",
      KeyV: "V",
      KeyB: "B",
      KeyG: "G",
    };
    return keyMap[this.settings.pushToTalkKey] || "T";
  }

  private updatePushToTalkDisplay(): void {
    this.updateStatus(this.settings.mode === "disabled" ? "disabled" : "ready");
  }

  public disable(): void {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch((error) => {
        console.warn("Failed to close AudioContext:", error);
      });
      this.audioContext = null;
    }

    if (this.recognition) {
      if (this.recognition.state === "active") {
        this.recognition.stop();
      }
      this.recognition = null;
    }

    this.updateStatus("disabled");
  }

  public cleanup(): void {
    this.disable();
    document.removeEventListener("keydown", this.onKeyDown.bind(this));
    document.removeEventListener("keyup", this.onKeyUp.bind(this));
  }

  // Set callback for voice message handling
  public setVoiceMessageCallback(
    callback: (message: string, type: string) => void
  ): void {
    this.onVoiceMessage = callback;
  }

  // Debug function
  public debug(): void {
    console.log("Voice Chat Debug Info:", {
      mode: this.settings.mode,
      isRecording: this.isRecording,
      isPushToTalkPressed: this.isPushToTalkPressed,
      hasAudioStream: !!this.audioStream,
      hasAudioContext: !!this.audioContext,
      audioContextState: this.audioContext?.state,
      hasRecognition: !!this.recognition,
      recognitionState: this.recognition?.state,
      pushToTalkKey: this.settings.pushToTalkKey,
    });
  }
}

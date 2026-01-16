import { getSettings } from "./storage";

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  private userInteracted: boolean = false;

  constructor() {
    this.isEnabled = getSettings().soundEnabled;
    this.setupUserInteractionListener();
  }

  private setupUserInteractionListener() {
    const initOnInteraction = () => {
      this.userInteracted = true;
      if (this.isEnabled && !this.isInitialized) {
        this.initializeContext();
      }
      document.removeEventListener("click", initOnInteraction);
      document.removeEventListener("keydown", initOnInteraction);
      document.removeEventListener("touchstart", initOnInteraction);
    };

    document.addEventListener("click", initOnInteraction);
    document.addEventListener("keydown", initOnInteraction);
    document.addEventListener("touchstart", initOnInteraction);
  }

  private initializeContext(): boolean {
    if (this.isInitialized && this.audioContext) return true;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;
      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn("Failed to initialize audio context:", e);
      return false;
    }
  }

  private getContext(): AudioContext | null {
    if (!this.userInteracted) return null;
    
    if (!this.isInitialized) {
      if (!this.initializeContext()) return null;
    }
    
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    
    return this.audioContext;
  }

  private getMasterGain(): GainNode | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    return this.masterGain;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled && this.userInteracted && !this.isInitialized) {
      this.initializeContext();
    }
  }

  refreshSettings() {
    this.isEnabled = getSettings().soundEnabled;
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.masterGain = null;
      this.isInitialized = false;
    }
  }

  playThrow() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(8000, now + 0.08);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playHit() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1760, now);
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.12);
  }

  playCoinCollect() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const notes = [1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  playXPCollect() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, now);
    osc.frequency.exponentialRampToValueAtTime(784, now + 0.1);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playLevelUp() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = i < 3 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  playGameOver() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const notes = [440, 392, 349, 294, 262];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.35);
    });
  }

  playBossDefeated() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const fanfare = [
      { freq: 523, time: 0 },
      { freq: 659, time: 0.1 },
      { freq: 784, time: 0.2 },
      { freq: 1047, time: 0.35 },
      { freq: 784, time: 0.5 },
      { freq: 1047, time: 0.6 },
      { freq: 1319, time: 0.75 },
      { freq: 1568, time: 0.9 },
    ];
    
    fanfare.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + time);
      
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.25, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.25);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + time);
      osc.stop(now + time + 0.3);
    });
    
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(131, now);
    bassGain.gain.setValueAtTime(0.3, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 1.3);
  }

  playPlayerHurt() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
    
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 400;
    
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    noise.start(now);
  }

  playMiniBossAlert() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || !masterGain) return;
    
    const now = ctx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "square";
      osc.frequency.setValueAtTime(440, now + i * 0.2);
      
      gain.gain.setValueAtTime(0, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.2 + 0.02);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.2 + 0.08);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.12);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.15);
    }
  }
}

export const soundManager = new SoundManager();

/* ==========================================================================
   Web Audio API Sound Engine & Retro Synthesizer
   - Zero-dependency N64 Spring Boings, Coins, Jumps, and Speech Synth
   ========================================================================== */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = false;
    this.bgmTimer = null;
    
    // Lazy init audio context on user interaction
    this.initAudioContext = this.initAudioContext.bind(this);
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play N64 Super Mario 64 Spring / Face Stretch Boing
  playBoing(displacement = 1.0) {
    if (!this.sfxEnabled) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Base frequency pitch shifts with stretch distance!
      const startFreq = Math.min(600, Math.max(120, 220 + displacement * 180));
      const endFreq = Math.max(80, startFreq * 0.4);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.25);
      osc.frequency.linearRampToValueAtTime(startFreq * 0.8, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Play Classic Mario Coin Sound
  playCoin() {
    if (!this.sfxEnabled) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play N64 Mario Jump Sound
  playJump() {
    if (!this.sfxEnabled) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  // Speak Mario Voice Catchphrases using SpeechSynthesis
  speakMario(phrase) {
    if (!this.sfxEnabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.pitch = 1.6; // High Mario pitch!
      utterance.rate = 1.1;  // Energetic rate
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Toggle Retro Chiptune BGM Loop
  toggleBGM(enable) {
    this.bgmEnabled = enable;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }

    if (!enable) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C E G C G E
    let noteIdx = 0;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[noteIdx], now);
        noteIdx = (noteIdx + 1) % notes.length;

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      } catch (e) {
        console.warn(e);
      }
    }, 250);
  }
}

// Global instance
window.soundEngine = new SoundEngine();

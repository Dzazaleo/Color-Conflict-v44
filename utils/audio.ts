

export class AudioManager {
    private ctx: AudioContext | null = null;
    private bgmNode: AudioBufferSourceNode | null = null;
    private bgmGain: GainNode | null = null;
    private sfxGain: GainNode | null = null; // Dedicated SFX Bus
    private masterGain: GainNode | null = null;
    private bgmBuffer: AudioBuffer | null = null;
    private bgmBufferReverse: AudioBuffer | null = null; // Dedicated Reverse Track
    
    // Cached SFX Buffers to reduce GC
    private crashBuffer: AudioBuffer | null = null;

    private wantsBGM: boolean = false;
    
    private isWordMode: boolean = false;
    private isReverseMode: boolean = false;
    private isWarpTransitioning: boolean = false; // Flag to suppress audio events during warp transition

    // Suspension State Tracking
    private isSystemSuspended: boolean = false; // Visibility / Focus
    private isLogicSuspended: boolean = false;  // Game Logic (Pause / Settings)

    // Volume Preferences
    private bgmVolumePref: number = 0.35;
    private bgmDuckMultiplier: number = 1.0;

    constructor() {
      // Lazy initialization on user interaction
    }
  
    public init() {
      // 1. Create AudioContext if it doesn't exist
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4; // Default Master
        this.masterGain.connect(this.ctx.destination);
        
        // SFX Bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0; // Default SFX
        this.sfxGain.connect(this.masterGain);
        
        // Generate Cached Buffers
        this.generateCrashBuffer();
        
        // Pre-render BGM
        this.generateBGM();
      } 
      
      // 2. Always resume context (Crucial for iOS)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // 3. iOS/Safari Unlock Hack
      try {
          const buffer = this.ctx.createBuffer(1, 1, 22050);
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.ctx.destination);
          source.start(0);
      } catch (e) {
          // Fallback or ignore if context isn't ready
      }
    }

    // Centralized State Management
    private updateContextState() {
        if (!this.ctx) return;
        
        // Suspend if EITHER system is hidden OR game logic is paused
        const shouldSuspend = this.isSystemSuspended || this.isLogicSuspended;
        
        if (shouldSuspend) {
            if (this.ctx.state === 'running') {
                this.ctx.suspend();
            }
        } else {
            // Only resume if BOTH are active
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
    }

    public setSystemPaused(paused: boolean) {
        this.isSystemSuspended = paused;
        this.updateContextState();
    }

    public pauseGameAudio() {
        this.isLogicSuspended = true;
        this.updateContextState();
    }

    public resumeGameAudio() {
        this.isLogicSuspended = false;
        this.updateContextState();
    }

    public reset() {
        this.isReverseMode = false;
        this.isWarpTransitioning = false;
        this.setReverseMode(false);
        this.setDucked(false);
    }

    private generateCrashBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) {
            if (i % 4 === 0) data[i] = Math.random() * 2 - 1;
            else data[i] = data[i-1]; 
        }
        this.crashBuffer = buffer;
    }

    // Volume Controls
    public setMasterVolume(val: number) {
        if (this.masterGain) this.masterGain.gain.value = val;
    }

    private applyBGMVolume(rampTime: number = 0.1) {
        if (!this.ctx || !this.bgmGain) return;
        const targetVol = this.bgmVolumePref * this.bgmDuckMultiplier;
        const t = this.ctx.currentTime;
        
        try {
            this.bgmGain.gain.cancelScheduledValues(t);
            this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
            this.bgmGain.gain.linearRampToValueAtTime(targetVol, t + rampTime);
        } catch (e) {
            this.bgmGain.gain.value = targetVol;
        }
    }

    public setBGMVolume(val: number) {
        this.bgmVolumePref = val;
        this.applyBGMVolume(0.05);
    }

    public setDucked(isDucked: boolean) {
        const target = isDucked ? 0.3 : 1.0;
        if (this.bgmDuckMultiplier !== target) {
            this.bgmDuckMultiplier = target;
            this.applyBGMVolume(0.2); // 200ms transition
        }
    }

    public setSFXVolume(val: number) {
        if (this.sfxGain) this.sfxGain.gain.value = val;
    }

    public setRuleTheme(isWordMode: boolean) {
        this.isWordMode = isWordMode;
        this.updateBGMPlayback();
    }

    public setReverseMode(isReverse: boolean) {
        if (this.isReverseMode === isReverse) return;
        this.isReverseMode = isReverse;
        
        // Swap tracks immediately if playing
        if (this.wantsBGM) {
             this.startBGM(true); // Force restart to swap buffers
        } else {
             this.updateBGMPlayback();
        }
    }

    public setWarpTransition(active: boolean) {
        this.isWarpTransitioning = active;
    }

    public rampToWarpSpeed(duration: number) {
        if (!this.ctx || !this.bgmNode) return;
        const t = this.ctx.currentTime;
        try {
            // Cancel any pending scheduled changes
            this.bgmNode.playbackRate.cancelScheduledValues(t);
            // Anchor at current speed to avoid jumps
            this.bgmNode.playbackRate.setValueAtTime(this.bgmNode.playbackRate.value, t);
            // Linear ramp to 50% speed
            this.bgmNode.playbackRate.linearRampToValueAtTime(0.5, t + duration);
        } catch (e) {
            // Fallback
            this.bgmNode.playbackRate.value = 0.5;
        }
    }

    private updateBGMPlayback() {
        if (!this.ctx || !this.bgmNode) return;

        // Block updates during warp transition to prevent glitching the slowdown ramp
        if (this.isWarpTransitioning) return;

        const t = this.ctx.currentTime;
        const rampTime = 0.1;

        // Pitch Shift Logic
        // Word Mode: +2 semitones (200 cents)
        // Color Mode: +1 semitone (100 cents)
        const targetDetune = this.isWordMode ? 200 : 100;

        // Playback Rate Logic
        // Since we use dedicated buffers for Forward vs Reverse, the rate is ALWAYS 1.0.
        // This avoids browser instability with negative playback rates.
        const targetRate = 1.0; 

        try {
            this.bgmNode.detune.cancelScheduledValues(t);
            this.bgmNode.detune.linearRampToValueAtTime(targetDetune, t + rampTime);
            
            this.bgmNode.playbackRate.cancelScheduledValues(t);
            this.bgmNode.playbackRate.linearRampToValueAtTime(targetRate, t + 0.1); 
        } catch (e) {
            this.bgmNode.detune.value = targetDetune;
            this.bgmNode.playbackRate.value = targetRate;
        }
    }
  
    private async generateBGM() {
      if (!this.ctx) return;
  
      // Synthwave: 120 BPM, driving beat
      const bpm = 120;
      const secondsPerBeat = 60 / bpm;
      const measures = 2; // Short loop to keep generation fast
      const totalBeats = measures * 4;
      const duration = secondsPerBeat * totalBeats;
      const sampleRate = this.ctx.sampleRate;
      
      const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      // 1. Kick Drum (Four on the floor)
      for (let i = 0; i < totalBeats; i++) {
          this.triggerKick(offlineCtx, i * secondsPerBeat);
      }

      // 2. Snare (Gated Reverb Style) - Beats 2 and 4
      for (let i = 1; i < totalBeats; i += 2) {
          this.triggerSnare(offlineCtx, i * secondsPerBeat);
      }

      // 3. Hi-Hats (16th notes)
      for (let i = 0; i < totalBeats * 4; i++) {
          this.triggerHat(offlineCtx, i * (secondsPerBeat / 4));
      }

      // 4. Bassline (Rolling 8th notes, Sawtooth)
      const bassOsc = offlineCtx.createOscillator();
      bassOsc.type = 'sawtooth';
      const bassGain = offlineCtx.createGain();
      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 800;
      bassFilter.Q.value = 1;

      bassOsc.connect(bassFilter).connect(bassGain).connect(offlineCtx.destination);
      
      // Pattern: Off-beat driving bass (C2 root)
      const eighthNote = secondsPerBeat / 2;
      const totalEighths = totalBeats * 2;
      
      bassOsc.frequency.setValueAtTime(65.41, 0); // C2
      bassOsc.start(0);

      for (let i = 0; i < totalEighths; i++) {
          const t = i * eighthNote;
          // Simple variation: C2 usually, G1 on last beat
          const freq = (i >= totalEighths - 2) ? 49.00 : 65.41; 
          bassOsc.frequency.setValueAtTime(freq, t);

          // Plucky envelope
          bassGain.gain.setValueAtTime(0.4, t);
          bassGain.gain.exponentialRampToValueAtTime(0.1, t + 0.1);
          bassGain.gain.setValueAtTime(0, t + eighthNote - 0.02);
      }

      // 5. Synth Pads (Retro Strings)
      const padOsc1 = offlineCtx.createOscillator();
      padOsc1.type = 'sawtooth';
      const padOsc2 = offlineCtx.createOscillator();
      padOsc2.type = 'sawtooth';
      padOsc2.detune.value = 10; // Chorus effect

      const padGain = offlineCtx.createGain();
      padGain.gain.value = 0.08;
      const padFilter = offlineCtx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 2500;

      padOsc1.connect(padFilter).connect(padGain).connect(offlineCtx.destination);
      padOsc2.connect(padFilter).connect(padGain).connect(offlineCtx.destination);

      // Chord: C Minorish (Root + Minor 3rd)
      padOsc1.frequency.value = 130.81; // C3
      padOsc2.frequency.value = 155.56; // Eb3
      
      padOsc1.start(0);
      padOsc2.start(0);

      // Render Forward Buffer
      this.bgmBuffer = await offlineCtx.startRendering();

      // Generate Reverse Buffer
      if (this.ctx && this.bgmBuffer) {
          this.bgmBufferReverse = this.ctx.createBuffer(
              this.bgmBuffer.numberOfChannels,
              this.bgmBuffer.length,
              this.bgmBuffer.sampleRate
          );
          // Manually reverse channel data
          for (let i = 0; i < this.bgmBuffer.numberOfChannels; i++) {
              const forwardData = this.bgmBuffer.getChannelData(i);
              const reverseData = this.bgmBufferReverse.getChannelData(i);
              for (let j = 0; j < forwardData.length; j++) {
                  reverseData[j] = forwardData[forwardData.length - 1 - j];
              }
          }
      }
      
      if (this.wantsBGM) {
          this.startBGM();
      }
    }

    private triggerKick(ctx: BaseAudioContext, t: number) {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    }
    
    private triggerSnare(ctx: BaseAudioContext, t: number) {
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15); // Short decay
        
        noise.connect(filter).connect(gain).connect(ctx.destination);
        noise.start(t);

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(oscGain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t+0.15);
    }

    private triggerHat(ctx: BaseAudioContext, t: number) {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, t); 
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        noise.connect(filter).connect(gain).connect(ctx.destination);
        noise.start(t);
    }
  
    public startBGM(restart: boolean = false) {
      this.wantsBGM = true;
      if (!this.ctx || !this.bgmBuffer || !this.masterGain) return;
      
      // If forced restart (e.g. swap tracks), stop existing
      if (restart && this.bgmNode) {
          try { this.bgmNode.stop(); } catch(e) {}
          try { this.bgmNode.disconnect(); } catch(e) {}
          this.bgmNode = null;
      }

      // GAIN RESET LOGIC: Ensure volume is restored even if previous track faded out
      if (!this.bgmGain) {
          this.bgmGain = this.ctx.createGain();
          this.bgmGain.connect(this.masterGain);
      }
      
      // Force volume reset (Cancel any fade-outs from stopBGM)
      try {
          const t = this.ctx.currentTime;
          const targetVol = this.bgmVolumePref * this.bgmDuckMultiplier;
          this.bgmGain.gain.cancelScheduledValues(t);
          this.bgmGain.gain.setValueAtTime(targetVol, t);
      } catch (e) {
          // Fallback if context time is weird
          this.bgmGain.gain.value = this.bgmVolumePref * this.bgmDuckMultiplier;
      }

      if (this.bgmNode) return; // Already playing

      this.bgmNode = this.ctx.createBufferSource();
      
      // Select appropriate buffer (Reverse or Forward)
      this.bgmNode.buffer = (this.isReverseMode && this.bgmBufferReverse) 
          ? this.bgmBufferReverse 
          : this.bgmBuffer;
      
      this.bgmNode.loop = true;
      
      // Ensure rate is 1.0 (Resetting any potential slowdown effects)
      this.bgmNode.playbackRate.value = 1.0; 
      
      // Apply initial state
      this.updateBGMPlayback();
      
      // Connect existing or new gain
      this.bgmNode.connect(this.bgmGain);
      this.bgmNode.start(0);
    }
  
    public stopBGM() {
      this.wantsBGM = false;
      if (this.bgmNode && this.bgmGain) {
        const nodeToStop = this.bgmNode;
        try {
            this.bgmGain.gain.cancelScheduledValues(this.ctx!.currentTime);
            this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.ctx!.currentTime);
            this.bgmGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.5);
        } catch (e) {}
        setTimeout(() => {
             if (this.bgmNode === nodeToStop) {
                 try { nodeToStop.stop(); } catch(e) {}
                 try { nodeToStop.disconnect(); } catch(e) {}
                 this.bgmNode = null;
             }
        }, 500);
      }
    }
  
    public play(type: 'wrong' | 'levelUp' | 'objective' | 'crate' | 'life' | 'lifeUp' | 'wild' | 'spin' | 'warpHit', variant: number = 1) {
      if (!this.ctx || !this.masterGain || !this.sfxGain) return;

      // Suppress non-essential audio during warp transition to avoid glitches
      if (this.isWarpTransitioning) return;

      const t = this.ctx.currentTime;
      const reverse = this.isReverseMode;
      
      // Use SFX Gain for effects
      const dest = this.sfxGain;
  
      switch (type) {
        case 'wrong': {
          // Crash noise - Use cached buffer to reduce GC allocation on collision
          if (!this.crashBuffer) this.generateCrashBuffer();
          
          if (this.crashBuffer) {
              const noise = this.ctx.createBufferSource();
              noise.buffer = this.crashBuffer;
              const gain = this.ctx.createGain();
              gain.gain.setValueAtTime(0.5, t);
              gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
              noise.connect(gain).connect(dest);
              noise.start(t);
          }
          break;
        }
        case 'levelUp': {
          // Ascending notes (descending if reversed)
          const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; 
          if (reverse) notes.reverse();

          notes.forEach((f, i) => {
              const osc = this.ctx!.createOscillator();
              osc.type = 'square';
              osc.frequency.value = f;
              const g = this.ctx!.createGain();
              g.gain.setValueAtTime(0.1, t + i*0.06);
              g.gain.linearRampToValueAtTime(0, t + i*0.06 + 0.1);
              osc.connect(g).connect(dest);
              osc.start(t + i*0.06);
              osc.stop(t + i*0.06 + 0.15);
          });
          break;
        }
        case 'objective': {
          const osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          // Reverse: Filter opens instead of closes
          if (reverse) {
              osc.frequency.setValueAtTime(800, t);
              const gain = this.ctx.createGain();
              gain.gain.setValueAtTime(0.01, t);
              gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
              gain.gain.setValueAtTime(0, t + 0.3);

              const filter = this.ctx.createBiquadFilter();
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(3000, t);
              filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
              
              osc.connect(filter).connect(gain).connect(dest);
          } else {
              osc.frequency.setValueAtTime(800, t);
              const gain = this.ctx.createGain();
              gain.gain.setValueAtTime(0.2, t);
              gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
              
              const filter = this.ctx.createBiquadFilter();
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(200, t);
              filter.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
              
              osc.connect(filter).connect(gain).connect(dest);
          }
          osc.start(t);
          osc.stop(t + 0.3);
          break;
        }
        case 'crate': {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          if (reverse) {
              osc.frequency.setValueAtTime(1800, t);
              osc.frequency.setValueAtTime(1200, t + 0.1);
          } else {
              osc.frequency.setValueAtTime(1200, t);
              osc.frequency.setValueAtTime(1800, t + 0.1);
          }
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.linearRampToValueAtTime(0, t + 0.3);
          osc.connect(gain).connect(dest);
          osc.start(t);
          osc.stop(t + 0.3);
          break;
        }
        case 'life': {
          const carrier = this.ctx.createOscillator();
          carrier.frequency.setValueAtTime(600, t);
          const mod = this.ctx.createOscillator();
          mod.type = 'sawtooth';
          mod.frequency.setValueAtTime(20, t);
          const modGain = this.ctx.createGain();
          modGain.gain.value = 300;
          mod.connect(modGain).connect(carrier.frequency);
          
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
          
          carrier.connect(gain).connect(dest);
          carrier.start(t);
          mod.start(t);
          carrier.stop(t + 0.6);
          mod.stop(t + 0.6);
          break;
        }
        case 'lifeUp': {
            // Gracious positive sound (Major triad arpeggio with reverb-like tail)
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = this.ctx!.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const gain = this.ctx!.createGain();
                const startTime = t + (i * 0.05);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
                
                osc.connect(gain).connect(dest);
                osc.start(startTime);
                osc.stop(startTime + 0.7);
            });
            break;
        }
        case 'wild': {
          const osc = this.ctx.createOscillator();
          osc.type = 'square';
          if (reverse) {
              osc.frequency.setValueAtTime(1200, t);
              osc.frequency.linearRampToValueAtTime(300, t + 0.2);
              osc.frequency.linearRampToValueAtTime(800, t + 0.3);
              osc.frequency.linearRampToValueAtTime(200, t + 0.4);
          } else {
              osc.frequency.setValueAtTime(200, t);
              osc.frequency.linearRampToValueAtTime(800, t + 0.1);
              osc.frequency.linearRampToValueAtTime(300, t + 0.2);
              osc.frequency.linearRampToValueAtTime(1200, t + 0.4);
          }
          
          const lfo = this.ctx.createOscillator();
          lfo.type = 'sawtooth';
          lfo.frequency.value = 50; 
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.value = 500;
          lfo.connect(lfoGain).connect(osc.frequency);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
          
          osc.connect(gain).connect(dest);
          osc.start(t);
          lfo.start(t);
          osc.stop(t + 0.4);
          lfo.stop(t + 0.4);
          break;
        }
        case 'spin': {
            const count = 5;
            for(let i=0; i<count; i++) {
                const osc = this.ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(800 + (Math.random() * 400), t + (i * 0.05));
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.1, t + (i * 0.05));
                gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.05) + 0.03);
                
                osc.connect(gain).connect(dest);
                osc.start(t + (i * 0.05));
                osc.stop(t + (i * 0.05) + 0.04);
            }
            break;
        }
        case 'warpHit': {
            // Variant is setIndex (1 to 5).
            // Reverse Sequence: Hits 5 -> 4 -> 3 -> 2 -> 1
            // Pitch: 5 (Low) -> 1 (High)
            // Vol: 5 (Quiet) -> 1 (Loud)
            
            // Map 5->0, 4->1, 3->2, 2->3, 1->4 steps
            const step = 5 - variant; 
            
            // Frequencies (Pentatonic C Majorish: C4, D4, E4, G4, C5)
            const freqs = [261.63, 293.66, 329.63, 392.00, 523.25];
            // Clamp step
            const safeStep = Math.max(0, Math.min(step, 4));
            const freq = freqs[safeStep];
            
            const vol = 0.3 + (safeStep * 0.175); // 0.3 -> 1.0

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.value = freq * 2; // Octave harmonic
            osc2.detune.value = 5;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(vol, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

            const gain2 = this.ctx.createGain();
            gain2.gain.setValueAtTime(0, t);
            gain2.gain.linearRampToValueAtTime(vol * 0.3, t + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

            osc.connect(gain).connect(dest);
            osc2.connect(gain2).connect(dest);
            
            osc.start(t);
            osc2.start(t);
            osc.stop(t + 0.5);
            osc2.stop(t + 0.5);
            break;
        }
      }
    }
  }
  
  export const audioManager = new AudioManager();
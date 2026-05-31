let audioCtx: AudioContext | null = null;
let isInitialized = false;
let isMuted = false;

export function toggleMute() {
    isMuted = !isMuted;
    try {
        if (audioCtx) {
            if (isMuted) {
                audioCtx.suspend().catch(e => console.warn("Failed to suspend audio context on mute", e));
            } else {
                audioCtx.resume().catch(e => console.warn("Failed to resume audio context on unmute", e));
            }
        }
    } catch (e) {
        console.error("Mute state switch failure", e);
    }
    return isMuted;
}

export function getMuteState() {
    return isMuted;
}

export function initAudio() {
    if (!isInitialized) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitialized = true;
        
        // Auto-pause and auto-resume on app background/foreground
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (audioCtx) {
                    if (document.hidden) {
                        audioCtx.suspend().catch(e => console.warn("Failed to suspend audio context", e));
                    } else if (!isMuted) {
                        audioCtx.resume().catch(e => console.warn("Failed to resume audio context", e));
                    }
                }
            });
        }
    }
    if (audioCtx && audioCtx.state === 'suspended' && !isMuted) {
        audioCtx.resume().catch(e => console.warn("Failed to resume audio context", e));
    }
}

export function playDetonate(combo: number) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // Calculate frequency - minor pentatonic jumps to sound pleasant but ascending
        // Base note + jump up a minor third or whole step
        const scaleNodes = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24]; 
        const nodeIndex = Math.min(combo, scaleNodes.length - 1);
        const semitones = scaleNodes[nodeIndex] + Math.max(0, (combo - scaleNodes.length) * 2);

        const baseFreq = 220; // A3
        const freq = baseFreq * Math.pow(1.059463094359, semitones); 
        
        osc.frequency.setValueAtTime(Math.min(freq, 2000), audioCtx.currentTime);
        osc.type = 'sine'; // Smooth tone

        // Amp envelope for a plucky/bell hit
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio error", e);
    }
}

export function playPerfectBonus() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful C Major arpeggio
        notes.forEach((freq, idx) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            osc.type = 'triangle';
            
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.35);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.4);
        });
    } catch (e) {
        console.error("Audio bonus error", e);
    }
}

export function playPurchaseConfirm() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // Sweet major arpeggio upward chords chime
        notes.forEach((freq, idx) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.22);
            
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.25);
        });
    } catch (e) {
        console.error("Audio purchase chime error", e);
    }
}

export function playSlotSpin() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.06);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.10, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
    } catch {}
}

export function playSlotStop() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
}

export function playSlotPayout(isJackpot: boolean) {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const scale = isJackpot 
            ? [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1318.51, 1567.98] // C Major rocket sweep scale
            : [523.25, 659.25, 783.99, 1046.50]; // Sweet chords
        scale.forEach((freq, idx) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            osc.frequency.setValueAtTime(freq, now + idx * 0.045);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, now + idx * 0.045);
            gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.045 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.045 + 0.12);
            osc.start(now + idx * 0.045);
            osc.stop(now + idx * 0.045 + 0.14);
        });
    } catch {}
}

export function playNearMissAlert() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const tones = [880, 587.33, 880, 587.33]; // Fast intense warnings
        tones.forEach((freq, idx) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.08 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.15);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.18);
        });
    } catch {}
}

export function playDefeatSound() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const notes = [311.13, 277.18, 246.94, 196.00, 164.81]; // Descending E minor/dissonant sequence
        notes.forEach((freq, idx) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            
            osc.frequency.setValueAtTime(freq, now + idx * 0.095);
            osc.type = 'sawtooth';
            
            gain.gain.setValueAtTime(0, now + idx * 0.095);
            gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.095 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.095 + 0.28);
            
            osc.start(now + idx * 0.095);
            osc.stop(now + idx * 0.095 + 0.32);
        });
    } catch (e) {
        console.error("Audio defeat error", e);
    }
}

export function playAdTick() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.09);
    } catch {}
}

export function playTransactionChord() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful C Major 9th chime
        notes.forEach((freq, idx) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, now + idx * 0.05);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.4);
        });
    } catch {}
}

export function playAlertBeep() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
    } catch {}
}

export function playGravityAbsorb() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // Deeper, complex space-warp sound (downward sweep)
        osc.frequency.setValueAtTime(320, audioCtx.currentTime); // Start medium-high
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.35); // Deep sweep down
        osc.type = 'triangle'; // Warmer, more resonant wave

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.03); // Quick swell
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4); // Fade out

        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
        console.error("Audio gravity absorb error", e);
    }
}



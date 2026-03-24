import { Platform } from "react-native";

/**
 * Sound effects using Web Audio API.
 * Generates synth sounds — no audio files needed.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.15,
  rampDown: boolean = true
) {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export class SoundService {
  /** Quick blip when radar sweep passes a loot box */
  static radarBlip() {
    playTone(880, 0.08, "sine", 0.08);
  }

  /** Getting closer to a loot box — ascending tones */
  static proximity(distanceNormalized: number) {
    // distanceNormalized: 0 = at the box, 1 = far away
    const freq = 440 + (1 - distanceNormalized) * 660;
    playTone(freq, 0.1, "sine", 0.06);
  }

  /** Loot box discovered / tapped */
  static discover() {
    const ctx = getContext();
    if (!ctx) return;
    // Rising arpeggio
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "sine", 0.12), i * 80);
    });
  }

  /** Chest opening — dramatic reveal */
  static chestOpen() {
    const ctx = getContext();
    if (!ctx) return;
    // Drum-like hit + sparkle
    playTone(120, 0.3, "triangle", 0.2);
    setTimeout(() => playTone(180, 0.2, "triangle", 0.15), 50);
    // Sparkle ascending
    setTimeout(() => {
      [784, 988, 1175, 1319, 1568].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, "sine", 0.1), i * 60);
      });
    }, 150);
  }

  /** Claim success celebration */
  static claimSuccess() {
    const ctx = getContext();
    if (!ctx) return;
    // Victory fanfare
    const notes = [523, 659, 784, 1047, 784, 1047];
    const durations = [0.12, 0.12, 0.12, 0.25, 0.12, 0.35];
    let time = 0;
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, durations[i], "sine", 0.12), time);
      time += durations[i] * 1000 * 0.7;
    });
  }

  /** Badge unlock */
  static badgeUnlock() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(523, 0.15, "sine", 0.1);
    setTimeout(() => playTone(659, 0.15, "sine", 0.1), 100);
    setTimeout(() => playTone(784, 0.3, "sine", 0.15), 200);
  }

  /** Level up */
  static levelUp() {
    const ctx = getContext();
    if (!ctx) return;
    // Triumphant ascending with harmonics
    const notes = [262, 330, 392, 523, 659, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.3, "sine", 0.12);
        playTone(freq * 1.5, 0.3, "sine", 0.06); // harmony
      }, i * 100);
    });
  }

  /** Error / denied */
  static error() {
    playTone(200, 0.15, "square", 0.08);
    setTimeout(() => playTone(160, 0.25, "square", 0.08), 150);
  }

  /** UI tap */
  static tap() {
    playTone(600, 0.04, "sine", 0.05);
  }

  /** Streak notification */
  static streak() {
    [440, 554, 659].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.12, "sine", 0.1), i * 60);
    });
  }

  /** Resume audio context after user gesture (required by browsers) */
  static async resume() {
    const ctx = getContext();
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
  }
}

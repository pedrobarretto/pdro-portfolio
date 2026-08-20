import { audioContextConstructor } from "@/lib/audio-context";
import { createPitchDetector, rootMeanSquare } from "@/lib/pitch";

/**
 * Microphone → filters → analyser → pitch, with the smoothing that stops a
 * tuner from twitching. Everything about "how fast may the reading move" lives
 * here; the UI just draws whatever comes out.
 */

/** Samples fed to the detector each pass, after decimation. */
const WINDOW_SIZE = 4096;
/** Decimate down to roughly this rate — enough resolution, a quarter of the work. */
const TARGET_RATE = 20_000;
const DETECT_INTERVAL_MS = 40;

const RMS_GATE = 0.004;
const CLARITY_GATE = 0.9;

/** Readings kept for the median. Odd, and ~200 ms of history. */
const HISTORY_SIZE = 5;
/** Beyond this ratio (~a semitone) a reading is a new note, not noise. */
const JUMP_RATIO = 0.06;
/** How long a note is held on screen after it stops ringing. */
const RELEASE_MS = 1200;

export type TunerSample = {
  /** Median of the recent confident readings, or null once the string dies out. */
  readonly frequency: number | null;
  readonly clarity: number;
};

export type TunerEngineError = "denied" | "unsupported" | "failed";

export type TunerStartResult = { readonly ok: true } | { readonly ok: false; readonly reason: TunerEngineError };

export type TunerEngine = {
  readonly start: () => Promise<TunerStartResult>;
  readonly stop: () => void;
};

const median = (values: readonly number[]): number =>
  [...values].sort((a, b) => a - b)[values.length >> 1];

/** Largest power of two that still leaves us above TARGET_RATE. */
const decimationFor = (sampleRate: number): number => {
  let factor = 1;
  while (factor < 8 && sampleRate / (factor * 2) >= TARGET_RATE) factor *= 2;
  return factor;
};

export function createTunerEngine(onSample: (sample: TunerSample) => void): TunerEngine {
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let frame: number | null = null;
  // Bumped by stop(), so a start() still awaiting permission tears itself down
  // instead of leaving a live mic behind.
  let generation = 0;

  const stop = () => {
    generation += 1;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    void context?.close().catch(() => {});
    context = null;
  };

  const start = async (): Promise<TunerStartResult> => {
    const AudioContextCtor = audioContextConstructor();
    if (!AudioContextCtor || !navigator.mediaDevices?.getUserMedia) {
      return { ok: false, reason: "unsupported" };
    }

    const mine = generation;
    let media: MediaStream;
    try {
      // Every one of these processors is designed to flatten voice, and every
      // one of them would wreck a pitch reading.
      media = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      return {
        ok: false,
        reason: name === "NotAllowedError" || name === "SecurityError" ? "denied" : "failed",
      };
    }

    if (mine !== generation) {
      media.getTracks().forEach((track) => track.stop());
      return { ok: false, reason: "failed" };
    }

    stream = media;
    context = new AudioContextCtor();
    await context.resume();

    const decimation = decimationFor(context.sampleRate);
    const workingRate = context.sampleRate / decimation;

    const analyser = context.createAnalyser();
    analyser.fftSize = WINDOW_SIZE * decimation;

    // Room rumble below the lowest string, and string squeak / hiss above the
    // harmonics we care about, are both just noise to the detector.
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 55;
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1800;

    context.createMediaStreamSource(media).connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(analyser);

    const raw = new Float32Array(analyser.fftSize);
    const decimated = new Float32Array(WINDOW_SIZE);
    const detect = createPitchDetector({ sampleRate: workingRate, windowSize: WINDOW_SIZE });

    let history: number[] = [];
    let pendingJump: number | null = null;
    let lastConfidentAt = 0;
    let lastDetectAt = 0;
    let released = true;

    /**
     * A reading more than a semitone from the current note is either a new
     * string or a glitch, and we can't tell from one frame — so it has to show
     * up twice in a row before the display follows it.
     */
    const accept = (frequency: number) => {
      if (history.length === 0) {
        history = [frequency];
        pendingJump = null;
        return;
      }
      const reference = median(history);
      if (Math.abs(frequency / reference - 1) > JUMP_RATIO) {
        const confirmed =
          pendingJump !== null && Math.abs(frequency / pendingJump - 1) < 0.03;
        if (confirmed) {
          history = [frequency, frequency, frequency];
          pendingJump = null;
        } else {
          pendingJump = frequency;
        }
        return;
      }
      pendingJump = null;
      history.push(frequency);
      if (history.length > HISTORY_SIZE) history.shift();
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastDetectAt < DETECT_INTERVAL_MS) return;
      lastDetectAt = now;

      analyser.getFloatTimeDomainData(raw);
      for (let i = 0; i < WINDOW_SIZE; i += 1) decimated[i] = raw[i * decimation];

      const reading = rootMeanSquare(decimated) >= RMS_GATE ? detect(decimated) : null;

      if (reading && reading.clarity >= CLARITY_GATE) {
        accept(reading.frequency);
        lastConfidentAt = now;
        released = false;
        onSample({ frequency: median(history), clarity: reading.clarity });
        return;
      }

      // Hold the last note while the string decays, then let go once.
      if (!released && now - lastConfidentAt > RELEASE_MS) {
        released = true;
        history = [];
        pendingJump = null;
        onSample({ frequency: null, clarity: 0 });
      }
    };

    frame = requestAnimationFrame(tick);
    return { ok: true };
  };

  return { start, stop };
}

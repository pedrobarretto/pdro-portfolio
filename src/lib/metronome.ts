import { audioContextConstructor } from "@/lib/audio-context";

/**
 * A metronome that keeps time on the audio clock rather than on timers. Clicks
 * are scheduled a fraction of a second ahead, so a busy main thread can smear
 * a frame without smearing the beat, and the UI reads its pendulum angle off
 * the same clock — the arm always lands on the click.
 */

/** How often we look for beats to schedule. */
const LOOKAHEAD_MS = 25;
/** How far ahead of the audio clock beats are queued. */
const SCHEDULE_AHEAD_S = 0.12;
const CLICK_DECAY_S = 0.05;
/** Click peak, before the user's volume. Leaves headroom so nothing clips. */
const CLICK_PEAK = 0.8;

export const TEMPO_MIN = 40;
export const TEMPO_MAX = 240;

export const BEATS_PER_BAR_OPTIONS = [2, 3, 4, 6] as const;
export type BeatsPerBar = (typeof BEATS_PER_BAR_OPTIONS)[number];

export type MetronomeSettings = {
  readonly bpm: number;
  readonly beatsPerBar: BeatsPerBar;
  /** 0–1, perceptual rather than raw gain. */
  readonly volume: number;
};

export type MetronomeReading = {
  /** Continuous beat count; whole numbers land exactly on a click. */
  readonly position: number;
  /** Zero-based beat within the current bar. Beat 0 is the accented one. */
  readonly beatInBar: number;
};

export type Metronome = {
  /** Resolves false when the browser has no Web Audio. */
  readonly start: () => Promise<boolean>;
  readonly stop: () => void;
  readonly setTempo: (bpm: number) => void;
  readonly setBeatsPerBar: (beats: BeatsPerBar) => void;
  readonly setVolume: (volume: number) => void;
  /** Where the beat is right now, or null once stopped. */
  readonly read: () => MetronomeReading | null;
};

export const clampTempo = (bpm: number): number =>
  Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, Math.round(bpm)));

/** Ears hear loudness closer to the square of the fader position. */
const gainFor = (volume: number): number => Math.max(0, Math.min(1, volume)) ** 2;

const TEMPO_MARKINGS = [
  { upTo: 59, label: "Largo" },
  { upTo: 71, label: "Adagio" },
  { upTo: 89, label: "Andante" },
  { upTo: 107, label: "Moderato" },
  { upTo: 131, label: "Allegro" },
  { upTo: 167, label: "Vivace" },
  { upTo: TEMPO_MAX, label: "Presto" },
] as const;

/** The Italian a musician would call this tempo. Decorative, but it's the language. */
export function tempoMarking(bpm: number): string {
  return (TEMPO_MARKINGS.find((marking) => bpm <= marking.upTo) ?? TEMPO_MARKINGS.at(-1)!).label;
}

export function createMetronome(settings: MetronomeSettings): Metronome {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer: number | null = null;

  let bpm = clampTempo(settings.bpm);
  let beatsPerBar: number = settings.beatsPerBar;
  let volume = settings.volume;

  // Beat n sounds at `anchorTime + (n - anchorBeat) * secondsPerBeat`. Tempo
  // changes move the anchor to the next unscheduled beat, so beats already
  // queued keep their times and the count stays continuous.
  let anchorBeat = 0;
  let anchorTime = 0;
  let nextBeat = 0;
  /** The beat that most recently started a bar — lets the meter change without a reset. */
  let barStart = 0;

  const secondsPerBeat = () => 60 / bpm;
  const timeOf = (beat: number) => anchorTime + (beat - anchorBeat) * secondsPerBeat();

  const click = (at: number, accent: boolean) => {
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = accent ? 1860 : 1240;
    // Exponential ramps can't touch zero, hence the near-silent floor.
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(accent ? CLICK_PEAK : CLICK_PEAK * 0.6, at + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + CLICK_DECAY_S);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(at);
    oscillator.stop(at + CLICK_DECAY_S + 0.02);
  };

  const schedule = () => {
    if (!context) return;
    while (timeOf(nextBeat) < context.currentTime + SCHEDULE_AHEAD_S) {
      click(timeOf(nextBeat), (nextBeat - barStart) % beatsPerBar === 0);
      nextBeat += 1;
    }
  };

  const stop = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    master = null;
    void context?.close().catch(() => {});
    context = null;
  };

  const start = async (): Promise<boolean> => {
    if (context) return true;
    const AudioContextCtor = audioContextConstructor();
    if (!AudioContextCtor) return false;

    context = new AudioContextCtor();
    await context.resume();
    master = context.createGain();
    master.gain.value = gainFor(volume);
    master.connect(context.destination);

    anchorBeat = 0;
    nextBeat = 0;
    barStart = 0;
    // A beat of runway: the first click shouldn't land before the arm moves.
    anchorTime = context.currentTime + 0.15;

    schedule();
    timer = window.setInterval(schedule, LOOKAHEAD_MS);
    return true;
  };

  const setTempo = (next: number) => {
    const clamped = clampTempo(next);
    if (clamped === bpm) return;
    if (context) {
      anchorTime = timeOf(nextBeat);
      anchorBeat = nextBeat;
    }
    bpm = clamped;
  };

  const setBeatsPerBar = (beats: BeatsPerBar) => {
    if (beats === beatsPerBar) return;
    // Start the new meter at the next beat instead of re-counting from zero,
    // which would flip the pendulum mid-swing.
    barStart = nextBeat;
    beatsPerBar = beats;
  };

  const setVolume = (next: number) => {
    volume = next;
    if (!context || !master) return;
    // A ramp rather than a jump — stepping gain mid-click makes a pop.
    master.gain.setTargetAtTime(gainFor(next), context.currentTime, 0.01);
  };

  const read = (): MetronomeReading | null => {
    if (!context) return null;
    const position = anchorBeat + (context.currentTime - anchorTime) / secondsPerBeat();
    const elapsed = Math.floor(position) - barStart;
    return { position, beatInBar: ((elapsed % beatsPerBar) + beatsPerBar) % beatsPerBar };
  };

  return { start, stop, setTempo, setBeatsPerBar, setVolume, read };
}

/** Note maths and guitar tunings. Equal temperament, A4 = 440 Hz. */

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type NoteId = `${NoteName}${number}`;

const A4_FREQUENCY = 440;
const A4_MIDI = 69;

export type Note = {
  readonly id: NoteId;
  readonly name: NoteName;
  readonly octave: number;
  readonly midi: number;
  readonly frequency: number;
};

export function noteFromMidi(midi: number): Note {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return {
    id: `${name}${octave}`,
    name,
    octave,
    midi,
    frequency: A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12),
  };
}

export function noteFromId(id: NoteId): Note {
  const match = /^([A-G]#?)(-?\d+)$/.exec(id);
  if (!match) throw new Error(`Not a note id: ${id}`);
  const index = NOTE_NAMES.indexOf(match[1] as NoteName);
  return noteFromMidi((Number(match[2]) + 1) * 12 + index);
}

export type NoteMatch = {
  readonly note: Note;
  /** Signed distance from the note, in cents. Negative = flat. */
  readonly cents: number;
};

/**
 * Nearest chromatic note to a frequency. `previous` adds hysteresis so a pitch
 * parked on a semitone boundary doesn't flicker between two names.
 */
export function nearestNote(frequency: number, previous?: Note): NoteMatch {
  const midi = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY);
  if (previous && Math.abs(midi - previous.midi) < 0.6) {
    return { note: previous, cents: (midi - previous.midi) * 100 };
  }
  const note = noteFromMidi(Math.round(midi));
  return { note, cents: (midi - note.midi) * 100 };
}

export type Tuning = {
  readonly id: string;
  readonly label: string;
  /** Thickest string first, the way they sit on the neck. */
  readonly strings: readonly NoteId[];
};

export const TUNINGS = [
  { id: "standard", label: "Standard", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
  { id: "drop-d", label: "Drop D", strings: ["D2", "A2", "D3", "G3", "B3", "E4"] },
  { id: "half-step", label: "E♭ standard", strings: ["D#2", "G#2", "C#3", "F#3", "A#3", "D#4"] },
  { id: "dadgad", label: "DADGAD", strings: ["D2", "A2", "D3", "G3", "A3", "D4"] },
  { id: "open-g", label: "Open G", strings: ["D2", "G2", "D3", "G3", "B3", "D4"] },
] as const satisfies readonly Tuning[];

export type TuningId = (typeof TUNINGS)[number]["id"];

/** ASCII "#" reads as a hash next to big type; swap it for the real sharp glyph. */
export function displayName(name: NoteName): string {
  return name.endsWith("#") ? `${name[0]}♯` : name;
}

"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Metronome } from "@/components/metronome";
import { haptic } from "@/lib/haptics";
import {
  createTunerEngine,
  type TunerEngine,
  type TunerEngineError,
  type TunerSample,
} from "@/lib/tuner-engine";
import {
  displayName,
  nearestNote,
  noteFromId,
  noteFromMidi,
  TUNINGS,
  type Note,
  type TuningId,
} from "@/lib/tuning";
import { cn } from "@/lib/utils";

/** A guitar is comfortably tunable to this; anything tighter is peg-turning theatre. */
const IN_TUNE_CENTS = 4;
const METER_RANGE_CENTS = 50;
/** Fraction of the gap to the new reading the needle closes per update (~25/s). */
const NEEDLE_EASE = 0.28;
/** Below this the needle just stops — chasing a tenth of a cent only looks nervous. */
const NEEDLE_DEADBAND = 0.15;

const TICKS = Array.from({ length: 21 }, (_, index) => (index - 10) * 5);

function stagger(step: number): CSSProperties {
  return { "--stagger": step } as CSSProperties;
}

type Status = "idle" | "starting" | "listening" | TunerEngineError;

const ERROR_COPY: Record<TunerEngineError, string> = {
  denied:
    "The mic is blocked. Allow microphone access for this site in your browser settings and try again.",
  unsupported: "This browser can't record audio. Safari, Chrome or Firefox will do it.",
  failed: "Couldn't open the microphone. Close anything else using it and try again.",
};

/** Phones dim in about 30 seconds. Tuning six strings reliably takes longer. */
function useScreenWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let finished = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (finished) {
          void lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Denied or unsupported — the tuner still works, the screen just dims.
      }
    };

    // The system drops the lock whenever the page is hidden, so take it again.
    const reacquire = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", reacquire);

    return () => {
      finished = true;
      document.removeEventListener("visibilitychange", reacquire);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}

function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const timers = [
      window.setTimeout(() => setStep(1), 120),
      window.setTimeout(() => setStep(2), 900),
      window.setTimeout(() => setStep(3), 2100),
      window.setTimeout(() => setStep(4), 3300),
      window.setTimeout(onDone, 3700),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onDone]);

  const line = (visible: boolean) =>
    cn(
      "transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
      visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-2 blur-[3px]",
    );

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Skip"
      className={cn(
        "fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 bg-background px-8 text-center transition-opacity duration-400",
        step >= 4 ? "opacity-0" : "opacity-100",
      )}
    >
      <span className={cn("block font-mono text-sm text-muted-foreground", line(step >= 1))}>
        hmm.
      </span>
      <span
        className={cn(
          "block max-w-[26rem] text-lg leading-relaxed text-foreground",
          line(step >= 2),
        )}
      >
        so that whole “every software engineer is a failed musician” thing is true, am I right?
      </span>
      <span
        className={cn(
          "block max-w-[26rem] text-lg leading-relaxed text-muted-foreground",
          line(step >= 3),
        )}
      >
        relax. I built you a tuner.
      </span>
      <span
        className={cn(
          "absolute bottom-10 font-mono text-xs text-muted-foreground/60",
          line(step >= 2),
        )}
      >
        tap to skip
      </span>
    </button>
  );
}

export function TunerClient({ showIntro }: { showIntro: boolean }) {
  const [introVisible, setIntroVisible] = useState(showIntro);
  const [status, setStatus] = useState<Status>("idle");
  const [tuningId, setTuningId] = useState<TuningId>("standard");
  const [note, setNote] = useState<Note | null>(null);
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [tuned, setTuned] = useState<ReadonlySet<number>>(() => new Set());

  const engineRef = useRef<TunerEngine | null>(null);
  const smoothedRef = useRef(0);
  const noteRef = useRef<Note | null>(null);
  const wasInTuneRef = useRef(false);

  const strings = useMemo(() => {
    const tuning = TUNINGS.find((candidate) => candidate.id === tuningId) ?? TUNINGS[0];
    return tuning.strings.map(noteFromId);
  }, [tuningId]);

  const handleSample = useCallback((sample: TunerSample) => {
    if (sample.frequency === null) {
      noteRef.current = null;
      setNote(null);
      setFrequency(null);
      return;
    }

    const match = nearestNote(sample.frequency, noteRef.current ?? undefined);
    const switchedNote = match.note.id !== noteRef.current?.id;
    noteRef.current = match.note;

    // Jump straight to a new string, glide within one.
    const previous = smoothedRef.current;
    const eased = previous + (match.cents - previous) * NEEDLE_EASE;
    if (switchedNote) {
      smoothedRef.current = match.cents;
    } else if (Math.abs(eased - previous) >= NEEDLE_DEADBAND) {
      smoothedRef.current = eased;
    }

    setNote(match.note);
    setCents(smoothedRef.current);
    setFrequency(sample.frequency);
  }, []);

  const enable = useCallback(async () => {
    if (status === "starting" || status === "listening") return;
    setStatus("starting");
    haptic(8, true);

    const engine = createTunerEngine(handleSample);
    engineRef.current = engine;
    const result = await engine.start();
    if (!result.ok) engine.stop();
    setStatus(result.ok ? "listening" : result.reason);
  }, [handleSample, status]);

  useEffect(() => () => engineRef.current?.stop(), []);

  const dismissIntro = useCallback(() => {
    setIntroVisible(false);
    window.history.replaceState(null, "", "/tuner");
  }, []);

  // The semitones either side, laid out the way the meter reads: flat on the
  // left, sharp on the right. Handy when a string is so far off that the tuner
  // has locked onto the wrong name entirely.
  const neighbours = useMemo(
    () =>
      note
        ? { flat: noteFromMidi(note.midi - 1), sharp: noteFromMidi(note.midi + 1) }
        : null,
    [note],
  );

  const activeIndex = note ? strings.findIndex((string) => string.midi === note.midi) : -1;
  const inTune = note !== null && Math.abs(cents) <= IN_TUNE_CENTS;

  // One tick the moment a string lands, and not again until it drifts off.
  useEffect(() => {
    if (!inTune) {
      wasInTuneRef.current = false;
      return;
    }
    if (wasInTuneRef.current) return;
    wasInTuneRef.current = true;
    haptic([14, 40, 20], true);
    if (activeIndex >= 0) {
      setTuned((previous) =>
        previous.has(activeIndex) ? previous : new Set(previous).add(activeIndex),
      );
    }
  }, [inTune, activeIndex]);

  const needlePercent =
    (Math.max(-METER_RANGE_CENTS, Math.min(METER_RANGE_CENTS, note ? cents : 0)) /
      METER_RANGE_CENTS) *
    50;
  const listening = status === "listening";
  useScreenWakeLock(listening);
  const allTuned = tuned.size === strings.length;

  return (
    <div className="min-h-screen bg-background">
      {introVisible && <Intro onDone={dismissIntro} />}

      <main className="mx-auto max-w-[640px] px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← back
        </Link>

        <header className="mt-10 animate-enter" style={stagger(0)}>
          <h1 className="text-2xl font-bold text-foreground">Guitar tuner</h1>
        </header>

        <section
          className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8 animate-enter"
          style={stagger(1)}
        >
          <div className="flex items-end justify-between font-mono text-xs text-muted-foreground">
            <span aria-hidden>♭ flat</span>
            <span aria-hidden>sharp ♯</span>
          </div>

          <div className="relative mt-3 h-14">
            <div className="absolute inset-x-0 top-0 flex h-10 items-end justify-between">
              {TICKS.map((value) => (
                <span
                  key={value}
                  className={cn(
                    "w-px rounded-full transition-colors duration-200",
                    value === 0 ? "h-9" : value % 25 === 0 ? "h-6" : "h-3",
                    value === 0 && inTune ? "bg-[var(--tune-ok)]" : "bg-border",
                  )}
                />
              ))}
            </div>

            <div
              className="absolute inset-x-0 top-0 h-14 transition-transform duration-150 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(${needlePercent}%)` }}
            >
              <div
                className={cn(
                  "absolute left-1/2 h-full w-[3px] -translate-x-1/2 rounded-full transition-[background-color,opacity] duration-200",
                  inTune ? "bg-[var(--tune-ok)]" : "bg-foreground",
                  note ? "opacity-100" : "opacity-20",
                )}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <div
              className={cn(
                "grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 transition-opacity duration-300",
                note ? "opacity-100" : "opacity-30",
              )}
            >
              <span
                className={cn(
                  "justify-self-end text-xl tabular-nums text-muted-foreground/50 transition-opacity duration-300",
                  neighbours ? "opacity-100" : "opacity-0",
                )}
              >
                {neighbours && `${displayName(neighbours.flat.name)}${neighbours.flat.octave}`}
              </span>

              <span className="flex items-baseline gap-1">
                <span className="text-6xl font-semibold tabular-nums text-foreground">
                  {note ? displayName(note.name) : "—"}
                </span>
                {/* Fixed width so the note glyph doesn't shift when the octave appears. */}
                <span className="w-4 text-left text-xl text-muted-foreground tabular-nums">
                  {note ? note.octave : ""}
                </span>
              </span>

              <span
                className={cn(
                  "justify-self-start text-xl tabular-nums text-muted-foreground/50 transition-opacity duration-300",
                  neighbours ? "opacity-100" : "opacity-0",
                )}
              >
                {neighbours && `${displayName(neighbours.sharp.name)}${neighbours.sharp.octave}`}
              </span>
            </div>

            <p
              className={cn(
                "mt-3 font-mono text-sm tabular-nums transition-colors duration-200",
                inTune ? "text-[var(--tune-ok)]" : "text-muted-foreground",
              )}
            >
              {!listening
                ? "microphone off"
                : !note
                  ? "listening…"
                  : inTune
                    ? "in tune"
                    : `${cents > 0 ? "sharp" : "flat"} by ${Math.abs(Math.round(cents))}¢`}
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground/70">
              {frequency ? `${frequency.toFixed(1)} Hz` : " "}
            </p>
          </div>

          <div className="mt-8 flex justify-between gap-2">
            {strings.map((string, index) => (
              <div
                key={`${string.id}-${index}`}
                className={cn(
                  "flex h-11 flex-1 items-center justify-center rounded-lg border font-mono text-sm tabular-nums transition-all duration-200",
                  index === activeIndex
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground",
                  tuned.has(index) &&
                    "border-[var(--tune-ok)] text-[var(--tune-ok)] bg-[var(--tune-ok)]/10",
                )}
                title={`${string.id} · ${string.frequency.toFixed(2)} Hz`}
              >
                {displayName(string.name)}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 animate-enter" style={stagger(2)}>
          {!listening && (
            <button
              type="button"
              onClick={enable}
              disabled={status === "starting"}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            >
              {status === "starting" ? "Waiting for the microphone…" : "Turn on the microphone"}
            </button>
          )}

          {(status === "denied" || status === "unsupported" || status === "failed") && (
            <p className="mt-3 text-sm text-destructive">{ERROR_COPY[status]}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-xs text-muted-foreground">tuning</span>
            {TUNINGS.map((tuning) => (
              <button
                key={tuning.id}
                type="button"
                onClick={() => {
                  setTuningId(tuning.id);
                  setTuned(new Set());
                  haptic(8);
                }}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs transition-colors duration-200",
                  tuning.id === tuningId
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {tuning.label}
              </button>
            ))}
          </div>

          {allTuned && (
            <p className="mt-6 text-sm text-muted-foreground">All six. Go play something.</p>
          )}
        </section>

        <div className="mt-8 animate-enter" style={stagger(3)}>
          <Metronome />
        </div>
      </main>
    </div>
  );
}

"use client";

import { Minus, Pause, Play, Plus, Volume1, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";
import {
  BEATS_PER_BAR_OPTIONS,
  clampTempo,
  createMetronome,
  tempoMarking,
  TEMPO_MAX,
  TEMPO_MIN,
  type BeatsPerBar,
  type Metronome as MetronomeEngine,
} from "@/lib/metronome";
import { cn } from "@/lib/utils";

/** Drawing geometry, in viewBox units. */
const PIVOT = { x: 60, y: 155 } as const;
const ARM_TIP_Y = 18;
/** Half the swing. Wide enough to read across a room, narrow enough to stay in frame. */
const MAX_ANGLE = 20;
/** Where the sliding weight sits at the slowest and fastest tempo. */
const WEIGHT_SLOW_Y = 78;
const WEIGHT_FAST_Y = 140;
/** Fraction of the angle kept each frame once stopped — the wind-down. */
const SETTLE_DECAY = 0.86;

const DEFAULT_BPM = 96;

/** Weight high on the arm means a slow swing, exactly like the wooden ones. */
const weightY = (bpm: number): number =>
  WEIGHT_SLOW_Y +
  ((bpm - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN)) * (WEIGHT_FAST_Y - WEIGHT_SLOW_Y);

/** Pendulum angle for a beat position. Whole beats sit at the extremes, where it ticks. */
const angleAt = (position: number): number => MAX_ANGLE * Math.cos(Math.PI * position);

function VolumeIcon({ volume }: { volume: number }) {
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  return <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

export function Metronome() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [beatsPerBar, setBeatsPerBar] = useState<BeatsPerBar>(4);
  const [volume, setVolume] = useState(0.6);
  const [beat, setBeat] = useState<number | null>(null);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const armRef = useRef<SVGGElement | null>(null);
  const angleRef = useRef(0);
  const beatRef = useRef<number | null>(null);

  const toggle = useCallback(async () => {
    haptic(8, true);
    const running = engineRef.current;
    if (running) {
      running.stop();
      engineRef.current = null;
      beatRef.current = null;
      setBeat(null);
      setPlaying(false);
      return;
    }

    const engine = createMetronome({ bpm, beatsPerBar, volume });
    if (!(await engine.start())) return;
    engineRef.current = engine;
    setPlaying(true);
  }, [beatsPerBar, bpm, volume]);

  // Settings changed while it's running: hand them to the live engine.
  useEffect(() => engineRef.current?.setTempo(bpm), [bpm]);
  useEffect(() => engineRef.current?.setBeatsPerBar(beatsPerBar), [beatsPerBar]);
  useEffect(() => engineRef.current?.setVolume(volume), [volume]);
  useEffect(() => () => engineRef.current?.stop(), []);

  // The arm is driven straight from the audio clock — no React state per frame,
  // and no chance of the drawing drifting out of phase with the clicks.
  useEffect(() => {
    let frame: number | null = null;

    const draw = () => {
      const reading = engineRef.current?.read() ?? null;

      if (reading) {
        angleRef.current = angleAt(reading.position);
        if (reading.beatInBar !== beatRef.current) {
          beatRef.current = reading.beatInBar;
          setBeat(reading.beatInBar);
        }
      } else {
        // Stopped: let the arm swing itself out instead of snapping upright.
        angleRef.current = Math.abs(angleRef.current) < 0.05 ? 0 : angleRef.current * SETTLE_DECAY;
      }

      armRef.current?.setAttribute(
        "transform",
        `rotate(${angleRef.current.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`,
      );

      if (reading || angleRef.current !== 0) frame = requestAnimationFrame(draw);
      else frame = null;
    };

    frame = requestAnimationFrame(draw);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [playing]);

  const nudge = (delta: number) => {
    setBpm((current) => clampTempo(current + delta));
    haptic(6);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-foreground">Metronome</h2>
        <span className="font-mono text-xs text-muted-foreground">{tempoMarking(bpm)}</span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        <svg
          viewBox="0 0 120 180"
          className="h-40 w-auto shrink-0"
          role="img"
          aria-label={`Metronome at ${bpm} beats per minute, ${playing ? "running" : "stopped"}`}
        >
          {/* Case: the wooden pyramid, with the slot the arm sweeps through. */}
          <path
            d="M22 162 L44 66 L76 66 L98 162 Z"
            fill="var(--foreground)"
            fillOpacity={0.05}
            stroke="var(--border)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <line
            x1={PIVOT.x}
            y1={74}
            x2={PIVOT.x}
            y2={150}
            stroke="var(--border)"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <rect x={6} y={160} width={108} height={13} rx={4} fill="var(--border)" />

          <g ref={armRef} transform={`rotate(0 ${PIVOT.x} ${PIVOT.y})`}>
            <line
              x1={PIVOT.x}
              y1={PIVOT.y}
              x2={PIVOT.x}
              y2={ARM_TIP_Y}
              stroke="var(--foreground)"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <rect
              x={PIVOT.x - 12}
              y={weightY(bpm) - 7}
              width={24}
              height={14}
              rx={3}
              fill="var(--foreground)"
              className="transition-[y] duration-300 ease-out motion-reduce:transition-none"
            />
            <circle
              cx={PIVOT.x}
              cy={ARM_TIP_Y}
              r={4}
              fill={beat === 0 ? "var(--tune-ok)" : "var(--foreground)"}
            />
          </g>

          <circle cx={PIVOT.x} cy={PIVOT.y} r={4} fill="var(--border)" />
        </svg>

        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Stop the metronome" : "Start the metronome"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-95"
            >
              {playing ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 translate-x-px fill-current" />
              )}
            </button>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold tabular-nums text-foreground">{bpm}</span>
              <span className="font-mono text-xs text-muted-foreground">bpm</span>
            </div>

            <div className="ml-auto flex gap-2">
              {[-1, 1].map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => nudge(direction)}
                  aria-label={direction < 0 ? "Slower by one bpm" : "Faster by one bpm"}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  {direction < 0 ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min={TEMPO_MIN}
            max={TEMPO_MAX}
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
            aria-label="Tempo in beats per minute"
            className="w-full accent-foreground"
          />

          <div className="flex items-center gap-3">
            <VolumeIcon volume={volume} />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              aria-label="Metronome volume"
              className="w-full accent-foreground"
            />
            <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-xs text-muted-foreground">beats</span>
        {BEATS_PER_BAR_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setBeatsPerBar(option);
              haptic(8);
            }}
            className={cn(
              "rounded-full border px-3 py-2 font-mono text-xs tabular-nums transition-colors duration-200",
              option === beatsPerBar
                ? "border-foreground text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: beatsPerBar }, (_, index) => (
            <span
              key={index}
              className={cn(
                "size-2 rounded-full transition-[background-color,transform] duration-100",
                index === beat
                  ? index === 0
                    ? "scale-125 bg-[var(--tune-ok)]"
                    : "scale-125 bg-foreground"
                  : "bg-border",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme, getThemeForTime } from "@/lib/theme-context";

const HOUR_MS = 3_600_000;
const PX_PER_HOUR = 14;
const DRAG_THRESHOLD_PX = 5;
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function themeForDate(date: Date): "light" | "dark" {
  const hour = date.getHours();
  return hour >= 7 && hour < 17 ? "light" : "dark";
}

export function ClockTheme() {
  const { theme, setTheme, isManualOverride, setManualOverride } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [offsetHours, setOffsetHours] = useState(0);
  const [, setTick] = useState(0);
  const lastHourRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const waveTimeoutRef = useRef<number | null>(null);
  const dragRef = useRef({ active: false, startX: 0, moved: false });
  const justDraggedRef = useRef(false);
  const offsetRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const warpingRef = useRef(false);

  const setOffset = (value: number) => {
    offsetRef.current = value;
    setOffsetHours(value);
  };

  // Initialize and update clock every second
  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setTick((t) => t + 1);

      // While the user is playing with time, the real clock stays out of it
      if (dragRef.current.active || offsetRef.current !== 0 || warpingRef.current) {
        return;
      }

      const currentHour = new Date().getHours();

      // Check if we crossed a time boundary (7 AM or 5 PM)
      if (lastHourRef.current !== null) {
        const crossedMorning = lastHourRef.current === 6 && currentHour === 7;
        const crossedEvening = lastHourRef.current === 16 && currentHour === 17;

        if (crossedMorning || crossedEvening) {
          // Reset manual override and apply time-based theme
          setManualOverride(false);
          setTheme(getThemeForTime());
        }
      }

      // Apply auto theme if not manually overridden
      if (!isManualOverride && lastHourRef.current !== currentHour) {
        const timeTheme = getThemeForTime();
        if (timeTheme !== theme) {
          setTheme(timeTheme);
        }
      }

      lastHourRef.current = currentHour;
    }, 1000);

    return () => clearInterval(interval);
  }, [theme, isManualOverride, setTheme, setManualOverride]);

  // Cleanup any in-flight scrub animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      document.documentElement.classList.remove("theme-scrubbing");
    };
  }, []);

  const beginScrubVisuals = () => {
    document.documentElement.classList.add("theme-scrubbing");
  };

  const endScrubVisuals = () => {
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-scrubbing");
    }, 300);
  };

  const finishScrub = () => {
    setOffset(0);
    setManualOverride(false);
    setTheme(getThemeForTime());
    endScrubVisuals();
  };

  // Spring the scrubbed time back to now
  const settleBack = () => {
    const from = offsetRef.current;
    if (from === 0) {
      finishScrub();
      return;
    }
    const duration = Math.min(900, 350 + Math.abs(from) * 25);
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = from * (1 - easeOut(t));
      setOffset(value);
      setTheme(themeForDate(new Date(Date.now() + value * HOUR_MS)));
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        finishScrub();
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  // Konami code: fast-forward a full day and land back on now
  const timeWarp = () => {
    if (warpingRef.current || dragRef.current.active) return;
    warpingRef.current = true;
    setManualOverride(true);
    beginScrubVisuals();

    const duration = 4000;
    const start = performance.now();
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = 24 * easeInOut(t);
      setOffset(value);
      setTheme(themeForDate(new Date(Date.now() + value * HOUR_MS)));
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        warpingRef.current = false;
        finishScrub();
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  const timeWarpRef = useRef(timeWarp);
  timeWarpRef.current = timeWarp;

  useEffect(() => {
    let progress = 0;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === KONAMI[progress]) {
        progress += 1;
      } else {
        progress = key === KONAMI[0] ? 1 : 0;
      }
      if (progress === KONAMI.length) {
        progress = 0;
        timeWarpRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (warpingRef.current) return;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    dragRef.current = {
      active: true,
      startX: event.clientX - offsetRef.current * PX_PER_HOUR,
      moved: false,
    };
    buttonRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    if (!drag.moved) {
      drag.moved = true;
      setManualOverride(true);
      beginScrubVisuals();
    }
    const offset = dx / PX_PER_HOUR;
    setOffset(offset);
    setTheme(themeForDate(new Date(Date.now() + offset * HOUR_MS)));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    buttonRef.current?.releasePointerCapture?.(event.pointerId);
    if (drag.moved) {
      justDraggedRef.current = true;
      settleBack();
    }
  };

  // Handle manual toggle (click or keyboard)
  const handleClick = () => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    const newTheme = theme === "dark" ? "light" : "dark";
    setManualOverride(true);
    const root = document.documentElement;
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const waveX = buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth - 24;
    const waveY = buttonRect ? buttonRect.top + buttonRect.height / 2 : 24;

    root.style.setProperty("--theme-wave-x", `${waveX}px`);
    root.style.setProperty("--theme-wave-y", `${waveY}px`);
    root.style.setProperty(
      "--theme-wave-color",
      newTheme === "dark" ? "var(--theme-wave-dark)" : "var(--theme-wave-light)",
    );

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startViewTransition = (
      document as Document & {
        startViewTransition?: (callback: () => void) => void;
      }
    ).startViewTransition?.bind(document);

    if (prefersReducedMotion || !startViewTransition) {
      document.body.classList.add("theme-wave");
      if (waveTimeoutRef.current) {
        window.clearTimeout(waveTimeoutRef.current);
      }
      setTheme(newTheme);
      waveTimeoutRef.current = window.setTimeout(() => {
        document.body.classList.remove("theme-wave");
      }, 1100);
      return;
    }

    startViewTransition(() => {
      setTheme(newTheme);
    });
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="text-sm font-mono text-muted-foreground tabular-nums"
        aria-label="Loading clock"
      >
        --:--:--
      </button>
    );
  }

  const displayedTime = formatTime(new Date(Date.now() + offsetHours * HOUR_MS));

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="text-sm font-mono text-muted-foreground hover:text-foreground transition-[color,transform] duration-150 tabular-nums cursor-pointer select-none touch-none active:scale-[0.97]"
      aria-label={`Current time: ${displayedTime}. Click to switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title="Click to toggle the theme — or drag me through the day"
    >
      {displayedTime}
    </button>
  );
}

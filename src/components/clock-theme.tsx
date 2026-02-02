"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme, getThemeForTime } from "@/lib/theme-context";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function ClockTheme() {
  const { theme, setTheme, isManualOverride, setManualOverride } = useTheme();
  const [time, setTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const lastHourRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const waveTimeoutRef = useRef<number | null>(null);

  // Initialize and update clock every second
  useEffect(() => {
    setMounted(true);
    setTime(formatTime(new Date()));

    const interval = setInterval(() => {
      const now = new Date();
      setTime(formatTime(now));

      const currentHour = now.getHours();

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

  // Handle manual toggle
  const handleClick = () => {
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

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors tabular-nums cursor-pointer"
      aria-label={`Current time: ${time}. Click to switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Click to switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {time}
    </button>
  );
}

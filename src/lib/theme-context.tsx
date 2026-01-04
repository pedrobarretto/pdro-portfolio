"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isManualOverride: boolean;
  setManualOverride: (override: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get theme based on current hour
function getThemeForTime(): Theme {
  const hour = new Date().getHours();
  // 7 AM (7) to 4:59 PM (16) = light
  // 5 PM (17) to 6:59 AM (6) = dark
  return hour >= 7 && hour < 17 ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isManualOverride, setManualOverride] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set theme and apply to DOM
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Initial mount - set theme based on time
  useEffect(() => {
    const timeBasedTheme = getThemeForTime();
    setThemeState(timeBasedTheme);
    setMounted(true);
  }, []);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isManualOverride, setManualOverride }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { getThemeForTime };

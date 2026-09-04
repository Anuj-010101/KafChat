import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const THEME_STORAGE_KEY = "kafchat_app_theme";

// Helper: Check system's preferred color scheme (OS level)
const getSystemThemeMode = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      /* fallback */
    }
  }

  const systemMode = getSystemThemeMode();
  return {
    mode: systemMode,
    accentColor: systemMode === "dark" ? "#38bdf8" : "#0284c7",
    fontFamily: "'Inter', sans-serif",
    bgType: "color",
    bgValue: systemMode === "dark" ? "#0b0e14" : "#f8fafc",
    isSystemSynced: !saved, // flag to keep auto-listening if user hasn't explicitly overridden
  };
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  // 1. Listen for real-time OS Theme changes (Light <-> Dark)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      // Agar user ne manually setting change nahi ki hai, toh OS change ke sath live switch karein
      if (!saved) {
        const newMode = e.matches ? "dark" : "light";
        setTheme((prev) => ({
          ...prev,
          mode: newMode,
          accentColor: newMode === "dark" ? "#38bdf8" : "#0284c7",
          bgValue: newMode === "dark" ? "#0b0e14" : "#f8fafc",
        }));
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  // 2. Sync DOM Elements with CSS Variables & Tailwind
  useEffect(() => {
    const root = document.documentElement;

    if (theme.mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    root.setAttribute("data-theme", theme.mode);

    if (theme.accentColor) {
      root.style.setProperty("--app-accent", theme.accentColor);
    }

    if (theme.fontFamily) {
      root.style.setProperty("--app-font", theme.fontFamily);
    }

    if (theme.bgType === "image" && theme.bgValue) {
      root.style.setProperty("--app-bg-image", `url('${theme.bgValue}')`);
    } else {
      root.style.setProperty("--app-bg-image", "none");
      if (theme.bgValue && theme.bgType === "color") {
        root.style.setProperty("--app-bg", theme.bgValue);
      }
    }

    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const setPresetLight = () => {
    setTheme((prev) => ({
      ...prev,
      mode: "light",
      accentColor: prev.accentColor === "#38bdf8" ? "#0284c7" : prev.accentColor,
      bgType: "color",
      bgValue: "#f8fafc",
    }));
  };

  const setPresetDark = () => {
    setTheme((prev) => ({
      ...prev,
      mode: "dark",
      accentColor: prev.accentColor === "#0284c7" ? "#38bdf8" : prev.accentColor,
      bgType: "color",
      bgValue: "#0b0e14",
    }));
  };

  const updateCustomTheme = (updates) => {
    setTheme((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setPresetDark,
        setPresetLight,
        updateCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
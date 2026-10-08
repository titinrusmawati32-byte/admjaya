import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored as ThemeMode;
      }
    } catch (e) {
      console.warn("Unable to access localStorage for theme:", e);
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light") return "light";
      if (stored === "dark") return "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateThemeDom = () => {
      let isDarkTarget = false;
      if (theme === "dark") {
        isDarkTarget = true;
      } else if (theme === "light") {
        isDarkTarget = false;
      } else {
        isDarkTarget = mediaQuery.matches;
      }

      const activeResolved = isDarkTarget ? "dark" : "light";
      setResolvedTheme(activeResolved);

      const root = document.documentElement;
      if (isDarkTarget) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // Sync mobile browser theme-color address bar
      const meta = document.getElementById("theme-color-meta");
      if (meta) {
        meta.setAttribute("content", isDarkTarget ? "#101B2D" : "#EEF7FF");
      }
    };

    updateThemeDom();

    const handleSystemChange = () => {
      if (theme === "system") {
        updateThemeDom();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    try {
      localStorage.setItem("theme", newTheme);
      // Sync legacy key so external references remain compatible
      const isDarkTarget =
        newTheme === "dark" ||
        (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      localStorage.setItem("edadmin_theme", isDarkTarget ? "dark" : "light");
    } catch (e) {
      console.warn("Unable to persist theme to localStorage:", e);
    }
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark: resolvedTheme === "dark",
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    foreground: string;
    background: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [colors, setColors] = useState({
    foreground: "",
    background: "",
  });

  // Initialize theme and handle mounting
  useEffect(() => {
    const savedTheme = localStorage.getItem("class_theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    setMounted(true);
  }, []);

  // Update colors when theme changes
  useEffect(() => {
    if (!mounted) return;

    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement);
      const foreground = `hsl(${styles
        .getPropertyValue("--foreground")
        .trim()
        .split(" ")
        .join(",")})`;
      const background = `hsl(${styles
        .getPropertyValue("--background")
        .trim()
        .split(" ")
        .join(",")})`;
      setColors({ foreground, background });
    };

    updateColors();

    // Update colors when theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Handle theme during Astro page transitions
    const handleBeforeSwap = (event: any) => {
      if (theme === "dark") {
        event.newDocument.documentElement.classList.add("dark");
      } else {
        event.newDocument.documentElement.classList.remove("dark");
      }
    };

    document.addEventListener("astro:before-swap", handleBeforeSwap);

    return () => {
      observer.disconnect();
      document.removeEventListener("astro:before-swap", handleBeforeSwap);
    };
  }, [mounted, theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("class_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
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

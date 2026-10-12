import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  themes,
  themeOrder,
  type ThemeName,
} from "@/constants/theme";

type ThemeContextType = {
  themeName: ThemeName;
  theme: (typeof themes)[ThemeName];
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>("default");

  const cycleTheme = () => {
    setThemeName((currentTheme) => {
      const currentIndex = themeOrder.indexOf(currentTheme);

      const nextIndex = (currentIndex + 1) % themeOrder.length;

      return themeOrder[nextIndex];
    });
  };

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        theme,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
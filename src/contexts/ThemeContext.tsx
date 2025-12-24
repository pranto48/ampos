import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'default' | 'liquid-glass';
type Wallpaper = 'none' | 'aurora' | 'waves' | 'particles' | 'gradient' | 'nebula';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  wallpaper: Wallpaper;
  setWallpaper: (wallpaper: Wallpaper) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('ampos-theme');
    return (saved as Theme) || 'default';
  });

  const [wallpaper, setWallpaper] = useState<Wallpaper>(() => {
    const saved = localStorage.getItem('ampos-wallpaper');
    return (saved as Wallpaper) || 'none';
  });

  useEffect(() => {
    localStorage.setItem('ampos-theme', theme);
    
    // Apply theme class to document
    const root = document.documentElement;
    root.classList.remove('theme-liquid-glass');
    
    if (theme === 'liquid-glass') {
      root.classList.add('theme-liquid-glass');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ampos-wallpaper', wallpaper);
  }, [wallpaper]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, wallpaper, setWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

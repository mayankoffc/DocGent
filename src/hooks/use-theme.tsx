'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
  accent: string;
  destructive: string;
  backgroundStyle?: string;
}

interface ThemeData {
  name: string;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: ThemeData;
  effect: string;
  setTheme: (theme: ThemeData) => void;
  setEffect: (effect: string) => void;
}

function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Default aurora background theme
const dynamicAuroraTheme: ThemeData = {
  name: 'Aurora Dreams',
  colors: {
    primary: '#8b2be2',
    secondary: '#00bfff',
    background: '#0a0520',
    foreground: '#ffffff',
    card: 'rgba(10, 5, 32, 0.5)',
    muted: '#4a4a5a',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: '#32cd32',
    destructive: '#ef4444',
    backgroundStyle: 'var(--aurora-bg-uiverse)', // We'll use this flag in layout
  }
};

// Default theme
const defaultTheme: ThemeData = dynamicAuroraTheme;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeData>(defaultTheme);
  const [effect, setEffectState] = useState<string>('none');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('anm-theme');
    const savedEffect = localStorage.getItem('anm-effect');
    
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setThemeState(parsed);
      } catch (e) {
        console.error('Failed to parse saved theme');
      }
    }
    
    if (savedEffect) {
      setEffectState(savedEffect);
    }
  }, []);

  // Apply theme colors to CSS variables
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Apply theme colors by converting hex to HSL components
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        root.style.setProperty('--' + key, hexToHsl(value));
      } else {
        root.style.setProperty('--' + key, value);
      }
    });
    
    // Special mappings for backward compatibility or specific needs
    if (theme.colors.card) root.style.setProperty('--surface', hexToHsl(theme.colors.card));
    if (theme.colors.foreground) root.style.setProperty('--text', hexToHsl(theme.colors.foreground));
    
    // Apply background style via CSS variable
    if (theme.colors.backgroundStyle) {
      root.style.setProperty('--background-style', theme.colors.backgroundStyle);
    } else {
      root.style.removeProperty('--background-style');
    }
    
    document.body.style.color = theme.colors.foreground;
    
    // Save to localStorage
    localStorage.setItem('anm-theme', JSON.stringify(theme));
  }, [theme, mounted]);

  // Apply background effect to body
  useEffect(() => {
    if (!mounted) return;
    
    const body = document.body;
    
    // Remove all existing effect classes
    const effectClasses = [
      'effect-particles', 'effect-stardust', 'effect-aurora', 'effect-matrix',
      'effect-bubbles', 'effect-snow', 'effect-fireflies', 'effect-confetti',
      'effect-smoke', 'effect-grid-pulse', 'effect-noise', 'effect-spotlight',
      'effect-waves', 'effect-meteor', 'effect-none'
    ];
    body.classList.remove(...effectClasses);
    
    // Add new effect class
    if (effect && effect !== 'none') {
      body.classList.add(`effect-${effect}`);
      console.log('🎆 ANM Effect Applied:', effect);
    }
    
    // Save to localStorage
    localStorage.setItem('anm-effect', effect);
  }, [effect, mounted]);

  const setTheme = (newTheme: ThemeData) => {
    setThemeState(newTheme);
  };

  const setEffect = (newEffect: string) => {
    setEffectState(newEffect);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      effect, 
      setTheme, 
      setEffect 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

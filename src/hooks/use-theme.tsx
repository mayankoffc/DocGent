'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
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

// Default theme - Cyber Neon (Theme 1)
const defaultTheme: ThemeData = {
  name: 'Cyber Neon',
  colors: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    background: '#0a0a0f',
    surface: '#1a1a2f',
    text: '#e0e0ff',
    accent: '#f472b6'
  }
};

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
    
    // Apply theme colors
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--text', theme.colors.text);
    root.style.setProperty('--accent', theme.colors.accent);
    
    // Apply to body
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;
    
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

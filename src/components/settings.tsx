
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Star, Crown, LogOut, ShieldCheck, Lock, AlertTriangle, CheckCircle2, UserCircle, FileText, Download, Settings2, Maximize2, Image, FileType, Palette, Paintbrush, RotateCcw, Save, Sparkles, Sun, Moon, Monitor, Eye, Wand2, Zap, Layers, Copy, Upload, Share2, Heart, Gem, Flame, Snowflake, Leaf, Cloud, CircleDot, Droplets, Brush, Play, Pause, RefreshCw, Shuffle, Stars, Wind, Waves, Mountain, Hexagon, Triangle, Square, Circle, Orbit, Atom, Rocket, Music, Gamepad2, Coffee, Ghost, Skull, Rainbow, Aperture, Box, Compass, Target, Activity, Radio, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionModal } from "./subscription-modal";
import { format } from "date-fns";
import { useTheme as useANMTheme } from "@/hooks/use-theme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { getAppSettings, type AppSettings } from "@/ai/flows/get-app-settings";
import { updateAppSettings } from "@/ai/flows/update-app-settings";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.357-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.536,44,30.169,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export function SettingsPage() {
    const { t, setLanguage, language } = useTranslation();
    const [theme, setTheme] = React.useState<"light" | "dark" | "system">("dark");
    const { toast } = useToast();
    const { user, signOut, signInWithGoogle, isFirebaseConfigured } = useAuth();
    const { subscription, cancelSubscription } = useSubscription();
    const [isSubscriptionModalOpen, setSubscriptionModalOpen] = React.useState(false);
    
    // ANM Theme System Hook
    const { 
      theme: anmTheme, 
      effect: globalEffect, 
      setTheme: setGlobalTheme, 
      setEffect: setGlobalEffect 
    } = useANMTheme();
    
    // Document Generation Settings
    const [pdfCompression, setPdfCompression] = React.useState<string>('medium');
    const [maxDownloadSize, setMaxDownloadSize] = React.useState<number>(10);
    const [autoOptimize, setAutoOptimize] = React.useState<boolean>(false);
    const [defaultPageSize, setDefaultPageSize] = React.useState<string>('A4');
    const [defaultOrientation, setDefaultOrientation] = React.useState<string>('portrait');
    const [embedFonts, setEmbedFonts] = React.useState<boolean>(true);
    const [colorMode, setColorMode] = React.useState<string>('RGB');
    
    // Theme Maker State - Default to Theme 1 (Cyber Neon)
    const [customTheme, setCustomTheme] = React.useState({
        name: 'Cyber Neon',
        primary: '#8b5cf6',
        secondary: '#06b6d4',
        accent: '#f59e0b',
        background: '#0a0a0f',
        foreground: '#fafafa',
        card: '#12121a',
        border: '#1f1f2e',
        muted: '#4a4a5a',
        destructive: '#ef4444',
    });
    const [savedThemes, setSavedThemes] = React.useState<any[]>([]);
    const [activeThemeId, setActiveThemeId] = React.useState<string | null>(null);
    const [selectedEffect, setSelectedEffect] = React.useState<string>('none');
    const [effectIntensity, setEffectIntensity] = React.useState<number>(50);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [aiPrompt, setAiPrompt] = React.useState<string>(''); // AI Prompt input
    
    // AI Preview Popup State
    const [showAiPreview, setShowAiPreview] = React.useState(false);
    const [aiGeneratedPreview, setAiGeneratedPreview] = React.useState<any>(null);
    
    // Admin Mode State
    const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
    const [isUpdatingSettings, setIsUpdatingSettings] = React.useState(false);
    const [adminCode, setAdminCode] = React.useState('');
    const [isControlsUnlocked, setIsControlsUnlocked] = React.useState(false);
    
    // Sync local state with global theme on mount
    React.useEffect(() => {
        setSelectedEffect(globalEffect);
    }, [globalEffect]);

    // Load settings from localStorage on mount
    React.useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as "light" | "dark" | "system" || 'dark';
        setTheme(storedTheme);
        
        // Load document settings
        setPdfCompression(localStorage.getItem('pdfCompression') || 'medium');
        setMaxDownloadSize(parseInt(localStorage.getItem('maxDownloadSize') || '10'));
        setAutoOptimize(localStorage.getItem('autoOptimize') === 'true');
        setDefaultPageSize(localStorage.getItem('defaultPageSize') || 'A4');
        setDefaultOrientation(localStorage.getItem('defaultOrientation') || 'portrait');
        setEmbedFonts(localStorage.getItem('embedFonts') !== 'false');
        setColorMode(localStorage.getItem('colorMode') || 'RGB');
        
        // Load saved themes
        const themes = localStorage.getItem('savedThemes');
        if (themes) {
            try {
                setSavedThemes(JSON.parse(themes));
            } catch(e) {}
        }
        
        // Load active theme
        const activeId = localStorage.getItem('activeThemeId');
        if (activeId) setActiveThemeId(activeId);
        
        // Load custom theme if editing
        const currentCustom = localStorage.getItem('customTheme');
        if (currentCustom) {
            try {
                const parsed = JSON.parse(currentCustom);
                if (parsed.colors) setCustomTheme(prev => ({ ...prev, ...parsed.colors, name: parsed.name || prev.name }));
            } catch(e) {}
        }
    }, []);

    // Fetch app settings from server if user has trial
    React.useEffect(() => {
        if (subscription.status === 'trial') {
            getAppSettings()
                .then(settings => {
                    setAppSettings(settings);
                })
                .catch(error => {
                    console.error("Failed to fetch app settings:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not load admin settings from the server.',
                    });
                })
                .finally(() => setIsLoadingSettings(false));
        } else {
            setIsLoadingSettings(false);
        }
    }, [subscription.status, toast]);


    React.useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const handleLanguageChange = (lang: string) => {
        setLanguage(lang as 'en' | 'hi' | 'es' | 'fr');
        toast({
            title: t('toastLanguageTitle'),
            description: t('toastLanguageDescription'),
        });
    }
    
    // Theme functions
    const applyTheme = (themeColors: typeof customTheme) => {
        const root = document.documentElement;
        
        // Convert hex to HSL for CSS variables
        const hexToHsl = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;
            
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };
        
        root.style.setProperty('--primary', hexToHsl(themeColors.primary));
        root.style.setProperty('--secondary', hexToHsl(themeColors.secondary));
        root.style.setProperty('--accent', hexToHsl(themeColors.accent));
        root.style.setProperty('--destructive', hexToHsl(themeColors.destructive));
        root.style.setProperty('--background', hexToHsl(themeColors.background));
        root.style.setProperty('--foreground', hexToHsl(themeColors.foreground));
        root.style.setProperty('--card', hexToHsl(themeColors.card));
        root.style.setProperty('--border', hexToHsl(themeColors.border));
        root.style.setProperty('--muted', hexToHsl(themeColors.muted));
        
        // Also update body background
        document.body.style.background = `linear-gradient(135deg, ${themeColors.background} 0%, ${themeColors.card} 50%, ${themeColors.background} 100%)`;
        
        // Sync with global ThemeProvider for persistence
        setGlobalTheme({
            name: themeColors.name,
            colors: {
                primary: themeColors.primary,
                secondary: themeColors.secondary,
                background: themeColors.background,
                surface: themeColors.card,
                text: themeColors.foreground,
                accent: themeColors.accent
            }
        });
    };
    
    const saveCurrentTheme = () => {
        const themeId = Date.now().toString();
        const newTheme = { id: themeId, ...customTheme };
        const updated = [...savedThemes, newTheme];
        setSavedThemes(updated);
        localStorage.setItem('savedThemes', JSON.stringify(updated));
        toast({
            title: "Theme Saved",
            description: `"${customTheme.name}" has been saved to your themes.`,
        });
    };
    
    const loadTheme = (themeData: any) => {
        setCustomTheme(themeData);
        setActiveThemeId(themeData.id);
        localStorage.setItem('activeThemeId', themeData.id);
        localStorage.setItem('customTheme', JSON.stringify({ name: themeData.name, colors: themeData }));
        applyTheme(themeData);
        toast({
            title: "Theme Applied",
            description: `"${themeData.name}" is now active.`,
        });
    };
    
    const deleteTheme = (themeId: string) => {
        const updated = savedThemes.filter(t => t.id !== themeId);
        setSavedThemes(updated);
        localStorage.setItem('savedThemes', JSON.stringify(updated));
        if (activeThemeId === themeId) {
            setActiveThemeId(null);
            localStorage.removeItem('activeThemeId');
            resetToDefault();
        }
        toast({ title: "Theme Deleted" });
    };
    
    const resetToDefault = () => {
        // Default to Theme 1 (Cyber Neon)
        const defaultTheme = {
            name: 'Cyber Neon',
            primary: '#8b5cf6',
            secondary: '#06b6d4',
            accent: '#f59e0b',
            background: '#0a0a0f',
            foreground: '#fafafa',
            card: '#12121a',
            border: '#1f1f2e',
            muted: '#4a4a5a',
            destructive: '#ef4444',
        };
        setCustomTheme(defaultTheme);
        setActiveThemeId(null);
        localStorage.removeItem('customTheme');
        localStorage.removeItem('activeThemeId');
        
        // Reset CSS variables
        const root = document.documentElement;
        root.style.removeProperty('--primary');
        root.style.removeProperty('--secondary');
        root.style.removeProperty('--accent');
        root.style.removeProperty('--destructive');
        root.style.removeProperty('--background');
        root.style.removeProperty('--foreground');
        root.style.removeProperty('--card');
        root.style.removeProperty('--border');
        root.style.removeProperty('--muted');
        document.body.style.background = 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)';
        
        toast({ title: "Theme Reset", description: "Default dark theme applied." });
    };
    
    // Export theme as JSON
    const exportTheme = (themeToExport: any) => {
        const themeData = JSON.stringify(themeToExport, null, 2);
        const blob = new Blob([themeData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${themeToExport.name || 'theme'}-anm-studios.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Theme Exported", description: `"${themeToExport.name}" has been downloaded.` });
    };
    
    // Import theme from JSON file
    const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTheme = JSON.parse(e.target?.result as string);
                if (importedTheme.primary && importedTheme.background && importedTheme.foreground) {
                    setCustomTheme({ ...importedTheme, name: importedTheme.name || 'Imported Theme' });
                    toast({ title: "Theme Imported", description: "Theme loaded successfully! Click Apply to use it." });
                } else {
                    throw new Error("Invalid theme format");
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Import Failed", description: "Invalid theme file format." });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    
    // Copy theme to clipboard
    const copyThemeToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(customTheme, null, 2));
        toast({ title: "Copied!", description: "Theme code copied to clipboard." });
    };
    
    // HSL to Hex conversion helper
    const hslToHex = (h: number, s: number, l: number): string => {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };
    
    // Hex to HSL conversion helper
    const hexToHslValues = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
                case g: h = ((b - r) / d + 2) * 60; break;
                case b: h = ((r - g) / d + 4) * 60; break;
            }
        }
        return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    };
    
    // Smart Theme Presets based on keywords
    const themePresets: Record<string, any> = {
        cyberpunk: { name: 'Neon Cyberpunk', primary: '#00ffff', secondary: '#ff00ff', accent: '#ffff00', background: '#0a0a12', foreground: '#e0f0ff', card: '#12121f', border: '#2a2a40', muted: '#4a4a6a', destructive: '#ff3366' },
        ocean: { name: 'Deep Ocean', primary: '#0ea5e9', secondary: '#06b6d4', accent: '#22d3ee', background: '#0a1520', foreground: '#e0f5ff', card: '#0f1f2e', border: '#1a3040', muted: '#3a5568', destructive: '#f43f5e' },
        sunset: { name: 'Sunset Glow', primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24', background: '#1a0f0a', foreground: '#fff5e5', card: '#251a12', border: '#3d2a1e', muted: '#6b5344', destructive: '#dc2626' },
        nature: { name: 'Forest Nature', primary: '#22c55e', secondary: '#16a34a', accent: '#84cc16', background: '#0a1210', foreground: '#e5fff0', card: '#121f1a', border: '#1e352d', muted: '#3d5a4a', destructive: '#ef4444' },
        neon: { name: 'Neon Dreams', primary: '#a855f7', secondary: '#ec4899', accent: '#06b6d4', background: '#0a0510', foreground: '#f0e0ff', card: '#150a20', border: '#2a1540', muted: '#5a3580', destructive: '#f43f5e' },
        pastel: { name: 'Soft Pastel', primary: '#c4b5fd', secondary: '#a5b4fc', accent: '#fda4af', background: '#12121a', foreground: '#f5f5ff', card: '#1a1a25', border: '#2d2d3d', muted: '#6b6b8a', destructive: '#f87171' },
        minimal: { name: 'Clean Minimal', primary: '#6b7280', secondary: '#9ca3af', accent: '#3b82f6', background: '#0a0a0c', foreground: '#f4f4f5', card: '#141416', border: '#27272a', muted: '#52525b', destructive: '#ef4444' },
        luxury: { name: 'Royal Luxury', primary: '#d4af37', secondary: '#c49b30', accent: '#f5d742', background: '#0a0808', foreground: '#fff8e8', card: '#151210', border: '#2a2520', muted: '#5a5040', destructive: '#b91c1c' },
        gaming: { name: 'Gaming RGB', primary: '#ef4444', secondary: '#22c55e', accent: '#3b82f6', background: '#080810', foreground: '#f0f0ff', card: '#101018', border: '#202030', muted: '#404060', destructive: '#dc2626' },
        retro: { name: 'Retro Wave', primary: '#f472b6', secondary: '#a855f7', accent: '#22d3ee', background: '#1a0a1a', foreground: '#fff0f5', card: '#251525', border: '#3d2540', muted: '#6b4570', destructive: '#f43f5e' },
        midnight: { name: 'Midnight Blue', primary: '#3b82f6', secondary: '#6366f1', accent: '#8b5cf6', background: '#050510', foreground: '#e0e5ff', card: '#0a0a18', border: '#1a1a30', muted: '#3a3a5a', destructive: '#ef4444' },
        fire: { name: 'Blazing Fire', primary: '#ef4444', secondary: '#f97316', accent: '#fbbf24', background: '#120808', foreground: '#fff0e0', card: '#1f1010', border: '#352020', muted: '#5a3535', destructive: '#dc2626' },
        ice: { name: 'Frozen Ice', primary: '#67e8f9', secondary: '#a5f3fc', accent: '#e0f2fe', background: '#08101a', foreground: '#f0faff', card: '#101820', border: '#1a2830', muted: '#3a4850', destructive: '#f87171' },
        matrix: { name: 'Matrix Green', primary: '#22c55e', secondary: '#4ade80', accent: '#86efac', background: '#000a00', foreground: '#d0ffd0', card: '#001000', border: '#002000', muted: '#105010', destructive: '#ff3030' },
        sakura: { name: 'Cherry Sakura', primary: '#f9a8d4', secondary: '#f472b6', accent: '#fda4af', background: '#150a10', foreground: '#fff5f8', card: '#201520', border: '#352030', muted: '#6a4560', destructive: '#e11d48' },
    };
    
    // ========== OPENROUTER AI THEME GENERATION (Optimized) ==========
    const callOpenRouterAI = async (prompt: string): Promise<any> => {
        const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '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';
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [{
                        role: 'user',
                        content: `Dark theme "${prompt}". JSON only: {"name":"2-3 words","primary":"#hex","secondary":"#hex","accent":"#hex","background":"#0a-0f","foreground":"#e-f","card":"#1","border":"#2","muted":"#5","destructive":"#e44"}`
                    }],
                    temperature: 0.7,
                    max_tokens: 200
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.log('⚠️ OpenRouter Error:', data.error.message || data.error);
                return null;
            }
            
            const text = data.choices?.[0]?.message?.content || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const requiredKeys = ['name', 'primary', 'secondary', 'accent', 'background', 'foreground', 'card', 'border', 'muted', 'destructive'];
                const hasAllKeys = requiredKeys.every(key => parsed[key] && (/^#[0-9a-fA-F]{6}$/.test(parsed[key]) || key === 'name'));
                
                if (hasAllKeys && parsed.name) {
                    console.log('✅ AI Generated Theme:', parsed.name);
                    return parsed;
                }
            }
            
            return null;
        } catch (error: any) {
            console.log('❌ AI Error:', error.message);
            return null;
        }
    };

    // AI Theme Generation with Smart Fallback
    const autoGenerateTheme = async (userPrompt?: string) => {
        setIsGenerating(true);
        
        try {
            let newTheme: any;
            const prompt = userPrompt || 'modern dark theme with purple accents';
            
            // Try OpenRouter AI (Gemini via OpenRouter)
            newTheme = await callOpenRouterAI(prompt);
            
            // Fallback to local generation if AI fails
            if (!newTheme) {
                console.log('🔄 Using local theme generation...');
                const promptLower = prompt.toLowerCase();
                
                // Check preset match
                const matchedPreset = Object.keys(themePresets).find(key => 
                    promptLower.includes(key) || promptLower.includes(key.substring(0, 4))
                );
                
                if (matchedPreset) {
                    newTheme = { ...themePresets[matchedPreset] };
                } else {
                    // Generate based on color keywords
                    let baseHue = 260;
                    const colorKeywords: Record<string, number> = {
                        red: 0, scarlet: 5, crimson: 348, orange: 30, amber: 45,
                        yellow: 60, gold: 50, lime: 90, green: 120, emerald: 150,
                        teal: 175, cyan: 180, sky: 200, blue: 220, indigo: 240,
                        purple: 270, violet: 280, magenta: 300, pink: 330, rose: 345
                    };
                    
                    for (const [color, hue] of Object.entries(colorKeywords)) {
                        if (promptLower.includes(color)) {
                            baseHue = hue;
                            break;
                        }
                    }
                    
                    newTheme = generatePaletteFromHue(baseHue, prompt);
                }
            }
            
            // Show preview popup
            setAiGeneratedPreview(newTheme);
            setShowAiPreview(true);
            setAiPrompt('');
            
            toast({ 
                title: "🎨 Theme Generated!", 
                description: `"${newTheme.name}" ready for preview` 
            });
            
        } catch (error) {
            console.error("Theme generation failed:", error);
            toast({ 
                title: "❌ Generation Failed", 
                description: "Please try again",
                variant: "destructive"
            });
        }
        
        setIsGenerating(false);
    };
    
    // Generate full palette from a base hue
    const generatePaletteFromHue = (hue: number, promptName: string) => {
        const complementaryHue = (hue + 180) % 360;
        const analogousHue = (hue + 30) % 360;
        const triadicHue = (hue + 120) % 360;
        
        const themeNames = [
            'Cosmic Dream', 'Neon Pulse', 'Electric Vibes', 'Digital Dawn',
            'Cyber Night', 'Quantum Glow', 'Stellar Fade', 'Prism Light',
            'Nova Burst', 'Plasma Wave', 'Astral Flow', 'Nebula Drift'
        ];
        const randomName = themeNames[Math.floor(Math.random() * themeNames.length)];
        
        return {
            name: promptName.length > 3 ? `${promptName.charAt(0).toUpperCase() + promptName.slice(1)} Style` : randomName,
            primary: hslToHex(hue, 70, 55),
            secondary: hslToHex(analogousHue, 65, 50),
            accent: hslToHex(triadicHue, 80, 60),
            background: hslToHex(hue, 15, 5),
            foreground: hslToHex(hue, 10, 95),
            card: hslToHex(hue, 12, 8),
            border: hslToHex(hue, 10, 15),
            muted: hslToHex(hue, 8, 35),
            destructive: '#ef4444',
        };
    };
    
    // Random theme generation - Local
    const generateRandomTheme = async () => {
        setIsGenerating(true);
        
        const presetKeys = Object.keys(themePresets);
        const randomKey = presetKeys[Math.floor(Math.random() * presetKeys.length)];
        const randomPreset = themePresets[randomKey];
        
        // Show preview popup
        setAiGeneratedPreview(randomPreset);
        setShowAiPreview(true);
        
        toast({ 
            title: "🎲 Random Theme!", 
            description: `"${randomPreset.name}" generated` 
        });
        
        setIsGenerating(false);
    };
    
    // Animation Presets - 15 Unique Animations
    const animationPresets = [
        { id: 'none', name: 'None', icon: Circle, description: 'No animation', css: '' },
        { id: 'float', name: 'Floating', icon: Cloud, description: 'Gentle floating motion', css: 'animate-float' },
        { id: 'pulse-glow', name: 'Pulse Glow', icon: Heart, description: 'Pulsating glow effect', css: 'animate-pulse-glow' },
        { id: 'shimmer', name: 'Shimmer', icon: Sparkles, description: 'Shimmering light sweep', css: 'animate-shimmer' },
        { id: 'breathe', name: 'Breathe', icon: Wind, description: 'Breathing scale effect', css: 'animate-breathe' },
        { id: 'tilt-3d', name: '3D Tilt', icon: Box, description: '3D tilt on hover', css: 'animate-tilt-3d' },
        { id: 'morph', name: 'Morph', icon: Hexagon, description: 'Border morphing', css: 'animate-morph' },
        { id: 'neon-flicker', name: 'Neon Flicker', icon: Zap, description: 'Neon sign flicker', css: 'animate-neon-flicker' },
        { id: 'gradient-shift', name: 'Gradient Shift', icon: Rainbow, description: 'Shifting gradient colors', css: 'animate-gradient-shift' },
        { id: 'wave', name: 'Wave', icon: Waves, description: 'Wavy motion effect', css: 'animate-wave' },
        { id: 'rotate-slow', name: 'Slow Rotate', icon: RefreshCw, description: 'Slow continuous rotation', css: 'animate-rotate-slow' },
        { id: 'bounce-soft', name: 'Soft Bounce', icon: Activity, description: 'Gentle bounce effect', css: 'animate-bounce-soft' },
        { id: 'glitch', name: 'Glitch', icon: Radio, description: 'Digital glitch effect', css: 'animate-glitch' },
        { id: 'orbit', name: 'Orbit', icon: Orbit, description: 'Orbital particles', css: 'animate-orbit' },
        { id: 'typewriter', name: 'Typewriter', icon: FileText, description: 'Typewriter reveal', css: 'animate-typewriter' },
    ];
    
    // Background Effect Presets - 15 Unique Effects
    const effectPresets = [
        { id: 'none', name: 'None', icon: Circle, description: 'No effect', css: '' },
        { id: 'particles', name: 'Particles', icon: Stars, description: 'Floating particles', css: 'effect-particles' },
        { id: 'stardust', name: 'Stardust', icon: Sparkles, description: 'Sparkling dust effect', css: 'effect-stardust' },
        { id: 'aurora', name: 'Aurora', icon: Rainbow, description: 'Northern lights effect', css: 'effect-aurora' },
        { id: 'matrix', name: 'Matrix Rain', icon: Atom, description: 'Digital rain effect', css: 'effect-matrix' },
        { id: 'bubbles', name: 'Bubbles', icon: Circle, description: 'Rising bubbles', css: 'effect-bubbles' },
        { id: 'snow', name: 'Snowfall', icon: Snowflake, description: 'Falling snow particles', css: 'effect-snow' },
        { id: 'fireflies', name: 'Fireflies', icon: Flame, description: 'Glowing fireflies', css: 'effect-fireflies' },
        { id: 'confetti', name: 'Confetti', icon: Gem, description: 'Celebration confetti', css: 'effect-confetti' },
        { id: 'smoke', name: 'Smoke', icon: Cloud, description: 'Smooth smoke effect', css: 'effect-smoke' },
        { id: 'grid-pulse', name: 'Grid Pulse', icon: Layers, description: 'Pulsing grid lines', css: 'effect-grid-pulse' },
        { id: 'noise', name: 'Film Grain', icon: Image, description: 'Cinematic noise', css: 'effect-noise' },
        { id: 'spotlight', name: 'Spotlight', icon: Target, description: 'Following spotlight', css: 'effect-spotlight' },
        { id: 'waves-bg', name: 'Wave Lines', icon: Waves, description: 'Animated wave lines', css: 'effect-waves' },
        { id: 'meteor', name: 'Meteors', icon: Rocket, description: 'Shooting meteors', css: 'effect-meteor' },
    ];
    
    // Apply effect to app - connects to global ThemeProvider
    const applyEffect = (effectId: string) => {
        setSelectedEffect(effectId);
        setGlobalEffect(effectId); // Apply globally via ThemeProvider
        const preset = effectPresets.find(e => e.id === effectId);
        toast({ title: "🌟 Effect Applied", description: `"${preset?.name}" background effect is now visible everywhere!` });
    };
    
    // ANM Studios Preset Theme Collections
    const presetThemeCollections = {
        signature: [
            { name: 'Cyber Neon', primary: '#8b5cf6', secondary: '#06b6d4', accent: '#f472b6', background: '#0a0a0f', foreground: '#e0e0ff', card: '#12121a', border: '#1f1f2e', muted: '#4a4a5a', destructive: '#ef4444', icon: Zap },
            { name: 'Midnight Purple', primary: '#8b5cf6', secondary: '#a855f7', accent: '#c084fc', background: '#0c0a1d', foreground: '#faf5ff', card: '#1a1625', border: '#2e2750', muted: '#4c3d7a', destructive: '#ef4444', icon: Gem },
            { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#0ea5e9', accent: '#06b6d4', background: '#0a1628', foreground: '#f0f9ff', card: '#0f2847', border: '#1e3a5f', muted: '#2d4a6f', destructive: '#ef4444', icon: Droplets },
            { name: 'Forest Green', primary: '#22c55e', secondary: '#10b981', accent: '#14b8a6', background: '#0a1f0a', foreground: '#f0fdf4', card: '#132f13', border: '#1f4d1f', muted: '#2d6b2d', destructive: '#ef4444', icon: Leaf },
            { name: 'Sunset Orange', primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24', background: '#1a0f05', foreground: '#fff7ed', card: '#2d1a0a', border: '#4d2d10', muted: '#7a4a1f', destructive: '#ef4444', icon: Sun },
        ],
        premium: [
            { name: 'Rose Gold', primary: '#f43f5e', secondary: '#fb7185', accent: '#fda4af', background: '#1f0a10', foreground: '#fff1f2', card: '#2d1018', border: '#4d1f2d', muted: '#7a3347', destructive: '#ef4444', icon: Heart },
            { name: 'Cyberpunk', primary: '#f0abfc', secondary: '#c026d3', accent: '#facc15', background: '#0d0d0d', foreground: '#fdf4ff', card: '#1a1a1a', border: '#333333', muted: '#525252', destructive: '#ef4444', icon: Zap },
            { name: 'Arctic', primary: '#38bdf8', secondary: '#7dd3fc', accent: '#e0f2fe', background: '#0c1929', foreground: '#f0f9ff', card: '#172b44', border: '#1e3a5f', muted: '#3b5b7d', destructive: '#f87171', icon: Snowflake },
            { name: 'Ember', primary: '#ef4444', secondary: '#f97316', accent: '#fbbf24', background: '#1c0a0a', foreground: '#fef2f2', card: '#2d1515', border: '#4a2020', muted: '#6b2d2d', destructive: '#ef4444', icon: Flame },
        ],
        exclusive: [
            { name: 'Neon Dreams', primary: '#00ff88', secondary: '#00ccff', accent: '#ff00ff', background: '#050505', foreground: '#ffffff', card: '#0a0a0a', border: '#1a1a1a', muted: '#333333', destructive: '#ff0055', icon: Sparkles },
            { name: 'Royal Velvet', primary: '#9333ea', secondary: '#7c3aed', accent: '#a78bfa', background: '#0f0520', foreground: '#f3e8ff', card: '#1a0f30', border: '#2d1a50', muted: '#4a2d7a', destructive: '#f43f5e', icon: Crown },
            { name: 'Golden Hour', primary: '#fbbf24', secondary: '#f59e0b', accent: '#fcd34d', background: '#1a1408', foreground: '#fefce8', card: '#2d2410', border: '#4d3d1a', muted: '#7a6028', destructive: '#ef4444', icon: Sun },
            { name: 'Deep Space', primary: '#6366f1', secondary: '#818cf8', accent: '#a5b4fc', background: '#030712', foreground: '#f8fafc', card: '#0f172a', border: '#1e293b', muted: '#334155', destructive: '#f87171', icon: Rocket },
        ],
        gaming: [
            { name: 'Matrix', primary: '#00ff00', secondary: '#22ff22', accent: '#88ff88', background: '#000500', foreground: '#00ff00', card: '#001200', border: '#003300', muted: '#005500', destructive: '#ff0000', icon: Atom },
            { name: 'RGB Wave', primary: '#ff0080', secondary: '#00ff80', accent: '#8000ff', background: '#050505', foreground: '#ffffff', card: '#0a0a0a', border: '#1f1f1f', muted: '#3a3a3a', destructive: '#ff0040', icon: Gamepad2 },
            { name: 'Vaporwave', primary: '#ff71ce', secondary: '#01cdfe', accent: '#05ffa1', background: '#0d0221', foreground: '#fffb96', card: '#1a0440', border: '#2d0860', muted: '#4a0d8f', destructive: '#ff0055', icon: Music },
            { name: 'Hacker', primary: '#39ff14', secondary: '#00ff41', accent: '#32cd32', background: '#0a0a0a', foreground: '#39ff14', card: '#0f0f0f', border: '#1a1a1a', muted: '#2a2a2a', destructive: '#ff0000', icon: Skull },
        ],
        aesthetic: [
            { name: 'Lavender Mist', primary: '#e0b0ff', secondary: '#dda0dd', accent: '#d8bfd8', background: '#1a0f20', foreground: '#faf5ff', card: '#2a1a35', border: '#3d2850', muted: '#5a3d75', destructive: '#ff6b9d', icon: Cloud },
            { name: 'Mint Fresh', primary: '#98ff98', secondary: '#90ee90', accent: '#7fffd4', background: '#0a1a10', foreground: '#f0fff4', card: '#152a1c', border: '#204030', muted: '#306040', destructive: '#ff6b6b', icon: Leaf },
            { name: 'Coral Reef', primary: '#ff7f50', secondary: '#ff6b6b', accent: '#ffa07a', background: '#1a0f0a', foreground: '#fff5ee', card: '#2d1a12', border: '#4a2a1f', muted: '#704030', destructive: '#dc143c', icon: Waves },
            { name: 'Cotton Candy', primary: '#ffb6c1', secondary: '#ffc0cb', accent: '#ff69b4', background: '#1a0a12', foreground: '#fff0f5', card: '#2a1520', border: '#402030', muted: '#603050', destructive: '#ff1493', icon: Heart },
        ]
    };
    
    // Flatten for backward compatibility
    const presetThemes = [...presetThemeCollections.signature, ...presetThemeCollections.premium, ...presetThemeCollections.exclusive];
    
    const handleUnlockControls = () => {
        const ADMIN_SECRET_CODE = "admin649290docgentor@";
        if (adminCode === ADMIN_SECRET_CODE) {
            setIsControlsUnlocked(true);
            toast({
                title: "Admin Controls Unlocked",
                description: "You can now modify app settings.",
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Invalid Code",
                description: "The admin code you entered is incorrect.",
            });
        }
    };

    const handleAdminSettingsUpdate = async () => {
        if (!appSettings || !user) return;
        
        setIsUpdatingSettings(true);
        try {
            await updateAppSettings({ ...appSettings, adminId: user.uid });
            
            // Refetch settings to get the new expiry date
            const updatedSettings = await getAppSettings();
            setAppSettings(updatedSettings);

            toast({
                title: "Settings Updated",
                description: "App settings have been successfully updated on the server.",
            });
        } catch(error: any) {
            console.error("Failed to update app settings:", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update settings on the server.',
            });
        } finally {
            setIsUpdatingSettings(false);
        }
    }
    
    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setAppSettings(prev => prev ? { ...prev, [key]: value } : null);
    }
    
    const handleDocSettingChange = (key: string, value: any) => {
        localStorage.setItem(key, value.toString());
        switch(key) {
            case 'pdfCompression': setPdfCompression(value); break;
            case 'maxDownloadSize': setMaxDownloadSize(value); break;
            case 'autoOptimize': setAutoOptimize(value); break;
            case 'defaultPageSize': setDefaultPageSize(value); break;
            case 'defaultOrientation': setDefaultOrientation(value); break;
            case 'embedFonts': setEmbedFonts(value); break;
            case 'colorMode': setColorMode(value); break;
        }
        toast({
            title: "Setting Saved",
            description: "Your document generation preference has been updated.",
        });
    }

    const isFreemiumCodeExpired = appSettings?.freemiumCodeExpiry ? new Date().getTime() > appSettings.freemiumCodeExpiry : false;

    const renderSubscriptionInfo = () => {
        let subInfo: {
            title: string;
            description: string;
            buttonText: string;
            alertTitle: string;
            alertDescription: string;
            bgColor: string;
            borderColor: string;
            titleColor: string;
            descColor: string;
        } | null = null;
    
        switch (subscription.status) {
            case 'trial':
                subInfo = {
                    title: "Developer Trial Active",
                    description: `Your trial expires on ${subscription.expiryDate ? format(new Date(subscription.expiryDate), 'PPP') : 'N/A'}.`,
                    buttonText: "End Trial",
                    alertTitle: "End Developer Trial?",
                    alertDescription: "This will immediately revoke all premium access. This action cannot be undone.",
                    bgColor: "bg-purple-50 dark:bg-purple-900/20",
                    borderColor: "border-purple-200 dark:border-purple-800",
                    titleColor: "text-purple-800 dark:text-purple-300",
                    descColor: "text-purple-600 dark:text-purple-400",
                };
                break;
            case 'freemium':
                subInfo = {
                    title: "Freemium Plan Active",
                    description: "You have access to all freemium tools.",
                    buttonText: "Cancel Plan",
                    alertTitle: "Cancel Freemium Plan?",
                    alertDescription: "You will lose access to freemium tools and will need a code to activate it again.",
                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                    borderColor: "border-blue-200 dark:border-blue-800",
                    titleColor: "text-blue-800 dark:text-blue-300",
                    descColor: "text-blue-600 dark:text-blue-400",
                };
                break;
            case 'active':
                 subInfo = {
                    title: "Premium Plan Active",
                    description: `Your ${subscription.plan} subscription renews on ${subscription.expiryDate ? format(new Date(subscription.expiryDate), 'PPP') : 'N/A'}.`,
                    buttonText: "Cancel Plan",
                    alertTitle: "Are you sure?",
                    alertDescription: "This action will cancel your subscription at the end of the current billing period. You will lose access to all premium features after that.",
                    bgColor: "bg-green-50 dark:bg-green-900/20",
                    borderColor: "border-green-200 dark:border-green-800",
                    titleColor: "text-green-800 dark:text-green-300",
                    descColor: "text-green-600 dark:text-green-400",
                };
                break;
            case 'cancelled':
                 subInfo = {
                    title: "Premium Plan (Cancelled)",
                    description: `Your access will expire on ${subscription.expiryDate ? format(new Date(subscription.expiryDate), 'PPP') : 'N/A'}.`,
                    buttonText: "Cancelled",
                    alertTitle: "",
                    alertDescription: "",
                    bgColor: "bg-orange-50 dark:bg-orange-900/20",
                    borderColor: "border-orange-200 dark:border-orange-800",
                    titleColor: "text-orange-800 dark:text-orange-300",
                    descColor: "text-orange-600 dark:text-orange-400",
                };
                break;
            default: // 'inactive'
                return null;
        }
        
        return (
            <div className={cn("flex items-center justify-between space-x-2 p-4 rounded-lg border", subInfo.bgColor, subInfo.borderColor)}>
                <div>
                    <h4 className={cn("font-semibold", subInfo.titleColor)}>{subInfo.title}</h4>
                    <p className={cn("text-sm", subInfo.descColor)}>
                        {subInfo.description}
                    </p>
                </div>
                {subscription.status !== 'cancelled' ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">{subInfo.buttonText}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{subInfo.alertTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {subInfo.alertDescription}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                            <AlertDialogAction onClick={cancelSubscription} className={buttonVariants({ variant: "destructive" })}>
                                Confirm Cancellation
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <Button disabled>{subInfo.buttonText}</Button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('settingsTitle')}</h1>
                <p className="text-muted-foreground">{t('settingsDescription')}</p>
            </div>

            {subscription.status === 'trial' && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck /> Admin Mode</CardTitle>
                        <CardDescription>Customize universal app settings in real-time. Changes will affect all users.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoadingSettings ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : appSettings ? (
                            <>
                                {!isControlsUnlocked ? (
                                    <div className="space-y-4 rounded-lg border-2 border-dashed bg-background/50 p-6 text-center">
                                        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <h3 className="font-semibold">Controls Locked</h3>
                                        <p className="text-sm text-muted-foreground">Enter the admin secret code to unlock settings.</p>
                                        <div className="flex max-w-sm mx-auto gap-2">
                                            <Input 
                                                type="password"
                                                placeholder="Enter admin code..."
                                                value={adminCode}
                                                onChange={(e) => setAdminCode(e.target.value)}
                                            />
                                            <Button onClick={handleUnlockControls}>Unlock</Button>
                                        </div>
                                    </div>
                                ) : (
                                     <fieldset disabled={isUpdatingSettings}>
                                         <div>
                                            <Label htmlFor="freemium-code">Freemium Activation Code</Label>
                                            {isFreemiumCodeExpired ? (
                                                <Alert variant="destructive">
                                                    <AlertTriangle className="h-4 w-4"/>
                                                    <AlertTitle>Code Expired!</AlertTitle>
                                                    <AlertDescription>
                                                        The previous code has expired. Please set a new 6-digit code to reactivate the freemium plan for users.
                                                    </AlertDescription>
                                                </Alert>
                                            ) : appSettings.freemiumCodeExpiry ? (
                                                <Alert>
                                                    <CheckCircle2 className="h-4 w-4"/>
                                                    <AlertTitle>Code is Active</AlertTitle>
                                                    <AlertDescription>
                                                        Current code is valid until {format(new Date(appSettings.freemiumCodeExpiry), 'PPP p')}.
                                                    </AlertDescription>
                                                </Alert>
                                            ) : null}
                                            <Input
                                                id="freemium-code"
                                                placeholder="Enter a new 6-digit code"
                                                value={appSettings.freemiumCode}
                                                onChange={(e) => handleSettingChange('freemiumCode', e.target.value)}
                                                maxLength={6}
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Setting a new code will automatically assign a 7-day validity period.</p>
                                         </div>
                                         <div>
                                            <Label>Monthly Price (₹{appSettings.monthlyPrice})</Label>
                                            <Slider
                                                value={[appSettings.monthlyPrice]}
                                                onValueChange={(value) => handleSettingChange('monthlyPrice', value[0])}
                                                min={10}
                                                max={100}
                                                step={1}
                                            />
                                         </div>
                                         <div>
                                            <Label>Yearly Price (₹{appSettings.yearlyPrice})</Label>
                                            <Slider
                                                value={[appSettings.yearlyPrice]}
                                                onValueChange={(value) => handleSettingChange('yearlyPrice', value[0])}
                                                min={99}
                                                max={500}
                                                step={1}
                                            />
                                         </div>
                                         <Button className="w-full" onClick={handleAdminSettingsUpdate} disabled={isUpdatingSettings}>
                                             {isUpdatingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                             Save & Update Server Settings
                                         </Button>
                                     </fieldset>
                                )}
                            </>
                        ) : (
                           <p className="text-destructive">Could not load app settings.</p> 
                        )}
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle>Manage Subscription</CardTitle>
                    <CardDescription>View your current plan and manage your subscription.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderSubscriptionInfo() || (
                         <div className="flex items-center justify-between space-x-2">
                             <Label htmlFor="subscription-status" className="flex flex-col space-y-1">
                                <span>You are on the Free Plan</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Upgrade to unlock premium features or activate the freemium plan.
                                </span>
                            </Label>
                            <Button onClick={() => setSubscriptionModalOpen(true)}>
                                <Crown className="mr-2 h-4 w-4" />
                                Upgrade Now
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('appearanceTitle')}</CardTitle>
                    <CardDescription>{t('appearanceDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                            <span>{t('themeTitle')}</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                {t('themeDescription')}
                            </span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant={theme === 'light' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={theme === 'dark' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={theme === 'system' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* COLOURS ENGINE by ANM Studios - Premium Theme System */}
            <Card className="border-0 overflow-hidden relative bg-black/60">
                {/* Ultra Premium Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-900 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-transparent pointer-events-none" />
                
                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
                
                {/* Floating Orbs */}
                <div className="absolute top-10 right-20 w-32 h-32 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-cyan-500/25 to-blue-500/15 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
                
                <CardHeader className="relative pb-2">
                    {/* Engine Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            {/* Logo + Title Row */}
                            <div className="flex items-center gap-5">
                                {/* Premium Engine Logo */}
                                <div className="relative group">
                                    {/* Outer Glow Ring */}
                                    <div className="absolute -inset-3 rounded-2xl opacity-75 group-hover:opacity-100 transition-all duration-700" style={{
                                        background: 'conic-gradient(from 0deg, #8b5cf6, #06b6d4, #f472b6, #fbbf24, #8b5cf6)',
                                        filter: 'blur(12px)',
                                        animation: 'spin 8s linear infinite'
                                    }} />
                                    {/* Logo Container */}
                                    <div className="relative w-16 h-16 rounded-xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-500" style={{
                                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                                    }}>
                                        {/* Inner Glow */}
                                        <div className="absolute inset-0 rounded-xl" style={{
                                            background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.2), transparent 60%)'
                                        }} />
                                        <Aperture className="h-8 w-8 text-white relative z-10" style={{
                                            filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))',
                                            animation: 'spin 12s linear infinite'
                                        }} />
                                    </div>
                                    {/* Status Indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
                                        border: '2px solid #0a0a0a'
                                    }}>
                                        <Zap className="h-2.5 w-2.5 text-white" />
                                    </div>
                                </div>
                                
                                {/* Title Section */}
                                <div className="space-y-1">
                                    {/* Main Title - COLOURS ENGINE */}
                                    <h2 className="text-3xl font-black tracking-tight" style={{
                                        background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 25%, #94a3b8 50%, #cbd5e1 75%, #e2e8f0 100%)',
                                        backgroundSize: '200% auto',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'metallic-shine 3s linear infinite',
                                        textShadow: '0 0 30px rgba(148, 163, 184, 0.3)'
                                    }}>
                                        COLOURS ENGINE
                                    </h2>
                                    {/* Subtitle - By ANM Studios */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium tracking-widest" style={{
                                            background: 'linear-gradient(90deg, #a78bfa, #c4b5fd, #ddd6fe, #c4b5fd, #a78bfa)',
                                            backgroundSize: '200% auto',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            animation: 'metallic-shine 4s linear infinite',
                                            letterSpacing: '0.2em'
                                        }}>
                                            BY ANM STUDIOS
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-violet-400" />
                                        <span className="text-[9px] text-violet-400/60 font-mono">INTEGRATED</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Engine Info Bar */}
                            <div className="flex items-center gap-3 pl-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>ENGINE ACTIVE</span>
                                </div>
                                <div className="h-3 w-px bg-slate-700" />
                                <span className="text-[10px] text-slate-500 font-mono">GEMINI AI CORE</span>
                                <div className="h-3 w-px bg-slate-700" />
                                <span className="text-[10px] text-slate-500">REALTIME SYNC</span>
                            </div>
                        </div>
                        
                        {/* Right Side - Badges & Version */}
                        <div className="flex flex-col items-end gap-2">
                            {/* Version Badge - Premium */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition" />
                                <div className="relative px-3 py-1.5 rounded-lg flex items-center gap-2" style={{
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <Activity className="h-3 w-3 text-violet-400 animate-pulse" />
                                    <span className="text-[11px] font-bold font-mono" style={{
                                        background: 'linear-gradient(90deg, #c4b5fd, #e9d5ff)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>v ASGR7.95</span>
                                </div>
                            </div>
                            
                            {/* Status Badges */}
                            <div className="flex gap-1.5">
                                {/* Verified Badge */}
                                <div className="px-2 py-1 rounded-md flex items-center gap-1" style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                                    <span className="text-[8px] font-bold text-emerald-400 tracking-wider">VERIFIED</span>
                                </div>
                                {/* Premium Badge */}
                                <div className="px-2 py-1 rounded-md flex items-center gap-1" style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
                                    border: '1px solid rgba(251, 191, 36, 0.3)'
                                }}>
                                    <Crown className="h-2.5 w-2.5 text-amber-400" />
                                    <span className="text-[8px] font-bold text-amber-400 tracking-wider">ELITE</span>
                                </div>
                                {/* AI Badge */}
                                <div className="px-2 py-1 rounded-md flex items-center gap-1" style={{
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(8, 145, 178, 0.1))',
                                    border: '1px solid rgba(6, 182, 212, 0.3)'
                                }}>
                                    <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                                    <span className="text-[8px] font-bold text-cyan-400 tracking-wider">AI</span>
                                </div>
                            </div>
                            
                            {/* Power Indicator */}
                            <div className="flex items-center gap-1 mt-1">
                                <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map((i) => (
                                        <div key={i} className="w-1 rounded-full animate-pulse" style={{
                                            height: `${8 + i * 2}px`,
                                            background: i <= 4 ? 'linear-gradient(to top, #8b5cf6, #a78bfa)' : 'rgba(139, 92, 246, 0.3)',
                                            animationDelay: `${i * 0.1}s`
                                        }} />
                                    ))}
                                </div>
                                <span className="text-[8px] text-violet-400/60 ml-1">PWR</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Description Bar */}
                    <CardDescription className="mt-5 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                }}>
                                    <Palette className="h-3 w-3 text-violet-400" />
                                </div>
                                <span className="text-slate-400">20+ Themes</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-600" />
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.1))',
                                    border: '1px solid rgba(6, 182, 212, 0.2)'
                                }}>
                                    <Play className="h-3 w-3 text-cyan-400" />
                                </div>
                                <span className="text-slate-400">15+ Animations</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-600" />
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(236, 72, 153, 0.1))',
                                    border: '1px solid rgba(244, 114, 182, 0.2)'
                                }}>
                                    <Stars className="h-3 w-3 text-pink-400" />
                                </div>
                                <span className="text-slate-400">15+ Effects</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-600" />
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))',
                                    border: '1px solid rgba(251, 191, 36, 0.2)'
                                }}>
                                    <Atom className="h-3 w-3 text-amber-400" />
                                </div>
                                <span className="text-slate-400">AI Powered</span>
                            </div>
                        </div>
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 relative">
                    <Tabs defaultValue="create" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 p-1.5 rounded-xl backdrop-blur-sm" style={{
                            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.8), rgba(20, 20, 35, 0.9))',
                            border: '1px solid rgba(139, 92, 246, 0.1)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                        }}>
                            <TabsTrigger value="create" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-fuchsia-500/10 data-[state=active]:text-violet-300 data-[state=active]:border data-[state=active]:border-violet-500/30 rounded-lg text-xs transition-all">
                                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                                Create
                            </TabsTrigger>
                            <TabsTrigger value="presets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/10 data-[state=active]:text-amber-300 data-[state=active]:border data-[state=active]:border-amber-500/30 rounded-lg text-xs transition-all">
                                <Layers className="h-3.5 w-3.5 mr-1.5" />
                                Gallery
                            </TabsTrigger>
                            <TabsTrigger value="animations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:text-pink-400 rounded-lg text-xs">
                                <Stars className="h-3.5 w-3.5 mr-1.5" />
                                Effects
                            </TabsTrigger>
                            <TabsTrigger value="saved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-500/20 data-[state=active]:text-emerald-400 rounded-lg text-xs">
                                <Heart className="h-3.5 w-3.5 mr-1.5" />
                                Saved
                            </TabsTrigger>
                            <TabsTrigger value="tools" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-blue-400 rounded-lg text-xs">
                                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                                Tools
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="create" className="space-y-6 mt-4">
                            {/* AI Generation Section - Enhanced with Prompt */}
                            <div className="rounded-xl p-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                            <Atom className="h-5 w-5 text-white animate-spin" style={{ animationDuration: '3s' }} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                AI Theme Generator
                                                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">GEMINI AI</span>
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground">Full UI access • Auto-save to localStorage</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* AI Prompt Input */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Describe your theme (e.g., "cyberpunk neon", "ocean sunset", "minimal dark")</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="Type your theme idea..."
                                            className="bg-black/30 flex-1"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && aiPrompt.trim()) {
                                                    autoGenerateTheme(aiPrompt);
                                                }
                                            }}
                                        />
                                        <Button 
                                            onClick={() => autoGenerateTheme(aiPrompt)}
                                            disabled={isGenerating || !aiPrompt.trim()}
                                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                                        >
                                            {isGenerating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Quick Generate Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {['Cyberpunk', 'Ocean', 'Sunset', 'Nature', 'Neon', 'Minimal', 'Luxury', 'Gaming'].map((style) => (
                                        <Button
                                            key={style}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setAiPrompt(style.toLowerCase());
                                                autoGenerateTheme(style.toLowerCase());
                                            }}
                                            disabled={isGenerating}
                                            className="text-xs border-primary/20 hover:bg-primary/10"
                                        >
                                            {style}
                                        </Button>
                                    ))}
                                </div>
                                
                                {/* From Primary Button */}
                                <div className="flex gap-2 pt-2 border-t border-white/5">
                                    <Button 
                                        onClick={() => autoGenerateTheme()}
                                        disabled={isGenerating}
                                        variant="outline"
                                        className="flex-1 border-primary/30"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Wand2 className="h-4 w-4 mr-2" />
                                        )}
                                        {isGenerating ? 'Generating...' : 'Generate from Primary Color'}
                                    </Button>
                                    <Button 
                                        onClick={generateRandomTheme}
                                        disabled={isGenerating}
                                        variant="outline"
                                        className="border-primary/30"
                                    >
                                        <Shuffle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Theme Name */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <CircleDot className="h-4 w-4 text-primary" />
                                        Theme Name
                                    </Label>
                                </div>
                                <Input 
                                    value={customTheme.name}
                                    onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="My Custom Theme"
                                    className="bg-black/30"
                                />
                            </div>
                            
                            {/* Color Pickers - Enhanced Grid */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-sm">
                                    <Palette className="h-4 w-4 text-primary" />
                                    Color Palette
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { key: 'primary', label: 'Primary', desc: 'Main brand color', icon: '●' },
                                        { key: 'secondary', label: 'Secondary', desc: 'Supporting color', icon: '◐' },
                                        { key: 'accent', label: 'Accent', desc: 'Highlights & focus', icon: '★' },
                                        { key: 'background', label: 'Background', desc: 'App background', icon: '▣' },
                                        { key: 'foreground', label: 'Foreground', desc: 'Text color', icon: 'A' },
                                        { key: 'card', label: 'Card', desc: 'Card surfaces', icon: '▢' },
                                        { key: 'border', label: 'Border', desc: 'Lines & dividers', icon: '─' },
                                        { key: 'muted', label: 'Muted', desc: 'Subtle elements', icon: '◌' },
                                        { key: 'destructive', label: 'Destructive', desc: 'Error states', icon: '⚠' },
                                    ].map(({ key, label, desc, icon }) => (
                                        <div key={key} className="group relative rounded-xl p-3 bg-black/20 border border-white/5 hover:border-primary/30 transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="relative">
                                                    <input 
                                                        type="color"
                                                        value={(customTheme as any)[key]}
                                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, [key]: e.target.value }))}
                                                        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-white/10 hover:border-primary/50 transition-colors"
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs pointer-events-none drop-shadow-lg">{icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-foreground">{label}</p>
                                                    <p className="text-[9px] text-muted-foreground truncate">{desc}</p>
                                                </div>
                                            </div>
                                            <Input 
                                                value={(customTheme as any)[key]}
                                                onChange={(e) => setCustomTheme(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="h-7 text-[10px] font-mono bg-black/30 border-white/5"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Enhanced Live Preview */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" /> 
                                    Live Preview
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded ml-auto">REAL-TIME</span>
                                </Label>
                                <div 
                                    className="rounded-2xl p-5 border-2 shadow-2xl"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${customTheme.background} 0%, ${customTheme.card} 100%)`,
                                        borderColor: customTheme.border
                                    }}
                                >
                                    <div 
                                        className="rounded-xl p-4 space-y-4 backdrop-blur-sm"
                                        style={{ background: `${customTheme.card}dd`, border: `1px solid ${customTheme.border}` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 style={{ color: customTheme.foreground }} className="font-bold text-lg">Preview Card</h3>
                                            <span 
                                                className="text-[10px] px-2 py-0.5 rounded-full"
                                                style={{ background: `${customTheme.primary}30`, color: customTheme.primary }}
                                            >
                                                ANM Studios
                                            </span>
                                        </div>
                                        <p style={{ color: customTheme.muted }} className="text-sm">Experience your theme in action. Every color you pick reflects here instantly.</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
                                                style={{ background: customTheme.primary, boxShadow: `0 4px 14px ${customTheme.primary}40` }}
                                            >
                                                Primary
                                            </button>
                                            <button 
                                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:scale-105"
                                                style={{ background: customTheme.secondary }}
                                            >
                                                Secondary
                                            </button>
                                            <button 
                                                className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105"
                                                style={{ background: customTheme.accent, color: customTheme.background }}
                                            >
                                                Accent
                                            </button>
                                            <button 
                                                className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105"
                                                style={{ background: customTheme.destructive, color: 'white' }}
                                            >
                                                Danger
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: customTheme.border }}>
                                            <div className="w-8 h-8 rounded-full" style={{ background: customTheme.primary }} />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium" style={{ color: customTheme.foreground }}>Sample User</p>
                                                <p className="text-[10px]" style={{ color: customTheme.muted }}>Designer at ANM Studios</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Enhanced Actions */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                <Button onClick={() => applyTheme(customTheme)} className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Apply Theme
                                </Button>
                                <Button onClick={saveCurrentTheme} variant="outline" className="border-primary/30 hover:bg-primary/10">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                                <Button onClick={resetToDefault} variant="ghost" className="hover:bg-destructive/10 hover:text-destructive">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </TabsContent>
                        
                        {/* Enhanced Gallery Tab with Categories */}
                        <TabsContent value="presets" className="mt-4 space-y-6">
                            {Object.entries(presetThemeCollections).map(([category, themes]) => (
                                <div key={category} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold capitalize flex items-center gap-2">
                                            {category === 'signature' && <Gem className="h-4 w-4 text-primary" />}
                                            {category === 'premium' && <Crown className="h-4 w-4 text-amber-400" />}
                                            {category === 'exclusive' && <Sparkles className="h-4 w-4 text-purple-400" />}
                                            {category} Collection
                                        </h4>
                                        <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded">{themes.length} themes</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {themes.map((preset, idx) => {
                                            const IconComponent = preset.icon;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setCustomTheme({ ...preset, name: preset.name });
                                                        applyTheme(preset as any);
                                                        toast({ title: "🎨 Theme Applied", description: `"${preset.name}" from ${category} collection.` });
                                                    }}
                                                    className="group relative rounded-xl p-3 border border-white/10 hover:border-primary/50 hover:scale-[1.02] transition-all text-left overflow-hidden"
                                                    style={{ background: `linear-gradient(135deg, ${preset.background}, ${preset.card})` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex gap-1">
                                                                {[preset.primary, preset.secondary, preset.accent].map((color, i) => (
                                                                    <div 
                                                                        key={i}
                                                                        className="w-4 h-4 rounded-full border border-white/20 shadow-lg"
                                                                        style={{ background: color }}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <IconComponent className="h-4 w-4 opacity-50" style={{ color: preset.foreground }} />
                                                        </div>
                                                        <p className="text-xs font-semibold" style={{ color: preset.foreground }}>{preset.name}</p>
                                                        <p className="text-[9px] opacity-60" style={{ color: preset.foreground }}>ANM Studios</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                        
                        {/* Enhanced Saved Themes Tab */}
                        <TabsContent value="saved" className="mt-4">
                            {savedThemes.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Heart className="h-8 w-8 text-primary/50" />
                                    </div>
                                    <p className="font-medium">No saved themes yet</p>
                                    <p className="text-sm mt-1">Create your first masterpiece!</p>
                                    <Button 
                                        variant="outline" 
                                        className="mt-4 border-primary/30"
                                        onClick={() => {
                                            const tabsList = document.querySelector('[value="create"]');
                                            if (tabsList) (tabsList as HTMLElement).click();
                                        }}
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Start Creating
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {savedThemes.map((savedTheme) => (
                                        <div
                                            key={savedTheme.id}
                                            className={cn(
                                                "relative rounded-xl p-3 border transition-all group",
                                                activeThemeId === savedTheme.id 
                                                    ? "border-primary ring-2 ring-primary/30" 
                                                    : "border-white/10 hover:border-white/20"
                                            )}
                                            style={{ background: `linear-gradient(135deg, ${savedTheme.background}, ${savedTheme.card})` }}
                                        >
                                            <div className="flex gap-1 mb-2">
                                                {[savedTheme.primary, savedTheme.secondary, savedTheme.accent].map((color: string, i: number) => (
                                                    <div 
                                                        key={i}
                                                        className="w-4 h-4 rounded-full border border-white/20 shadow-lg"
                                                        style={{ background: color }}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs font-semibold mb-2" style={{ color: savedTheme.foreground }}>{savedTheme.name}</p>
                                            <div className="flex gap-1">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-7 text-xs flex-1 hover:bg-primary/20"
                                                    onClick={() => loadTheme(savedTheme)}
                                                >
                                                    Apply
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-7 text-xs hover:bg-primary/20"
                                                    onClick={() => exportTheme(savedTheme)}
                                                >
                                                    <Download className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteTheme(savedTheme.id)}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                            {activeThemeId === savedTheme.id && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="text-[10px] bg-gradient-to-r from-primary to-purple-600 text-white px-2 py-0.5 rounded-full shadow-lg">Active</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        
                        {/* Animations & Effects Tab */}
                        <TabsContent value="animations" className="mt-4 space-y-6">
                            {/* Background Effects Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                        <Stars className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold">Background Effects</h4>
                                        <p className="text-[10px] text-muted-foreground">Particles, dust & ambient effects</p>
                                    </div>
                                    <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">ALWAYS ON</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/70 -mt-1">🌟 Ye effects hamesha background mein chalte rahenge</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {/* None */}
                                    <button
                                        onClick={() => applyEffect('none')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'none'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-gray-700/30 to-gray-800/30 flex items-center justify-center">
                                            <Circle className="h-6 w-6 text-gray-500" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">None</p>
                                        {selectedEffect === 'none' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Particles - Floating dots */}
                                    <button
                                        onClick={() => applyEffect('particles')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'particles'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-violet-900/50 to-purple-900/50 overflow-hidden">
                                            <div className="absolute w-1.5 h-1.5 rounded-full bg-violet-400 animate-float" style={{ left: '20%', top: '30%' }} />
                                            <div className="absolute w-1 h-1 rounded-full bg-purple-400 animate-float" style={{ left: '60%', top: '50%', animationDelay: '0.5s' }} />
                                            <div className="absolute w-2 h-2 rounded-full bg-fuchsia-400 animate-float" style={{ left: '75%', top: '20%', animationDelay: '1s' }} />
                                            <div className="absolute w-1 h-1 rounded-full bg-violet-300 animate-float" style={{ left: '40%', top: '70%', animationDelay: '1.5s' }} />
                                            <Stars className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-violet-300/50" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Particles</p>
                                        {selectedEffect === 'particles' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Stardust - Sparkling stars */}
                                    <button
                                        onClick={() => applyEffect('stardust')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'stardust'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-indigo-900/60 to-slate-900/60 overflow-hidden">
                                            <div className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-pulse" style={{ left: '15%', top: '25%', animationDuration: '1s' }} />
                                            <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ left: '45%', top: '35%', animationDuration: '1.5s' }} />
                                            <div className="absolute w-1.5 h-1.5 bg-yellow-100 rounded-full animate-pulse" style={{ left: '70%', top: '20%', animationDuration: '0.8s' }} />
                                            <div className="absolute w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse" style={{ left: '80%', top: '60%', animationDuration: '2s' }} />
                                            <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ left: '30%', top: '65%', animationDuration: '1.2s' }} />
                                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-yellow-200/60" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Stardust</p>
                                        {selectedEffect === 'stardust' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Aurora - Northern lights */}
                                    <button
                                        onClick={() => applyEffect('aurora')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'aurora'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg overflow-hidden bg-slate-900">
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 via-violet-500/40 to-pink-500/40 animate-gradient-shift blur-sm" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-green-400/20 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
                                            <Rainbow className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white/70 z-10" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Aurora</p>
                                        {selectedEffect === 'aurora' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Matrix - Digital rain */}
                                    <button
                                        onClick={() => applyEffect('matrix')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'matrix'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-black overflow-hidden">
                                            <div className="absolute text-[6px] font-mono text-green-500/70 leading-none animate-bounce-soft" style={{ left: '10%', top: '-5%', animationDuration: '2s' }}>01</div>
                                            <div className="absolute text-[6px] font-mono text-green-400/80 leading-none animate-bounce-soft" style={{ left: '30%', top: '10%', animationDuration: '1.5s', animationDelay: '0.3s' }}>10</div>
                                            <div className="absolute text-[6px] font-mono text-green-500/60 leading-none animate-bounce-soft" style={{ left: '55%', top: '-10%', animationDuration: '2.5s', animationDelay: '0.7s' }}>11</div>
                                            <div className="absolute text-[6px] font-mono text-green-300/90 leading-none animate-bounce-soft" style={{ left: '75%', top: '5%', animationDuration: '1.8s', animationDelay: '1s' }}>00</div>
                                            <Atom className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-green-500/50" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Matrix</p>
                                        {selectedEffect === 'matrix' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Bubbles - Rising bubbles */}
                                    <button
                                        onClick={() => applyEffect('bubbles')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'bubbles'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-t from-blue-900/60 to-cyan-900/40 overflow-hidden">
                                            <div className="absolute w-3 h-3 rounded-full border border-white/30 bg-white/10 animate-float" style={{ left: '20%', bottom: '-10%', animationDuration: '3s' }} />
                                            <div className="absolute w-2 h-2 rounded-full border border-white/20 bg-white/5 animate-float" style={{ left: '50%', bottom: '-5%', animationDuration: '2.5s', animationDelay: '0.5s' }} />
                                            <div className="absolute w-4 h-4 rounded-full border border-white/25 bg-white/10 animate-float" style={{ left: '70%', bottom: '-15%', animationDuration: '4s', animationDelay: '1s' }} />
                                            <Circle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300/50" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Bubbles</p>
                                        {selectedEffect === 'bubbles' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Snow - Falling snowflakes */}
                                    <button
                                        onClick={() => applyEffect('snow')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'snow'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-b from-slate-800/60 to-blue-900/60 overflow-hidden">
                                            <div className="absolute text-[8px] text-white/80 animate-bounce-soft" style={{ left: '15%', top: '-5%', animationDuration: '2s' }}>❄</div>
                                            <div className="absolute text-[6px] text-white/60 animate-bounce-soft" style={{ left: '40%', top: '10%', animationDuration: '2.5s', animationDelay: '0.5s' }}>❄</div>
                                            <div className="absolute text-[7px] text-white/70 animate-bounce-soft" style={{ left: '65%', top: '-10%', animationDuration: '3s', animationDelay: '1s' }}>❄</div>
                                            <div className="absolute text-[5px] text-white/50 animate-bounce-soft" style={{ left: '80%', top: '5%', animationDuration: '2.2s', animationDelay: '1.5s' }}>❄</div>
                                            <Snowflake className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Snow</p>
                                        {selectedEffect === 'snow' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Fireflies - Glowing dots */}
                                    <button
                                        onClick={() => applyEffect('fireflies')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'fireflies'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-emerald-950/70 to-slate-900/70 overflow-hidden">
                                            <div className="absolute w-2 h-2 rounded-full bg-yellow-300 shadow-lg shadow-yellow-300/80 animate-pulse" style={{ left: '25%', top: '30%', animationDuration: '1.5s' }} />
                                            <div className="absolute w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-lg shadow-yellow-200/80 animate-pulse" style={{ left: '60%', top: '50%', animationDuration: '2s', animationDelay: '0.5s' }} />
                                            <div className="absolute w-1 h-1 rounded-full bg-amber-300 shadow-lg shadow-amber-300/80 animate-pulse" style={{ left: '70%', top: '25%', animationDuration: '1.8s', animationDelay: '1s' }} />
                                            <Flame className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400/40" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Fireflies</p>
                                        {selectedEffect === 'fireflies' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Confetti */}
                                    <button
                                        onClick={() => applyEffect('confetti')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'confetti'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-pink-900/40 to-purple-900/40 overflow-hidden">
                                            <div className="absolute w-1.5 h-1.5 bg-red-400 rotate-45 animate-bounce-soft" style={{ left: '15%', top: '-5%', animationDuration: '1.5s' }} />
                                            <div className="absolute w-1 h-2 bg-yellow-400 animate-bounce-soft" style={{ left: '35%', top: '0%', animationDuration: '2s', animationDelay: '0.3s' }} />
                                            <div className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce-soft" style={{ left: '55%', top: '-10%', animationDuration: '1.8s', animationDelay: '0.6s' }} />
                                            <div className="absolute w-1 h-1.5 bg-green-400 animate-bounce-soft" style={{ left: '75%', top: '5%', animationDuration: '2.2s', animationDelay: '0.9s' }} />
                                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">🎉</span>
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Confetti</p>
                                        {selectedEffect === 'confetti' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Smoke */}
                                    <button
                                        onClick={() => applyEffect('smoke')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'smoke'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-gradient-to-t from-gray-900/70 to-slate-800/50 overflow-hidden">
                                            <div className="absolute w-6 h-6 rounded-full bg-gray-400/20 blur-sm animate-float" style={{ left: '30%', bottom: '10%', animationDuration: '4s' }} />
                                            <div className="absolute w-8 h-8 rounded-full bg-gray-500/15 blur-md animate-float" style={{ left: '45%', bottom: '5%', animationDuration: '5s', animationDelay: '1s' }} />
                                            <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400/50" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Smoke</p>
                                        {selectedEffect === 'smoke' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Grid Pulse */}
                                    <button
                                        onClick={() => applyEffect('grid-pulse')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'grid-pulse'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-slate-950 overflow-hidden">
                                            <div 
                                                className="absolute inset-0 animate-pulse"
                                                style={{ 
                                                    backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
                                                    backgroundSize: '8px 8px',
                                                    animationDuration: '2s'
                                                }} 
                                            />
                                            <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/50" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Grid</p>
                                        {selectedEffect === 'grid-pulse' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Film Grain / Noise */}
                                    <button
                                        onClick={() => applyEffect('noise')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'noise'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-amber-950/40 overflow-hidden">
                                            <div 
                                                className="absolute inset-0 opacity-50"
                                                style={{ 
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                                                }} 
                                            />
                                            <Image className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-amber-300/60" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Grain</p>
                                        {selectedEffect === 'noise' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Spotlight */}
                                    <button
                                        onClick={() => applyEffect('spotlight')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'spotlight'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-slate-950 overflow-hidden">
                                            <div 
                                                className="absolute w-12 h-12 rounded-full animate-pulse"
                                                style={{ 
                                                    background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)',
                                                    left: '20%',
                                                    top: '10%',
                                                    animationDuration: '2s'
                                                }} 
                                            />
                                            <Target className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Spotlight</p>
                                        {selectedEffect === 'spotlight' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Wave Lines */}
                                    <button
                                        onClick={() => applyEffect('waves-bg')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'waves-bg'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-indigo-950/60 overflow-hidden">
                                            <div className="absolute inset-0 flex flex-col justify-center gap-1">
                                                <div className="h-0.5 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent animate-wave" style={{ animationDuration: '2s' }} />
                                                <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent animate-wave" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                                                <div className="h-0.5 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent animate-wave" style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
                                            </div>
                                            <Waves className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300/40" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Waves</p>
                                        {selectedEffect === 'waves-bg' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                    
                                    {/* Meteor */}
                                    <button
                                        onClick={() => applyEffect('meteor')}
                                        className={cn(
                                            "relative rounded-xl p-3 border text-center transition-all overflow-hidden h-20",
                                            selectedEffect === 'meteor'
                                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                                                : "border-white/10 bg-black/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-lg bg-slate-950 overflow-hidden">
                                            <div 
                                                className="absolute w-8 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent rotate-45 animate-float"
                                                style={{ left: '-10%', top: '20%', animationDuration: '2s' }} 
                                            />
                                            <div 
                                                className="absolute w-6 h-0.5 bg-gradient-to-r from-transparent via-white/70 to-transparent rotate-45 animate-float"
                                                style={{ left: '30%', top: '40%', animationDuration: '2.5s', animationDelay: '0.8s' }} 
                                            />
                                            <Rocket className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-orange-400/60 rotate-45" />
                                        </div>
                                        <p className="absolute bottom-1 left-0 right-0 text-[9px] font-medium">Meteor</p>
                                        {selectedEffect === 'meteor' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Effect Controls */}
                            <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 space-y-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-cyan-400" />
                                    Effect Controls
                                </h4>
                                <div className="space-y-2">
                                    <Label className="text-xs flex items-center justify-between">
                                        Effect Intensity
                                        <span className="text-muted-foreground">{effectIntensity}%</span>
                                    </Label>
                                    <Slider
                                        value={[effectIntensity]}
                                        onValueChange={(v) => setEffectIntensity(v[0])}
                                        min={10}
                                        max={100}
                                        step={5}
                                        className="[&_[role=slider]]:bg-cyan-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 border-cyan-500/30"
                                        onClick={() => {
                                            setSelectedEffect('none');
                                            localStorage.removeItem('anm-effect');
                                            toast({ title: "Effects Cleared", description: "Background effect has been disabled." });
                                        }}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600"
                                        onClick={() => {
                                            localStorage.setItem('anm-effect', selectedEffect);
                                            localStorage.setItem('anm-intensity', effectIntensity.toString());
                                            toast({ title: "✨ Saved!", description: "Your effect settings have been saved." });
                                        }}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Settings
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Live Preview - Shows background effects */}
                            <div className="rounded-xl p-4 bg-black/30 border border-white/10 space-y-3">
                                <Label className="text-xs flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" /> 
                                    Live Preview
                                    <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">REAL-TIME</span>
                                </Label>
                                
                                {/* Preview Container with Background Effect */}
                                <div 
                                    className={cn(
                                        "relative rounded-2xl p-6 border-2 overflow-hidden min-h-[200px]",
                                        selectedEffect === 'particles' && 'effect-particles',
                                        selectedEffect === 'stardust' && 'effect-stardust',
                                        selectedEffect === 'aurora' && 'effect-aurora',
                                        selectedEffect === 'matrix' && 'effect-matrix',
                                        selectedEffect === 'bubbles' && 'effect-bubbles',
                                        selectedEffect === 'snow' && 'effect-snow',
                                        selectedEffect === 'fireflies' && 'effect-fireflies',
                                        selectedEffect === 'confetti' && 'effect-confetti',
                                        selectedEffect === 'smoke' && 'effect-smoke',
                                        selectedEffect === 'grid-pulse' && 'effect-grid-pulse',
                                        selectedEffect === 'noise' && 'effect-noise',
                                        selectedEffect === 'spotlight' && 'effect-spotlight',
                                        selectedEffect === 'waves-bg' && 'effect-waves',
                                        selectedEffect === 'meteor' && 'effect-meteor',
                                    )}
                                    style={{ 
                                        background: `linear-gradient(135deg, ${customTheme.background} 0%, ${customTheme.card} 100%)`,
                                        borderColor: customTheme.border,
                                        ['--anm-intensity' as any]: effectIntensity / 100,
                                    }}
                                >
                                    {/* Preview Card */}
                                    <div 
                                        className="relative rounded-xl p-4 border backdrop-blur-sm transition-all"
                                        style={{ 
                                            background: `${customTheme.card}dd`,
                                            borderColor: customTheme.border,
                                            color: customTheme.primary,
                                        }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div 
                                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                                                style={{ 
                                                    background: `linear-gradient(135deg, ${customTheme.primary}, ${customTheme.secondary})`,
                                                    boxShadow: `0 4px 20px ${customTheme.primary}40`
                                                }}
                                            >
                                                <Sparkles className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold" style={{ color: customTheme.foreground }}>Preview Card</p>
                                                <p className="text-xs" style={{ color: customTheme.muted }}>
                                                    {selectedEffect !== 'none' ? effectPresets.find(e => e.id === selectedEffect)?.name : 'No effect selected'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm mb-3" style={{ color: customTheme.muted }}>
                                            This preview shows your selected background effect in real-time.
                                        </p>
                                        <div className="flex gap-2">
                                            <span 
                                                className="px-3 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: customTheme.primary, color: 'white' }}
                                            >
                                                Primary
                                            </span>
                                            <span 
                                                className="px-3 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: customTheme.secondary, color: 'white' }}
                                            >
                                                Secondary
                                            </span>
                                            <span 
                                                className="px-3 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: customTheme.accent, color: customTheme.background }}
                                            >
                                                Accent
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Floating particles for visual effect */}
                                    {selectedEffect !== 'none' && (
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            {[...Array(10)].map((_, i) => (
                                                <div 
                                                    key={i}
                                                    className="absolute w-2 h-2 rounded-full animate-float opacity-60"
                                                    style={{
                                                        background: customTheme.primary,
                                                        left: `${Math.random() * 100}%`,
                                                        top: `${Math.random() * 100}%`,
                                                        animationDelay: `${i * 0.3}s`,
                                                        animationDuration: `${3 + Math.random() * 4}s`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Effect Info */}
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                                    <span>Effect: <span className="text-cyan-400">{effectPresets.find(e => e.id === selectedEffect)?.name || 'None'}</span></span>
                                    <span>Intensity: <span className="text-purple-400">{effectIntensity}%</span></span>
                                </div>
                            </div>
                        </TabsContent>
                        
                        {/* New Tools Tab */}
                        <TabsContent value="tools" className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Export Current Theme */}
                                <div className="rounded-xl p-4 bg-black/20 border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Download className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Export Theme</p>
                                            <p className="text-[10px] text-muted-foreground">Download as JSON file</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full border-primary/30"
                                        onClick={() => exportTheme(customTheme)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Current Theme
                                    </Button>
                                </div>
                                
                                {/* Import Theme */}
                                <div className="rounded-xl p-4 bg-black/20 border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <Upload className="h-4 w-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Import Theme</p>
                                            <p className="text-[10px] text-muted-foreground">Load from JSON file</p>
                                        </div>
                                    </div>
                                    <label className="block">
                                        <input 
                                            type="file" 
                                            accept=".json" 
                                            onChange={importTheme}
                                            className="hidden"
                                        />
                                        <Button variant="outline" size="sm" className="w-full border-emerald-500/30 cursor-pointer" asChild>
                                            <span>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Import Theme File
                                            </span>
                                        </Button>
                                    </label>
                                </div>
                                
                                {/* Copy to Clipboard */}
                                <div className="rounded-xl p-4 bg-black/20 border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Copy className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Copy Code</p>
                                            <p className="text-[10px] text-muted-foreground">Copy theme as JSON</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full border-blue-500/30"
                                        onClick={copyThemeToClipboard}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy to Clipboard
                                    </Button>
                                </div>
                                
                                {/* Auto Generate */}
                                <div className="rounded-xl p-4 bg-black/20 border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <Wand2 className="h-4 w-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">AI Generate</p>
                                            <p className="text-[10px] text-muted-foreground">Auto-generate from primary</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full border-purple-500/30"
                                        onClick={autoGenerateTheme}
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate Theme
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Stats Section */}
                            <div className="rounded-xl p-4 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Gem className="h-4 w-4 text-primary" />
                                        Theme Stats
                                    </p>
                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">ANM Studios</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{savedThemes.length}</p>
                                        <p className="text-[10px] text-muted-foreground">Saved</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-amber-400">{presetThemes.length}</p>
                                        <p className="text-[10px] text-muted-foreground">Presets</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-emerald-400">∞</p>
                                        <p className="text-[10px] text-muted-foreground">Possible</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="text-center pt-4 border-t border-white/5">
                                <div className="flex items-center justify-center gap-2">
                                    <Aperture className="h-3 w-3 text-violet-400" style={{ animation: 'spin 8s linear infinite' }} />
                                    <p className="text-[10px] font-medium" style={{
                                        background: 'linear-gradient(90deg, #94a3b8, #cbd5e1, #e2e8f0, #cbd5e1, #94a3b8)',
                                        backgroundSize: '200% auto',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'metallic-shine 4s linear infinite'
                                    }}>
                                        COLOURS ENGINE
                                    </p>
                                    <span className="text-[10px] text-slate-500">•</span>
                                    <p className="text-[10px]" style={{
                                        background: 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        BY ANM STUDIOS
                                    </p>
                                    <span className="text-[10px] text-slate-500">•</span>
                                    <span className="text-[10px] text-slate-500 font-mono">v ASGR7.95</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />{t('accountTitle')}</CardTitle>
                    <CardDescription>{t('accountDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="google-auth" className="flex flex-col space-y-1">
                            <span>Account Status</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                {user ? `${t('signedInAs', { email: user.email || '' })}` : "You are not signed in."}
                            </span>
                        </Label>
                        {user ? (
                            <Button variant="outline" onClick={signOut}> <LogOut className="mr-2 h-4 w-4" /> {t('signOut')}</Button>
                        ) : (
                           <Button variant="outline" id="google-auth" onClick={signInWithGoogle} disabled={!isFirebaseConfigured}>
                                <GoogleIcon className="mr-2"/>
                                {t('signInWithGoogle')}
                            </Button>
                        )}
                    </div>
                    
                    {user && (
                        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                            <div className="text-sm font-medium">Account Details</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Plan</div>
                                    <div className="font-medium capitalize">{subscription.status === 'active' ? `Premium ${subscription.plan}` : subscription.status}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Member Since</div>
                                    <div className="font-medium">{user.metadata?.creationTime ? format(new Date(user.metadata.creationTime), 'MMM yyyy') : 'N/A'}</div>
                                </div>
                                {subscription.status === 'active' && subscription.expiryDate && (
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground">Valid Until</div>
                                        <div className="font-medium">{format(new Date(subscription.expiryDate), 'PPP')}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Document Generation Settings</CardTitle>
                    <CardDescription>Customize how your documents are generated and optimized</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-compression" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            PDF Compression Level
                        </Label>
                        <Select value={pdfCompression} onValueChange={(v) => handleDocSettingChange('pdfCompression', v)}>
                            <SelectTrigger id="pdf-compression">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Highest Quality)</SelectItem>
                                <SelectItem value="low">Low (Large Size)</SelectItem>
                                <SelectItem value="medium">Medium (Balanced) ⭐</SelectItem>
                                <SelectItem value="high">High (Smaller Size)</SelectItem>
                                <SelectItem value="maximum">Maximum (Smallest Size)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Higher compression = smaller file size but slightly lower quality</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max-size" className="flex items-center gap-2">
                            <Maximize2 className="h-4 w-4" />
                            Max Download Size: {maxDownloadSize} MB
                        </Label>
                        <Slider
                            id="max-size"
                            value={[maxDownloadSize]}
                            onValueChange={(v) => handleDocSettingChange('maxDownloadSize', v[0])}
                            min={1}
                            max={50}
                            step={1}
                        />
                        <p className="text-xs text-muted-foreground">Limit maximum file size for downloads (1-50 MB)</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-optimize" className="flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                Auto-Optimize Images
                            </Label>
                            <p className="text-xs text-muted-foreground">Automatically compress images in PDFs</p>
                        </div>
                        <Switch
                            id="auto-optimize"
                            checked={autoOptimize}
                            onCheckedChange={(v) => handleDocSettingChange('autoOptimize', v)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="page-size">Default Page Size</Label>
                            <Select value={defaultPageSize} onValueChange={(v) => handleDocSettingChange('defaultPageSize', v)}>
                                <SelectTrigger id="page-size">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                                    <SelectItem value="A3">A3 (297×420mm)</SelectItem>
                                    <SelectItem value="Letter">Letter (8.5×11")</SelectItem>
                                    <SelectItem value="Legal">Legal (8.5×14")</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="orientation">Orientation</Label>
                            <Select value={defaultOrientation} onValueChange={(v) => handleDocSettingChange('defaultOrientation', v)}>
                                <SelectTrigger id="orientation">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                    <SelectItem value="landscape">Landscape</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="embed-fonts" className="flex items-center gap-2">
                                <FileType className="h-4 w-4" />
                                Embed Fonts in PDF
                            </Label>
                            <p className="text-xs text-muted-foreground">Ensures consistent appearance across devices</p>
                        </div>
                        <Switch
                            id="embed-fonts"
                            checked={embedFonts}
                            onCheckedChange={(v) => handleDocSettingChange('embedFonts', v)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color-mode" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Color Mode
                        </Label>
                        <Select value={colorMode} onValueChange={(v) => handleDocSettingChange('colorMode', v)}>
                            <SelectTrigger id="color-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RGB">RGB (Screen Display)</SelectItem>
                                <SelectItem value="CMYK">CMYK (Professional Print)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Use CMYK for professional printing, RGB for digital</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('accountTitle')}</CardTitle>
                    <CardDescription>{t('accountDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="google-auth" className="flex flex-col space-y-1">
                            <span>Account Status</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                {user ? `${t('signedInAs', { email: user.email || '' })}` : "You are not signed in."}
                            </span>
                        </Label>
                        {user ? (
                            <Button variant="outline" onClick={signOut}> <LogOut className="mr-2 h-4 w-4" /> {t('signOut')}</Button>
                        ) : (
                           <Button variant="outline" id="google-auth" onClick={signInWithGoogle} disabled={!isFirebaseConfigured}>
                                <GoogleIcon className="mr-2"/>
                                {t('signInWithGoogle')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('languageRegionTitle')}</CardTitle>
                    <CardDescription>{t('languageRegionDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between space-x-2">
                         <Label htmlFor="language" className="flex-1">
                            {t('appLanguage')}
                        </Label>
                        <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-[200px]" id="language">
                                <SelectValue placeholder={t('selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English (United States)</SelectItem>
                                <SelectItem value="hi">हिन्दी (भारत)</SelectItem>
                                <SelectItem value="es">Español (España)</SelectItem>
                                <SelectItem value="fr">Français (France)</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('aboutTitle')}</CardTitle>
                    <CardDescription>{t('aboutDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="help-center">
                            {t('helpCenterTitle')}
                        </Label>
                        <Button variant="outline" id="help-center" asChild>
                            <a href="https://wa.me/916207885443" target="_blank" rel="noopener noreferrer">{t('helpCenterButton')}</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <SubscriptionModal isOpen={isSubscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} />
            
            {/* AI Generated Theme Preview Popup */}
            {showAiPreview && aiGeneratedPreview && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl border border-white/20 p-6 max-w-md w-full shadow-2xl shadow-purple-500/20">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">🤖 AI Generated Theme</h3>
                                <p className="text-sm text-gray-400">{aiGeneratedPreview.name}</p>
                            </div>
                            <button 
                                onClick={() => setShowAiPreview(false)}
                                className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                        
                        {/* Color Palette Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {[
                                { key: 'primary', label: 'Primary' },
                                { key: 'secondary', label: 'Secondary' },
                                { key: 'accent', label: 'Accent' },
                                { key: 'background', label: 'BG' },
                                { key: 'foreground', label: 'Text' },
                                { key: 'card', label: 'Card' },
                                { key: 'border', label: 'Border' },
                                { key: 'muted', label: 'Muted' },
                                { key: 'destructive', label: 'Error' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex flex-col items-center gap-1">
                                    <div 
                                        className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-lg"
                                        style={{ backgroundColor: aiGeneratedPreview[key] }}
                                    />
                                    <span className="text-[8px] text-gray-400 font-medium">{label}</span>
                                    <span className="text-[7px] text-gray-500">{aiGeneratedPreview[key]}</span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Live Preview Card */}
                        <div 
                            className="rounded-2xl p-4 mb-6 border"
                            style={{ 
                                backgroundColor: aiGeneratedPreview.card,
                                borderColor: aiGeneratedPreview.border
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div 
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: aiGeneratedPreview.primary }}
                                >
                                    <Palette className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: aiGeneratedPreview.foreground }}>
                                        Preview Card
                                    </p>
                                    <p className="text-xs" style={{ color: aiGeneratedPreview.muted }}>
                                        See how it looks
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs"
                                    style={{ backgroundColor: aiGeneratedPreview.primary, color: 'white' }}
                                >
                                    Primary
                                </span>
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs"
                                    style={{ backgroundColor: aiGeneratedPreview.secondary, color: 'white' }}
                                >
                                    Secondary
                                </span>
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs"
                                    style={{ backgroundColor: aiGeneratedPreview.accent, color: aiGeneratedPreview.background }}
                                >
                                    Accent
                                </span>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 border-white/20 hover:bg-white/10"
                                onClick={() => {
                                    setShowAiPreview(false);
                                    setAiGeneratedPreview(null);
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                onClick={() => {
                                    // Apply theme
                                    setCustomTheme(aiGeneratedPreview);
                                    applyTheme(aiGeneratedPreview);
                                    
                                    // Save to AI generated themes
                                    const aiGeneratedThemes = JSON.parse(localStorage.getItem('aiGeneratedThemes') || '[]');
                                    const themeWithId = { 
                                        ...aiGeneratedPreview, 
                                        id: Date.now().toString(), 
                                        generatedAt: new Date().toISOString()
                                    };
                                    aiGeneratedThemes.unshift(themeWithId);
                                    if (aiGeneratedThemes.length > 10) aiGeneratedThemes.pop();
                                    localStorage.setItem('aiGeneratedThemes', JSON.stringify(aiGeneratedThemes));
                                    
                                    setShowAiPreview(false);
                                    setAiGeneratedPreview(null);
                                    
                                    toast({ 
                                        title: "✅ Theme Applied & Saved!", 
                                        description: `"${aiGeneratedPreview.name}" is now active` 
                                    });
                                }}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Set & Save
                            </Button>
                        </div>
                        
                        {/* Regenerate Option */}
                        <button
                            onClick={() => {
                                setShowAiPreview(false);
                                setAiGeneratedPreview(null);
                                autoGenerateTheme(aiPrompt || undefined);
                            }}
                            className="w-full mt-3 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Generate Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

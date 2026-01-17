
"use client";

import * as React from "react";
import { Gem, Crown, Sparkles, Zap, Droplets, Leaf, Sun, Heart, Snowflake, Flame, Rocket, Atom, Gamepad2, Music, Skull, Cloud, Waves } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";

export const presetThemeCollections = {
    signature: [
        { 
            name: 'Aurora Dreams', 
            primary: '#8b2be2', 
            secondary: '#00bfff', 
            accent: '#32cd32', 
            background: '#0a0520', 
            foreground: '#ffffff', 
            card: 'rgba(10, 5, 32, 0.5)', 
            border: 'rgba(255, 255, 255, 0.1)', 
            muted: '#4a4a5a', 
            destructive: '#ef4444', 
            icon: Sparkles,
            backgroundStyle: 'var(--aurora-bg-uiverse)'
        },
        { 
            name: 'Cyber Neon', 
            primary: '#8b5cf6', 
            secondary: '#06b6d4', 
            accent: '#f472b6', 
            background: '#0a0a0f', 
            foreground: '#e0e0ff', 
            card: '#12121a', 
            border: '#1f1f2e', 
            muted: '#4a4a5a', 
            destructive: '#ef4444', 
            icon: Zap,
            backgroundStyle: 'radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 114, 182, 0.1) 0, transparent 50%), radial-gradient(at 0% 100%, #0a0a0f 0, transparent 50%), #0a0a0f'
        },
        { 
            name: 'Midnight Purple', 
            primary: '#8b5cf6', 
            secondary: '#a855f7', 
            accent: '#c084fc', 
            background: '#0c0a1d', 
            foreground: '#faf5ff', 
            card: '#1a1625', 
            border: '#2e2750', 
            muted: '#4c3d7a', 
            destructive: '#ef4444', 
            icon: Gem,
            backgroundStyle: 'radial-gradient(circle at 50% -20%, #2e1065 0%, #0c0a1d 80%), radial-gradient(at 0% 100%, rgba(139, 92, 246, 0.1) 0, transparent 50%), #0c0a1d'
        },
        { 
            name: 'Ocean Blue', 
            primary: '#3b82f6', 
            secondary: '#0ea5e9', 
            accent: '#06b6d4', 
            background: '#0a1628', 
            foreground: '#f0f9ff', 
            card: '#0f2847', 
            border: '#1e3a5f', 
            muted: '#2d4a6f', 
            destructive: '#ef4444', 
            icon: Droplets,
            backgroundStyle: 'radial-gradient(at 100% 0%, #1e3a8a 0%, transparent 50%), radial-gradient(at 0% 100%, #1e40af 0%, transparent 50%), linear-gradient(135deg, #0a1628 0%, #0f172a 100%)'
        },
        { 
            name: 'Forest Green', 
            primary: '#22c55e', 
            secondary: '#10b981', 
            accent: '#14b8a6', 
            background: '#0a1f0a', 
            foreground: '#f0fdf4', 
            card: '#132f13', 
            border: '#1f4d1f', 
            muted: '#2d6b2d', 
            destructive: '#ef4444', 
            icon: Leaf,
            backgroundStyle: 'radial-gradient(at 50% 100%, #064e3b 0%, transparent 70%), linear-gradient(180deg, #0a1f0a 0%, #062b06 100%)'
        },
        { 
            name: 'Sunset Orange', 
            primary: '#f97316', 
            secondary: '#fb923c', 
            accent: '#fbbf24', 
            background: '#1a0f05', 
            foreground: '#fff7ed', 
            card: '#2d1a0a', 
            border: '#4d2d10', 
            muted: '#7a4a1f', 
            destructive: '#ef4444', 
            icon: Sun,
            backgroundStyle: 'radial-gradient(at 0% 0%, #7c2d12 0%, transparent 50%), radial-gradient(at 100% 100%, #451a03 0%, transparent 50%), #1a0f05'
        },
    ],
    premium: [
        { 
            name: 'Rose Gold', 
            primary: '#f43f5e', 
            secondary: '#fb7185', 
            accent: '#fda4af', 
            background: '#1f0a10', 
            foreground: '#fff1f2', 
            card: '#2d1018', 
            border: '#4d1f2d', 
            muted: '#7a3347', 
            destructive: '#ef4444', 
            icon: Heart,
            backgroundStyle: 'radial-gradient(at 80% 20%, #4c0519 0, transparent 50%), radial-gradient(at 20% 80%, #4c0519 0, transparent 50%), #1f0a10'
        },
        { 
            name: 'Cyberpunk', 
            primary: '#f0abfc', 
            secondary: '#c026d3', 
            accent: '#facc15', 
            background: '#0d0d0d', 
            foreground: '#fdf4ff', 
            card: '#1a1a1a', 
            border: '#333333', 
            muted: '#525252', 
            destructive: '#ef4444', 
            icon: Zap,
            backgroundStyle: 'radial-gradient(at 50% 50%, #1a1a1a 0%, #0d0d0d 100%), repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(240, 171, 252, 0.03) 1px, rgba(240, 171, 252, 0.03) 2px)'
        },
        { 
            name: 'Arctic', 
            primary: '#38bdf8', 
            secondary: '#7dd3fc', 
            accent: '#e0f2fe', 
            background: '#0c1929', 
            foreground: '#f0f9ff', 
            card: '#172b44', 
            border: '#1e3a5f', 
            muted: '#3b5b7d', 
            destructive: '#f87171', 
            icon: Snowflake,
            backgroundStyle: 'radial-gradient(at 50% 0%, #0f172a 0%, #0c1929 100%), radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.05) 0%, transparent 40%)'
        },
        { 
            name: 'Ember', 
            primary: '#ef4444', 
            secondary: '#f97316', 
            accent: '#fbbf24', 
            background: '#1c0a0a', 
            foreground: '#fef2f2', 
            card: '#2d1515', 
            border: '#4a2020', 
            muted: '#6b2d2d', 
            destructive: '#ef4444', 
            icon: Flame,
            backgroundStyle: 'radial-gradient(at 50% -20%, #450a0a 0%, #1c0a0a 80%), radial-gradient(at 100% 100%, rgba(239, 68, 68, 0.1) 0, transparent 50%)'
        },
    ],
    exclusive: [
        { 
            name: 'Neon Dreams', 
            primary: '#00ff88', 
            secondary: '#00ccff', 
            accent: '#ff00ff', 
            background: '#050505', 
            foreground: '#ffffff', 
            card: '#0a0a0a', 
            border: '#1a1a1a', 
            muted: '#333333', 
            destructive: '#ff0055', 
            icon: Sparkles,
            backgroundStyle: 'radial-gradient(at 40% 40%, #0a0a0a 0, transparent 50%), radial-gradient(at 60% 60%, #080808 0, transparent 50%), #050505'
        },
        { 
            name: 'Royal Velvet', 
            primary: '#9333ea', 
            secondary: '#7c3aed', 
            accent: '#a78bfa', 
            background: '#0f0520', 
            foreground: '#f3e8ff', 
            card: '#1a0f30', 
            border: '#2d1a50', 
            muted: '#4a2d7a', 
            destructive: '#f43f5e', 
            icon: Crown,
            backgroundStyle: 'radial-gradient(at 0% 0%, #4c1d95 0, transparent 50%), radial-gradient(at 100% 100%, #2e1065 0, transparent 50%), #0f0520'
        },
        { 
            name: 'Golden Hour', 
            primary: '#fbbf24', 
            secondary: '#f59e0b', 
            accent: '#fcd34d', 
            background: '#1a1408', 
            foreground: '#fefce8', 
            card: '#2d2410', 
            border: '#4d3d1a', 
            muted: '#7a6028', 
            destructive: '#ef4444', 
            icon: Sun,
            backgroundStyle: 'radial-gradient(at 50% -50%, #78350f 0%, #1a1408 100%), radial-gradient(at 0% 100%, rgba(251, 191, 36, 0.05) 0, transparent 50%)'
        },
        { 
            name: 'Deep Space', 
            primary: '#6366f1', 
            secondary: '#818cf8', 
            accent: '#a5b4fc', 
            background: '#030712', 
            foreground: '#f8fafc', 
            card: '#0f172a', 
            border: '#1e293b', 
            muted: '#334155', 
            destructive: '#f87171', 
            icon: Rocket,
            backgroundStyle: 'radial-gradient(at 50% 50%, #111827 0%, #030712 100%), radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)'
        },
    ],
    gaming: [
        { 
            name: 'Matrix', 
            primary: '#00ff00', 
            secondary: '#22ff22', 
            accent: '#88ff88', 
            background: '#000500', 
            foreground: '#00ff00', 
            card: '#001200', 
            border: '#003300', 
            muted: '#005500', 
            destructive: '#ff0000', 
            icon: Atom,
            backgroundStyle: 'radial-gradient(at 50% 50%, #001200 0%, #000500 100%), linear-gradient(rgba(0, 255, 0, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.02) 1px, transparent 1px)'
        },
        { 
            name: 'RGB Wave', 
            primary: '#ff0080', 
            secondary: '#00ff80', 
            accent: '#8000ff', 
            background: '#050505', 
            foreground: '#ffffff', 
            card: '#0a0a0a', 
            border: '#1f1f1f', 
            muted: '#3a3a3a', 
            destructive: '#ff0040', 
            icon: Gamepad2,
            backgroundStyle: 'linear-gradient(135deg, #050505 0%, #111111 50%, #050505 100%), radial-gradient(at 100% 100%, rgba(255, 0, 128, 0.05) 0%, transparent 50%), radial-gradient(at 0% 0%, rgba(0, 255, 128, 0.05) 0%, transparent 50%)'
        },
        { 
            name: 'Vaporwave', 
            primary: '#ff71ce', 
            secondary: '#01cdfe', 
            accent: '#05ffa1', 
            background: '#0d0221', 
            foreground: '#fffb96', 
            card: '#1a0440', 
            border: '#2d0860', 
            muted: '#4a0d8f', 
            destructive: '#ff0055', 
            icon: Music,
            backgroundStyle: 'linear-gradient(to bottom, #240b36, #0d0221), radial-gradient(at 50% 100%, #ff71ce1a 0%, transparent 70%)'
        },
        { 
            name: 'Hacker', 
            primary: '#39ff14', 
            secondary: '#00ff41', 
            accent: '#32cd32', 
            background: '#0a0a0a', 
            foreground: '#39ff14', 
            card: '#0f0f0f', 
            border: '#1a1a1a', 
            muted: '#2a2a2a', 
            destructive: '#ff0000', 
            icon: Skull,
            backgroundStyle: 'radial-gradient(at 0% 0%, #001a00 0%, #0a0a0a 100%), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57, 255, 20, 0.01) 2px, rgba(57, 255, 20, 0.01) 4px)'
        },
    ],
    aesthetic: [
        { 
            name: 'Lavender Mist', 
            primary: '#e0b0ff', 
            secondary: '#dda0dd', 
            accent: '#d8bfd8', 
            background: '#1a0f20', 
            foreground: '#faf5ff', 
            card: '#2a1a35', 
            border: '#3d2850', 
            muted: '#5a3d75', 
            destructive: '#ff6b9d', 
            icon: Cloud,
            backgroundStyle: 'radial-gradient(at 100% 0%, #4c1d951a 0%, transparent 50%), radial-gradient(at 0% 100%, #1a0f20 0%, #2a1a35 100%)'
        },
        { 
            name: 'Mint Fresh', 
            primary: '#98ff98', 
            secondary: '#90ee90', 
            accent: '#7fffd4', 
            background: '#1a1a1a', 
            foreground: '#f0fff4', 
            card: '#152a1c', 
            border: '#204030', 
            muted: '#306040', 
            destructive: '#ff6b6b', 
            icon: Leaf,
            backgroundStyle: 'radial-gradient(at 0% 0%, #064e3b1a 0%, transparent 50%), radial-gradient(at 100% 100%, #1a1a1a 0%, #152a1c 100%)'
        },
        { 
            name: 'Coral Reef', 
            primary: '#ff7f50', 
            secondary: '#ff6b6b', 
            accent: '#ffa07a', 
            background: '#1a0f0a', 
            foreground: '#fff5ee', 
            card: '#2d1a12', 
            border: '#4a2a1f', 
            muted: '#704030', 
            destructive: '#dc143c', 
            icon: Waves,
            backgroundStyle: 'radial-gradient(at 50% 50%, #2d1a12 0%, #1a0f0a 100%), radial-gradient(at 100% 0%, #ff7f501a 0%, transparent 40%)'
        },
        { 
            name: 'Cotton Candy', 
            primary: '#ffb6c1', 
            secondary: '#ffc0cb', 
            accent: '#ff69b4', 
            background: '#1a0a12', 
            foreground: '#fff0f5', 
            card: '#2a1520', 
            border: '#402030', 
            muted: '#603050', 
            destructive: '#ff1493', 
            icon: Heart,
            backgroundStyle: 'radial-gradient(at 100% 100%, #c026d31a 0%, transparent 50%), radial-gradient(at 0% 0%, #4c05191a 0%, transparent 50%), #1a0a12'
        },
    ]
};

export function ThemeGallery() {
    const { setTheme } = useTheme();

    const applyTheme = (theme: any) => {
        const themeData = {
            name: theme.name,
            colors: {
                primary: theme.primary,
                secondary: theme.secondary,
                accent: theme.accent,
                background: theme.background,
                foreground: theme.foreground,
                card: theme.card,
                border: theme.border,
                muted: theme.muted,
                destructive: theme.destructive,
                backgroundStyle: theme.backgroundStyle,
            }
        };

        setTheme(themeData);
    };

    return (
        <div className="space-y-6">
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
                                        applyTheme(preset);
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
        </div>
    );
}

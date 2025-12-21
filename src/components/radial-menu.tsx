
"use client";

import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'next/navigation';

type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'editor' | 'watermark-adder';

interface ToolDefinition {
  nameKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  tool: Tool;
  color: string;
  bgColor: string;
  gradient: string;
}

interface RadialMenuProps {
  tools: ToolDefinition[];
}

export function RadialMenu({ tools }: RadialMenuProps) {
    const { t } = useTranslation();
    const router = useRouter();

    const radius = 180; // increased radius so tools are further from center
    const numTools = tools.length;
    const angleStep = (2 * Math.PI) / numTools;

    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            
            {/* Outer Decorative Ring - Glowing Glass */}
            <div 
                className="absolute w-[460px] h-[460px] rounded-full animate-radial-spin [animation-duration:120s] pointer-events-none"
                style={{
                    background: 'transparent',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.08)',
                }}
            />
            
            {/* Middle Decorative Ring */}
            <div 
                className="absolute w-[380px] h-[380px] rounded-full animate-spin-reverse [animation-duration:90s] pointer-events-none"
                style={{
                    background: 'transparent',
                    border: '1px solid rgba(6, 182, 212, 0.12)',
                    boxShadow: '0 0 30px rgba(6, 182, 212, 0.06)',
                }}
            />

            {/* Tools rotating container */}
            <div 
                className="absolute w-full h-full animate-radial-spin z-10"
                style={{ animationDuration: '80s' }}
            >
                {tools.map((tool, index) => {
                    const angle = index * angleStep - Math.PI / 2; // Start from top
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    return (
                        <TooltipProvider key={tool.tool} delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => router.push(`/tool/${tool.tool}`)}
                                        className={cn(
                                            "absolute w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer",
                                            "hover:scale-125 hover:z-30 hover:shadow-2xl",
                                        )}
                                        style={{
                                            top: `calc(50% - 32px)`,
                                            left: `calc(50% - 32px)`,
                                            transform: `translate(${x}px, ${y}px)`,
                                            background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px ${tool.color.includes('violet') ? 'rgba(139, 92, 246, 0.2)' : tool.color.includes('cyan') ? 'rgba(6, 182, 212, 0.2)' : 'rgba(244, 114, 182, 0.2)'}`,
                                        }}
                                        aria-label={t(tool.nameKey as any)}
                                    >
                                        <tool.icon className={cn("w-7 h-7", tool.color)} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="z-50">
                                    <p className="font-medium">{t(tool.nameKey as any)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>

            {/* Central Element - Small Liquid Glass Orb */}
            <div 
                className="absolute w-20 h-20 rounded-full flex items-center justify-center group cursor-pointer z-20"
                style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(244, 114, 182, 0.2) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 0 40px rgba(139, 92, 246, 0.15)',
                }}
                onClick={() => router.push('/tool/dashboard')}
            >
                {/* Glass shine effect */}
                <div 
                    className="absolute inset-1 rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.25), transparent 50%)',
                    }}
                />
                <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_12px_rgba(139,92,246,0.9)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
        </div>
    );
}

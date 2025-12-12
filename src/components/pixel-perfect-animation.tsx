
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Calculator, Cpu, ScanSearch, Sparkles, CheckCircle, SlidersHorizontal } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { ResolutionValue } from './image-upscaler';


const resolutionMap: Record<ResolutionValue, { width: number; height: number; megapixels: number }> = {
    '1K': { width: 1024, height: 1024, megapixels: 1 },
    '2K': { width: 2048, height: 2048, megapixels: 4.2 },
    '4K': { width: 4096, height: 4096, megapixels: 16.8 },
    '6K': { width: 6144, height: 6144, megapixels: 37.7 },
    '8K': { width: 8192, height: 8192, megapixels: 67.1 },
};

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
}

interface PixelPerfectAnimationProps {
    sourceDimensions: { width: number; height: number };
    targetResolution: ResolutionValue;
}

export function PixelPerfectAnimation({ sourceDimensions, targetResolution }: PixelPerfectAnimationProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = useMemo(() => {
        const sourcePixels = sourceDimensions.width * sourceDimensions.height;
        const targetWidth = resolutionMap[targetResolution].width;
        
        // Calculate target height while maintaining aspect ratio
        const aspectRatio = sourceDimensions.width / sourceDimensions.height;
        const targetHeight = Math.round(targetWidth / aspectRatio);
        const targetPixels = targetWidth * targetHeight;

        return [
            { text: `Analyzing ${formatNumber(sourcePixels)} original pixels...`, icon: ScanSearch },
            { text: `Generating ${formatNumber(targetPixels - sourcePixels)} new pixels...`, icon: Cpu },
            { text: `Mapping pixels for ${targetWidth}x${targetHeight} resolution...`, icon: Calculator },
            { text: `AI enhancing at pixel-level...`, icon: Sparkles },
            { text: "Improving image quality and clarity...", icon: CheckCircle },
            { text: `Applying final touch-ups...`, icon: SlidersHorizontal },
        ];
    }, [sourceDimensions, targetResolution]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prevStep) => (prevStep + 1));
        }, 2500);

        // Stop at the last step
        if (currentStep >= steps.length - 1) {
            clearInterval(interval);
        }

        return () => clearInterval(interval);
    }, [currentStep, steps.length]);

    const progressPercentage = ((currentStep + 1) / steps.length) * 100;
    const currentInfo = steps[currentStep] || steps[steps.length - 1];
    const CurrentIcon = currentInfo.icon;

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center gap-6 p-4 rounded-lg bg-muted/50 border border-dashed">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div 
                    className="absolute inset-0 border-4 border-primary rounded-full animate-spin"
                    style={{ animationDuration: '2s', clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)' }}
                ></div>
                <CurrentIcon className="absolute inset-0 m-auto w-10 h-10 text-primary transition-all duration-500" />
            </div>

            <div className="w-full space-y-2">
                <p className="text-sm font-medium text-primary h-5">
                   {currentInfo.text}
                </p>
                <Progress value={progressPercentage} className="w-full h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
                High-fidelity enhancement in progress... This may take up to a minute.
            </p>
        </div>
    );
}

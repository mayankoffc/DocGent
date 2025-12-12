"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PaperSheetProps {
  children: React.ReactNode;
  isScannerMode?: boolean;
  className?: string;
}

export function PaperSheet({ children, isScannerMode = false, className }: PaperSheetProps) {
  return (
    <div
      className={cn(
        "relative w-full bg-white shadow-lg overflow-auto",
        "paper-sheet",
        isScannerMode && "scanner-effect",
        className
      )}
      style={{
        minHeight: '297mm',
        padding: '20mm',
      }}
    >
      {/* Paper content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Scanner mode noise overlay */}
      {isScannerMode && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
}

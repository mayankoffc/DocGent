
"use client";

import { Pencil } from 'lucide-react';
import './writing-animation.css';

export function WritingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
      <div className="writing-container">
        <Pencil className="pencil-icon" />
        <div className="writing-text">
          <span style={{ animationDelay: '0s' }}>S</span>
          <span style={{ animationDelay: '0.1s' }}>o</span>
          <span style={{ animationDelay: '0.2s' }}>l</span>
          <span style={{ animationDelay: '0.3s' }}>v</span>
          <span style={{ animationDelay: '0.4s' }}>i</span>
          <span style={{ animationDelay: '0.5s' }}>n</span>
          <span style={{ animationDelay: '0.6s' }}>g</span>
          <span style={{ animationDelay: '0.7s' }}>.</span>
          <span style={{ animationDelay: '0.8s' }}>.</span>
          <span style={{ animationDelay: '0.9s' }}>.</span>
        </div>
      </div>
       <p className="mt-4 text-sm text-center">
        The AI is analyzing your booklet and preparing the solutions...
      </p>
    </div>
  );
}

    
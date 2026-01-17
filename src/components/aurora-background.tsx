
"use client";

import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";

export function AuroraBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render on server to avoid hydration mismatch
  if (!mounted) return null;

  // Show only if it's the expected background style
  if (theme?.colors?.backgroundStyle !== 'var(--aurora-bg-uiverse)') {
    return null;
  }

  return (
    <div className="bg-aurora-uiverse" aria-hidden="true" />
  );
}

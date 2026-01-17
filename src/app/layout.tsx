import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { RecentGenerationsProvider } from '@/hooks/use-recent-generations';
import { ToolStateProvider } from '@/hooks/use-tool-state';
import { TranslationProvider } from '@/hooks/use-translation';
import Script from 'next/script';
import { SubscriptionProvider } from '@/hooks/use-subscription';
import { Loader2 } from 'lucide-react';
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from '@/hooks/use-theme';
import { AuroraBackground } from '@/components/aurora-background';

// This needs to be imported here to be available globally for the animation
import '@/components/writing-animation.css';

export const metadata: Metadata = {
  title: 'DOC AI',
  description: 'AI-powered document and presentation generator',
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat&family=Cedarville+Cursive&family=Dancing+Script&family=Indie+Flower&family=Kalam&family=Lato&family=Lora&family=Merriweather&family=Montserrat&family=Nunito&family=Open+Sans&family=PT+Sans:wght@400;700&family=Patrick+Hand&family=Playfair+Display&family=Poppins:wght@400;600;700&family=Raleway&family=Reenie+Beanie&family=Roboto&family=Rock+Salt&family=Shadows+Into+Light&family=Source+Code+Pro&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(theme);
              
              // Apply custom theme if exists
              const customTheme = localStorage.getItem('anm-theme') || localStorage.getItem('customTheme');
              if (customTheme) {
                try {
                  const themeData = JSON.parse(customTheme);
                  const root = document.documentElement;
                  
                  const hexToHsl = (hex) => {
                    hex = hex.replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
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
                    return Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
                  };

                  Object.entries(themeData.colors || {}).forEach(([key, value]) => {
                    if (typeof value === 'string' && value.startsWith('#')) {
                      root.style.setProperty('--' + key, hexToHsl(value));
                    } else {
                      root.style.setProperty('--' + key, value);
                    }
                  });

                  // Apply background style if it exists
                  if (themeData.colors && themeData.colors.backgroundStyle) {
                    root.style.setProperty('--background-style', themeData.colors.backgroundStyle);
                  }
                } catch(e) {}
              }
            })();
          `
        }} />
      </head>
      <body className={cn(
          "min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <TranslationProvider>
          <ThemeProvider>
            <AuroraBackground />
            <AuthProvider>
              <SubscriptionProvider>
                <RecentGenerationsProvider>
                  <ToolStateProvider>
                    {children}
                    <Toaster />
                  </ToolStateProvider>
                </RecentGenerationsProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </ThemeProvider>
        </TranslationProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        <Script src={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs`} type="module"></Script>
      </body>
    </html>
  );
}

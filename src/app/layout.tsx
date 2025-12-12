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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat&family=Cedarville+Cursive&family=Dancing+Script&family=Indie+Flower&family=Kalam&family=Lato&family=Lora&family=Merriweather&family=Montserrat&family=Nunito&family=Open+Sans&family=PT+Sans:wght@400;700&family=Patrick+Hand&family=Playfair+Display&family=Poppins:wght@400;600;700&family=Raleway&family=Reenie+Beanie&family=Roboto&family=Rock+Salt&family=Shadows+Into+Light&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}>
        <TranslationProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <RecentGenerationsProvider>
                <ToolStateProvider>
                  <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-indigo-50 via-white to-green-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-emerald-950/30" />
                  {children}
                  <Toaster />
                </ToolStateProvider>
              </RecentGenerationsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </TranslationProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        <Script src={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs`} type="module"></Script>
      </body>
    </html>
  );
}

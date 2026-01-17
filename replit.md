# nextn

## Overview
This is a Next.js 15 application with Firebase integration. It includes features like PDF processing, AI integration via Genkit, and user authentication.

## Project Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React UI components
- `src/lib/` - Utility libraries (Firebase, PDF processing, etc.)
- `src/ai/` - AI/Genkit related code and flows
- `src/hooks/` - Custom React hooks
- `src/config/` - Application configuration
- `src/services/` - Service layer

## Setup Requirements

### Firebase Configuration
The app requires Firebase configuration. Add the following environment variables:

**Client-side Firebase (public):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Server-side Firebase Admin:**
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON string of your Firebase service account credentials

## Development
The app runs on port 5000 using `npm run dev`.

## Design System - Liquid Glass Effect

The app uses a comprehensive "liquid glass" UI design system with:

**Core CSS Properties:**
- `backdrop-blur: 16-30px` - Glass blur effect
- `backdrop-saturate: 1.4-1.8` - Color vibrancy enhancement
- `bg-white/[0.06-0.15]` - Transparent white backgrounds
- `border-white/[0.15-0.2]` - Subtle white borders
- Inset shadows for depth: `inset 0 1px 0 rgba(255,255,255,0.2)`

**Glass Utility Classes (globals.css):**
- `.liquid-glass` - Standard glass effect
- `.liquid-glass-strong` - Enhanced glass with stronger blur
- `.dark-glass` - Dark variant for overlays
- `.glass-surface--svg` - SVG filter-based glass
- `.glass-surface--fallback` - Browser fallback

**Updated Components:**
Card, Dialog, AlertDialog, Button, Input, Textarea, Select, Dropdown (including nested submenus), Popover, Tabs, Toast, Tooltip, Sheet, Switch, Badge, Alert, Menubar (root, content, subcontent), Sidebar, Header, Dashboard cards, Settings

## Recent Changes
- January 17, 2026: Fixed all tools to be 100% functional
  - Document Generator: Fixed page sizes (A3, A4, A5) to actually produce correct size PDFs when exported
  - Document Converter: Completely rewritten - now actually converts documents (PDF↔TXT↔HTML) instead of returning dummy text
  - All dropdown options verified to be connected to actual functionality
  - Watermark Adder: Position, opacity, font size, angle all work properly
  - Exam Paper Generator: Curriculum, language, difficulty all affect output
- January 17, 2026: Made all text content professional and DOCGENTOR-branded
  - Updated app name from "DocGent" to "DOCGENTOR" throughout the app
  - Simplified tool names: Document Generator, Exam Paper Generator, Notes Generator, Resume Builder, etc.
  - Made dashboard taglines clear and simple
  - Updated upgrade/membership page with cleaner pricing and feature descriptions
  - Simplified help center content with easy-to-understand language
  - Updated all placeholder texts to be more relatable examples
  - Changed technical jargon to simple English across all translations
- January 17, 2026: Completed comprehensive liquid glass UI implementation across ALL components
  - Updated 20+ UI components with consistent glass styling
  - Applied liquid glass to page-level components: Header, Dashboard, Settings, Sidebar
  - Updated Menubar with full glass styling (root, content, subcontent)
  - Enhanced Switch, Badge, and Alert components with glass effects
  - All components now use consistent: backdrop-blur-[16-30px], backdrop-saturate-[1.4-1.8], bg-white/[0.06-0.15], border-white/[0.15-0.2], inset shadows
- January 17, 2026: Imported from GitHub and configured for Replit environment
  - Updated Next.js config to allow Replit proxy domains
  - Modified firebase-server.ts to use environment variables instead of JSON file import

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

## Design System - Dock Dark Theme

The app uses a dock-based dark UI design system with:

**Core Colors:**
- Background: `#060010` (deep dark purple-black)
- Border: `#222` (subtle dark border)
- Hover Background: `#0a0015` (slightly lighter)
- Hover Border: `#333` (slightly lighter border)

**Dock UI Utility Classes (globals.css):**
- `.dock-outer` - Container for dock elements
- `.dock-panel` - Fixed bottom navigation panel
- `.dock-item` - Individual dock buttons with hover effects
- `.dock-icon` - Icon container within dock items
- `.dock-label` - Tooltip labels for dock items
- `.dark-panel` - Main UI container panels
- `.dark-card` - Content section cards

**Legacy Classes (for compatibility):**
- `.liquid-glass` - Now uses dark theme styling
- `.dark-glass` - Dark variant styling
- `.glass-card` - Card with dark theme

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
- January 17, 2026: Replaced liquid glass UI with dock-based dark theme
  - Removed all backdrop-blur and glass effects
  - New dark theme: #060010 background, #222 borders
  - Added dock UI classes: .dock-panel, .dock-item, .dock-label, .dark-panel, .dark-card
  - Updated legacy glass classes to use solid dark colors for compatibility
  - Cleaner, more performant UI without blur effects
- January 17, 2026: Imported from GitHub and configured for Replit environment
  - Updated Next.js config to allow Replit proxy domains
  - Modified firebase-server.ts to use environment variables instead of JSON file import

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

## Recent Changes
- January 17, 2026: Imported from GitHub and configured for Replit environment
  - Updated Next.js config to allow Replit proxy domains
  - Modified firebase-server.ts to use environment variables instead of JSON file import

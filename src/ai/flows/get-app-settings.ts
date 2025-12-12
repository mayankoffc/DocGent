
'use server';
/**
 * @fileOverview A server-side flow to retrieve global application settings from Firestore.
 *
 * - getAppSettings - Fetches the current application settings.
 * - AppSettings - The type definition for the application settings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-server';

const AppSettingsSchema = z.object({
  freemiumCode: z.string().length(6, { message: "Code must be 6 digits" }).default("239028"),
  freemiumCodeExpiry: z.number().nullable().default(null).describe("The timestamp when the freemium code expires."),
  monthlyPrice: z.number().min(10).max(100).default(29),
  yearlyPrice: z.number().min(99).max(500).default(199),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

const getAppSettingsFlow = ai.defineFlow(
  {
    name: 'getAppSettingsFlow',
    inputSchema: z.void(),
    outputSchema: AppSettingsSchema,
  },
  async () => {
    if (!db) {
      console.error("Firestore Admin is not initialized. Returning default settings.");
      return AppSettingsSchema.parse({});
    }

    const settingsRef = db.collection('app-settings').doc('main');
    const docSnap = await settingsRef.get();

    if (docSnap.exists) {
      // Validate data from Firestore against our Zod schema
      const result = AppSettingsSchema.safeParse(docSnap.data());
      if (result.success) {
        return result.data;
      }
      // If data is invalid, return default and log error
      console.warn("Firestore 'app-settings' document has invalid data, returning defaults.", result.error);
    }
    
    // If document doesn't exist or is invalid, create it with default values
    const defaultSettings = AppSettingsSchema.parse({});
    await settingsRef.set(defaultSettings);
    return defaultSettings;
  }
);

export async function getAppSettings(): Promise<AppSettings> {
    return getAppSettingsFlow();
}


'use server';
/**
 * @fileOverview A server-side flow to manage user-specific data in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-server';
import { FieldValue } from 'firebase-admin/firestore';

// Define the structure of user data in Firestore
const UserDataSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().or(z.literal("")).optional(), // Allow URL or empty string
  createdAt: z.custom<FieldValue>(),
  imageGenerationCount: z.number().default(0),
  lastGenerationTimestamp: z.custom<FieldValue>().optional(),
  quotaResetTimestamp: z.custom<FieldValue>().optional(),
});
export type UserData = z.infer<typeof UserDataSchema>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Flow to create a user document in Firestore on first sign-up
export const createUserDataFlow = ai.defineFlow(
  {
    name: 'createUserDataFlow',
    inputSchema: z.object({
        uid: z.string(),
        email: z.string().email(),
        displayName: z.string().optional(),
        photoURL: z.string().url().or(z.literal("")).optional(),
    }),
    outputSchema: z.void(),
  },
  async ({ uid, email, displayName, photoURL }) => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();

    // Only create the document if it doesn't already exist
    if (!docSnap.exists) {
      const now = FieldValue.serverTimestamp();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      await userRef.set({
        uid,
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        createdAt: now,
        imageGenerationCount: 0,
        lastGenerationTimestamp: now,
        quotaResetTimestamp: tomorrow,
      });
    }
  }
);

// Flow to get a user's data and reset quota if needed
const getUserDataFlow = ai.defineFlow(
  {
    name: 'getUserDataFlow',
    inputSchema: z.string(), // User ID
    outputSchema: UserDataSchema.omit({ createdAt: true, lastGenerationTimestamp: true, quotaResetTimestamp: true }),
  },
  async (uid) => {
    if (!db) throw new Error('Firestore is not initialized.');

    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      throw new Error('User data not found.');
    }
    
    const userData = docSnap.data() as any;
    
    // Check if quota needs to be reset
    const now = new Date().getTime();
    const quotaResetTime = userData.quotaResetTimestamp?.toDate().getTime() || 0;
    
    if (now > quotaResetTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      await userRef.update({
        imageGenerationCount: 0,
        quotaResetTimestamp: tomorrow
      });
      
      // Update the local copy to reflect the reset
      userData.imageGenerationCount = 0;
    }

    return {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      imageGenerationCount: userData.imageGenerationCount,
    };
  }
);
export const getUserData = getUserDataFlow;

// Flow to update the image count
const updateImageCountFlow = ai.defineFlow(
  {
    name: 'updateImageCountFlow',
    inputSchema: z.object({ userId: z.string(), count: z.number().int().positive() }),
    outputSchema: z.void(),
  },
  async ({ userId, count }) => {
    if (!db) throw new Error('Firestore is not initialized.');

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      imageGenerationCount: FieldValue.increment(count),
      lastGenerationTimestamp: FieldValue.serverTimestamp(),
    });
  }
);
export const updateImageCount = updateImageCountFlow;

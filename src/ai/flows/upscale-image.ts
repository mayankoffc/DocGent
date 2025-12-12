
'use server';
/**
 * @fileOverview An AI-powered image upscaler.
 *
 * - upscaleImage - A function that handles the image upscaling process.
 * - UpscaleImageInput - The input type for the upscaleImage function.
 * - UpscaleImageOutput - The return type for the upscaleImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getUserData, updateImageCount } from './user-data';
import type { Subscription } from '@/hooks/use-subscription';

const resolutionSchema = z.enum(['1K', '2K', '4K', '6K', '8K']);

const UpscaleImageInputSchema = z.object({
  imageDataUri: z.string().describe("A source image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  resolution: resolutionSchema.describe("The target resolution for upscaling."),
  applyHdrEffect: z.boolean().default(false).describe("Whether to apply an HDR10+ style color and contrast enhancement."),
  userId: z.string().optional().describe('The user ID for quota checking.'),
  subscription: z.custom<Subscription>().optional().describe('The user\'s subscription status.'),
});
export type UpscaleImageInput = z.infer<typeof UpscaleImageInputSchema>;


const UpscaleImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The base64 encoded data URI of the upscaled image."),
});
export type UpscaleImageOutput = z.infer<typeof UpscaleImageOutputSchema>;

export async function upscaleImage(input: UpscaleImageInput): Promise<UpscaleImageOutput> {
  return upscaleImageFlow(input);
}


const upscaleImageFlow = ai.defineFlow(
  {
    name: 'upscaleImageFlow',
    inputSchema: UpscaleImageInputSchema,
    outputSchema: UpscaleImageOutputSchema,
  },
  async (input) => {
    // Quota Check
    if (!input.userId) {
        throw new Error("Image upscaling is disabled for guest users. Please sign in.");
    }
    if (input.subscription?.status !== 'active' && input.subscription?.status !== 'trial') {
        const userData = await getUserData(input.userId);
        if (userData.imageGenerationCount >= 10) {
            throw new Error("Daily image processing limit (10) exceeded. Please upgrade to a premium plan for unlimited images or try again tomorrow.");
        }
    }
    
    // Create the base prompt, focusing only on clarity and pure upscaling.
    let advancedPrompt = `
      You are a high-fidelity image processing engine. Your ONLY task is to perform a pure technical upsampling of the provided source image to the target resolution of **${input.resolution}**.

      **CRITICAL DIRECTIVE:** You are an EDITOR, not a CREATOR. You MUST NOT change the subject, content, composition, colors, or any existing elements of the original image. Your primary responsibility is to increase the resolution and enhance clarity and sharpness. The final output MUST be a visibly clearer, crisper, and clean version of the original. Returning the original image without any enhancement is a failure of your task.

      ---
      **// STEP 1: PURE RESOLUTION UPSCALE & CLARITY ENHANCEMENT**
      - Your first task is to perform a pure technical upsampling of the source image to the target resolution of **${input.resolution}**.
      - Focus on creating new pixel data that is mathematically consistent with the surrounding original pixels. PRESERVE all original details, textures, and lines.
      - After upscaling, analyze the image for any compression artifacts, pixelation, or blurriness.
      - Perform a meticulous, pixel-level repair. Smooth out blocky areas and correct jagged edges without losing sharpness.
      - Apply intelligent sharpening to enhance fine details without creating halos or an over-sharpened look.
      - Apply gentle denoising to clean up any minor noise.
      - **DO NOT** alter the original color grading or contrast unless explicitly instructed in the next step. The goal is clarity, not a stylistic change.
    `;

    // Conditionally add the HDR step only if the user requested it.
    if (input.applyHdrEffect) {
        advancedPrompt += `
        ---
        **// STEP 2: OPTIONAL HDR COLOR & CONTRAST ENHANCEMENT**
        - As a final step, apply a professional HDR10+ style color and contrast enhancement.
        - Your goal is to expand the dynamic range. Deepen the blacks, brighten the highlights, and make the colors more vibrant and true-to-life without oversaturating.
        - This enhancement should feel natural and powerful.
        `;
    }
    
    advancedPrompt += "\nThe final output must be a single, high-quality image that is a technically and visually enhanced version of the original."

    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: [
                { media: { url: input.imageDataUri } },
                { text: advancedPrompt }
            ],
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        if (!media?.url) {
            throw new Error('Image upscaling failed to return an image.');
        }

        // Update user's image count in Firestore
        if (input.userId) {
            await updateImageCount({ userId: input.userId, count: 1 });
        }

        return { imageDataUri: media.url };

    } catch (e: any) {
        console.error("Image upscaling failed:", e);
        throw new Error(`Failed to upscale the image. ${e.message}`);
    }
  }
);

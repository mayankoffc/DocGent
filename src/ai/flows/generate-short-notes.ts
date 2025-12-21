
'use server';
/**
 * @fileOverview An AI-powered short notes generator with OCR capabilities.
 *
 * - generateShortNotes - A function that handles the note generation process.
 * - GenerateShortNotesInput - The input type for the generateShortNotes function.
 * - GenerateShortNotesOutput - The return type for the generateShortNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShortNotesInputSchema = z.object({
  pdfDataUri: z.string().describe("A PDF document of the chapter or content to be summarized, provided as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
  detailLevel: z.enum(['concise', 'detailed', 'comprehensive']).describe("The desired level of detail for the notes. 'concise' for a brief overview, 'detailed' for main points with explanations, 'comprehensive' for an in-depth summary with examples."),
});
export type GenerateShortNotesInput = z.infer<typeof GenerateShortNotesInputSchema>;

const GenerateShortNotesOutputSchema = z.object({
  shortNotes: z.string().describe('The generated short notes in a well-structured markdown format, including headings, bullet points, and bold text for key terms.'),
});
export type GenerateShortNotesOutput = z.infer<typeof GenerateShortNotesOutputSchema>;

export async function generateShortNotes(input: GenerateShortNotesInput): Promise<GenerateShortNotesOutput> {
  return generateShortNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShortNotesPrompt',
  input: {schema: GenerateShortNotesInputSchema},
  output: {schema: GenerateShortNotesOutputSchema},
  prompt: `Notes from PDF. Level: {{{detailLevel}}} (concise=brief, detailed=balanced, comprehensive=in-depth).
Format: markdown (#headings, -bullets, **bold** keywords).
Doc: {{media url=pdfDataUri}}`,
});

const generateShortNotesFlow = ai.defineFlow(
  {
    name: 'generateShortNotesFlow',
    inputSchema: GenerateShortNotesInputSchema,
    outputSchema: GenerateShortNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model failed to return generated notes.");
    }
    return output;
  }
);

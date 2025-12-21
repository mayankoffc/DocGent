
'use server';
/**
 * @fileOverview An AI-powered booklet and question paper solver with OCR capabilities.
 *
 * - solveBooklet - A function that handles the solving process for full PDFs.
 * - solveBookletPage - A function that handles solving a single page (for large PDFs).
 * - SolveBookletInput - The input type for the solveBooklet function.
 * - SolveBookletOutput - The return type for the solveBooklet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveBookletInputSchema = z.object({
  pdfDataUri: z.string().describe("A PDF document of a question paper or booklet, provided as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
  detailLevel: z.enum(['short', 'medium', 'detailed']).describe("The desired level of detail for the answer key. 'short' for just the answer, 'medium' for a brief explanation, 'detailed' for a full step-by-step solution."),
});
export type SolveBookletInput = z.infer<typeof SolveBookletInputSchema>;

// Schema for single page processing
const SolveBookletPageInputSchema = z.object({
  pageImageUri: z.string().describe("A single page image as data URI (PNG format)."),
  pageNumber: z.number().describe("The current page number."),
  totalPages: z.number().describe("Total number of pages in the document."),
  detailLevel: z.enum(['short', 'medium', 'detailed']).describe("The desired level of detail."),
});
export type SolveBookletPageInput = z.infer<typeof SolveBookletPageInputSchema>;

const SolveBookletOutputSchema = z.object({
  solvedAnswers: z.string().describe('The fully solved answer key in a well-structured markdown format. Each answer should be detailed and provide step-by-step explanations where applicable. Mathematical equations and chemical formulas must be formatted as KaTeX strings.'),
});
export type SolveBookletOutput = z.infer<typeof SolveBookletOutputSchema>;

export async function solveBooklet(input: SolveBookletInput): Promise<SolveBookletOutput> {
  return solveBookletFlow(input);
}

export async function solveBookletPage(input: SolveBookletPageInput): Promise<SolveBookletOutput> {
  return solveBookletPageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveBookletPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: SolveBookletInputSchema },
  output: {schema: SolveBookletOutputSchema},
  prompt: `Solve all questions from PDF. Detail: {{{detailLevel}}} (short=answer only, medium=brief explanation, detailed=step-by-step).
Rules: Same language as PDF, KaTeX for math ($$formula$$), markdown format (## Q1, **Answer:**).
Doc: {{media url=pdfDataUri}}`,
});

// Prompt for single page processing
const pagePrompt = ai.definePrompt({
  name: 'solveBookletPagePrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: SolveBookletPageInputSchema },
  output: {schema: SolveBookletOutputSchema},
  prompt: `Solve questions from this page ({{{pageNumber}}}/{{{totalPages}}}). Detail: {{{detailLevel}}}.
Rules: Same language, KaTeX for math ($$formula$$), markdown (## Q, **Answer:**). Skip if no questions.
Page: {{media url=pageImageUri}}`,
});

const solveBookletFlow = ai.defineFlow(
  {
    name: 'solveBookletFlow',
    inputSchema: SolveBookletInputSchema,
    outputSchema: SolveBookletOutputSchema,
  },
  async (input) => {
    
    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error("The AI model failed to return a solved answer key.");
    }
    
    return output;
  }
);

// Flow for single page processing
const solveBookletPageFlow = ai.defineFlow(
  {
    name: 'solveBookletPageFlow',
    inputSchema: SolveBookletPageInputSchema,
    outputSchema: SolveBookletOutputSchema,
  },
  async (input) => {
    const { output } = await pagePrompt(input);
    
    if (!output) {
      return { solvedAnswers: 'No questions found on this page.' };
    }
    
    return output;
  }
);


'use server';
/**
 * @fileOverview An AI-powered booklet and question paper solver with OCR capabilities.
 *
 * - solveBooklet - A function that handles the solving process.
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

const SolveBookletOutputSchema = z.object({
  solvedAnswers: z.string().describe('The fully solved answer key in a well-structured markdown format. Each answer should be detailed and provide step-by-step explanations where applicable. Mathematical equations and chemical formulas must be formatted as KaTeX strings.'),
});
export type SolveBookletOutput = z.infer<typeof SolveBookletOutputSchema>;

export async function solveBooklet(input: SolveBookletInput): Promise<SolveBookletOutput> {
  return solveBookletFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveBookletPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: SolveBookletInputSchema },
  output: {schema: SolveBookletOutputSchema},
  prompt: `You are an expert tutor and problem solver. Your task is to analyze the provided PDF document, which is a question paper or booklet. You must identify every single question and provide a solution for each one based on the requested detail level.

**CRITICAL INSTRUCTIONS:**

1.  **Language Detection:** You MUST first detect the language of the questions in the PDF (e.g., English, Hindi, Hinglish). All of your output (headings, explanations, answers) MUST be in the same detected language.
2.  **Identify All Questions:** Carefully parse the entire document page by page to find all questions. This includes Multiple Choice Questions (MCQs), short answer, long answer, fill-in-the-blanks, and complex, multi-part problems.
3.  **Adhere to Detail Level:** You MUST provide solutions that match the user's requested detail level: '{{{detailLevel}}}'.
    *   **short:** Provide only the final, concise answer. For MCQs, give just the option (e.g., "(B)"). For problems, give only the final numerical or text answer. No explanations.
    *   **medium:** State the correct answer and provide a brief, one or two-sentence explanation. For problems, show the main formula used and the final answer.
    *   **detailed:** Provide a comprehensive, step-by-step solution.
        *   For **MCQs**, state the correct option and provide a clear explanation for why it is correct and why the other options are incorrect.
        *   For **math or science problems**, show the complete step-by-step derivation, including formulas used and calculations.
        *   For **theory questions**, provide a detailed, well-structured answer as if you were writing an exam for top marks.
4.  **Formatting (VERY IMPORTANT):**
    *   **Mathematical & Chemical Formulas:** You MUST format all mathematical equations, expressions, and chemical formulas using **KaTeX**. For example, for a quadratic equation, output '$$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}$$'. For a chemical formula, use KaTeX syntax like '$$H_2O$$' for Water. This is mandatory.
    *   **Structure:** The output MUST be well-structured in markdown format.
        *   Use headings (e.g., \`## Question 1\`, \`## प्रश्न 1\`).
        *   Use bold text (e.g., \`**Answer:**\`, \`**उत्तर:**\`) to clearly indicate the final answer.
        *   Use bullet points, numbered lists, and code blocks for clarity where appropriate.
        *   Maintain the original question numbering.

**User Request:**
*   **Detail Level:** {{{detailLevel}}}
*   **Document to Solve:** {{media url=pdfDataUri}}

Now, generate the detailed, solved answer key following all instructions precisely.
`,
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

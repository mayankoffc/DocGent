
'use server';
/**
 * @fileOverview An AI flow that converts a source text into a styled HTML document that looks like the user's handwriting on a notebook page.
 *
 * - convertToHandwriting - The main function that handles the conversion process.
 * - HandwritingConverterInput - The input type for the function.
 * - HandwritingConverterOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const fontNameEnum = z.enum(['Caveat', 'Dancing Script', 'Patrick Hand', 'Indie Flower', 'Kalam', 'Reenie Beanie', 'Rock Salt']);

const HandwritingConverterInputSchema = z.object({
  sourceText: z.string().describe("The text content to be converted into handwriting."),
  fontName: fontNameEnum.describe("The Google Font to use for the handwriting style."),
});
export type HandwritingConverterInput = z.infer<typeof HandwritingConverterInputSchema>;

const HandwritingConverterOutputSchema = z.object({
  handwrittenNoteHtml: z.string().describe("The generated A4-styled page as a complete HTML string, ready for client-side rendering into a PDF."),
});
export type HandwritingConverterOutput = z.infer<typeof HandwritingConverterOutputSchema>;


export async function convertToHandwriting(input: HandwritingConverterInput): Promise<HandwritingConverterOutput> {
  return handwritingConverterFlow(input);
}


function generateHtmlForPdf(text: string, fontName: string): string {
    const renderedText = text.replace(/\n/g, '<br/>');
    
    // High-quality SVG background for a realistic lined paper effect
    const realisticPaperBackground = `
        background-color: #fdfaf2;
        background-image: 
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cpattern id='p' width='100' height='26' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 25.5h100' stroke='%23d3dce9' stroke-width='1'/%3E%3C/pattern%3E%3Cpattern id='m' width='210mm' height='297mm' patternUnits='userSpaceOnUse'%3E%3Cpath d='M25.5mm 0 V297mm' stroke='%23f29393' stroke-width='1'/%3E%3C/pattern%3E%3Cfilter id='noise' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='3' stitchTiles='stitch' type='fractalNoise'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3Crect width='100%25' height='100%25' fill='url(%23m)'/%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Indie+Flower&family=Kalam&family=Patrick+Hand&family=Reenie+Beanie&family=Rock+Salt&display=swap');
                body {
                    margin: 0;
                    padding: 0;
                    width: 210mm;
                    min-height: 297mm;
                    box-sizing: border-box;
                    ${realisticPaperBackground}
                    font-family: '${fontName}', cursive;
                    font-size: 16px;
                    color: #00005a; /* Darker blue ink color */
                    line-height: 26px; /* Match the line height of the paper */
                    padding: 20mm 20mm 20mm 30mm; /* A4 padding with margin */
                }
                .content {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    padding-top: 5px; /* Align text with the first line better */
                }
            </style>
        </head>
        <body>
            <div class="content">${renderedText}</div>
        </body>
        </html>
    `;
}

const handwritingConverterFlow = ai.defineFlow(
  {
    name: 'handwritingConverterFlow',
    inputSchema: HandwritingConverterInputSchema,
    outputSchema: HandwritingConverterOutputSchema,
  },
  async (input) => {
    // This flow now only receives plain text and generates the HTML.
    // The complex PDF parsing is handled on the client.
    const htmlContent = generateHtmlForPdf(input.sourceText, input.fontName);
    return { handwrittenNoteHtml: htmlContent };
  }
);

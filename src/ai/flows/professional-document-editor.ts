
'use server';
/**
 * @fileOverview An advanced AI document editor that revises text based on a prompt.
 *
 * - editDocument - A function that handles the document revision process.
 * - ProfessionalDocumentEditorInput - The input type for the editDocument function.
 * - ProfessionalDocumentEditorOutput - The return type for the editDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfessionalDocumentEditorInputSchema = z.object({
  originalText: z.string().describe("The original text to be edited."),
  editPrompt: z.string().describe('A prompt describing the desired edits (e.g., "Make this more professional").'),
});
export type ProfessionalDocumentEditorInput = z.infer<typeof ProfessionalDocumentEditorInputSchema>;

const ProfessionalDocumentEditorOutputSchema = z.object({
  editedContent: z.string().describe('The professionally revised and formatted document content in clean markdown.'),
});
export type ProfessionalDocumentEditorOutput = z.infer<typeof ProfessionalDocumentEditorOutputSchema>;

export async function editDocument(input: ProfessionalDocumentEditorInput): Promise<ProfessionalDocumentEditorOutput> {
  return professionalDocumentEditorFlow(input);
}

const textEditingPrompt = ai.definePrompt({
  name: 'professionalDocumentEditorTextPrompt',
  input: {schema: z.object({
    originalText: ProfessionalDocumentEditorInputSchema.shape.originalText,
    editPrompt: ProfessionalDocumentEditorInputSchema.shape.editPrompt,
  })},
  output: {schema: z.object({
    editedContent: ProfessionalDocumentEditorOutputSchema.shape.editedContent
  })},
  prompt: `You are an advanced professional document editor AI. Your task is to revise and enhance the document text based on the user's edit prompt.

### User's Edit Prompt:
"{{{editPrompt}}}"

### Goals:

1.  **Tone & Clarity**: Revise the text to match the user's prompt. Make it clear and engaging.
2.  **Grammar & Spelling**: Correct all grammatical errors, punctuation mistakes, and spelling issues.
3.  **Structure & Flow**: Improve the logical flow. Add headings and subheadings where appropriate using markdown.
4.  **Content Enhancement**: Preserve technical accuracy while improving clarity.
5.  **Return Format**: Return the revised document in clean markdown format in the 'editedContent' field.

---

### Document to Edit:

"""
{{{originalText}}}
"""
`,
});

const professionalDocumentEditorFlow = ai.defineFlow(
  {
    name: 'professionalDocumentEditorFlow',
    inputSchema: ProfessionalDocumentEditorInputSchema,
    outputSchema: ProfessionalDocumentEditorOutputSchema,
  },
  async ({ originalText, editPrompt }) => {
    // 1. Get the edited text from the AI
    const { output } = await textEditingPrompt({ originalText, editPrompt });
    if (!output?.editedContent) {
        throw new Error('Failed to get edited content from the model.');
    }
    
    return { 
        editedContent: output.editedContent,
    };
  }
);


'use server';
/**
 * @fileOverview A document generation AI agent.
 *
 * - generateDocument - A function that handles the document generation process.
 * - GenerateDocumentInput - The input type for the generateDocument function.
 * - GenerateDocumentOutput - The return type for the generateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getUserData, updateImageCount } from './user-data';
import type { Subscription } from '@/hooks/use-subscription';


const GenerateDocumentInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the document.'),
  documentType: z.enum(['essay', 'report', 'letter', 'meeting-agenda', 'project-proposal', 'presentation', 'timetable']).default('essay').describe('The type of document to generate.'),
  format: z.enum(['DOCX', 'PDF', 'TXT']).default('PDF').describe('The format of the document to generate.'),
  pageSize: z.enum(['A4', 'A3', 'A5']).default('A4').describe('The page size for the document.'),
  pageCount: z.number().min(1).max(30).default(1).describe('The number of pages for the document.'),
  qualityLevel: z.enum(['medium', 'high', 'ultra']).default('high').describe('The quality level for the document generation. "Ultra" will be more detailed and take longer.'),
  numImages: z.number().min(0).max(15).default(0).describe('The number of AI-generated images to include in the document.'),
  theme: z.enum(['professional', 'creative', 'minimalist']).default('professional').describe('The overall theme and style of the document.'),
  font: z.enum([
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Merriweather',
    'Playfair Display',
    'Nunito',
    'Raleway',
    'Source Code Pro',
    'Lora',
    'PT Sans',
    'Poppins',
    'Caveat',
    'Dancing Script',
    'Patrick Hand',
    'Indie Flower'
  ]).default('Roboto').describe('The font family for the document.'),
  generateTemplate: z.boolean().default(true).describe('For presentations, whether to generate an AI template with background images.'),
  userId: z.string().optional().describe('The user ID for quota checking.'),
  subscription: z.custom<Subscription>().optional().describe('The user\'s subscription status.'),
});
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

const PageSchema = z.object({
  title: z.string().optional().describe("For presentations, the title of the slide. For other documents, this can be empty."),
  content: z.string().describe("The text content for this page. This should be well-written and relevant to the user's prompt and theme. Use markdown for formatting like headings, bold text, and lists. If a content image is requested, include an image tag like `![Alt text](placeholder)` where it should appear."),
  imagePrompt: z.string().optional().describe("If an image is relevant for this page, provide a concise, descriptive prompt for an image generation model that matches the document's theme. For example: 'A clean infographic diagram of the 4-step process.' or 'A vector illustration of a bar chart showing growth.'")
});

const DocumentThemeSchema = z.object({
    backgroundColor: z.string().describe("A CSS background color for the main content area of the page (e.g., '#ffffff'). For presentations, this should be dark (e.g., '#111827')"),
    textColor: z.string().describe("A CSS color value for the main text (e.g., '#333333'). For presentations, this should be light (e.g., '#F9FAFB')"),
    headingColor: z.string().describe("A CSS color value for headings (e.g., '#111111'). For presentations, this should be a vibrant accent color."),
    backgroundPrompt: z.string().describe("A creative prompt for an image generation model to create a decorative border or frame for the document. The design should stay on the edges and not interfere with text readability. For example: 'A soft, abstract watercolor wash as a page border', or 'A minimalist geometric pattern with thin gold lines to frame the page'. For presentations, this should be abstract and visually consistent for a template.")
});

const GenerateDocumentOutputSchema = z.object({
  pages: z.array(z.object({
    content: z.string().describe("The text content for this page, formatted as an HTML string."),
    markdownContent: z.string().describe("The raw markdown content for this page."),
    imageDataUri: z.string().optional().describe("The base64 encoded data URI of the generated image for this page, if any."),
  })).describe('An array of pages, each containing content and an optional image.'),
  theme: z.object({
    backgroundColor: z.string(),
    textColor: z.string(),
    headingColor: z.string(),
    backgroundImageDataUri: z.string().optional().describe("The base64 encoded data URI of the generated background/border image for the document theme."),
  }).describe("The generated visual theme for the document."),
  isPresentation: z.boolean().optional().describe("A flag to indicate if the output is a presentation."),
});
export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;

export async function generateDocument(input: GenerateDocumentInput): Promise<GenerateDocumentOutput> {
  return generateDocumentFlow(input);
}

const textGenerationPrompt = ai.definePrompt({
    name: 'generateDocumentTextPrompt',
    input: {schema: GenerateDocumentInputSchema.extend({ isPresentation: z.boolean(), isTimetable: z.boolean() })},
    output: {schema: z.object({ pages: z.array(PageSchema), theme: DocumentThemeSchema })},
    prompt: `You are an AI document creator and art director. Your main task is to generate the complete content for a '{{{documentType}}}' and a matching visual theme based on the user's request.

**Overall Goal:** The user wants to create a '{{{documentType}}}' about the following topic: "{{{prompt}}}".

**Your Task Breakdown:**

**1. Content Generation (The 'pages' field):**
   - You MUST write the full content for the document, directly addressing the user's prompt.
   - The content must be high-quality, well-structured, and formatted using markdown (e.g., # for headings, * for lists).
   - The document MUST have exactly {{{pageCount}}} pages (or slides).
   - **Structure Rules:**
     - {{#if isPresentation}}The structure must be: A Title Slide (short, catchy title based on the prompt), followed by content slides, and a final "Thank You" or "Q&A" slide. Distribute the content logically across the {{{pageCount}}} slides.{{/if}}
     - {{#if isTimetable}}You are an expert scheduler. Generate a timetable as a single-page markdown table. The 'content' field for the single page must contain ONLY the markdown table. The title field can be the main title of the timetable.{{/if}}
   - **Image Integration:**
     - You have a budget to generate exactly {{{numImages}}} images.
     - You must distribute these images across the pages where they are most effective by generating a unique and descriptive 'imagePrompt' for each.
     - Image prompts should be for clean, vector-style illustrations or infographics on a plain white background.
     - Do not generate more or fewer than {{{numImages}}} image prompts in total. If numImages is 0, do not generate any image prompts.

**2. Visual Theme Generation (The 'theme' field):**
   - You MUST define a visual style in the 'theme' output that matches the user's requested '{{{theme}}}' style.
   - **Color Palette Rules:**
     - **professional:** Use a white background ('#ffffff'), dark text, and a professional heading color.
     - **creative:** Use an off-white background, vibrant colors, and an artistic style.
     - **minimalist:** Use an off-white background, dark grey text, and a simple, elegant style.
     - **presentation:** For presentations, ALWAYS use a dark background (e.g., '#111827'), light text, and a vibrant heading color.
   - **Background/Border Generation (CRITICAL):**
     - You MUST ALWAYS generate a 'backgroundPrompt' for a decorative page border or background for ALL document types.
     - The background design should be subtle and not interfere with text readability.
     - Examples: 'A minimalist geometric pattern with thin gold lines to frame the page' for a professional document, or 'A soft, abstract watercolor wash as a page border' for a creative one. For presentations, this must be a consistent, abstract, professional template background.

**Generation Quality:** The quality for this entire generation (text and image prompts) must be '{{{qualityLevel}}}'.

Now, based on all these instructions, generate the complete 'pages' and 'theme' objects.
`,
});

const generateImage = async (prompt: string): Promise<string | undefined> => {
    if (!prompt) return undefined;
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt,
            config: { responseModalities: ['TEXT', 'IMAGE'] },
        });
        return media?.url;
    } catch (e) {
        console.error("Image generation failed for prompt:", prompt, e);
        return undefined;
    }
};

const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {
    const { marked } = await import('marked');

    const isPresentation = input.documentType === 'presentation';
    const isTimetable = input.documentType === 'timetable';

    const totalImagesToGenerate = input.numImages + (input.theme === 'professional' ? 0 : 1);

    if (totalImagesToGenerate > 0) {
        if (!input.userId) {
            throw new Error("Image generation is disabled for guest users. Please sign in.");
        }
        if (input.subscription?.status !== 'active' && input.subscription?.status !== 'trial') {
            const userData = await getUserData(input.userId);
            if (userData.imageGenerationCount + totalImagesToGenerate > 10) {
                throw new Error("Daily image generation limit (10) exceeded. Please upgrade to a premium plan for unlimited images or try again tomorrow.");
            }
        }
    }

    const {output: textOutput} = await textGenerationPrompt({
        ...input,
        isPresentation,
        isTimetable,
    });
    if (!textOutput?.pages || !textOutput?.theme) {
      throw new Error('Failed to generate document content or theme from the model.');
    }

    const allImagePrompts: (string | undefined)[] = [
        textOutput.theme.backgroundPrompt,
        ...textOutput.pages.map(p => p.imagePrompt)
    ];
    
    const generationPromises = allImagePrompts.map(prompt => generateImage(prompt || ''));
    const generatedImages = await Promise.all(generationPromises);

    const backgroundImageDataUri = generatedImages[0];
    const pageImageUris = generatedImages.slice(1);
    
    if (input.userId && totalImagesToGenerate > 0) {
        await updateImageCount({ userId: input.userId, count: totalImagesToGenerate });
    }

    const finalPages = textOutput.pages.map((page, index) => {
        const titleHtml = page.title ? `<h1>${page.title}</h1>` : '';
        const titleMarkdown = page.title ? `# ${page.title}\n\n` : '';
        let contentHtml = marked.parse(page.content) as string;
        
        const imageDataUri = pageImageUris[index];
        if (imageDataUri) {
            const imageHtml = `<img src="${imageDataUri}" alt="Generated content image" style="max-height: 300px; margin: 1rem auto; border-radius: 0.5rem; background-color: white; padding: 0.5rem;" data-ai-hint="infographic diagram" />`;
            if (contentHtml.includes('(placeholder)')) {
                 contentHtml = contentHtml.replace(/<p>!\[.*?\]\(placeholder\)<\/p>/, imageHtml);
            } else {
                contentHtml += imageHtml;
            }
        }
        
        return {
            content: titleHtml + contentHtml,
            markdownContent: titleMarkdown + page.content,
            imageDataUri: imageDataUri,
        };
    });

    return {
        pages: finalPages,
        theme: {
            backgroundColor: textOutput.theme.backgroundColor,
            textColor: textOutput.theme.textColor,
            headingColor: textOutput.theme.headingColor,
            backgroundImageDataUri: backgroundImageDataUri,
        },
        isPresentation: isPresentation,
    };
  }
);

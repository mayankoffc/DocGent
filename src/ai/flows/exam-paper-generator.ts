
'use server';
/**
 * @fileOverview An AI-powered exam paper generator.
 *
 * - generateExamPaper - A function that handles the exam paper generation process.
 * - GenerateExamPaperInput - The input type for the generateExamPaper function.
 * - GenerateExamPaperOutput - The return type for the generateExamPaper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExamPaperInputSchema = z.object({
  examTitle: z.string().describe("The main title for the exam paper."),
  standard: z.string().describe("The standard or grade level for the exam (e.g., 10th, 12th)."),
  subject: z.string().describe("The subject of the exam (e.g., Physics, History)."),
  curriculum: z.enum(['ncert', 'nios', 'board']).describe("The educational board or curriculum to follow (e.g., NCERT, NIOS)."),
  syllabus: z.string().describe("A detailed list of chapters, topics, or concepts to be included in the exam."),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("The difficulty level of the questions."),
  numQuestions: z.number().int().min(1).describe("The exact number of questions to generate. This is ONLY used if isMCQOnly is true."),
  totalMarks: z.string().describe("The total marks for the exam (e.g., '100')."),
  timeAllotted: z.string().describe("The time duration for the exam (e.g., '3 Hours')."),
  includePYQs: z.boolean().describe("Whether to include questions based on Previous Year Questions (PYQs) and competitive exam patterns."),
  addAnswerKey: z.boolean().describe("Whether to generate a detailed, solved answer key for the paper."),
  language: z.enum(['english', 'hindi']).default('english').describe("The language for the exam paper."),
  isMCQOnly: z.boolean().optional().describe("Whether to generate only Multiple Choice Questions."),
  competencyPercentage: z.number().min(0).max(100).optional().describe("The percentage of competency-based questions."),
  useOriginalQuestions: z.boolean().optional().describe("Whether to generate new, original AI-created practice questions."),
  generateBlueprint: z.boolean().optional().describe("Whether to generate a blueprint of the exam paper."),
  isSectionWise: z.boolean().optional().describe("Whether to use the section-wise question generation mode."),
  numMCQs: z.number().optional().describe("Number of Multiple Choice Questions (1 mark each)."),
  num1Mark: z.number().optional().describe("Number of 1-mark questions."),
  num2Mark: z.number().optional().describe("Number of 2-mark questions."),
  num3Mark: z.number().optional().describe("Number of 3-mark questions."),
  num4Mark: z.number().optional().describe("Number of 4-mark questions."),
});
export type GenerateExamPaperInput = z.infer<typeof GenerateExamPaperInputSchema>;

const GenerateExamPaperOutputSchema = z.object({
  examPaperContent: z.string().describe("The fully generated exam paper content, formatted and ready to be displayed. It should contain the header and a numbered list of questions."),
  answerKeyContent: z.string().optional().describe("The detailed, solved answer key content, if requested. Formatted and ready to be displayed."),
  blueprintContent: z.string().optional().describe("The generated blueprint of the exam, showing the distribution of marks across chapters and question types in a markdown table."),
});
export type GenerateExamPaperOutput = z.infer<typeof GenerateExamPaperOutputSchema>;

export async function generateExamPaper(input: GenerateExamPaperInput): Promise<GenerateExamPaperOutput> {
  return generateExamPaperFlow(input);
}

const validateExamMarks = ai.defineTool(
  {
    name: 'validateExamMarks',
    description: 'Validates if the sum of marks for all proposed questions equals the total marks. For non-MCQ papers, it also validates the question count if provided.',
    inputSchema: z.object({
      proposedMarks: z.array(z.number()).describe('An array of numbers, where each number is the mark for a single question.'),
      totalMarks: z.number().describe('The total marks the exam paper should have.'),
      numQuestions: z.number().optional().describe('The total number of questions the exam paper should have (if specified).'),
    }),
    outputSchema: z.boolean(),
  },
  async ({ proposedMarks, totalMarks, numQuestions }) => {
    const sum = proposedMarks.reduce((a, b) => a + b, 0);
    const count = proposedMarks.length;
    // If numQuestions is provided, both count and sum must match. Otherwise, just the sum.
    const countMatches = numQuestions ? count === numQuestions : true;
    return sum === totalMarks && countMatches;
  }
);


const textGenerationPrompt = ai.definePrompt({
  name: 'generateExamPaperTextPrompt',
  tools: [validateExamMarks],
  input: {schema: GenerateExamPaperInputSchema.extend({
    isNcert: z.boolean(),
    isNios: z.boolean(),
  })},
  output: {schema: z.object({
    examPaperContent: GenerateExamPaperOutputSchema.shape.examPaperContent,
    answerKeyContent: GenerateExamPaperOutputSchema.shape.answerKeyContent,
    blueprintContent: GenerateExamPaperOutputSchema.shape.blueprintContent,
  })},
  prompt: `Exam Paper Generator. Use validateExamMarks tool FIRST to validate marks sum={{{totalMarks}}}.

**Specs:** Title={{{examTitle}}}, Std={{{standard}}}, Sub={{{subject}}}, Lang={{{language}}}, Curriculum={{{curriculum}}}, Difficulty={{{difficulty}}}, Time={{{timeAllotted}}}, Marks={{{totalMarks}}}
**Syllabus:** {{{syllabus}}}

**Mode:**
{{#if isSectionWise}}Section-wise: MCQ={{{numMCQs}}}, 1M={{{num1Mark}}}, 2M={{{num2Mark}}}, 3M={{{num3Mark}}}, 4M={{{num4Mark}}}
{{else if isMCQOnly}}MCQ Only: {{{numQuestions}}} questions, 4 options each (A-D)
{{else}}Standard: Mix of MCQ, Short, Long answers{{/if}}

**Style:** {{#if competencyPercentage}}Competency={{{competencyPercentage}}}%{{/if}} {{#if includePYQs}}PYQ-pattern{{/if}} {{#if useOriginalQuestions}}Original-only{{/if}}

**Format:** Markdown, Header(#title,time,marks), Instructions, Questions with [marks] at end
{{#if addAnswerKey}}**AnswerKey:** Full solutions, markdown headings per answer{{/if}}
{{#if generateBlueprint}}**Blueprint:** Table |Chapter|QType|Marks|{{/if}}

Generate now.`,
});

const generateExamPaperFlow = ai.defineFlow(
  {
    name: 'generateExamPaperFlow',
    inputSchema: GenerateExamPaperInputSchema,
    outputSchema: GenerateExamPaperOutputSchema,
  },
  async input => {
    let finalInput = { ...input };

    if (input.isSectionWise) {
        const numMCQs = input.numMCQs || 0;
        const num1Mark = input.num1Mark || 0;
        const num2Mark = input.num2Mark || 0;
        const num3Mark = input.num3Mark || 0;
        const num4Mark = input.num4Mark || 0;
        
        const totalQuestions = numMCQs + num1Mark + num2Mark + num3Mark + num4Mark;
        finalInput.numQuestions = totalQuestions;
    }
    
    const llmResponse = await textGenerationPrompt({
        ...finalInput,
        isNcert: input.curriculum === 'ncert',
        isNios: input.curriculum === 'nios',
    });
    
    // After calling the prompt, check if the tool call was successful and handled.
    // The prompt instructs the model to stop if validation fails, which can result in empty content.
    if (!llmResponse.output?.examPaperContent) {
        const toolRequest = llmResponse.references?.[0]?.part.toolRequest;
        if(toolRequest?.name === 'validateExamMarks' && toolRequest?.output === false) {
             throw new Error(
                'AI failed to create a valid question paper structure. The sum of marks for the generated questions did not match the total marks requested. Please check your "Total Marks" or try again.'
            );
        }
      throw new Error('Failed to generate exam paper content. The AI model did not return the expected output.');
    }

    return {
        examPaperContent: llmResponse.output.examPaperContent,
        answerKeyContent: llmResponse.output.answerKeyContent,
        blueprintContent: llmResponse.output.blueprintContent,
    };
  }
);

'use server';
/**
 * @fileOverview A server-side flow to convert documents from one format to another.
 *
 * - convertDocument - The main function to handle the conversion process.
 * - ConvertDocumentInput - The input type for the function.
 * - ConvertDocumentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument, rgb } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

const ConvertDocumentInputSchema = z.object({
  fileDataUri: z.string().describe('The base64 encoded data URI of the file to convert.'),
  sourceFileName: z.string().describe('The original name of the file.'),
  targetFormat: z.string().describe('The target format to convert to (e.g., "pdf", "docx", "txt").'),
});

const ConvertDocumentOutputSchema = z.object({
  convertedFileDataUri: z.string().describe('The base64 encoded data URI of the converted file.'),
  convertedFileName: z.string().describe('The name of the converted file.'),
});

export type ConvertDocumentInput = z.infer<typeof ConvertDocumentInputSchema>;
export type ConvertDocumentOutput = z.infer<typeof ConvertDocumentOutputSchema>;

/**
 * Extract the source file format from the filename
 */
function getSourceFormat(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return extension;
}

/**
 * Convert base64 data URI to Buffer
 */
function dataUriToBuffer(dataUri: string): Buffer {
  const base64String = dataUri.split(',')[1];
  return Buffer.from(base64String, 'base64');
}

/**
 * Extract text from PDF using pdfjs-dist
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    // Set up PDF.js worker
    const pdfWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.js`;
    GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

    const pdf = await getDocument({ data: new Uint8Array(fileBuffer) }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
      }
    }

    return fullText || 'Unable to extract text from PDF.';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or encrypted.');
  }
}

/**
 * Create a PDF from text content
 */
async function createPdfFromText(textContent: string, fileName: string): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const pageSize = { width: 612, height: 792 }; // Letter size

    // Split text into lines that fit on page
    const lines = textContent.split('\n');
    const maxCharsPerLine = 80;
    const maxLinesPerPage = 40;
    const wrappedLines: string[] = [];

    for (const line of lines) {
      if (line.length === 0) {
        wrappedLines.push('');
      } else {
        let currentLine = '';
        const words = line.split(' ');
        for (const word of words) {
          if ((currentLine + ' ' + word).length > maxCharsPerLine) {
            wrappedLines.push(currentLine.trim());
            currentLine = word;
          } else {
            currentLine += (currentLine ? ' ' : '') + word;
          }
        }
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      }
    }

    let currentPage = pdfDoc.addPage([pageSize.width, pageSize.height]);
    let yPosition = pageSize.height - 40;
    let lineCount = 0;

    const fontSize = 12;
    const lineHeight = fontSize + 4;

    for (const line of wrappedLines) {
      if (lineCount >= maxLinesPerPage) {
        currentPage = pdfDoc.addPage([pageSize.width, pageSize.height]);
        yPosition = pageSize.height - 40;
        lineCount = 0;
      }

      currentPage.drawText(line || ' ', {
        x: 40,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
      lineCount++;
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error creating PDF from text:', error);
    throw new Error('Failed to create PDF from text.');
  }
}

export async function convertDocument(
  input: ConvertDocumentInput
): Promise<ConvertDocumentOutput> {
  return convertDocumentFlow(input);
}

const convertDocumentFlow = ai.defineFlow(
  {
    name: 'convertDocumentFlow',
    inputSchema: ConvertDocumentInputSchema,
    outputSchema: ConvertDocumentOutputSchema,
  },
  async (input) => {
    try {
      const sourceFormat = getSourceFormat(input.sourceFileName);
      const targetFormat = input.targetFormat.toLowerCase();
      const originalFileName = input.sourceFileName.substring(0, input.sourceFileName.lastIndexOf('.'));
      const convertedFileName = `${originalFileName}.${targetFormat}`;

      // Check for DOCX conversion (not supported)
      if (targetFormat === 'docx') {
        throw new Error('DOCX conversion coming soon. We are working on DOCX support!');
      }

      // Convert base64 data URI to buffer
      const fileBuffer = dataUriToBuffer(input.fileDataUri);

      let convertedContent: Buffer | Uint8Array;
      let mimeType = 'text/plain';

      // Handle PDF source conversions
      if (sourceFormat === 'pdf') {
        if (targetFormat === 'txt') {
          // PDF to TXT: Extract text
          const textContent = await extractTextFromPdf(fileBuffer);
          convertedContent = Buffer.from(textContent, 'utf-8');
          mimeType = 'text/plain';
        } else if (targetFormat === 'html') {
          // PDF to HTML: Extract text and wrap in HTML
          const textContent = await extractTextFromPdf(fileBuffer);
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${originalFileName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
        }
        pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>${originalFileName}</h1>
    <pre>${textContent}</pre>
</body>
</html>`;
          convertedContent = Buffer.from(htmlContent, 'utf-8');
          mimeType = 'text/html';
        } else if (targetFormat === 'pdf') {
          // PDF to PDF: Just return the same file
          convertedContent = fileBuffer;
          mimeType = 'application/pdf';
        } else {
          throw new Error(`Conversion from PDF to ${targetFormat.toUpperCase()} is not supported.`);
        }
      } else if (sourceFormat === 'txt') {
        // Handle TXT source conversions
        const textContent = fileBuffer.toString('utf-8');

        if (targetFormat === 'pdf') {
          // TXT to PDF: Create PDF from text
          convertedContent = await createPdfFromText(textContent, originalFileName);
          mimeType = 'application/pdf';
        } else if (targetFormat === 'html') {
          // TXT to HTML
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${originalFileName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
        }
        pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>${originalFileName}</h1>
    <pre>${textContent}</pre>
</body>
</html>`;
          convertedContent = Buffer.from(htmlContent, 'utf-8');
          mimeType = 'text/html';
        } else if (targetFormat === 'txt') {
          // TXT to TXT: Just return the same file
          convertedContent = fileBuffer;
          mimeType = 'text/plain';
        } else {
          throw new Error(`Conversion from TXT to ${targetFormat.toUpperCase()} is not supported.`);
        }
      } else if (sourceFormat === 'html') {
        // Handle HTML source conversions
        const htmlContent = fileBuffer.toString('utf-8');

        if (targetFormat === 'txt') {
          // HTML to TXT: Strip HTML tags
          const textContent = htmlContent
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
          convertedContent = Buffer.from(textContent, 'utf-8');
          mimeType = 'text/plain';
        } else if (targetFormat === 'pdf') {
          // HTML to PDF: Convert HTML to text first, then to PDF
          const textContent = htmlContent
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
          convertedContent = await createPdfFromText(textContent, originalFileName);
          mimeType = 'application/pdf';
        } else if (targetFormat === 'html') {
          // HTML to HTML: Return as-is
          convertedContent = fileBuffer;
          mimeType = 'text/html';
        } else {
          throw new Error(`Conversion from HTML to ${targetFormat.toUpperCase()} is not supported.`);
        }
      } else {
        throw new Error(`Conversion from ${sourceFormat.toUpperCase()} is not supported. Supported formats: PDF, TXT, HTML.`);
      }

      // Convert to base64
      const base64Content = Buffer.from(convertedContent).toString('base64');
      const convertedFileDataUri = `data:${mimeType};base64,${base64Content}`;

      return {
        convertedFileDataUri,
        convertedFileName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during conversion.';
      throw new Error(errorMessage);
    }
  }
);

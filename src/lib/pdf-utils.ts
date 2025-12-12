
'use client';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// The workerSrc is set globally in the component that uses this utility,
// ensuring it runs only on the client-side and has the correct path.

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file to process.
 * @returns A promise that resolves with the extracted text.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  if (!GlobalWorkerOptions.workerSrc) {
    throw new Error('PDF.js worker is not configured. Please ensure it is set in the calling component.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
}

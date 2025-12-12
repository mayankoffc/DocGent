
'use server';
/**
 * @fileOverview A server-side flow to add text or image watermarks to a PDF.
 *
 * - addWatermark - The main function to handle the watermarking process.
 * - AddWatermarkInput - The input type for the function.
 * - AddWatermarkOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const AddWatermarkInputSchema = z.object({
    pdfDataUri: z.string().describe("The source PDF file as a data URI."),
    watermarkType: z.enum(['text', 'image']).describe("The type of watermark to add."),
    watermarkText: z.string().optional().describe("The text content for the watermark."),
    watermarkImageDataUri: z.string().optional().describe("The image data URI for the logo watermark."),
    position: z.enum(['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center', 'diagonal']).describe("Position of the watermark on the page."),
    opacity: z.number().min(0).max(1).describe("The opacity of the watermark (0.0 to 1.0)."),
    fontSize: z.number().min(8).max(144).optional().describe("Font size for text watermarks."),
    angle: z.number().min(0).max(90).default(0).describe("The rotation angle of the watermark in degrees."),
    logoScale: z.number().min(0.01).max(1).default(0.25).describe("The scale of the logo image (1% to 100%)."),
});
export type AddWatermarkInput = z.infer<typeof AddWatermarkInputSchema>;

const AddWatermarkOutputSchema = z.object({
  cleanedPdfDataUri: z.string().describe("The data URI of the PDF with the watermark added."),
});
export type AddWatermarkOutput = z.infer<typeof AddWatermarkOutputSchema>;

export async function addWatermark(input: AddWatermarkInput): Promise<AddWatermarkOutput> {
  return addWatermarkFlow(input);
}

const addWatermarkFlow = ai.defineFlow(
  {
    name: 'addWatermarkFlow',
    inputSchema: AddWatermarkInputSchema,
    outputSchema: AddWatermarkOutputSchema,
  },
  async (input) => {
    const { pdfDataUri, watermarkType, watermarkText, watermarkImageDataUri, position, opacity, fontSize, angle, logoScale } = input;

    const pdfBuffer = Buffer.from(pdfDataUri.substring(pdfDataUri.indexOf(',') + 1), 'base64');
    
    const pdfDoc = await PDFDocument.load(pdfBuffer, { 
        updateMetadata: false 
    });
    
    let watermarkImage;
    if (watermarkType === 'image' && watermarkImageDataUri) {
        const imageBuffer = Buffer.from(watermarkImageDataUri.substring(watermarkImageDataUri.indexOf(',') + 1), 'base64');
        if (watermarkImageDataUri.startsWith('data:image/png')) {
            watermarkImage = await pdfDoc.embedPng(imageBuffer);
        } else if (watermarkImageDataUri.startsWith('data:image/jpeg')) {
            watermarkImage = await pdfDoc.embedJpg(imageBuffer);
        } else {
             throw new Error("Unsupported watermark image type. Please use PNG or JPEG.");
        }
    }
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();

    for (const page of pages) {
        const { width, height } = page.getSize();
        
        if (watermarkType === 'text' && watermarkText) {
            const textWidth = font.widthOfTextAtSize(watermarkText, fontSize || 50);
            const textHeight = font.heightAtSize(fontSize || 50);
            
            let x, y;
            const padding = 20;
            const rotation = degrees(angle);
            
            const centerX = (width - textWidth) / 2;
            const centerY = (height - textHeight) / 2;

            switch (position) {
                case 'topLeft': x = padding; y = height - textHeight - padding; break;
                case 'topRight': x = width - textWidth - padding; y = height - textHeight - padding; break;
                case 'bottomLeft': x = padding; y = padding; break;
                case 'bottomRight': x = width - textWidth - padding; y = padding; break;
                case 'diagonal':
                    page.drawText(watermarkText, {
                        x: centerX,
                        y: centerY + textHeight / 4, 
                        font,
                        size: fontSize || 50,
                        color: rgb(0.5, 0.5, 0.5),
                        opacity: opacity,
                        rotate: degrees(-45),
                        wordBreaks: [' '],
                    });
                    continue; 
                default: x = centerX; y = centerY;
            }

            page.drawText(watermarkText, {
                x, y, font,
                size: fontSize || 50,
                color: rgb(0.5, 0.5, 0.5),
                opacity: opacity,
                rotate: rotation,
            });

        } else if (watermarkType === 'image' && watermarkImage) {
            const imageDims = watermarkImage.scale(logoScale); 

            let x, y;
            const padding = 20;
            const rotation = degrees(angle);

            switch (position) {
                case 'topLeft': x = padding; y = height - imageDims.height - padding; break;
                case 'topRight': x = width - imageDims.width - padding; y = height - imageDims.height - padding; break;
                case 'bottomLeft': x = padding; y = padding; break;
                case 'bottomRight': x = width - imageDims.width - padding; y = padding; break;
                default: x = (width - imageDims.width) / 2; y = (height - imageDims.height) / 2;
            }

            page.drawImage(watermarkImage, {
                x, y,
                width: imageDims.width,
                height: imageDims.height,
                opacity: opacity,
                rotate: rotation,
            });
        }
    }
    
    const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const modifiedPdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');
    const cleanedPdfDataUri = `data:application/pdf;base64,${modifiedPdfBase64}`;

    return { cleanedPdfDataUri };
  }
);

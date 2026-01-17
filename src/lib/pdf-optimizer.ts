import { PDFDocument } from 'pdf-lib';

export interface PDFOptimizationOptions {
  compression?: 'none' | 'low' | 'medium' | 'high' | 'maximum';
  maxSizeMB?: number;
  optimizeImages?: boolean;
  embedFonts?: boolean;
}

/**
 * Get user's PDF optimization settings from localStorage
 */
export function getUserPDFSettings(): PDFOptimizationOptions {
  if (typeof window === 'undefined') return {};
  
  return {
    compression: (localStorage.getItem('pdfCompression') as any) || 'medium',
    maxSizeMB: parseInt(localStorage.getItem('maxDownloadSize') || '10'),
    optimizeImages: localStorage.getItem('autoOptimize') === 'true',
    embedFonts: localStorage.getItem('embedFonts') !== 'false',
  };
}

/**
 * Get compression quality based on compression level
 */
function getCompressionQuality(level: string): number {
  switch(level) {
    case 'none': return 1.0;
    case 'low': return 0.9;
    case 'medium': return 0.75;
    case 'high': return 0.6;
    case 'maximum': return 0.4;
    default: return 0.75;
  }
}

/**
 * Optimize PDF based on user settings
 */
export async function optimizePDF(
  pdfBytes: Uint8Array,
  options?: PDFOptimizationOptions
): Promise<Uint8Array> {
  const settings = options || getUserPDFSettings();
  
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Set compression options
    const compressionQuality = getCompressionQuality(settings.compression || 'medium');
    
    // Get all pages
    const pages = pdfDoc.getPages();
    
    // Optimize images if enabled
    if (settings.optimizeImages) {
      // Note: pdf-lib doesn't have direct image compression
      // This is a placeholder for future implementation with sharp/jimp
      console.log('Image optimization requested - quality:', compressionQuality);
    }
    
    // Save with compression
    const optimizedBytes = await pdfDoc.save({
      useObjectStreams: settings.compression !== 'none',
    });
    
    // Check size limit
    if (settings.maxSizeMB) {
      const sizeMB = optimizedBytes.length / (1024 * 1024);
      if (sizeMB > settings.maxSizeMB) {
        console.warn(`PDF size (${sizeMB.toFixed(2)}MB) exceeds limit (${settings.maxSizeMB}MB)`);
        // Could throw error or further compress here
      }
    }
    
    return optimizedBytes;
  } catch (error) {
    console.error('PDF optimization failed:', error);
    // Return original if optimization fails
    return pdfBytes;
  }
}

/**
 * Get default page size in points (72 points = 1 inch)
 */
export function getPageSize(size: string = 'A4'): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    'A4': { width: 595, height: 842 },      // 210 x 297 mm
    'A3': { width: 842, height: 1191 },     // 297 x 420 mm
    'A5': { width: 420, height: 595 },      // 148 x 210 mm
    'Letter': { width: 612, height: 792 },  // 8.5 x 11 inches
    'Legal': { width: 612, height: 1008 },  // 8.5 x 14 inches
  };
  
  return sizes[size] || sizes['A4'];
}

/**
 * Apply orientation to page size
 */
export function applyOrientation(
  size: { width: number; height: number },
  orientation: string = 'portrait'
): { width: number; height: number } {
  if (orientation === 'landscape') {
    return { width: size.height, height: size.width };
  }
  return size;
}

/**
 * Get user's default page dimensions
 */
export function getUserPageDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 595, height: 842 }; // Default A4
  }
  
  const pageSize = localStorage.getItem('defaultPageSize') || 'A4';
  const orientation = localStorage.getItem('defaultOrientation') || 'portrait';
  
  const size = getPageSize(pageSize);
  return applyOrientation(size, orientation);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(originalSize: number, compressedSize: number): string {
  const ratio = ((originalSize - compressedSize) / originalSize) * 100;
  return ratio.toFixed(1) + '%';
}

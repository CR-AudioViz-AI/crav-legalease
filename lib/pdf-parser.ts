import pdf from 'pdf-parse';
import { getErrorMessage, logError, formatApiError } from '@/lib/utils/error-utils';

export interface PDFParseResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount: number;
  };
  pages: string[];
}

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    const data = await pdf(buffer);
    
    return {
      text: data.text,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate,
        modificationDate: data.info?.ModDate,
        pageCount: data.numpages,
      },
      pages: extractPages(data.text, data.numpages),
    };
  } catch (error: unknown) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractPages(text: string, pageCount: number): string[] {
  // Simple page splitting - can be enhanced
  const avgCharsPerPage = text.length / pageCount;
  const pages: string[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    const start = Math.floor(i * avgCharsPerPage);
    const end = Math.floor((i + 1) * avgCharsPerPage);
    pages.push(text.slice(start, end));
  }
  
  return pages;
}

export function validatePDF(buffer: Buffer): boolean {
  // Check PDF signature
  const signature = buffer.toString('utf8', 0, 5);
  return signature === '%PDF-';
}

export function isPDFEncrypted(buffer: Buffer): boolean {
  // Simple check for encryption - look for /Encrypt in PDF
  const content = buffer.toString('utf8');
  return content.includes('/Encrypt');
}

export function cleanPDFText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/gm, '')
    .replace(/^\s+/gm, '')
    .trim();
}

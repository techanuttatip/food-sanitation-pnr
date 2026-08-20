import Tesseract from 'tesseract.js';

export interface OCRResult {
  raw_text: string;
  national_id?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  address?: string;
  confidence: number;
  processing_time_ms: number;
}

export const ocrService = {
  async extractFromImage(imageFile: File, onProgress?: (progress: number) => void): Promise<OCRResult> {
    const start = Date.now();
    const imageUrl = URL.createObjectURL(imageFile);
    
    const result = await Tesseract.recognize(
      imageUrl,
      'tha+eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        },
      }
    );
    
    URL.revokeObjectURL(imageUrl);
    const rawText = result.data.text;
    const parsed = ocrService.parseThaiIDCard(rawText);
    
    return {
      raw_text: rawText,
      confidence: result.data.confidence,
      processing_time_ms: Date.now() - start,
      ...parsed,
    };
  },

  parseThaiIDCard(rawText: string): Partial<OCRResult> {
    return {
      national_id: ocrService.extractNationalId(rawText),
      ...ocrService.extractThaiName(rawText),
      date_of_birth: ocrService.extractDateOfBirth(rawText),
    };
  },

  extractNationalId(text: string): string | undefined {
    return text.replace(/[\s-]/g, '').match(/\d{13}/)?.[0];
  },

  extractThaiName(text: string): { first_name?: string; last_name?: string } {
    const match = text.match(/(นาย|นาง|นางสาว)\s*([\u0E00-\u0E7F]+)\s+([\u0E00-\u0E7F]+)/);
    if (match) {
      return {
        first_name: match[2],
        last_name: match[3],
      };
    }
    return {};
  },

  extractDateOfBirth(text: string): string | undefined {
    const match = text.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{4})/);
    if (match) {
      return match[0];
    }
    return undefined;
  }
};

interface RecognizePriceResult {
  status: number;
  normalizedAmountKRW: number;
  extractedText?: string;
  confidence?: number;
}

interface ScanApiResponse {
  detectedAmountKRW?: number;
  amountKRW?: number;
  extractedText?: string;
  confidence?: number;
}

export async function recognizePrice(file: File): Promise<RecognizePriceResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/scan/extract-price', {
      method: 'POST',
      body: formData,
    });

    if (res.status === 200) {
      const data = (await res.json()) as ScanApiResponse;
      return {
        status: res.status,
        normalizedAmountKRW: data.detectedAmountKRW ?? data.amountKRW ?? 0,
        extractedText: data.extractedText,
        confidence: data.confidence,
      };
    }

    return { status: res.status, normalizedAmountKRW: 0 };
  } catch {
    return { status: 0, normalizedAmountKRW: 0 };
  }
}

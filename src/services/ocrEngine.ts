import { supabase } from "@/integrations/supabase/client";

export type OCRMode = "printed" | "handwriting" | "mixed";

export interface OCRResult {
  extracted_text: string;
  processing_time_ms: number;
  word_count: number;
  character_count: number;
  confidence_note: string;
}

export interface OCRError {
  error: string;
  processing_time_ms?: number;
}

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data after the data URL prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type OcrProcessBody = {
  imageBase64: string;
  fileName: string;
  fileType: string;
  mode: OCRMode;
};

async function invokeOcrProcess(body: OcrProcessBody) {
  // Ensure user is authenticated before invoking the edge function
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in to use OCR processing");
  }

  // IMPORTANT:
  // Some backend deployments reject ES256 user JWTs at the gateway level.
  // To avoid that, we call the function using the project's publishable key
  // (a valid JWT for the gateway), and pass the user's access token in the body.
  return supabase.functions.invoke("ocr-process", {
    body: {
      ...body,
      userAccessToken: session.access_token,
    },
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
}

/**
 * Process an image file with OCR
 */
export async function processImage(
  file: File,
  mode: OCRMode = "mixed"
): Promise<OCRResult> {
  const base64 = await fileToBase64(file);

  const { data, error } = await invokeOcrProcess({
    imageBase64: base64,
    fileName: file.name,
    fileType: file.type,
    mode,
  });

  if (error) {
    throw new Error(error.message || "OCR processing failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as OCRResult;
}

/**
 * Process a PDF file by extracting images from each page
 * Note: For PDFs, we convert to image on the client side using canvas
 */
export async function processPDF(
  file: File,
  mode: OCRMode = "printed"
): Promise<OCRResult> {
  // For now, we'll treat PDF as a single image extraction
  // In production, you'd use pdf.js to extract each page
  const base64 = await fileToBase64(file);

  const { data, error } = await invokeOcrProcess({
    imageBase64: base64,
    fileName: file.name,
    fileType: file.type,
    mode,
  });

  if (error) {
    throw new Error(error.message || "PDF OCR processing failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as OCRResult;
}

/**
 * Process handwritten documents
 */
export async function processHandwriting(file: File): Promise<OCRResult> {
  return processImage(file, "handwriting");
}

/**
 * Detect if a file is likely handwritten based on heuristics
 * This is a placeholder - in production you might use ML classification
 */
export function isLikelyHandwritten(fileName: string): boolean {
  const handwritingKeywords = [
    "handwritten",
    "handwriting",
    "notes",
    "notebook",
    "manuscript",
    "letter",
    "diary",
    "journal",
  ];

  const lowerName = fileName.toLowerCase();
  return handwritingKeywords.some((keyword) => lowerName.includes(keyword));
}

/**
 * Unified OCR processor that detects file type and processes accordingly
 */
export async function processDocument(
  file: File,
  mode?: OCRMode
): Promise<OCRResult> {
  // Auto-detect mode if not specified
  const detectedMode = mode || (isLikelyHandwritten(file.name) ? "handwriting" : "mixed");

  if (file.type === "application/pdf") {
    return processPDF(file, detectedMode);
  }

  if (file.type.startsWith("image/")) {
    return processImage(file, detectedMode);
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}


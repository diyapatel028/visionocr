import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OCRRequest {
  imageBase64: string;
  fileName: string;
  fileType: string;
  mode: "printed" | "handwriting" | "mixed";
  userAccessToken?: string;
}

interface OCRResponse {
  extracted_text: string;
  processing_time_ms: number;
  word_count: number;
  character_count: number;
  confidence_note: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const payload = (await req.json()) as OCRRequest;

    // Validate user authentication
    // Note: we expect the client to pass the user's access token in the body.
    // This avoids gateway-level JWT validation issues with ES256 tokens.
    const userAccessToken = payload.userAccessToken;
    if (!userAccessToken) {
      console.error("Missing userAccessToken");
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(userAccessToken);

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`OCR request from authenticated user: ${user.id}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageBase64, fileName, fileType, mode = "mixed" } = payload;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    // Base64 is approximately 33% larger than binary
    const estimatedSize = (imageBase64.length * 3) / 4;
    
    if (estimatedSize > MAX_SIZE_BYTES) {
      console.error(`File too large: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "application/pdf"];
    if (fileType && !allowedTypes.includes(fileType.toLowerCase())) {
      console.error(`Invalid file type: ${fileType}`);
      return new Response(
        JSON.stringify({ error: "Invalid file type. Allowed: PNG, JPEG, WebP, GIF, PDF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing OCR for file: ${fileName}, type: ${fileType}, mode: ${mode}, size: ${(estimatedSize / 1024).toFixed(1)}KB`);

    // Build the prompt based on OCR mode
    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "printed":
        systemPrompt = `You are an advanced OCR (Optical Character Recognition) engine. Your task is to extract ALL printed text from the provided image with perfect accuracy. 

Rules:
- Extract text exactly as it appears, preserving formatting where possible
- Maintain paragraph structure and line breaks
- Include headers, footers, captions, and any visible text
- If text is unclear, make your best interpretation but note uncertainty
- Do not add any commentary or explanations - only output the extracted text`;
        userPrompt = "Extract all printed text from this document image. Output ONLY the extracted text, nothing else.";
        break;

      case "handwriting":
        systemPrompt = `You are an advanced OCR engine specialized in handwriting recognition. Your task is to carefully read and transcribe all handwritten text from the provided image.

Rules:
- Carefully interpret handwritten characters
- Preserve the structure and flow of the writing
- If a word is unclear, provide your best interpretation
- Handle cursive, print, and mixed handwriting styles
- Do not add commentary - only output the extracted text`;
        userPrompt = "Carefully read and transcribe all handwritten text from this image. Output ONLY the extracted text, nothing else.";
        break;

      case "mixed":
      default:
        systemPrompt = `You are an advanced OCR (Optical Character Recognition) engine capable of reading both printed text and handwriting. Your task is to extract ALL text from the provided image.

Rules:
- Extract ALL visible text including printed and handwritten content
- Preserve document structure (headers, paragraphs, lists)
- Handle tables by extracting content row by row
- Include captions, annotations, and marginalia
- For unclear text, make your best interpretation
- Output ONLY the extracted text without any commentary`;
        userPrompt = "Extract all text (printed and handwritten) from this document image. Output ONLY the extracted text, maintaining the original structure.";
    }

    // Determine the image URL format
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith("data:")) {
      // Add proper data URL prefix if not present
      const mimeType = fileType || "image/png";
      imageUrl = `data:${mimeType};base64,${imageBase64}`;
    }

    // Call Lovable AI with vision capabilities
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || "";

    if (!extractedText.trim()) {
      throw new Error("No text could be extracted from the image");
    }

    const processingTime = Date.now() - startTime;
    const words = extractedText.split(/\s+/).filter(Boolean);
    
    const result: OCRResponse = {
      extracted_text: extractedText,
      processing_time_ms: processingTime,
      word_count: words.length,
      character_count: extractedText.length,
      confidence_note: mode === "handwriting" 
        ? "Handwriting recognition - accuracy may vary based on writing clarity"
        : "High confidence OCR extraction",
    };

    console.log(`OCR completed: ${result.word_count} words in ${result.processing_time_ms}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("OCR processing error:", error);
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        processing_time_ms: processingTime,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

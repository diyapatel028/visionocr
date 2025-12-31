import { cn } from "@/lib/utils";
import { Scan, Loader2 } from "lucide-react";

interface ProcessingAnimationProps {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  progress?: number;
}

export function ProcessingAnimation({ status, progress = 0 }: ProcessingAnimationProps) {
  if (status === "idle") return null;

  const statusLabels = {
    uploading: "Uploading document...",
    processing: "Extracting text with OCR...",
    complete: "Extraction complete!",
    error: "Processing failed",
    idle: "",
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
      {/* Animated scanner */}
      <div className="relative w-32 h-32">
        {/* Outer ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl border-2 transition-colors duration-300",
            status === "complete"
              ? "border-secondary"
              : status === "error"
              ? "border-destructive"
              : "border-primary/50"
          )}
        />

        {/* Scanning line */}
        {(status === "uploading" || status === "processing") && (
          <div className="absolute inset-2 overflow-hidden rounded-xl">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
          </div>
        )}

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {status === "complete" ? (
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <Scan className="w-6 h-6 text-secondary" />
            </div>
          ) : status === "error" ? (
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-2xl">✕</span>
            </div>
          ) : (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          )}
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
      </div>

      {/* Status text */}
      <div className="text-center">
        <p
          className={cn(
            "font-mono text-sm transition-colors duration-300",
            status === "complete"
              ? "text-secondary"
              : status === "error"
              ? "text-destructive"
              : "text-primary"
          )}
        >
          {statusLabels[status]}
        </p>

        {/* Progress bar */}
        {(status === "uploading" || status === "processing") && (
          <div className="mt-4 w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

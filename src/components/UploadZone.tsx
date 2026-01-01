import { useCallback, useState } from "react";
import { Upload, FileImage, FileText, X, Pencil, Type, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OCRMode } from "@/services/ocrEngine";

interface UploadZoneProps {
  onFileSelect: (file: File, mode: OCRMode) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMode, setSelectedMode] = useState<OCRMode>("mixed");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleProcess = useCallback(() => {
    if (selectedFile) {
      onFileSelect(selectedFile, selectedMode);
    }
  }, [selectedFile, selectedMode, onFileSelect]);

  const modeOptions: { value: OCRMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "printed", label: "Printed", icon: <Type className="w-4 h-4" />, desc: "Typed documents" },
    { value: "handwriting", label: "Handwriting", icon: <Pencil className="w-4 h-4" />, desc: "Written notes" },
    { value: "mixed", label: "Mixed", icon: <Layers className="w-4 h-4" />, desc: "Both types" },
  ];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          "bg-card/50 backdrop-blur-sm",
          isDragging
            ? "border-primary bg-accent/20 scale-[1.02]"
            : "border-border hover:border-primary/50",
          isProcessing && "pointer-events-none opacity-70"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 rounded-xl pointer-events-none" />

        <label className="flex flex-col items-center justify-center p-12 cursor-pointer relative">
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileInput}
            disabled={isProcessing}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl bg-accent flex items-center justify-center">
                  {selectedFile.type.startsWith("image/") ? (
                    <FileImage className="w-10 h-10 text-primary" />
                  ) : (
                    <FileText className="w-10 h-10 text-primary" />
                  )}
                </div>
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      clearFile();
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-center">
                <p className="font-mono text-sm text-foreground truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  "w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300",
                  isDragging
                    ? "bg-primary/20 animate-pulse-glow"
                    : "bg-accent"
                )}
              >
                <Upload
                  className={cn(
                    "w-10 h-10 transition-colors duration-300",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {isDragging ? "Drop your file here" : "Drag & drop your document"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse • PNG, JPG, PDF
                </p>
              </div>
            </div>
          )}
        </label>

        {/* Animated border glow on drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse-glow" />
          </div>
        )}
      </div>

      {/* OCR Mode Selection & Process Button */}
      {selectedFile && (
        <div className="space-y-4 animate-fade-in">
          {/* Mode Selection */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="text-sm font-medium text-foreground mb-3">OCR Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMode(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200",
                    selectedMode === option.value
                      ? "border-primary bg-accent text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                  <span className="text-[10px] opacity-70">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Process Button */}
          <Button
            variant="glow"
            size="lg"
            className="w-full"
            onClick={handleProcess}
            disabled={isProcessing}
          >
            Extract Text
          </Button>
        </div>
      )}
    </div>
  );
}

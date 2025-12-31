import { useState } from "react";
import { Copy, Check, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ResultDisplayProps {
  text: string;
  fileName?: string;
}

export function ResultDisplay({ text, fileName }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The extracted text has been copied.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? `${fileName.split(".")[0]}_ocr.txt` : "extracted_text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Text file has been downloaded.",
    });
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Extracted Text</p>
            <p className="text-xs text-muted-foreground font-mono">
              {wordCount} words • {charCount} characters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="terminal"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <Check className="w-4 h-4 text-secondary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="terminal"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
        <pre
          className={cn(
            "font-mono text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed",
            "selection:bg-primary/30"
          )}
        >
          {text}
        </pre>
      </div>

      {/* Terminal-style footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">$</span> ocr_extract --complete
        </p>
      </div>
    </div>
  );
}

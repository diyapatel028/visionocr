import { useState, useCallback, useEffect } from "react";
import { Scan, History, Zap, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/UploadZone";
import { ProcessingAnimation } from "@/components/ProcessingAnimation";
import { ResultDisplay } from "@/components/ResultDisplay";
import { DocumentHistory, type HistoryItem } from "@/components/DocumentHistory";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { processDocument, type OCRMode, type OCRResult } from "@/services/ocrEngine";

type ProcessingStatus = "idle" | "uploading" | "processing" | "complete" | "error";

const Index = () => {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [currentFileName, setCurrentFileName] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>();
  const [processingStats, setProcessingStats] = useState<{
    time: number;
    words: number;
    chars: number;
  } | null>(null);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Fetch user's document history on mount
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("documents")
      .select(`
        id,
        file_name,
        file_type,
        created_at,
        ocr_results (
          extracted_text
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching history:", error);
      return;
    }

    if (data) {
      const historyItems: HistoryItem[] = data.map((doc) => ({
        id: doc.id,
        fileName: doc.file_name,
        fileType: doc.file_type,
        extractedText: doc.ocr_results?.[0]?.extracted_text || "",
        processedAt: new Date(doc.created_at),
      }));
      setHistory(historyItems);
    }
  };

  const handleOCRProcessing = useCallback(
    async (file: File, mode: OCRMode) => {
      if (!user) return;

      setCurrentFileName(file.name);
      setStatus("uploading");
      setProgress(0);
      setExtractedText("");
      setSelectedHistoryId(undefined);
      setProcessingStats(null);

      // Simulate upload progress
      for (let i = 0; i <= 30; i += 10) {
        await new Promise((r) => setTimeout(r, 100));
        setProgress(i);
      }

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          status: "processing",
        })
        .select()
        .single();

      if (docError) {
        console.error("Error creating document:", docError);
        setStatus("error");
        toast({
          title: "Error",
          description: "Failed to create document record.",
          variant: "destructive",
        });
        return;
      }

      setStatus("processing");
      setProgress(40);

      try {
        // Call the real OCR engine
        const result: OCRResult = await processDocument(file, mode);

        setProgress(90);

        // Save OCR result to database
        const { error: ocrError } = await supabase
          .from("ocr_results")
          .insert({
            document_id: docData.id,
            user_id: user.id,
            extracted_text: result.extracted_text,
            word_count: result.word_count,
            character_count: result.character_count,
            processing_time_ms: result.processing_time_ms,
          });

        if (ocrError) {
          console.error("Error saving OCR result:", ocrError);
        }

        // Update document status
        await supabase
          .from("documents")
          .update({ status: "completed" })
          .eq("id", docData.id);

        setProgress(100);
        setExtractedText(result.extracted_text);
        setProcessingStats({
          time: result.processing_time_ms,
          words: result.word_count,
          chars: result.character_count,
        });
        setStatus("complete");

        // Add to local history
        const newItem: HistoryItem = {
          id: docData.id,
          fileName: file.name,
          fileType: file.type,
          extractedText: result.extracted_text,
          processedAt: new Date(),
        };
        setHistory((prev) => [newItem, ...prev.slice(0, 9)]);
        setSelectedHistoryId(newItem.id);

        toast({
          title: "Extraction complete",
          description: `Extracted ${result.word_count} words in ${(result.processing_time_ms / 1000).toFixed(1)}s`,
        });
      } catch (error) {
        console.error("OCR processing error:", error);
        
        // Update document status to failed
        await supabase
          .from("documents")
          .update({ status: "failed" })
          .eq("id", docData.id);

        setStatus("error");
        toast({
          title: "OCR Failed",
          description: error instanceof Error ? error.message : "Failed to extract text from document.",
          variant: "destructive",
        });
      }
    },
    [toast, user]
  );

  const handleFileSelect = useCallback(
    (file: File, mode: OCRMode) => {
      handleOCRProcessing(file, mode);
    },
    [handleOCRProcessing]
  );

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setExtractedText(item.extractedText);
    setCurrentFileName(item.fileName);
    setStatus("complete");
    setSelectedHistoryId(item.id);
    setProcessingStats(null);
  }, []);

  const handleHistoryDelete = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) {
        console.error("Error deleting document:", error);
        toast({
          title: "Error",
          description: "Failed to delete document.",
          variant: "destructive",
        });
        return;
      }

      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedHistoryId === id) {
        setExtractedText("");
        setStatus("idle");
        setSelectedHistoryId(undefined);
      }

      toast({
        title: "Deleted",
        description: "Document removed from history.",
      });
    },
    [selectedHistoryId, toast]
  );

  const handleNewScan = useCallback(() => {
    setStatus("idle");
    setExtractedText("");
    setProgress(0);
    setCurrentFileName("");
    setSelectedHistoryId(undefined);
    setProcessingStats(null);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
                <Scan className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">VisionOCR</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  v1.0.0 • AI-Powered Text Extraction
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-xs font-mono text-accent-foreground">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {user?.email}
              </span>
              <Button variant="ghost" size="icon" title="Profile">
                <User className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Area */}
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="text-gradient-primary">Extract Text</span>{" "}
                <span className="text-foreground">from Any Document</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Upload images or PDFs and let our AI-powered OCR engine extract
                text with precision. Supports printed text, handwriting, and mixed documents.
              </p>
            </div>

            {/* Upload or Processing or Results */}
            {status === "idle" && (
              <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
            )}

            {(status === "uploading" || status === "processing") && (
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8">
                <ProcessingAnimation status={status} progress={progress} />
              </div>
            )}

            {status === "error" && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
                <p className="text-destructive font-medium mb-4">
                  Failed to process document
                </p>
                <Button variant="terminal" onClick={handleNewScan}>
                  Try Again
                </Button>
              </div>
            )}

            {status === "complete" && extractedText && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Results</h3>
                    {processingStats && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Processed in {(processingStats.time / 1000).toFixed(1)}s
                      </p>
                    )}
                  </div>
                  <Button
                    variant="terminal"
                    size="sm"
                    onClick={handleNewScan}
                    className="gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    New Scan
                  </Button>
                </div>
                <ResultDisplay text={extractedText} fileName={currentFileName} />
              </div>
            )}

            {/* Features */}
            {status === "idle" && (
              <div className="grid sm:grid-cols-3 gap-4 mt-8">
                {[
                  {
                    icon: "⚡",
                    title: "Lightning Fast",
                    desc: "AI-powered processing",
                  },
                  {
                    icon: "✍️",
                    title: "Handwriting",
                    desc: "Recognizes written text",
                  },
                  {
                    icon: "🔒",
                    title: "Secure",
                    desc: "Your files are encrypted",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <h4 className="font-medium text-foreground text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - History */}
          <aside className="lg:border-l lg:border-border lg:pl-8">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Recent Documents</h3>
              </div>
              <DocumentHistory
                items={history}
                onSelect={handleHistorySelect}
                onDelete={handleHistoryDelete}
                selectedId={selectedHistoryId}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="font-mono">© 2024 VisionOCR. Built with precision.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                System Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

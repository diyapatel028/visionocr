import { FileImage, FileText, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface HistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  processedAt: Date;
}

interface DocumentHistoryProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

export function DocumentHistory({
  items,
  onSelect,
  onDelete,
  selectedId,
}: DocumentHistoryProps) {
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No documents yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Upload a document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "group relative rounded-lg border transition-all duration-200 cursor-pointer",
            "hover:border-primary/50 hover:bg-accent/50",
            selectedId === item.id
              ? "border-primary bg-accent"
              : "border-border bg-card/50"
          )}
          style={{ animationDelay: `${index * 50}ms` }}
          onClick={() => onSelect(item)}
        >
          <div className="flex items-start gap-3 p-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                selectedId === item.id ? "bg-primary/20" : "bg-muted"
              )}
            >
              {item.fileType.includes("image") ? (
                <FileImage
                  className={cn(
                    "w-5 h-5 transition-colors",
                    selectedId === item.id ? "text-primary" : "text-muted-foreground"
                  )}
                />
              ) : (
                <FileText
                  className={cn(
                    "w-5 h-5 transition-colors",
                    selectedId === item.id ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-foreground truncate">
                {item.fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.extractedText.slice(0, 80)}...
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(item.processedAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

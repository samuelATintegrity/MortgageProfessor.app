"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComparisonStore } from "@/stores/comparison-store";
import { toast } from "@/hooks/use-toast";

export function CompetitorUploader() {
  const { competitorFileName, isProcessing, parseError, setProcessing, setParseError, setCompetitorData, reset } =
    useComparisonStore();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, PNG, or JPG file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB.",
          variant: "destructive",
        });
        return;
      }

      setParseError(null);
      setProcessing(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-competitor-quote", {
          method: "POST",
          body: formData,
        });

        // Handle non-JSON responses gracefully
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(text || `Server error (${res.status})`);
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to parse quote");
        }

        setCompetitorData(data, file.name);
        toast({
          title: "Quote parsed",
          description: `Extracted data from ${data.lenderName}`,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to parse competitor quote";
        setParseError(message);
        toast({
          title: "Parse failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [setProcessing, setParseError, setCompetitorData]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // If already parsed, show filename with option to re-upload
  if (competitorFileName && !isProcessing) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{competitorFileName}</p>
          <p className="text-xs text-muted-foreground">Parsed successfully</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Replace
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="h-4 w-4" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragEnter={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Analyzing competitor quote...</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI is extracting fees and line items
            </p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium">
              Drop a competitor quote here, or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, PNG, and JPG files (up to 10MB)
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {parseError && (
        <p className="text-sm text-destructive">{parseError}</p>
      )}
    </div>
  );
}

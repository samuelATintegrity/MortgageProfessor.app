"use client";

import { type RefObject } from "react";
import { toPng } from "html-to-image";
import { Camera, FileDown, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface QuoteActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function QuoteActionBar({ captureRef }: QuoteActionBarProps) {
  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `mortgage-quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Quote saved as PNG" });
    } catch {
      toast({
        title: "Capture failed",
        description: "Could not generate image",
        variant: "destructive",
      });
    }
  }

  function handleExportPdf() {
    toast({ title: "Coming soon", description: "PDF export is under development" });
  }

  function handleSaveQuote() {
    toast({ title: "Coming soon", description: "Save quote is under development" });
  }

  function handleSaveTemplate() {
    toast({ title: "Coming soon", description: "Save as template is under development" });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleCapture} variant="default" size="sm">
        <Camera />
        Capture as Image
      </Button>
      <Button onClick={handleExportPdf} variant="outline" size="sm">
        <FileDown />
        Export PDF
      </Button>
      <Button onClick={handleSaveQuote} variant="outline" size="sm">
        <Save />
        Save Quote
      </Button>
      <Button onClick={handleSaveTemplate} variant="outline" size="sm">
        <Copy />
        Save as Template
      </Button>
    </div>
  );
}

"use client";

import { type RefObject } from "react";
import { toPng } from "html-to-image";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useComparisonStore } from "@/stores/comparison-store";

interface ComparisonActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function ComparisonActionBar({ captureRef }: ComparisonActionBarProps) {
  const reset = useComparisonStore((s) => s.reset);
  const hasData = useComparisonStore((s) => s.rows.length > 0);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `quote-comparison-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Comparison saved as PNG" });
    } catch {
      toast({
        title: "Capture failed",
        description: "Could not generate image",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleCapture} variant="default" size="sm" disabled={!hasData}>
        <Camera />
        Capture as Image
      </Button>
      <Button onClick={reset} variant="outline" size="sm">
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}

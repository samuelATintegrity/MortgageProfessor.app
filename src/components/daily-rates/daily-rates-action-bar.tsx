"use client";

import { type RefObject } from "react";
import { toPng } from "html-to-image";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useDailyRatesStore } from "@/stores/daily-rates-store";

interface DailyRatesActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function DailyRatesActionBar({ captureRef }: DailyRatesActionBarProps) {
  const { date, outputWidth, outputHeight } = useDailyRatesStore((s) => s.input);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      // Wait for all fonts to be loaded before capture
      await document.fonts.ready;

      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 1,
        width: outputWidth,
        height: outputHeight,
        backgroundColor: "#000000",
        style: {
          width: `${outputWidth}px`,
          height: `${outputHeight}px`,
        },
      });
      const link = document.createElement("a");
      link.download = `daily-rates-${date}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Daily rates saved as PNG" });
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
      <Button onClick={handleCapture} variant="default" size="sm">
        <Camera />
        Capture as Image
      </Button>
    </div>
  );
}

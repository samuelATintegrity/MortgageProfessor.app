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
  const date = useDailyRatesStore((s) => s.input.date);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#000000",
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

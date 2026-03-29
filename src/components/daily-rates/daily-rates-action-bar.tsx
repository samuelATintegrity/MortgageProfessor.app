"use client";

import { type RefObject } from "react";
import { toPng, toCanvas } from "html-to-image";
import { Camera, FileDown } from "lucide-react";
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

  async function handleExportPdf() {
    if (!captureRef.current) return;
    try {
      toast({ title: "Generating PDF…", description: "Please wait" });

      await document.fonts.ready;

      const canvas = await toCanvas(captureRef.current, {
        quality: 1,
        pixelRatio: 1,
        width: outputWidth,
        height: outputHeight,
        backgroundColor: "#000000",
        style: {
          width: `${outputWidth}px`,
          height: `${outputHeight}px`,
        },
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const { jsPDF } = await import("jspdf");

      const pdfWidthMm = 210;
      const pdfHeightMm = (imgHeight / imgWidth) * pdfWidthMm;

      const pdf = new jsPDF({
        orientation: pdfHeightMm > pdfWidthMm ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidthMm, pdfHeightMm + 10],
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 5, pdfWidthMm, pdfHeightMm);
      pdf.save(`daily-rates-${date}.pdf`);

      toast({ title: "PDF exported", description: "Daily rates saved as PDF" });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
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
      <Button onClick={handleExportPdf} variant="outline" size="sm">
        <FileDown />
        Export PDF
      </Button>
    </div>
  );
}

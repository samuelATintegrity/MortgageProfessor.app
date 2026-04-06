"use client";

import { useRef } from "react";
import { toPng, toCanvas } from "html-to-image";
import { Camera, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AmortInputForm } from "@/components/amortization/amort-input-form";
import { AmortOutput } from "@/components/amortization/amort-output";

export default function AmortizationPage() {
  const captureRef = useRef<HTMLDivElement>(null);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `amortization-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Chart saved as PNG" });
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
      const canvas = await toCanvas(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
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
      pdf.save(`amortization-${Date.now()}.pdf`);
      toast({ title: "PDF exported", description: "Chart saved as PDF" });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Amortization Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Compare up to 3 loan scenarios side by side
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div>
          <AmortInputForm />
        </div>

        <div className="space-y-4">
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

          <AmortOutput ref={captureRef} />
        </div>
      </div>
    </div>
  );
}

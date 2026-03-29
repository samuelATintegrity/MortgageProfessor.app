"use client";

import { useState, type RefObject } from "react";
import { toPng, toCanvas } from "html-to-image";
import { Camera, FileDown, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRefiStore } from "@/stores/refi-store";
import { saveRefiAnalysis } from "@/lib/actions/quotes";

interface RefiActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function RefiActionBar({ captureRef }: RefiActionBarProps) {
  const { input, result } = useRefiStore();
  const [saving, setSaving] = useState(false);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `refi-analysis-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Refinance analysis saved as PNG" });
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
        backgroundColor: "#ffffff",
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
      pdf.save(`refi-analysis-${Date.now()}.pdf`);

      toast({ title: "PDF exported", description: "Refinance analysis saved as PDF" });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    }
  }

  async function handleSaveAnalysis() {
    if (!result) return;
    setSaving(true);
    try {
      const loanStartDate = input.loanStartDate instanceof Date
        ? input.loanStartDate.toISOString().split("T")[0]
        : null;

      const res = await saveRefiAnalysis({
        currentRate: input.originalRate ?? 0,
        currentBalance: input.currentBalance ?? 0,
        currentMonthlyPayment: result.currentMonthlyPayment,
        currentLoanOriginationDate: loanStartDate,
        currentRemainingMonths: null,
        newRate: input.newRate ?? 0,
        newLoanAmount: result.newLoanAmount,
        newLoanTermYears: input.newTermYears ?? 30,
        newClosingCosts: input.closingCosts ?? 0,
        results: result as unknown as Record<string, unknown>,
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Analysis saved successfully" });
      }
    } finally {
      setSaving(false);
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
      <Button onClick={handleSaveAnalysis} variant="outline" size="sm" disabled={saving || !result}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        Save Analysis
      </Button>
    </div>
  );
}

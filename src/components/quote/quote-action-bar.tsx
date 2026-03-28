"use client";

import { useState, type RefObject } from "react";
import { toPng, toCanvas } from "html-to-image";
import { Camera, FileDown, Save, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useQuoteStore } from "@/stores/quote-store";
import { saveQuote, saveTemplate } from "@/lib/actions/quotes";

interface QuoteActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function QuoteActionBar({ captureRef }: QuoteActionBarProps) {
  const { input, result } = useQuoteStore();
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

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

  async function handleExportPdf() {
    if (!captureRef.current) return;
    try {
      toast({ title: "Generating PDF…", description: "Please wait" });

      // Capture the quote element as a canvas at 2x resolution
      const canvas = await toCanvas(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Dynamic import to keep bundle size down
      const { jsPDF } = await import("jspdf");

      // Use the aspect ratio of the captured element to size the PDF
      // Standard letter width in points = 612, but we'll use mm for jsPDF
      const pdfWidthMm = 210; // A4 width
      const pdfHeightMm = (imgHeight / imgWidth) * pdfWidthMm;

      const pdf = new jsPDF({
        orientation: pdfHeightMm > pdfWidthMm ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidthMm, pdfHeightMm + 10], // +10 for small margin
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 5, pdfWidthMm, pdfHeightMm);
      pdf.save(`mortgage-quote-${Date.now()}.pdf`);

      toast({ title: "PDF exported", description: "Quote saved as PDF" });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    }
  }

  async function handleSaveQuote() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await saveQuote({
        quoteType: "quick",
        transactionType: input.transactionType ?? "purchase",
        loanType: input.loanType ?? "conventional",
        ficoScore: input.fico ?? 740,
        borrowerOrLenderPaid: input.isBorrowerPaid ? "borrower" : "lender",
        borrowerPaidCompPct: input.borrowerPaidCompPercent ?? null,
        baseLoanAmount: input.loanAmount ?? 0,
        propertyValue: input.propertyValue ?? 0,
        loanTermYears: input.loanTermYears ?? 30,
        state: input.state ?? "UT",
        lockPeriodDays: input.lockPeriodDays ?? 30,
        hazardInsuranceMonthly: input.hazardInsuranceMonthly ?? 0,
        mortgageInsuranceMonthly: input.mortgageInsuranceMonthly ?? 0,
        propertyTaxMonthly: input.propertyTaxMonthly ?? 0,
        prepaidInterestDays: input.prepaidInterestDays ?? 15,
        sellerCredit: input.sellerCredit ?? 0,
        buydownAmount: 0,
        vaFundingFee: result?.financedFeeAmount ?? 0,
        results: result as unknown as Record<string, unknown>,
        name: saveName || undefined,
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      } else {
        setSaveDialogOpen(false);
        setSaveName("");
        toast({ title: "Saved", description: "Quote saved successfully" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    try {
      const res = await saveTemplate({
        name: `Quick Quote - ${new Date().toLocaleDateString()}`,
        templateType: "quick_quote",
        config: input as Record<string, unknown>,
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Template saved successfully" });
      }
    } finally {
      setSavingTemplate(false);
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
      <Button variant="outline" size="sm" disabled={!result} onClick={() => setSaveDialogOpen(true)}>
        <Save />
        Save Quote
      </Button>
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="quoteName">
                Quote Name
              </label>
              <Input
                id="quoteName"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Smith Family Purchase"
              />
            </div>
            <Button onClick={handleSaveQuote} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button onClick={handleSaveTemplate} variant="outline" size="sm" disabled={savingTemplate}>
        {savingTemplate ? <Loader2 className="animate-spin" /> : <Copy />}
        Save as Template
      </Button>
    </div>
  );
}

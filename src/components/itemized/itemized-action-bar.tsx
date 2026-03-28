"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { Camera, FileDown, Save, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useItemizedStore } from "@/stores/itemized-store";
import { saveQuote, saveTemplate } from "@/lib/actions/quotes";

interface ItemizedActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function ItemizedActionBar({ captureRef }: ItemizedActionBarProps) {
  const { input, result } = useItemizedStore();
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `itemized-quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Itemized quote saved as PNG" });
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

  async function handleSaveQuote() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await saveQuote({
        quoteType: "itemized",
        transactionType: "purchase",
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
        buydownAmount: input.buydownAmount ?? 0,
        vaFundingFee: result?.financedFeeAmount ?? 0,
        results: { input: input as Record<string, unknown>, result: result as unknown as Record<string, unknown> },
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Itemized quote saved successfully" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    try {
      const res = await saveTemplate({
        name: `Itemized Quote - ${new Date().toLocaleDateString()}`,
        templateType: "itemized_quote",
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
      <Button onClick={handleSaveQuote} variant="outline" size="sm" disabled={saving || !result}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        Save Quote
      </Button>
      <Button onClick={handleSaveTemplate} variant="outline" size="sm" disabled={savingTemplate}>
        {savingTemplate ? <Loader2 className="animate-spin" /> : <Copy />}
        Save as Template
      </Button>
    </div>
  );
}

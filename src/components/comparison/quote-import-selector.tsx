"use client";

import { useState, useEffect } from "react";
import { FileInput, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useComparisonStore, type SavedQuoteData } from "@/stores/comparison-store";
import { toast } from "@/hooks/use-toast";

interface SavedQuoteSummary {
  id: string;
  name: string | null;
  client_name: string | null;
  base_loan_amount: number;
  loan_type: string;
  results: {
    baseLoanAmount?: number;
    propertyValue?: number;
    loanTermYears?: number;
    tiers?: Array<{
      tierName: string;
      interestRate: number;
      monthlyPI: number;
      titleFees: number;
      prepaidCosts: number;
      lenderFees: number;
      financedFee: number;
      downPayment: number;
      sellerCredit: number;
      monthlyEscrow: number;
      monthlyMI: number;
      totalMonthlyPayment: number;
      pointsBuydown: number;
      itemized: {
        prepaidInterest: number;
        prepaidTaxes: number;
        prepaidHazard: number;
        appraisalFee: number;
        underwritingFee: number;
        processingFee: number;
        voeCreditFee: number;
        taxServiceFee: number;
        mersFee: number;
        borrowerComp: number;
        titleFee: number;
        escrowFee: number;
      };
    }>;
  };
  created_at: string;
}

const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function QuoteImportSelector() {
  const [open, setOpen] = useState(false);
  const [quotes, setQuotes] = useState<SavedQuoteSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<SavedQuoteSummary | null>(null);
  const [selectedTier, setSelectedTier] = useState(0);
  const importFromQuote = useComparisonStore((s) => s.importFromQuote);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("quotes")
      .select("id, name, client_name, base_loan_amount, loan_type, results, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          setQuotes((data as SavedQuoteSummary[]) ?? []);
        }
        setLoading(false);
      });
  }, [open]);

  function handleSelectQuote(quote: SavedQuoteSummary) {
    setSelectedQuote(quote);
    setSelectedTier(0);
  }

  function handleImport() {
    if (!selectedQuote) return;
    const tiers = selectedQuote.results.tiers;
    if (!tiers || tiers.length === 0) {
      toast({ title: "No data", description: "This quote has no tier results to import.", variant: "destructive" });
      return;
    }

    const quoteData: SavedQuoteData = {
      baseLoanAmount: selectedQuote.results.baseLoanAmount ?? selectedQuote.base_loan_amount,
      propertyValue: selectedQuote.results.propertyValue ?? 0,
      loanTermYears: selectedQuote.results.loanTermYears ?? 30,
      tiers,
    };

    importFromQuote(quoteData, selectedTier);
    setOpen(false);
    setSelectedQuote(null);
    toast({ title: "Imported", description: `Imported ${tiers[selectedTier].tierName} tier data into your quote column.` });
  }

  const tiers = selectedQuote?.results.tiers ?? [];
  const showTierSelector = tiers.length > 1;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileInput className="h-4 w-4 mr-1" />
        Import Your Quote
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedQuote(null); }}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Saved Quote</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No saved quotes found. Save a quote first to import it here.
          </p>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
            {/* Quote list */}
            <div className="space-y-1">
              {quotes.map((q) => {
                const isSelected = selectedQuote?.id === q.id;
                const hasTiers = q.results.tiers && q.results.tiers.length > 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuote(q)}
                    disabled={!hasTiers}
                    className={`w-full text-left rounded-md border p-3 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : hasTiers
                        ? "border-gray-200 hover:border-gray-300"
                        : "border-gray-100 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {q.name || q.client_name || "Untitled Quote"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {q.loan_type} &middot; {fmtCurrency.format(q.base_loan_amount)} &middot;{" "}
                          {new Date(q.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tier selector */}
            {selectedQuote && showTierSelector && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Select a rate tier to import:
                </p>
                <div className="space-y-1">
                  {tiers.map((tier, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTier(idx)}
                      className={`w-full text-left rounded-md border p-2 text-sm transition-colors ${
                        selectedTier === idx
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium">{tier.tierName}</span>
                      <span className="text-muted-foreground ml-2">
                        {(tier.interestRate * 100).toFixed(3)}%
                      </span>
                      {selectedTier === idx && <Check className="h-3 w-3 text-primary inline ml-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Import button */}
            {selectedQuote && (
              <div className="border-t pt-3">
                <Button onClick={handleImport} className="w-full" size="sm">
                  Import {tiers[selectedTier]?.tierName ?? "Quote"} Data
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

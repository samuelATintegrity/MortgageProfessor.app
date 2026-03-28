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

interface QuickQuoteTier {
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
}

interface SavedQuoteSummary {
  id: string;
  name: string | null;
  client_name: string | null;
  base_loan_amount: number;
  loan_type: string;
  quote_type: string;
  property_value: number;
  loan_term_years: number;
  results: {
    baseLoanAmount?: number;
    propertyValue?: number;
    loanTermYears?: number;
    tiers?: QuickQuoteTier[];
    // Itemized quote shape: { input: {...}, result: {...} }
    input?: Record<string, unknown>;
    result?: Record<string, unknown>;
  };
  created_at: string;
}

/** Convert an itemized quote result into a synthetic tier for import */
function itemizedResultToTier(results: SavedQuoteSummary["results"]): QuickQuoteTier | null {
  const r = results.result;
  const inp = results.input;
  if (!r) return null;

  // Sum section items for lender/title/prepaid totals
  const sectionATotal = (r.sectionATotal as number) ?? 0;
  const sectionBTotal = (r.sectionBTotal as number) ?? 0;
  const sectionCTotal = (r.sectionCTotal as number) ?? 0;
  const prepaidsTotal = (r.prepaidsTotal as number) ?? 0;

  return {
    tierName: "Itemized",
    interestRate: (r.interestRate as number) ?? 0,
    monthlyPI: (r.monthlyPI as number) ?? 0,
    titleFees: sectionCTotal,
    prepaidCosts: prepaidsTotal,
    lenderFees: sectionATotal + sectionBTotal,
    financedFee: (r.financedFeeAmount as number) ?? 0,
    downPayment: (r.downPayment as number) ?? 0,
    sellerCredit: (inp?.sellerCredit as number) ?? 0,
    monthlyEscrow: (r.monthlyEscrow as number) ?? 0,
    monthlyMI: (r.monthlyMI as number) ?? 0,
    totalMonthlyPayment: (r.totalMonthlyPayment as number) ?? 0,
    pointsBuydown: 0,
    itemized: {
      prepaidInterest: findSectionAmount(r, "prepaids", "Prepaid Interest"),
      prepaidTaxes: findSectionAmount(r, "prepaids", "Property Tax Reserve"),
      prepaidHazard: findSectionAmount(r, "prepaids", "Homeowner"),
      appraisalFee: (inp?.appraisalFee as number) ?? 0,
      underwritingFee: (inp?.underwritingFee as number) ?? 0,
      processingFee: (inp?.processingFee as number) ?? 0,
      voeCreditFee: (inp?.creditReportFee as number) ?? 0,
      taxServiceFee: (inp?.taxServiceFee as number) ?? 0,
      mersFee: (inp?.mersFee as number) ?? 0,
      borrowerComp: findSectionAmount(r, "sectionA", "Origination Fee"),
      titleFee: (inp?.titleInsuranceLender as number) ?? 0,
      escrowFee: (inp?.settlementFee as number) ?? 0,
    },
  };
}

/** Find amount from a section array by partial label match */
function findSectionAmount(result: Record<string, unknown>, section: string, labelMatch: string): number {
  const items = result[section] as Array<{ label: string; amount: number }> | undefined;
  if (!items) return 0;
  const match = items.find((item) => item.label.toLowerCase().includes(labelMatch.toLowerCase()));
  return match?.amount ?? 0;
}

const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function QuoteSection({
  label,
  quotes,
  selectedId,
  onSelect,
}: {
  label: string;
  quotes: SavedQuoteSummary[];
  selectedId: string | null;
  onSelect: (q: SavedQuoteSummary) => void;
}) {
  if (quotes.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 px-1">
        {label}
      </p>
      <div className="space-y-1">
        {quotes.map((q) => {
          const isSelected = selectedId === q.id;
          const isItemizedQuote = q.quote_type === "itemized";
          const hasTiers = isItemizedQuote
            ? !!q.results.result
            : q.results.tiers && q.results.tiers.length > 0;
          return (
            <button
              key={q.id}
              onClick={() => onSelect(q)}
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
    </div>
  );
}

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
      .select("id, name, client_name, base_loan_amount, property_value, loan_term_years, loan_type, quote_type, results, created_at")
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

    const isItemized = selectedQuote.quote_type === "itemized";
    let tiers: QuickQuoteTier[];
    let tierIdx = selectedTier;

    if (isItemized) {
      const syntheticTier = itemizedResultToTier(selectedQuote.results);
      if (!syntheticTier) {
        toast({ title: "No data", description: "This itemized quote has no result data to import.", variant: "destructive" });
        return;
      }
      tiers = [syntheticTier];
      tierIdx = 0;
    } else {
      tiers = selectedQuote.results.tiers ?? [];
      if (tiers.length === 0) {
        toast({ title: "No data", description: "This quote has no tier results to import.", variant: "destructive" });
        return;
      }
    }

    const quoteData: SavedQuoteData = {
      baseLoanAmount: selectedQuote.results.baseLoanAmount ?? selectedQuote.base_loan_amount,
      propertyValue: selectedQuote.results.propertyValue ?? selectedQuote.property_value ?? 0,
      loanTermYears: selectedQuote.results.loanTermYears ?? selectedQuote.loan_term_years ?? 30,
      tiers,
    };

    importFromQuote(quoteData, tierIdx);
    setOpen(false);
    setSelectedQuote(null);
    toast({ title: "Imported", description: `Imported ${tiers[tierIdx].tierName} tier data into your quote column.` });
  }

  const isSelectedItemized = selectedQuote?.quote_type === "itemized";
  const tiers = isSelectedItemized ? [] : (selectedQuote?.results.tiers ?? []);
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
            {/* Quote list — sectioned */}
            <QuoteSection
              label="Quick Quotes"
              quotes={quotes.filter((q) => q.quote_type !== "itemized")}
              selectedId={selectedQuote?.id ?? null}
              onSelect={handleSelectQuote}
            />
            <QuoteSection
              label="Itemized Quotes"
              quotes={quotes.filter((q) => q.quote_type === "itemized")}
              selectedId={selectedQuote?.id ?? null}
              onSelect={handleSelectQuote}
            />

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

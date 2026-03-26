"use client";

import { useRef, useEffect } from "react";
import { QuoteInputForm } from "@/components/quote/quote-input-form";
import { QuoteComparisonTable } from "@/components/quote/quote-comparison-table";
import { QuoteActionBar } from "@/components/quote/quote-action-bar";
import { useQuoteStore } from "@/stores/quote-store";

export default function NewQuotePage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const calculate = useQuoteStore((s) => s.calculate);

  // Run initial calculation on mount so the table populates with defaults
  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Quick Quote Builder</h1>
        <p className="text-muted-foreground mt-1">
          Compare rate options for your client
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Input Form (scrollable on desktop) */}
        <div className="xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto xl:pr-2">
          <QuoteInputForm />
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <QuoteActionBar captureRef={captureRef} />

          {/* Capture wrapper with white bg and padding for clean image output */}
          <div className="rounded-lg border bg-white shadow-sm">
            <QuoteComparisonTable ref={captureRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

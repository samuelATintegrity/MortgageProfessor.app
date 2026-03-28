"use client";

import { useRef, useEffect } from "react";
import { CompetitorUploader } from "@/components/comparison/competitor-uploader";
import { ComparisonTableEditor } from "@/components/comparison/comparison-table-editor";
import { ComparisonTableOutput } from "@/components/comparison/comparison-table-output";
import { ComparisonActionBar } from "@/components/comparison/comparison-action-bar";
import { useComparisonStore } from "@/stores/comparison-store";
import { useQuoteStore } from "@/stores/quote-store";
import { QuoteImportSelector } from "@/components/comparison/quote-import-selector";

export default function ComparisonPage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const hasData = useComparisonStore((s) => s.competitorData !== null || s.rows.length > 0);
  const setCompanyName = useComparisonStore((s) => s.setCompanyName);
  const profileCompanyName = useQuoteStore((s) => s.profile.companyName);

  useEffect(() => {
    if (profileCompanyName) {
      setCompanyName(profileCompanyName);
    }
  }, [profileCompanyName, setCompanyName]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Competitor Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Upload a competitor quote and compare side by side
        </p>
      </div>

      {/* Upload + Import */}
      <div className="flex flex-col gap-4">
        <CompetitorUploader />
        <div className="flex items-center gap-2">
          <QuoteImportSelector />
          <span className="text-xs text-muted-foreground">
            Populate &ldquo;Your Quote&rdquo; column from a saved quote
          </span>
        </div>
      </div>

      {/* Two-panel layout (shown after parse) */}
      {hasData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* Left: Editor */}
          <div>
            <ComparisonTableEditor />
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <ComparisonActionBar captureRef={captureRef} />

            <div className="rounded-lg border bg-white shadow-sm">
              <ComparisonTableOutput ref={captureRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

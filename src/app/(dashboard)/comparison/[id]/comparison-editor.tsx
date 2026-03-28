"use client";

import { useRef, useEffect } from "react";
import { ComparisonTableEditor } from "@/components/comparison/comparison-table-editor";
import { ComparisonTableOutput } from "@/components/comparison/comparison-table-output";
import { ComparisonActionBar } from "@/components/comparison/comparison-action-bar";
import { QuoteImportSelector } from "@/components/comparison/quote-import-selector";
import { useComparisonStore, type SavedComparisonData } from "@/stores/comparison-store";

interface ComparisonEditorProps {
  comparison: {
    id: string;
    name: string | null;
    competitor_lender: string | null;
    competitor_file_name: string | null;
    company_name: string | null;
    rows: unknown;
  };
}

export function ComparisonEditor({ comparison }: ComparisonEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const loadSavedComparison = useComparisonStore((s) => s.loadSavedComparison);
  const hasRows = useComparisonStore((s) => s.rows.length > 0);

  useEffect(() => {
    loadSavedComparison(comparison as unknown as SavedComparisonData);
  }, [comparison, loadSavedComparison]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {comparison.name || "Competitor Comparison"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Edit your saved comparison
        </p>
      </div>

      <div className="flex items-center gap-2">
        <QuoteImportSelector />
        <span className="text-xs text-muted-foreground">
          Populate &ldquo;Your Quote&rdquo; column from a saved quote
        </span>
      </div>

      {hasRows && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div>
            <ComparisonTableEditor />
          </div>
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

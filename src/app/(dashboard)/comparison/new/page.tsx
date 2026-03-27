"use client";

import { useRef } from "react";
import { CompetitorUploader } from "@/components/comparison/competitor-uploader";
import { ComparisonTableEditor } from "@/components/comparison/comparison-table-editor";
import { ComparisonTableOutput } from "@/components/comparison/comparison-table-output";
import { ComparisonActionBar } from "@/components/comparison/comparison-action-bar";
import { useComparisonStore } from "@/stores/comparison-store";

export default function ComparisonPage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const hasData = useComparisonStore((s) => s.competitorData !== null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Competitor Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Upload a competitor quote and compare side by side
        </p>
      </div>

      {/* Upload area */}
      <CompetitorUploader />

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

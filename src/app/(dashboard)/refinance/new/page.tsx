"use client";

import { useRef, useEffect } from "react";
import { RefiInputForm } from "@/components/refinance/refi-input-form";
import { RefiComparisonCard } from "@/components/refinance/refi-comparison-card";
import { RefiActionBar } from "@/components/refinance/refi-action-bar";
import { useRefiStore } from "@/stores/refi-store";

export default function NewRefinanceAnalysisPage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const calculate = useRefiStore((s) => s.calculate);

  // Run initial calculation on mount so the comparison populates with defaults
  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Refinance Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Compare current loan vs refinance options
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Input Form (scrollable on desktop) */}
        <div className="xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto xl:pr-2">
          <RefiInputForm />
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <RefiActionBar captureRef={captureRef} />

          {/* Capture wrapper with white bg for clean image output */}
          <div className="rounded-lg border bg-white shadow-sm">
            <RefiComparisonCard ref={captureRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

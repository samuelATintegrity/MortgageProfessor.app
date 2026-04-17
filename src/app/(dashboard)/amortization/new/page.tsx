"use client";

import { AmortInputForm } from "@/components/amortization/amort-input-form";
import { AmortOutput } from "@/components/amortization/amort-output";

export default function AmortizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Amortization Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Compare up to 3 loan scenarios side by side
        </p>
      </div>

      <AmortInputForm />
      <AmortOutput />
    </div>
  );
}

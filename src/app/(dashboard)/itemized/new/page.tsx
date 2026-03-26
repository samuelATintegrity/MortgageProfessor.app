"use client";

import { useRef, useEffect } from "react";
import { ItemizedInputForm } from "@/components/itemized/itemized-input-form";
import { ItemizedClosingCosts } from "@/components/itemized/itemized-closing-costs";
import { ItemizedActionBar } from "@/components/itemized/itemized-action-bar";
import { useItemizedStore } from "@/stores/itemized-store";

export default function NewItemizedQuotePage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const calculate = useItemizedStore((s) => s.calculate);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Itemized Quote Builder</h1>
        <p className="text-muted-foreground mt-1">
          Create a full closing cost breakdown for your client
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Input Form */}
        <div className="xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto xl:pr-2">
          <ItemizedInputForm />
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <ItemizedActionBar captureRef={captureRef} />

          <div className="rounded-lg border bg-white shadow-sm">
            <ItemizedClosingCosts ref={captureRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

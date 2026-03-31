"use client";

import { useRef, useEffect, useState } from "react";
import { QuoteInputForm } from "@/components/quote/quote-input-form";
import { QuoteComparisonTable } from "@/components/quote/quote-comparison-table";
import { QuoteActionBar } from "@/components/quote/quote-action-bar";
import { useQuoteStore } from "@/stores/quote-store";
import type { QuoteInput } from "@/lib/calculations/quote";

interface SharedQuoteClientProps {
  quoteInput: Record<string, unknown>;
  branding: Record<string, unknown>;
}

export function SharedQuoteClient({ quoteInput, branding }: SharedQuoteClientProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the global store with the snapshot data
  useEffect(() => {
    const store = useQuoteStore.getState();

    // Hydrate input
    store.setInput(quoteInput as Partial<QuoteInput>);

    // Hydrate branding
    if (branding.brandingImageUrl != null) {
      store.setBrandingImageUrl(branding.brandingImageUrl as string | null);
    }
    if (branding.headlineFont) {
      store.setHeadlineFont(branding.headlineFont as string);
    }
    if (branding.profile) {
      store.setProfile(branding.profile as { fullName: string; companyName: string; nmlsNumber: string });
    }
    if (branding.brandingToggles) {
      store.setBrandingToggles(branding.brandingToggles as { showName: boolean; showCompany: boolean; showNmls: boolean });
    }
    if (branding.sectionHeaderColor) {
      store.setSectionHeaderColor(branding.sectionHeaderColor as string);
    }

    // Run calculation
    store.calculate();
    setHydrated(true);
  }, [quoteInput, branding]);

  // Load Google Font dynamically
  const headlineFont = useQuoteStore((s) => s.headlineFont);
  useEffect(() => {
    if (headlineFont === "Inter") return;
    const id = `google-font-${headlineFont.replace(/\s/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headlineFont)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  }, [headlineFont]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400 text-sm">Loading quote...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal top bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Mortgage Professor" className="h-7 w-auto" />
        <span className="text-sm text-gray-400">Shared Quote</span>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* Left: Input Form */}
          <div>
            <QuoteInputForm />
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <QuoteActionBar captureRef={captureRef} hideShare hideSave />

            <div className="rounded-lg border bg-white shadow-sm">
              <QuoteComparisonTable ref={captureRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

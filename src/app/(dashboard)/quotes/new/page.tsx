"use client";

import { useRef, useEffect } from "react";
import { QuoteInputForm } from "@/components/quote/quote-input-form";
import { QuoteComparisonTable } from "@/components/quote/quote-comparison-table";
import { QuoteActionBar } from "@/components/quote/quote-action-bar";
import { useQuoteStore } from "@/stores/quote-store";
import { createClient } from "@/lib/supabase/client";

export default function NewQuotePage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const calculate = useQuoteStore((s) => s.calculate);
  const headlineFont = useQuoteStore((s) => s.headlineFont);
  const setProfile = useQuoteStore((s) => s.setProfile);
  const setBrandingImageUrl = useQuoteStore((s) => s.setBrandingImageUrl);

  // Run initial calculation on mount so the table populates with defaults
  useEffect(() => {
    calculate();
  }, [calculate]);

  // Load profile data for quote header
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_name, nmls_number, logo_url")
        .eq("id", user.id)
        .single();
      if (profile) {
        setProfile({
          fullName: profile.full_name ?? "",
          companyName: profile.company_name ?? "",
          nmlsNumber: profile.nmls_number ?? "",
        });
        if (profile.logo_url) {
          setBrandingImageUrl(profile.logo_url);
        }
      }
    }
    loadProfile();
  }, [setProfile, setBrandingImageUrl]);

  // Load Google Font dynamically when headlineFont changes
  useEffect(() => {
    if (headlineFont === "Inter") return; // Inter is already loaded
    const id = `google-font-${headlineFont.replace(/\s/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headlineFont)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  }, [headlineFont]);

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
        {/* Left: Input Form */}
        <div>
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

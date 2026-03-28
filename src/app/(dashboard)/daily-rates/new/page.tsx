"use client";

import { useRef, useEffect } from "react";
import { DailyRatesInputForm } from "@/components/daily-rates/daily-rates-input-form";
import { DailyRatesOutput } from "@/components/daily-rates/daily-rates-output";
import { DailyRatesActionBar } from "@/components/daily-rates/daily-rates-action-bar";
import { useQuoteStore } from "@/stores/quote-store";
import { createClient } from "@/lib/supabase/client";

export default function NewDailyRatesPage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const setProfile = useQuoteStore((s) => s.setProfile);
  const setBrandingImageUrl = useQuoteStore((s) => s.setBrandingImageUrl);

  // Load profile data for branding
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Daily Rates</h1>
        <p className="text-muted-foreground mt-1">
          Create a branded rate image for social media
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Input Form */}
        <div>
          <DailyRatesInputForm />
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <DailyRatesActionBar captureRef={captureRef} />

          {/* Preview — scaled down, max width ~360px to keep it manageable */}
          <div className="max-w-sm mx-auto">
            <DailyRatesOutput ref={captureRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

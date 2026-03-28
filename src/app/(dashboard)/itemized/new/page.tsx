"use client";

import { useRef, useEffect } from "react";
import { ItemizedInputForm } from "@/components/itemized/itemized-input-form";
import { ItemizedClosingCosts } from "@/components/itemized/itemized-closing-costs";
import { ItemizedActionBar } from "@/components/itemized/itemized-action-bar";
import { useItemizedStore } from "@/stores/itemized-store";
import { useQuoteStore } from "@/stores/quote-store";
import { createClient } from "@/lib/supabase/client";

export default function NewItemizedQuotePage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const calculate = useItemizedStore((s) => s.calculate);
  const setProfile = useQuoteStore((s) => s.setProfile);
  const setBrandingImageUrl = useQuoteStore((s) => s.setBrandingImageUrl);

  useEffect(() => {
    calculate();
  }, [calculate]);

  // Load profile data for branding header
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
      <div>
        <h1 className="text-2xl font-bold">Itemized Quote Builder</h1>
        <p className="text-muted-foreground mt-1">
          Create a full closing cost breakdown for your client
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Input Form */}
        <div>
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

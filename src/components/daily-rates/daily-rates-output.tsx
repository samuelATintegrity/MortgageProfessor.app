"use client";

import { forwardRef } from "react";
import { useDailyRatesStore } from "@/stores/daily-rates-store";
import { useQuoteStore } from "@/stores/quote-store";

function formatRate(rate: number): string {
  return (rate * 100).toFixed(3) + "%";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface RateEntry {
  label: string;
  rate: number;
  show: boolean;
}

export const DailyRatesOutput = forwardRef<HTMLDivElement>(
  function DailyRatesOutput(_props, ref) {
    const input = useDailyRatesStore((s) => s.input);
    const { brandingImageUrl, profile, brandingToggles } = useQuoteStore();

    const rates: RateEntry[] = [
      { label: "Conventional", rate: input.conventional, show: input.showConventional },
      { label: "FHA", rate: input.fha, show: input.showFha },
      { label: "VA", rate: input.va, show: input.showVa },
      { label: "USDA", rate: input.usda, show: input.showUsda },
    ];

    const visibleRates = rates.filter((r) => r.show);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-black"
        style={{ aspectRatio: "9 / 16", width: "100%" }}
      >
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={input.backgroundImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `center ${input.backgroundPosition}%` }}
          crossOrigin="anonymous"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-[5%]">
          {/* Top: Branding */}
          <div className="text-center">
            {brandingImageUrl && (
              <div className="flex justify-center mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brandingImageUrl}
                  alt="Branding"
                  className="max-h-[8%] w-auto object-contain drop-shadow-lg"
                  style={{ maxHeight: "60px" }}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            {brandingToggles.showName && profile.fullName && (
              <p className="text-white text-lg font-bold drop-shadow-lg">
                {profile.fullName}
              </p>
            )}
            {brandingToggles.showCompany && profile.companyName && (
              <p className="text-white/90 text-sm drop-shadow-lg">
                {profile.companyName}
              </p>
            )}
            {brandingToggles.showNmls && profile.nmlsNumber && (
              <p className="text-white/70 text-xs drop-shadow-lg">
                NMLS# {profile.nmlsNumber}
              </p>
            )}
          </div>

          {/* Bottom: Rates + Date */}
          <div>
            {/* Date */}
            <p className="text-white/80 text-center text-sm mb-4 drop-shadow-lg">
              {formatDate(input.date)}
            </p>

            {/* Title */}
            <h2 className="text-white text-center text-2xl font-bold mb-4 drop-shadow-lg">
              Today&apos;s Rates
            </h2>

            {/* Rate Cards */}
            <div className="space-y-2">
              {visibleRates.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between bg-white/15 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20"
                >
                  <span className="text-white font-medium text-base drop-shadow">
                    {entry.label}
                  </span>
                  <span className="text-white font-bold text-xl drop-shadow">
                    {formatRate(entry.rate)}
                  </span>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-white/50 text-center text-[8px] mt-4">
              Estimates only. Get an official Loan Estimate before choosing a loan.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

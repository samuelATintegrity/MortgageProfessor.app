"use client";

import { forwardRef } from "react";
import { useDailyRatesStore } from "@/stores/daily-rates-store";
import { useQuoteStore } from "@/stores/quote-store";

function formatRate(rate: number): string {
  return (rate * 100).toFixed(3) + "% APR";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

interface RateEntry {
  label: string;
  rate: number;
  show: boolean;
  isHomeReady?: boolean;
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
      { label: "HomeReady", rate: input.homeReady, show: input.showHomeReady, isHomeReady: true },
    ];

    const visibleRates = rates.filter((r) => r.show);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-black"
        style={{ aspectRatio: `${input.outputWidth} / ${input.outputHeight}`, width: "100%" }}
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

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${input.overlayOpacity})` }}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col p-[5%]">
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
              <p className="text-lg font-bold drop-shadow-lg" style={{ color: input.headlineColor }}>
                {profile.fullName}
              </p>
            )}
            {brandingToggles.showCompany && profile.companyName && (
              <p className="text-sm drop-shadow-lg" style={{ color: input.headlineColor, opacity: 0.9 }}>
                {profile.companyName}
              </p>
            )}
            {brandingToggles.showNmls && profile.nmlsNumber && (
              <p className="text-xs drop-shadow-lg" style={{ color: input.headlineColor, opacity: 0.7 }}>
                NMLS# {profile.nmlsNumber}
              </p>
            )}
          </div>

          {/* Center: Rates */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Date */}
            <p className="text-center text-sm mb-4 drop-shadow-lg" style={{ color: input.headlineColor, opacity: 0.8 }}>
              {formatDate(input.date)}
            </p>

            {/* Title */}
            <h2
              className="text-center font-bold mb-4 drop-shadow-lg"
              style={{
                fontFamily: input.headlineFont !== "Inter" ? input.headlineFont : undefined,
                fontSize: `${input.headlineFontSize}px`,
                color: input.headlineColor,
              }}
            >
              Today&apos;s Rates
            </h2>

            {/* Rate Cards */}
            <div className="space-y-2 w-full">
              {visibleRates.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between bg-white/15 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20"
                >
                  <span
                    className="font-medium text-base drop-shadow"
                    style={{ color: input.rateTextColor }}
                  >
                    {entry.label}
                  </span>
                  <span
                    className="font-bold text-xl drop-shadow"
                    style={{ color: input.rateTextColor }}
                  >
                    {formatRate(entry.rate)}
                  </span>
                </div>
              ))}
            </div>

            {/* Scenario Descriptions */}
            {input.showScenarioDescriptions && visibleRates.length > 0 && (
              <div className="mt-3 space-y-0.5 w-full">
                {visibleRates.map((entry) => (
                  <p
                    key={`scenario-${entry.label}`}
                    className="text-[7px] leading-tight drop-shadow"
                    style={{ color: input.rateTextColor, opacity: 0.6 }}
                  >
                    {entry.label} rate based on a home value of{" "}
                    {formatCurrency(input.propertyValue)} and{" "}
                    {formatCurrency(input.loanAmount)} loan amount,{" "}
                    {input.creditScore} credit score.
                    {entry.isHomeReady &&
                      " Income must be at or below 80% of the AMI."}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Disclaimer */}
          <p className="text-center text-[8px]" style={{ color: input.rateTextColor, opacity: 0.4 }}>
            Estimates only. Get an official Loan Estimate before choosing a loan.
          </p>
        </div>
      </div>
    );
  }
);

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

export const DailyRatesOutput = forwardRef<HTMLDivElement>(
  function DailyRatesOutput(_props, ref) {
    const input = useDailyRatesStore((s) => s.input);
    const { brandingImageUrl, profile, brandingToggles } = useQuoteStore();

    const visibleRates = input.products.filter((p) => p.show);

    // Scale down for shorter/wider aspect ratios (IG Post 1:1, X Post ~16:9)
    const aspectRatio = input.outputHeight / input.outputWidth;
    const isCompact = aspectRatio <= 1.2; // 1:1 or wider
    const isVeryCompact = aspectRatio <= 0.7; // X Post-style landscape

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
          style={{
            objectPosition: `center ${input.backgroundPosition}%`,
            filter: input.blurIntensity > 0 ? `blur(${input.blurIntensity}px)` : undefined,
            // Scale slightly to prevent blur edge artifacts
            transform: input.blurIntensity > 0 ? "scale(1.05)" : undefined,
          }}
          crossOrigin="anonymous"
        />

        {/* Dark Overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${input.overlayOpacity})` }}
        />

        {/* White Overlay */}
        {input.whiteOverlayOpacity > 0 && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(255, 255, 255, ${input.whiteOverlayOpacity})` }}
          />
        )}

        {/* Branding — positioned at top, does not affect centering */}
        <div className={`absolute inset-x-0 top-0 text-center z-10 ${isVeryCompact ? "p-[2%]" : isCompact ? "p-[3%]" : "p-[5%]"}`}>
          {brandingImageUrl && (
            <div className={`flex justify-center ${isCompact ? "mb-1" : "mb-2"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandingImageUrl}
                alt="Branding"
                className="max-h-[8%] w-auto object-contain drop-shadow-lg"
                style={{ maxHeight: isVeryCompact ? "30px" : isCompact ? "40px" : "60px" }}
                crossOrigin="anonymous"
              />
            </div>
          )}
          {brandingToggles.showName && profile.fullName && (
            <p className={`font-bold drop-shadow-lg ${isVeryCompact ? "text-xs" : isCompact ? "text-sm" : "text-lg"}`} style={{ color: input.headlineColor }}>
              {profile.fullName}
            </p>
          )}
          {brandingToggles.showCompany && profile.companyName && (
            <p className={`drop-shadow-lg ${isVeryCompact ? "text-[10px]" : isCompact ? "text-xs" : "text-sm"}`} style={{ color: input.headlineColor, opacity: 0.9 }}>
              {profile.companyName}
            </p>
          )}
          {brandingToggles.showNmls && profile.nmlsNumber && (
            <p className={`drop-shadow-lg ${isVeryCompact ? "text-[8px]" : isCompact ? "text-[10px]" : "text-xs"}`} style={{ color: input.headlineColor, opacity: 0.7 }}>
              NMLS# {profile.nmlsNumber}
            </p>
          )}
        </div>

        {/* Center: Rates — true centered in the image */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${isVeryCompact ? "p-[3%]" : isCompact ? "p-[4%]" : "p-[5%]"}`}>
          {/* Title */}
          <h2
            className="text-center font-bold drop-shadow-lg"
            style={{
              fontFamily: input.headlineFont !== "Inter" ? input.headlineFont : undefined,
              fontSize: `${isVeryCompact ? Math.round(input.headlineFontSize * 0.6) : isCompact ? Math.round(input.headlineFontSize * 0.75) : input.headlineFontSize}px`,
              color: input.headlineColor,
            }}
          >
            Today&apos;s Rates
          </h2>

          {/* Date — snug below title */}
          <p
            className={`text-center drop-shadow-lg ${isVeryCompact ? "text-[10px] mb-1" : isCompact ? "text-xs mb-1.5" : "text-sm mb-3"}`}
            style={{ color: input.headlineColor, opacity: 0.8 }}
          >
            {formatDate(input.date)}
          </p>

          {/* Rate Cards */}
          <div className={`w-full ${isVeryCompact ? "space-y-1" : isCompact ? "space-y-1.5" : "space-y-2"}`}>
            {visibleRates.map((entry) => (
              <div
                key={entry.id}
                className={`${
                  input.rateCardLayout === "center"
                    ? `grid grid-cols-2 ${isVeryCompact ? "px-2 py-1" : isCompact ? "px-3 py-1.5" : "px-4 py-3"}`
                    : `flex items-center justify-between ${isVeryCompact ? "px-2 py-1" : isCompact ? "px-3 py-1.5" : "px-4 py-3"}`
                } ${
                  input.showRateCardBg
                    ? "bg-white/15 backdrop-blur-sm rounded-lg border border-white/20"
                    : ""
                }`}
              >
                <span
                  className={`font-medium drop-shadow ${
                    isVeryCompact ? "text-xs" : isCompact ? "text-sm" : "text-base"
                  } ${
                    input.rateCardLayout === "center"
                      ? "text-right pr-3 border-r border-white/30 self-center"
                      : ""
                  }`}
                  style={{ color: input.rateTextColor }}
                >
                  {entry.label}
                </span>
                <span
                  className={`font-bold drop-shadow ${
                    isVeryCompact ? "text-sm" : isCompact ? "text-base" : "text-xl"
                  } ${
                    input.rateCardLayout === "center"
                      ? "text-left pl-3 self-center"
                      : ""
                  }`}
                  style={{ color: input.rateTextColor }}
                >
                  {formatRate(entry.rate)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Scenario Descriptions */}
        {input.showScenarioDescriptions && visibleRates.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 p-[5%] z-10">
            <div className="space-y-0.5 w-full">
              {visibleRates.map((entry) => (
                <p
                  key={`scenario-${entry.id}`}
                  className="text-[7px] leading-tight drop-shadow"
                  style={{ color: input.rateTextColor, opacity: 0.6 }}
                >
                  {entry.label} rate based on a home value of{" "}
                  {formatCurrency(entry.propertyValue)} and{" "}
                  {formatCurrency(entry.loanAmount)} loan amount,{" "}
                  {entry.creditScore} credit score.
                  {entry.isHomeReady &&
                    " Income must be at or below 80% of the AMI."}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

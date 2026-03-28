"use client";

import { forwardRef } from "react";
import { useRefiStore } from "@/stores/refi-store";
import { useQuoteStore } from "@/stores/quote-store";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  DollarSign,
  TrendingDown,
  Lightbulb,
  Zap,
  Gift,
} from "lucide-react";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function rateDisplay(rate: number): string {
  return (rate * 100).toFixed(3) + "%";
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-gray-600" />
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

export const RefiComparisonCard = forwardRef<HTMLDivElement>(
  function RefiComparisonCard(_props, ref) {
    const result = useRefiStore((s) => s.result);
    const input = useRefiStore((s) => s.input);
    const sectionVisibility = useRefiStore((s) => s.sectionVisibility);
    const { brandingImageUrl, profile, brandingToggles } = useQuoteStore();

    if (!result) {
      return (
        <div ref={ref} className="bg-white p-8 rounded-lg">
          <div className="py-12 text-center text-muted-foreground">
            Fill in the loan details to see your refinance comparison.
          </div>
        </div>
      );
    }

    const paymentSavings = result.monthlyPaymentDifference >= 0;
    const interestSavings = result.totalInterestSavings >= 0;

    return (
      <div ref={ref} className="bg-white text-gray-900 p-6 rounded-lg">
        {/* Branding Header */}
        <div className="text-center mb-4">
          {brandingImageUrl && (
            <div className="flex justify-center mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandingImageUrl}
                alt="Branding"
                className="max-h-20 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}
          {brandingToggles.showName && profile.fullName && (
            <h2 className="text-lg font-bold text-gray-800">
              {profile.fullName}
            </h2>
          )}
          {brandingToggles.showCompany && profile.companyName && (
            <p className="text-sm text-gray-600">{profile.companyName}</p>
          )}
          {brandingToggles.showNmls && profile.nmlsNumber && (
            <p className="text-xs text-gray-500">
              NMLS# {profile.nmlsNumber}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold">Refinance Analysis</h2>
          <p className="text-sm text-gray-500">
            {rateDisplay(input.originalRate ?? 0)} {input.originalTermYears ?? 30}yr
            {" "}
            &rarr;{" "}
            {rateDisplay(input.newRate ?? 0)} {input.newTermYears ?? 30}yr
          </p>
        </div>

        {/* Monthly Payment Comparison */}
        {sectionVisibility.monthlyPayment && (
          <>
            <SectionHeader icon={DollarSign} title="Monthly Payment Comparison" />
            <div className="grid grid-cols-3 gap-4 text-center mb-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Current Payment
                </p>
                <p className="text-xl font-bold">
                  {fmt.format(result.currentMonthlyPayment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  New Payment
                </p>
                <p className="text-xl font-bold">
                  {fmt.format(result.newMonthlyPayment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Difference
                </p>
                <div className="flex items-center justify-center gap-1">
                  {paymentSavings ? (
                    <ArrowDown className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowUp className="h-4 w-4 text-red-600" />
                  )}
                  <p
                    className={`text-xl font-bold ${
                      paymentSavings ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmt.format(Math.abs(result.monthlyPaymentDifference))}
                  </p>
                </div>
                <p
                  className={`text-xs ${
                    paymentSavings ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {paymentSavings ? "lower" : "higher"}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Interest Savings */}
        {sectionVisibility.interestSavings && (
          <>
            <SectionHeader icon={TrendingDown} title="Interest Savings" />
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Current Loan&apos;s Remaining Interest
                </span>
                <span className="font-semibold">
                  {fmt.format(result.currentRemainingInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  New Loan Total Interest
                </span>
                <span className="font-semibold">
                  {fmt.format(result.newTotalInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">
                  Total Interest Savings
                </span>
                <span
                  className={`text-lg font-bold ${
                    interestSavings ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {fmt.format(Math.abs(result.totalInterestSavings))}
                  <span className="text-xs ml-1">
                    {interestSavings ? "saved" : "more"}
                  </span>
                </span>
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Break-Even Analysis */}
        {sectionVisibility.breakEven && (
          <>
            <SectionHeader icon={Clock} title="Break-Even Analysis" />
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Refinance Costs
                </span>
                <span className="font-semibold">
                  {fmt.format(input.closingCosts ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Time to Recoup Fees
                </span>
                <span className="font-semibold">
                  {result.breakEvenMonths >= 0
                    ? `${result.breakEvenMonths} months`
                    : "N/A (payment increases)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Daily Interest Saved
                </span>
                <span
                  className={`font-semibold ${
                    result.dailyInterestSaved >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {fmt.format(Math.abs(result.dailyInterestSaved))}/day
                </span>
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Accelerated Payoff */}
        {sectionVisibility.acceleratedPayoff && result.acceleratedPayoff && (
          <>
            <SectionHeader icon={Zap} title="Accelerated Payoff" />
            <div className="space-y-2 mb-2">
              <p className="text-sm text-gray-500 leading-relaxed">
                If you maintain your current payment of{" "}
                <span className="font-semibold text-gray-900">
                  {fmt.format(result.currentMonthlyPayment)}
                </span>{" "}
                at the new rate, you&apos;d pay off in{" "}
                <span className="font-semibold text-gray-900">
                  {result.acceleratedPayoff.yearsSaved >= 1
                    ? `${Math.floor(result.acceleratedPayoff.termMonths / 12)} years${result.acceleratedPayoff.termMonths % 12 > 0 ? ` ${result.acceleratedPayoff.termMonths % 12} months` : ""}`
                    : `${result.acceleratedPayoff.termMonths} months`}
                </span>.
              </p>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-500">
                  Time Saved
                </span>
                <span className="font-semibold text-emerald-600">
                  {result.acceleratedPayoff.yearsSaved} years
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Additional Interest Saved
                </span>
                <span className="font-semibold text-emerald-600">
                  {fmt.format(result.acceleratedPayoff.interestSaved)}
                </span>
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Additional Benefits */}
        {sectionVisibility.additionalBenefits && (result.additionalBenefits.skippedPaymentsValue > 0 || result.additionalBenefits.escrowRefundValue > 0) && (
          <>
            <SectionHeader icon={Gift} title="Additional Benefits" />
            <div className="space-y-2 mb-2">
              {sectionVisibility.showSkippedPayments && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Skipped Payments (approx. 2 months)
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {fmt.format(result.additionalBenefits.skippedPaymentsValue)}
                  </span>
                </div>
              )}
              {result.additionalBenefits.escrowRefundValue > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Escrow Account Refund
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {fmt.format(result.additionalBenefits.escrowRefundValue)}
                  </span>
                </div>
              )}
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Summary */}
        {sectionVisibility.summary && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Lightbulb className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm leading-relaxed text-gray-900">
                {result.summaryText}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

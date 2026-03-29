"use client";

import { forwardRef } from "react";
import { useRefiStore } from "@/stores/refi-store";
import { useQuoteStore } from "@/stores/quote-store";
import { Separator } from "@/components/ui/separator";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function rateDisplay(rate: number): string {
  return (rate * 100).toFixed(3) + "%";
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

/** Standard row: label on left, value on right, with bottom border */
function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-gray-500 ${valueClass ?? ""}`}>{value}</span>
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
            <SectionHeader title="Monthly Payment Comparison" />
            <div className="space-y-2 mb-2">
              <Row label="Current Payment" value={fmt.format(result.currentMonthlyPayment)} />
              <Row label="New Payment" value={fmt.format(result.newMonthlyPayment)} />
              <Row
                label="Difference"
                value={fmt.format(Math.abs(result.monthlyPaymentDifference))}
                valueClass={`font-semibold ${paymentSavings ? "!text-emerald-600" : "!text-red-600"}`}
              />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Interest Savings */}
        {sectionVisibility.interestSavings && (
          <>
            <SectionHeader title="Interest Savings" />
            <div className="space-y-2 mb-2">
              <Row label="Current Loan's Remaining Interest" value={fmt.format(result.currentRemainingInterest)} />
              <Row label="New Loan Total Interest" value={fmt.format(result.newTotalInterest)} />
              <Row
                label="Total Interest Savings"
                value={fmt.format(Math.abs(result.totalInterestSavings))}
                valueClass={`font-semibold ${interestSavings ? "!text-emerald-600" : "!text-red-600"}`}
              />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Break-Even Analysis */}
        {sectionVisibility.breakEven && (
          <>
            <SectionHeader title="Break-Even Analysis" />
            <div className="space-y-2 mb-2">
              <Row label="Refinance Costs" value={fmt.format(input.closingCosts ?? 0)} />
              <Row
                label="Time to Recoup Fees"
                value={result.breakEvenMonths >= 0 ? `${result.breakEvenMonths} months` : "N/A (payment increases)"}
              />
              <Row
                label="Daily Interest Saved"
                value={fmt.format(Math.abs(result.dailyInterestSaved))}
                valueClass={`font-semibold ${result.dailyInterestSaved >= 0 ? "!text-emerald-600" : "!text-red-600"}`}
              />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Accelerated Payoff */}
        {sectionVisibility.acceleratedPayoff && result.acceleratedPayoff && (
          <>
            <SectionHeader title="Accelerated Payoff" />
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
              <Row
                label="Time Saved"
                value={`${result.acceleratedPayoff.yearsSaved.toFixed(1)} years`}
                valueClass="font-semibold !text-emerald-600"
              />
              <Row
                label="Additional Interest Saved"
                value={fmt.format(result.acceleratedPayoff.interestSaved)}
                valueClass="font-semibold !text-emerald-600"
              />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Debt Payoff Analysis */}
        {sectionVisibility.debtPayoff && result.debtPayoff && (
          <>
            <SectionHeader title="Debt Payoff Analysis" />
            <div className="space-y-2 mb-2">
              <Row label="Previous Total Monthly Payments" value={fmt.format(result.debtPayoff.totalOldPayments)} />
              <Row label="New Mortgage Payment" value={fmt.format(result.newMonthlyPayment)} />
              <Row
                label="Monthly Savings (with debt eliminated)"
                value={fmt.format(Math.abs(result.debtPayoff.monthlySavingsWithDebt))}
                valueClass={`font-semibold ${result.debtPayoff.monthlySavingsWithDebt >= 0 ? "!text-emerald-600" : "!text-red-600"}`}
              />
              {result.debtPayoff.acceleratedPayoffYearsSaved > 0 && (
                <>
                  <div className="pt-3">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      If you maintain your previous total payments of{" "}
                      <span className="font-semibold text-gray-900">
                        {fmt.format(result.debtPayoff.totalOldPayments)}
                      </span>{" "}
                      toward the new mortgage, you&apos;d pay off in{" "}
                      <span className="font-semibold text-gray-900">
                        {Math.floor(result.debtPayoff.acceleratedPayoffMonths / 12)} years
                        {result.debtPayoff.acceleratedPayoffMonths % 12 > 0
                          ? ` ${result.debtPayoff.acceleratedPayoffMonths % 12} months`
                          : ""}
                      </span>.
                    </p>
                  </div>
                  <Row
                    label="Time Saved"
                    value={`${result.debtPayoff.acceleratedPayoffYearsSaved.toFixed(1)} years`}
                    valueClass="font-semibold !text-emerald-600"
                  />
                  <Row
                    label="Additional Interest Saved"
                    value={fmt.format(result.debtPayoff.acceleratedPayoffInterestSaved)}
                    valueClass="font-semibold !text-emerald-600"
                  />
                </>
              )}
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Additional Benefits */}
        {sectionVisibility.additionalBenefits && (result.additionalBenefits.skippedPaymentsValue > 0 || result.additionalBenefits.escrowRefundValue > 0) && (
          <>
            <SectionHeader title="Additional Benefits" />
            <div className="space-y-2 mb-2">
              {sectionVisibility.showSkippedPayments && (
                <Row
                  label={`Skipped Payments (${result.additionalBenefits.skippedMonths} month${result.additionalBenefits.skippedMonths > 1 ? "s" : ""})`}
                  value={fmt.format(result.additionalBenefits.skippedPaymentsValue)}
                  valueClass="font-semibold !text-emerald-600"
                />
              )}
              {result.additionalBenefits.escrowRefundValue > 0 && (
                <Row
                  label="Escrow Account Refund"
                  value={fmt.format(result.additionalBenefits.escrowRefundValue)}
                  valueClass="font-semibold !text-emerald-600"
                />
              )}
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Summary */}
        {sectionVisibility.summary && (
          <div className="pt-2">
            <p className="text-sm leading-relaxed text-gray-700">
              {result.summaryText}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 text-center mt-4">
          Estimates only. Get an official Loan Estimate before choosing a loan.
        </p>
      </div>
    );
  }
);

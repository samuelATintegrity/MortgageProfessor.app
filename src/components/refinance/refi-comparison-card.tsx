"use client";

import { forwardRef } from "react";
import { useRefiStore, type RowFormatting } from "@/stores/refi-store";
import { useQuoteStore } from "@/stores/quote-store";
import { Separator } from "@/components/ui/separator";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

/** Standard row: label on left, value on right, with bottom border and optional formatting */
function Row({ label, value, rowKey, formatting, onRowClick }: {
  label: string;
  value: string;
  rowKey?: string;
  formatting?: RowFormatting;
  onRowClick?: (key: string) => void;
}) {
  const style: React.CSSProperties = {};
  if (formatting?.highlight) style.backgroundColor = "#fef08a";
  if (formatting?.bold) style.fontWeight = "bold";
  if (formatting?.underline) style.textDecoration = "underline";
  if (formatting?.color) style.color = formatting.color;

  return (
    <div
      className={`flex justify-between items-center pb-2 border-b border-gray-100 ${rowKey ? "cursor-pointer hover:bg-gray-50" : ""}`}
      style={formatting?.highlight ? { backgroundColor: "#fef08a" } : undefined}
      onClick={rowKey && onRowClick ? () => onRowClick(rowKey) : undefined}
    >
      <span className="text-sm text-gray-500" style={formatting?.bold || formatting?.underline || formatting?.color ? style : undefined}>{label}</span>
      <span className="text-sm text-gray-500" style={formatting?.bold || formatting?.underline || formatting?.color ? style : undefined}>{value}</span>
    </div>
  );
}

export const RefiComparisonCard = forwardRef<HTMLDivElement>(
  function RefiComparisonCard(_props, ref) {
    const result = useRefiStore((s) => s.result);
    const sectionVisibility = useRefiStore((s) => s.sectionVisibility);
    const formatting = useRefiStore((s) => s.formatting);
    const setActiveFormatRow = useRefiStore((s) => s.setActiveFormatRow);
    const { brandingImageUrl, profile, brandingToggles } = useQuoteStore();

    const handleRowClick = (key: string) => setActiveFormatRow(key);

    if (!result) {
      return (
        <div ref={ref} className="bg-white p-8 rounded-lg">
          <div className="py-12 text-center text-muted-foreground">
            Fill in the loan details to see your refinance comparison.
          </div>
        </div>
      );
    }

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
        </div>

        {/* Monthly Payment Comparison */}
        {sectionVisibility.monthlyPayment && (
          <>
            <SectionHeader title="Monthly Payment Comparison" />
            <div className="space-y-2 mb-2">
              <Row label="Current Payment" value={fmt.format(result.currentMonthlyPayment)} rowKey="currentPayment" formatting={formatting["currentPayment"]} onRowClick={handleRowClick} />
              <Row label="New Payment" value={fmt.format(result.newMonthlyPayment)} rowKey="newPayment" formatting={formatting["newPayment"]} onRowClick={handleRowClick} />
              <Row label="Difference" value={fmt.format(Math.abs(result.monthlyPaymentDifference))} rowKey="difference" formatting={formatting["difference"]} onRowClick={handleRowClick} />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Interest Savings */}
        {sectionVisibility.interestSavings && (
          <>
            <SectionHeader title="Interest Savings" />
            <div className="space-y-2 mb-2">
              <Row label="Current Loan's Remaining Interest" value={fmt.format(result.currentRemainingInterest)} rowKey="remainingInterest" formatting={formatting["remainingInterest"]} onRowClick={handleRowClick} />
              <Row label="New Loan Total Interest" value={fmt.format(result.newTotalInterest)} rowKey="newTotalInterest" formatting={formatting["newTotalInterest"]} onRowClick={handleRowClick} />
              <Row label="Total Interest Savings" value={fmt.format(Math.abs(result.totalInterestSavings))} rowKey="totalInterestSavings" formatting={formatting["totalInterestSavings"]} onRowClick={handleRowClick} />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Break-Even Analysis */}
        {sectionVisibility.breakEven && (
          <>
            <SectionHeader title="Break-Even Analysis" />
            <div className="space-y-2 mb-2">
              <Row label="Lender Costs" value={fmt.format(result.lenderCosts)} rowKey="lenderCosts" formatting={formatting["lenderCosts"]} onRowClick={handleRowClick} />
              {result.escrowSetupCosts > 0 && (
                <Row label="Escrow Costs" value={fmt.format(result.escrowSetupCosts)} rowKey="escrowCosts" formatting={formatting["escrowCosts"]} onRowClick={handleRowClick} />
              )}
              {result.escrowSetupCosts > 0 && (
                <Row label="Total Closing Costs" value={fmt.format(result.totalClosingCosts)} rowKey="totalClosingCosts" formatting={formatting["totalClosingCosts"]} onRowClick={handleRowClick} />
              )}
              <Row label="Time to Recoup Fees" value={result.breakEvenMonths >= 0 ? `${result.breakEvenMonths} months` : "N/A (payment increases)"} rowKey="breakEven" formatting={formatting["breakEven"]} onRowClick={handleRowClick} />
              <Row label="Daily Interest Saved" value={fmt.format(Math.abs(result.dailyInterestSaved))} rowKey="dailyInterest" formatting={formatting["dailyInterest"]} onRowClick={handleRowClick} />
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
              <Row label="Time Saved" value={`${result.acceleratedPayoff.yearsSaved.toFixed(1)} years`} rowKey="accelTimeSaved" formatting={formatting["accelTimeSaved"]} onRowClick={handleRowClick} />
              <Row label="Additional Interest Saved" value={fmt.format(result.acceleratedPayoff.interestSaved)} rowKey="accelInterestSaved" formatting={formatting["accelInterestSaved"]} onRowClick={handleRowClick} />
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Debt Payoff Analysis */}
        {sectionVisibility.debtPayoff && result.debtPayoff && (
          <>
            <SectionHeader title="Debt Payoff Analysis" />
            <div className="space-y-2 mb-2">
              <Row label="Previous Total Monthly Payments" value={fmt.format(result.debtPayoff.totalOldPayments)} rowKey="debtOldPayments" formatting={formatting["debtOldPayments"]} onRowClick={handleRowClick} />
              <Row label="New Mortgage Payment" value={fmt.format(result.newMonthlyPayment)} rowKey="debtNewPayment" formatting={formatting["debtNewPayment"]} onRowClick={handleRowClick} />
              <Row label="Monthly Savings (with debt eliminated)" value={fmt.format(Math.abs(result.debtPayoff.monthlySavingsWithDebt))} rowKey="debtMonthlySavings" formatting={formatting["debtMonthlySavings"]} onRowClick={handleRowClick} />
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
                  <Row label="Time Saved" value={`${result.debtPayoff.acceleratedPayoffYearsSaved.toFixed(1)} years`} rowKey="debtTimeSaved" formatting={formatting["debtTimeSaved"]} onRowClick={handleRowClick} />
                  <Row label="Additional Interest Saved" value={fmt.format(result.debtPayoff.acceleratedPayoffInterestSaved)} rowKey="debtInterestSaved" formatting={formatting["debtInterestSaved"]} onRowClick={handleRowClick} />
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
                <Row label={`Skipped Payments (${result.additionalBenefits.skippedMonths} month${result.additionalBenefits.skippedMonths > 1 ? "s" : ""})`} value={fmt.format(result.additionalBenefits.skippedPaymentsValue)} rowKey="skippedPayments" formatting={formatting["skippedPayments"]} onRowClick={handleRowClick} />
              )}
              {result.additionalBenefits.escrowRefundValue > 0 && (
                <Row label="Escrow Account Refund" value={fmt.format(result.additionalBenefits.escrowRefundValue)} rowKey="escrowRefund" formatting={formatting["escrowRefund"]} onRowClick={handleRowClick} />
              )}
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 text-center mt-4">
          Estimates only. Get an official Loan Estimate before choosing a loan.
        </p>
      </div>
    );
  }
);

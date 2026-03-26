"use client";

import { forwardRef } from "react";
import { useQuoteStore } from "@/stores/quote-store";
import type { TierResult } from "@/lib/calculations/quote";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function fmtRate(rate: number) {
  return (rate * 100).toFixed(3) + "%";
}

function PointsCell({ tier }: { tier: TierResult }) {
  if (tier.isLenderCredit) {
    return (
      <span className="text-emerald-600 font-medium">
        Lender Credit: {fmt.format(tier.pointsBuydown)}
      </span>
    );
  }
  return <span>{fmt.format(tier.pointsBuydown)}</span>;
}

interface QuoteComparisonTableProps {
  className?: string;
}

export const QuoteComparisonTable = forwardRef<
  HTMLDivElement,
  QuoteComparisonTableProps
>(function QuoteComparisonTable({ className }, ref) {
  const { input, result } = useQuoteStore();

  if (!result) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Fill in the form to see rate comparisons
      </div>
    );
  }

  const loanTypeLabel =
    input.loanType === "conventional"
      ? "Conventional"
      : input.loanType === "fha"
      ? "FHA"
      : input.loanType === "va"
      ? "VA"
      : "$0 Down";

  const tiers = [result.lowRate, result.parRate, result.lowCost];

  const closingRows: { label: string; getValue: (t: TierResult) => string; bold?: boolean }[] = [
    { label: "Interest Rate", getValue: (t) => fmtRate(t.interestRate) },
    { label: "Points / Buydown", getValue: () => "" },
    { label: "Prepaid & 3rd Party Fees", getValue: (t) => fmt.format(t.prepaidThirdPartyFees) },
    { label: "Lender Fees", getValue: (t) => fmt.format(t.lenderFees) },
    { label: "Temp Buydown", getValue: (t) => fmt.format(t.tempBuydown) },
    { label: "Down Payment", getValue: (t) => fmt.format(t.downPayment) },
    { label: "Seller Credit", getValue: (t) => t.sellerCredit > 0 ? `-${fmt.format(t.sellerCredit)}` : fmt.format(0) },
    { label: "Total Cash at Closing", getValue: (t) => fmt.format(t.totalCashAtClosing), bold: true },
  ];

  const monthlyRows: { label: string; getValue: (t: TierResult) => string; bold?: boolean }[] = [
    { label: "Monthly P&I", getValue: (t) => fmt.format(t.monthlyPI) },
    { label: "Monthly Escrow", getValue: (t) => fmt.format(t.monthlyEscrow) },
    { label: "Monthly MI", getValue: (t) => fmt.format(t.monthlyMI) },
    { label: "Total Monthly Payment", getValue: (t) => fmt.format(t.totalMonthlyPayment), bold: true },
  ];

  return (
    <div
      ref={ref}
      className={`bg-white text-gray-900 p-6 rounded-lg ${className ?? ""}`}
    >
      {/* Header / Branding */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          Mortgage Professor
        </h2>
        <p className="text-xs text-gray-500">NMLS# 000000</p>
      </div>

      {/* Loan Summary */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-sm mb-3">
        <span>
          <span className="text-gray-500">Loan Amount:</span>{" "}
          <span className="font-medium">{fmt.format(result.loanAmount)}</span>
        </span>
        <span>
          <span className="text-gray-500">Home Value:</span>{" "}
          <span className="font-medium">{fmt.format(result.propertyValue)}</span>
        </span>
        <span>
          <span className="text-gray-500">LTV:</span>{" "}
          <span className="font-medium">{(result.ltv * 100).toFixed(0)}%</span>
        </span>
      </div>

      {/* Assumptions */}
      <p className="text-[11px] text-gray-500 text-center mb-4 leading-relaxed">
        {result.assumptionsText}
      </p>

      {/* Title */}
      <h3 className="text-center text-base font-semibold mb-4">
        {loanTypeLabel} {input.loanTermYears} Year Fixed Loan Options For You
      </h3>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left px-3 py-2 font-medium rounded-tl-md">
                &nbsp;
              </th>
              {tiers.map((t) => (
                <th
                  key={t.tierName}
                  className="text-center px-3 py-2 font-medium last:rounded-tr-md"
                >
                  {t.tierName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Closing Cost Section */}
            {closingRows.map((row) => {
              const isPointsRow = row.label === "Points / Buydown";
              return (
                <tr
                  key={row.label}
                  className={`border-b border-gray-200 ${
                    row.bold ? "bg-gray-100" : ""
                  }`}
                >
                  <td
                    className={`px-3 py-2 text-gray-700 ${
                      row.bold ? "font-semibold" : ""
                    }`}
                  >
                    {row.label}
                  </td>
                  {tiers.map((t) => (
                    <td
                      key={t.tierName}
                      className={`px-3 py-2 text-center ${
                        row.bold ? "font-semibold" : ""
                      }`}
                    >
                      {isPointsRow ? (
                        <PointsCell tier={t} />
                      ) : (
                        row.getValue(t)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Separator */}
            <tr>
              <td colSpan={4} className="h-3" />
            </tr>

            {/* Monthly Payment Section */}
            {monthlyRows.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-gray-200 ${
                  row.bold ? "bg-gray-100" : ""
                }`}
              >
                <td
                  className={`px-3 py-2 text-gray-700 ${
                    row.bold ? "font-semibold" : ""
                  }`}
                >
                  {row.label}
                </td>
                {tiers.map((t) => (
                  <td
                    key={t.tierName}
                    className={`px-3 py-2 text-center ${
                      row.bold ? "font-semibold" : ""
                    }`}
                  >
                    {row.getValue(t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
        This is not a loan commitment or guarantee of rates. Rates and fees are
        subject to change without notice. Actual terms may vary based on credit
        profile, property type, and other factors. Contact your loan officer for
        a personalized quote.
      </p>
    </div>
  );
});

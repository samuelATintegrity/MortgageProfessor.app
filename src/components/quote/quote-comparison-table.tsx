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
        Lender Credit: {fmt.format(Math.abs(tier.pointsBuydown))}
      </span>
    );
  }
  return <span>{fmt.format(tier.pointsBuydown)}</span>;
}

/** Returns true if at least one visible tier has a non-zero value */
function anyNonZero(tiers: TierResult[], getValue: (t: TierResult) => number): boolean {
  return tiers.some((t) => getValue(t) !== 0);
}

/** Convert hex color to rgba with alpha for tinting */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface QuoteComparisonTableProps {
  className?: string;
}

export const QuoteComparisonTable = forwardRef<
  HTMLDivElement,
  QuoteComparisonTableProps
>(function QuoteComparisonTable({ className }, ref) {
  const { input, result, brandingImageUrl, headlineFont } = useQuoteStore();

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

  const visibleTiers = result.tiers.filter((t) => t.visible);
  const colSpan = visibleTiers.length + 1;

  const isRefinance = result.transactionType === "refinance";
  const piOnly = result.piOnlyMode;
  const hasBuydown = result.buydownType !== "none" && !isRefinance;

  // Build closing cost rows dynamically
  type RowDef = {
    label: string;
    getValue: (t: TierResult) => string;
    bold?: boolean;
    isPoints?: boolean;
  };

  const closingRows: RowDef[] = [];

  // Interest Rate — always
  closingRows.push({
    label: "Interest Rate",
    getValue: (t) => fmtRate(t.interestRate),
  });

  // Points / Buydown — always
  closingRows.push({
    label: "Points / Buydown",
    getValue: () => "",
    isPoints: true,
  });

  // Title Fees — hide if all $0
  if (anyNonZero(visibleTiers, (t) => t.titleFees)) {
    closingRows.push({
      label: "Title Fees",
      getValue: (t) => fmt.format(t.titleFees),
    });
  }

  // Prepaid Costs — hide if piOnly or all $0
  if (!piOnly && anyNonZero(visibleTiers, (t) => t.prepaidCosts)) {
    closingRows.push({
      label: "Prepaid Costs",
      getValue: (t) => fmt.format(t.prepaidCosts),
    });
  }

  // Lender Fees — hide if all $0
  if (anyNonZero(visibleTiers, (t) => t.lenderFees)) {
    closingRows.push({
      label: "Lender Fees",
      getValue: (t) => fmt.format(t.lenderFees),
    });
  }

  // Buydown Cost — hide if no buydown, refinance, or all $0
  if (hasBuydown && anyNonZero(visibleTiers, (t) => t.buydownCost)) {
    closingRows.push({
      label: "Temp Buydown",
      getValue: (t) => fmt.format(t.buydownCost),
    });
  }

  // Down Payment — hide if refinance or all $0
  if (!isRefinance && anyNonZero(visibleTiers, (t) => t.downPayment)) {
    closingRows.push({
      label: "Down Payment",
      getValue: (t) => fmt.format(t.downPayment),
    });
  }

  // Seller Credit — hide if refinance or all $0
  if (!isRefinance && anyNonZero(visibleTiers, (t) => t.sellerCredit)) {
    closingRows.push({
      label: "Seller Credit",
      getValue: (t) =>
        t.sellerCredit > 0 ? `-${fmt.format(t.sellerCredit)}` : fmt.format(0),
    });
  }

  // VA Funding Fee — hide if all $0
  if (anyNonZero(visibleTiers, (t) => t.vaFundingFee)) {
    closingRows.push({
      label: "VA Funding Fee",
      getValue: (t) => fmt.format(t.vaFundingFee),
    });
  }

  // Total Cash at Closing / Total Loan Costs
  closingRows.push({
    label: piOnly ? "Total Loan Costs" : "Total Cash at Closing",
    getValue: (t) => fmt.format(t.totalCashAtClosing),
    bold: true,
  });

  // Build monthly payment rows
  const monthlyRows: RowDef[] = [];

  // Monthly P&I — always
  monthlyRows.push({
    label: "Monthly P&I",
    getValue: (t) => fmt.format(t.monthlyPI),
  });

  // Monthly Escrow — hide if piOnly or all $0
  if (!piOnly && anyNonZero(visibleTiers, (t) => t.monthlyEscrow)) {
    monthlyRows.push({
      label: "Monthly Escrow",
      getValue: (t) => fmt.format(t.monthlyEscrow),
    });
  }

  // Monthly MI — hide if all $0
  if (!piOnly && anyNonZero(visibleTiers, (t) => t.monthlyMI)) {
    monthlyRows.push({
      label: "Monthly MI",
      getValue: (t) => fmt.format(t.monthlyMI),
    });
  }

  // Total Monthly Payment — hide if piOnly (P&I is the only payment shown)
  if (!piOnly) {
    monthlyRows.push({
      label: hasBuydown ? "Permanent Monthly Payment" : "Total Monthly Payment",
      getValue: (t) => fmt.format(t.totalMonthlyPayment),
      bold: true,
    });
  }

  // Buydown year rows
  const buydownRows: { label: string; getValue: (t: TierResult) => string }[] = [];
  if (hasBuydown) {
    // Determine max years from visible tiers
    const maxYears = Math.max(...visibleTiers.map((t) => t.buydownYears.length));
    for (let y = maxYears; y >= 1; y--) {
      const yearLabel = piOnly ? `Year ${y} P&I` : `Year ${y} Payment`;
      buydownRows.push({
        label: yearLabel,
        getValue: (t) => {
          const yearData = t.buydownYears.find((by) => by.year === y);
          if (!yearData) return "—";
          return fmt.format(piOnly ? yearData.monthlyPI : yearData.monthlyTotal);
        },
      });
    }
    // Reverse so Year 1 is at bottom (closest to permanent)
    // Actually user wants descending: Year 3 first, then Year 2, Year 1
    // The loop already goes maxYears down to 1, so Year 3 is first. That's correct.
  }

  return (
    <div
      ref={ref}
      className={`bg-white text-gray-900 p-6 rounded-lg ${className ?? ""}`}
    >
      {/* Header / Branding */}
      <div className="text-center mb-4">
        {brandingImageUrl ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandingImageUrl}
              alt="Branding"
              className="max-h-20 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800">
              Mortgage Professor
            </h2>
            <p className="text-xs text-gray-500">NMLS# 000000</p>
          </>
        )}
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
      <h3
        className="text-center text-base font-semibold mb-4"
        style={{ fontFamily: headlineFont !== "Inter" ? headlineFont : undefined }}
      >
        {loanTypeLabel} {input.loanTermYears} Year Fixed Loan Options For You
      </h3>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-medium rounded-tl-md bg-gray-800 text-white">
                &nbsp;
              </th>
              {visibleTiers.map((t, i) => (
                <th
                  key={t.id}
                  className={`text-center px-3 py-2 font-medium text-white ${
                    i === visibleTiers.length - 1 ? "rounded-tr-md" : ""
                  }`}
                  style={{ backgroundColor: t.color }}
                >
                  {t.tierName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Closing Cost Section */}
            {closingRows.map((row) => (
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
                {visibleTiers.map((t) => (
                  <td
                    key={t.id}
                    className={`px-3 py-2 text-center ${
                      row.bold ? "font-semibold" : ""
                    }`}
                    style={
                      !row.bold
                        ? { backgroundColor: hexToRgba(t.color, 0.06) }
                        : undefined
                    }
                  >
                    {row.isPoints ? <PointsCell tier={t} /> : row.getValue(t)}
                  </td>
                ))}
              </tr>
            ))}

            {/* Separator */}
            <tr>
              <td colSpan={colSpan} className="h-3" />
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
                {visibleTiers.map((t) => (
                  <td
                    key={t.id}
                    className={`px-3 py-2 text-center ${
                      row.bold ? "font-semibold" : ""
                    }`}
                    style={
                      !row.bold
                        ? { backgroundColor: hexToRgba(t.color, 0.06) }
                        : undefined
                    }
                  >
                    {row.getValue(t)}
                  </td>
                ))}
              </tr>
            ))}

            {/* Buydown Year Rows */}
            {buydownRows.length > 0 && (
              <>
                <tr>
                  <td colSpan={colSpan} className="h-1" />
                </tr>
                {buydownRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-gray-200"
                  >
                    <td className="px-3 py-2 text-gray-700">{row.label}</td>
                    {visibleTiers.map((t) => (
                      <td
                        key={t.id}
                        className="px-3 py-2 text-center"
                        style={{ backgroundColor: hexToRgba(t.color, 0.06) }}
                      >
                        {row.getValue(t)}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
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

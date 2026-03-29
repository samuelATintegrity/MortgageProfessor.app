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

function PointsLabel({ tier }: { tier: TierResult }) {
  if (tier.isLenderCredit) {
    return <span className="text-gray-700 text-xs">Lender Credit</span>;
  }
  return <span className="text-gray-700 text-xs">Points/Origination</span>;
}

function PointsValue({ tier }: { tier: TierResult }) {
  if (tier.isLenderCredit) {
    return (
      <span className="text-emerald-600 font-medium">
        {fmt.format(Math.abs(tier.pointsBuydown))}
      </span>
    );
  }
  return <span>{fmt.format(Math.abs(tier.pointsBuydown) < 0.01 ? 0 : tier.pointsBuydown)}</span>;
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
  const { input, result, brandingImageUrl, headlineFont, profile, brandingToggles } = useQuoteStore();

  if (!result) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Fill in the form to see rate comparisons
      </div>
    );
  }

  const loanTypeLabels: Record<string, string> = {
    conventional: "Conventional",
    fha: "FHA",
    va: "VA",
    usda: "USDA",
    non_qm: "Non-QM",
    jumbo: "Jumbo",
  };
  const loanTypeLabel = loanTypeLabels[input.loanType ?? "conventional"] ?? input.loanType;

  const visibleTiers = result.tiers.filter((t) => t.visible);

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
    bold: true,
  });

  // Points / Buydown — always
  closingRows.push({
    label: "Points / Buydown",
    getValue: () => "",
    isPoints: true,
  });

  const itemize = result.itemizeMode;

  if (itemize) {
    // Itemized: show each fee individually (hide $0 rows)

    // Title section
    if (anyNonZero(visibleTiers, (t) => t.itemized.titleFee)) {
      closingRows.push({
        label: "Title Fee",
        getValue: (t) => fmt.format(t.itemized.titleFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.escrowFee)) {
      closingRows.push({
        label: "Escrow Fee",
        getValue: (t) => fmt.format(t.itemized.escrowFee),
      });
    }

    // Prepaid section (hide if piOnly)
    if (!piOnly) {
      if (anyNonZero(visibleTiers, (t) => t.itemized.prepaidInterest)) {
        closingRows.push({
          label: "Prepaid Interest",
          getValue: (t) => fmt.format(t.itemized.prepaidInterest),
        });
      }
      if (anyNonZero(visibleTiers, (t) => t.itemized.prepaidTaxes)) {
        closingRows.push({
          label: "Prepaid Taxes",
          getValue: (t) => fmt.format(t.itemized.prepaidTaxes),
        });
      }
      if (anyNonZero(visibleTiers, (t) => t.itemized.prepaidHazard)) {
        closingRows.push({
          label: "Prepaid Hazard",
          getValue: (t) => fmt.format(t.itemized.prepaidHazard),
        });
      }
    }

    // Lender fees section
    if (anyNonZero(visibleTiers, (t) => t.itemized.appraisalFee)) {
      closingRows.push({
        label: "Appraisal Fee",
        getValue: (t) => fmt.format(t.itemized.appraisalFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.underwritingFee)) {
      closingRows.push({
        label: "Underwriting Fee",
        getValue: (t) => fmt.format(t.itemized.underwritingFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.processingFee)) {
      closingRows.push({
        label: "Processing Fee",
        getValue: (t) => fmt.format(t.itemized.processingFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.voeCreditFee)) {
      closingRows.push({
        label: "VOE/Credit Fee",
        getValue: (t) => fmt.format(t.itemized.voeCreditFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.taxServiceFee)) {
      closingRows.push({
        label: "Tax Service Fee",
        getValue: (t) => fmt.format(t.itemized.taxServiceFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.mersFee)) {
      closingRows.push({
        label: "MERS Fee",
        getValue: (t) => fmt.format(t.itemized.mersFee),
      });
    }
    if (anyNonZero(visibleTiers, (t) => t.itemized.borrowerComp)) {
      closingRows.push({
        label: "Borrower Comp",
        getValue: (t) => fmt.format(t.itemized.borrowerComp),
      });
    }
  } else {
    // Consolidated view (default)

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

  // Total Cash at Closing / Total Loan Costs
  closingRows.push({
    label: piOnly ? "Total Loan Costs" : isRefinance ? "Total Closing Costs" : "Total Cash at Closing",
    getValue: (t) => {
      const total = piOnly ? t.totalCashAtClosing - (t.downPayment ?? 0) : t.totalCashAtClosing;
      return fmt.format(total);
    },
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

  // Total Monthly Payment — hide if piOnly
  if (!piOnly) {
    monthlyRows.push({
      label: hasBuydown ? "Permanent Monthly Payment" : "Total Monthly Payment",
      getValue: (t) => fmt.format(t.totalMonthlyPayment),
      bold: true,
    });
  }

  // Buydown year rows
  const buydownRows: RowDef[] = [];
  if (hasBuydown) {
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
  }

  // Column grid class based on number of visible tiers
  const gridCols =
    visibleTiers.length === 1
      ? "grid-cols-1"
      : visibleTiers.length === 2
      ? "grid-cols-2"
      : "grid-cols-3";

  return (
    <div
      ref={ref}
      className={`bg-white text-gray-900 p-6 rounded-lg ${className ?? ""}`}
    >
      {/* Header / Branding */}
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
        {/* Fallback if nothing is shown */}
        {!brandingImageUrl && !(brandingToggles.showName && profile.fullName) && (
          <h2 className="text-lg font-bold text-gray-800">Mortgage Professor</h2>
        )}
      </div>

      {/* Loan Summary */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-sm mb-3">
        {result.rollClosingCostsIn && visibleTiers.length > 0 && visibleTiers[0].closingCostsRolledIn > 0 ? (
          <>
            <span>
              <span className="text-gray-500">Base Loan Amount:</span>{" "}
              <span className="font-medium">{fmt.format(result.baseLoanAmount)}</span>
            </span>
            <span>
              <span className="text-gray-500">Closing Costs: <span className="font-bold text-gray-700">Rolled In</span></span>
            </span>
          </>
        ) : result.financedFeeAmount > 0 ? (
          <>
            <span>
              <span className="text-gray-500">Base Loan Amount:</span>{" "}
              <span className="font-medium">{fmt.format(result.baseLoanAmount)}</span>
            </span>
            <span>
              <span className="text-gray-500">Total Loan Amount:</span>{" "}
              <span className="font-medium">{fmt.format(result.totalLoanAmount)}</span>
              <span className="text-gray-400 text-xs ml-1">(incl. {result.financedFeeLabel})</span>
            </span>
          </>
        ) : (
          <span>
            <span className="text-gray-500">Loan Amount:</span>{" "}
            <span className="font-medium">{fmt.format(result.loanAmount)}</span>
          </span>
        )}
        <span>
          <span className="text-gray-500">Home Value:</span>{" "}
          <span className="font-medium">{fmt.format(result.propertyValue)}</span>
        </span>
        <span>
          <span className="text-gray-500">LTV:</span>{" "}
          <span className="font-medium">{parseFloat((result.ltv * 100).toFixed(1))}%</span>
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-center text-base font-semibold mb-4"
        style={{ fontFamily: headlineFont !== "Inter" ? headlineFont : undefined }}
      >
        {loanTypeLabel} {input.loanTermYears} Year Fixed Loan Options For You
      </h3>

      {/* Comparison Columns */}
      <div className={`grid ${gridCols} gap-3`}>
        {visibleTiers.map((tier) => (
          <div key={tier.id} className="flex flex-col">
            {/* Tier Header */}
            <div
              className="text-center px-3 py-2 font-bold text-white rounded-t-md text-sm"
              style={{ backgroundColor: tier.color }}
            >
              {tier.tierName}
            </div>

            {/* Closing Cost Rows */}
            <div className="flex-1">
              {closingRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center px-3 py-1.5 border-b border-gray-200 text-sm ${
                    row.bold ? "font-semibold" : ""
                  }`}
                  style={{
                    backgroundColor: row.bold
                      ? hexToRgba(tier.color, 0.15)
                      : "#ffffff",
                  }}
                >
                  {row.isPoints ? (
                    <PointsLabel tier={tier} />
                  ) : (
                    <span className="text-gray-700 text-xs">{row.label}</span>
                  )}
                  <span className="text-right">
                    {row.isPoints ? <PointsValue tier={tier} /> : row.getValue(tier)}
                  </span>
                </div>
              ))}

              {/* Separator */}
              <div className="h-2 bg-white" />

              {/* Monthly Payment Rows */}
              {monthlyRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center px-3 py-1.5 border-b border-gray-200 text-sm ${
                    row.bold ? "font-semibold" : ""
                  }`}
                  style={{
                    backgroundColor: row.bold
                      ? hexToRgba(tier.color, 0.15)
                      : "#ffffff",
                  }}
                >
                  <span className="text-gray-700 text-xs">{row.label}</span>
                  <span>{row.getValue(tier)}</span>
                </div>
              ))}

              {/* Buydown Year Rows */}
              {buydownRows.length > 0 && (
                <>
                  <div className="h-1 bg-white" />
                  {buydownRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center px-3 py-1.5 border-b border-gray-200 text-sm bg-white"
                    >
                      <span className="text-gray-700 text-xs">{row.label}</span>
                      <span>{row.getValue(tier)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assumptions */}
      <p className="text-[11px] text-gray-500 text-center mt-4 leading-relaxed">
        {result.assumptionsText}
      </p>

      {/* Footer Disclaimer */}
      <p className="text-[10px] text-gray-400 text-center mt-4">
        Estimates only. Get an official Loan Estimate before choosing a loan.
      </p>
    </div>
  );
});

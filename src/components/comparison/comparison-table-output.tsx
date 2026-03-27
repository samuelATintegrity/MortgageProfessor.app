"use client";

import { forwardRef, Fragment } from "react";
import { useComparisonStore } from "@/stores/comparison-store";
import type { ComparisonCategory, ComparisonRow } from "@/lib/types/comparison";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const CATEGORY_LABELS: Record<ComparisonCategory, string> = {
  loan_info: "Loan Info",
  closing_costs: "Closing Costs",
  monthly_payment: "Monthly Payment",
};

const CATEGORY_ORDER: ComparisonCategory[] = [
  "loan_info",
  "closing_costs",
  "monthly_payment",
];

function DiffCell({ userValue, competitorValue }: { userValue: number; competitorValue: number }) {
  if (userValue === 0 && competitorValue === 0) return <span className="text-gray-400">—</span>;
  const diff = userValue - competitorValue;
  if (diff === 0) return <span className="text-gray-500">$0.00</span>;
  // Negative diff = user is cheaper = good (green)
  // Positive diff = user is more expensive = bad (red)
  const isGood = diff < 0;
  return (
    <span className={isGood ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
      {isGood ? "-" : "+"}{fmt.format(Math.abs(diff))}
    </span>
  );
}

function formatRowValue(row: ComparisonRow, value: number): string {
  // For interest rate rows, format as percentage
  if (row.competitorLabel.toLowerCase().includes("interest rate") || row.userLabel.toLowerCase().includes("interest rate")) {
    if (value > 0 && value < 1) {
      return (value * 100).toFixed(3) + "%";
    }
  }
  // For loan term, show as plain number
  if (row.competitorLabel.toLowerCase().includes("loan term") || row.userLabel.toLowerCase().includes("loan term")) {
    return value.toString();
  }
  return fmt.format(value);
}

interface ComparisonTableOutputProps {
  className?: string;
}

export const ComparisonTableOutput = forwardRef<
  HTMLDivElement,
  ComparisonTableOutputProps
>(function ComparisonTableOutput({ className }, ref) {
  const { rows, lenderName } = useComparisonStore();

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Upload a competitor quote to begin
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`bg-white text-gray-900 p-6 rounded-lg ${className ?? ""}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-gray-800">Quote Comparison</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your Quote vs. {lenderName || "Competitor"}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left px-3 py-2 font-medium rounded-tl-md w-[35%]">
                &nbsp;
              </th>
              <th className="text-center px-3 py-2 font-medium w-[20%]">
                Your Quote
              </th>
              <th className="text-center px-3 py-2 font-medium w-[20%]">
                {lenderName || "Competitor"}
              </th>
              <th className="text-center px-3 py-2 font-medium rounded-tr-md w-[25%]">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map((category) => {
              const categoryRows = rows.filter((r) => r.category === category);
              // Filter out rows where both values are 0
              const visibleRows = categoryRows.filter(
                (r) => r.userValue !== 0 || r.competitorValue !== 0 || r.userLabel || r.competitorLabel
              );

              if (visibleRows.length === 0) return null;

              const userTotal = categoryRows.reduce(
                (sum, r) => sum + r.userValue,
                0
              );
              const competitorTotal = categoryRows.reduce(
                (sum, r) => sum + r.competitorValue,
                0
              );
              const showTotals = category !== "loan_info";

              return (
                <Fragment key={category}>
                  {/* Category header */}
                  <tr className="bg-gray-100">
                    <td
                      colSpan={4}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      {CATEGORY_LABELS[category]}
                    </td>
                  </tr>

                  {/* Rows */}
                  {visibleRows.map((row) => {
                    // Show the user label, falling back to competitor label
                    const displayLabel = row.userLabel || row.competitorLabel || "—";
                    const showCompetitorLabel =
                      row.competitorLabel &&
                      row.userLabel &&
                      row.competitorLabel.toLowerCase() !== row.userLabel.toLowerCase();

                    return (
                      <tr key={row.id} className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-700">
                          {displayLabel}
                          {showCompetitorLabel && (
                            <span className="block text-xs text-gray-400 italic">
                              ({row.competitorLabel})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.userValue !== 0 ? formatRowValue(row, row.userValue) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.competitorValue !== 0 ? formatRowValue(row, row.competitorValue) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {category !== "loan_info" ? (
                            <DiffCell
                              userValue={row.userValue}
                              competitorValue={row.competitorValue}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Category total */}
                  {showTotals && (
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <td className="px-3 py-2 font-semibold text-gray-700">
                        Total {CATEGORY_LABELS[category]}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        {fmt.format(userTotal)}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        {fmt.format(competitorTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <DiffCell
                          userValue={userTotal}
                          competitorValue={competitorTotal}
                        />
                      </td>
                    </tr>
                  )}

                  {/* Spacer between categories */}
                  <tr>
                    <td colSpan={4} className="h-2" />
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
        This comparison is for informational purposes only. Actual rates, fees,
        and terms may vary. Contact your loan officer for details.
      </p>
    </div>
  );
});


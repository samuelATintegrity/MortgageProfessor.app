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

import type { ClosingCostSubcategory } from "@/lib/types/comparison";

const CLOSING_COST_GROUP_LABELS: Record<ClosingCostSubcategory, string> = {
  lender_fees: "Lender Fees",
  title_fees: "Title & Escrow",
  prepaid: "Prepaids & Escrow",
  government: "Government",
  other: "Other",
};

const CLOSING_COST_GROUP_ORDER: ClosingCostSubcategory[] = [
  "lender_fees",
  "title_fees",
  "prepaid",
  "government",
  "other",
];

function DiffCell({ userValue, competitorValue, format }: { userValue: number; competitorValue: number; format?: "currency" | "percentage" | "plain" }) {
  if (userValue === 0 && competitorValue === 0) return <span className="text-gray-400">—</span>;
  const diff = userValue - competitorValue;
  if (diff === 0) return <span className="text-gray-500">{format === "percentage" ? "0%" : "$0.00"}</span>;
  const isGood = diff < 0;
  const formatted = format === "percentage"
    ? Math.abs(diff).toFixed(3) + "%"
    : fmt.format(Math.abs(diff));
  return (
    <span className={isGood ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
      {isGood ? "-" : "+"}{formatted}
    </span>
  );
}

function formatRowValue(row: ComparisonRow, value: number): string {
  const format = row.format ?? "currency";
  if (format === "percentage") return value.toFixed(3) + "%";
  if (format === "plain") return value.toString();
  return fmt.format(value);
}

function RowDisplay({ row, showDiff }: { row: ComparisonRow; showDiff: boolean }) {
  const displayLabel = row.userLabel || row.competitorLabel || "—";
  const showCompetitorLabel =
    row.competitorLabel &&
    row.userLabel &&
    row.competitorLabel.toLowerCase() !== row.userLabel.toLowerCase();

  return (
    <tr className="border-b border-gray-200">
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
        {showDiff ? (
          <DiffCell
            userValue={row.userValue}
            competitorValue={row.competitorValue}
            format={row.format}
          />
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function SavingsSummary({ rows, yourLabel, lenderName }: { rows: ComparisonRow[]; yourLabel: string; lenderName: string }) {
  const closingRows = rows.filter((r) => r.category === "closing_costs" && (r.format ?? "currency") === "currency");
  const monthlyRows = rows.filter((r) => r.category === "monthly_payment" && (r.format ?? "currency") === "currency");

  const userClosing = closingRows.reduce((s, r) => s + r.userValue, 0);
  const compClosing = closingRows.reduce((s, r) => s + r.competitorValue, 0);
  const userMonthly = monthlyRows.reduce((s, r) => s + r.userValue, 0);
  const compMonthly = monthlyRows.reduce((s, r) => s + r.competitorValue, 0);

  const closingDiff = userClosing - compClosing;
  const monthlyDiff = userMonthly - compMonthly;

  const hasBothClosing = userClosing > 0 && compClosing > 0;
  const hasBothMonthly = userMonthly > 0 && compMonthly > 0;

  if (!hasBothClosing && !hasBothMonthly) return null;

  const competitorLabel = lenderName || "Competitor";

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {hasBothClosing && closingDiff !== 0 && (
        <div className={`rounded-lg p-3 text-center ${closingDiff < 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
          <p className={`text-sm font-semibold ${closingDiff < 0 ? "text-emerald-700" : "text-red-700"}`}>
            {closingDiff < 0
              ? `${yourLabel} saves ${fmt.format(Math.abs(closingDiff))}`
              : `${competitorLabel} saves ${fmt.format(Math.abs(closingDiff))}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">in closing costs</p>
        </div>
      )}
      {hasBothMonthly && monthlyDiff !== 0 && (
        <div className={`rounded-lg p-3 text-center ${monthlyDiff < 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
          <p className={`text-sm font-semibold ${monthlyDiff < 0 ? "text-emerald-700" : "text-red-700"}`}>
            {monthlyDiff < 0
              ? `${yourLabel} saves ${fmt.format(Math.abs(monthlyDiff))}/mo`
              : `${competitorLabel} saves ${fmt.format(Math.abs(monthlyDiff))}/mo`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">in monthly payment</p>
        </div>
      )}
    </div>
  );
}

interface ComparisonTableOutputProps {
  className?: string;
}

export const ComparisonTableOutput = forwardRef<
  HTMLDivElement,
  ComparisonTableOutputProps
>(function ComparisonTableOutput({ className }, ref) {
  const { rows, lenderName, companyName } = useComparisonStore();
  const yourLabel = companyName || "Your Quote";

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
          {yourLabel} vs. {lenderName || "Competitor"}
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
                {yourLabel}
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
              const visibleRows = categoryRows.filter(
                (r) => r.userValue !== 0 || r.competitorValue !== 0 || r.userLabel || r.competitorLabel
              );

              if (visibleRows.length === 0) return null;

              const currencyRows = categoryRows.filter((r) => (r.format ?? "currency") === "currency");
              const userTotal = currencyRows.reduce((sum, r) => sum + r.userValue, 0);
              const competitorTotal = currencyRows.reduce((sum, r) => sum + r.competitorValue, 0);
              const showTotals = category !== "loan_info";

              return (
                <Fragment key={category}>
                  {/* Category header */}
                  <tr className="bg-gray-100">
                    <td colSpan={4} className="px-3 py-2 font-semibold text-gray-700">
                      {CATEGORY_LABELS[category]}
                    </td>
                  </tr>

                  {/* Closing costs: group by subcategory */}
                  {category === "closing_costs" ? (
                    CLOSING_COST_GROUP_ORDER.map((group) => {
                      const groupRows = visibleRows.filter(
                        (r) => (r.closingCostCategory ?? "other") === group
                      );
                      if (groupRows.length === 0) return null;

                      const groupUserTotal = groupRows.reduce((s, r) => s + r.userValue, 0);
                      const groupCompTotal = groupRows.reduce((s, r) => s + r.competitorValue, 0);

                      return (
                        <Fragment key={group}>
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {CLOSING_COST_GROUP_LABELS[group]}
                            </td>
                          </tr>
                          {groupRows.map((row) => (
                            <RowDisplay key={row.id} row={row} showDiff={true} />
                          ))}
                          <tr className="border-b border-gray-200">
                            <td className="px-4 py-1.5 text-xs font-medium text-gray-500 italic">
                              Subtotal
                            </td>
                            <td className="px-3 py-1.5 text-center text-xs font-medium text-gray-500">
                              {fmt.format(groupUserTotal)}
                            </td>
                            <td className="px-3 py-1.5 text-center text-xs font-medium text-gray-500">
                              {fmt.format(groupCompTotal)}
                            </td>
                            <td className="px-3 py-1.5 text-center text-xs">
                              <DiffCell userValue={groupUserTotal} competitorValue={groupCompTotal} />
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })
                  ) : (
                    visibleRows.map((row) => (
                      <RowDisplay key={row.id} row={row} showDiff={category !== "loan_info"} />
                    ))
                  )}

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
                        <DiffCell userValue={userTotal} competitorValue={competitorTotal} />
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan={4} className="h-2" />
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Savings Summary */}
      <SavingsSummary rows={rows} yourLabel={yourLabel} lenderName={lenderName} />

      {/* Footer */}
      <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
        This comparison is for informational purposes only. Actual rates, fees,
        and terms may vary. Contact your loan officer for details.
      </p>
    </div>
  );
});


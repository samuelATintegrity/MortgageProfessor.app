"use client";

import { useRefiStore } from "@/stores/refi-store";
import { Button } from "@/components/ui/button";
import { X, Highlighter, Bold, Underline, Eraser } from "lucide-react";

const COLOR_PRESETS = [
  { label: "Default", value: undefined, className: "bg-gray-500" },
  { label: "Blue", value: "#2563eb", className: "bg-blue-600" },
  { label: "Red", value: "#dc2626", className: "bg-red-600" },
  { label: "Green", value: "#16a34a", className: "bg-green-600" },
  { label: "Black", value: "#111827", className: "bg-gray-900" },
];

/** Row key → human-readable label */
const ROW_LABELS: Record<string, string> = {
  currentPayment: "Current Payment",
  newPayment: "New Payment",
  difference: "Difference",
  remainingInterest: "Remaining Interest",
  newTotalInterest: "New Loan Total Interest",
  totalInterestSavings: "Total Interest Savings",
  lenderCosts: "Lender Costs",
  escrowCosts: "Escrow Costs",
  totalClosingCosts: "Total Closing Costs",
  breakEven: "Time to Recoup Fees",
  dailyInterest: "Daily Interest Saved",
  accelTimeSaved: "Time Saved",
  accelInterestSaved: "Additional Interest Saved",
  debtOldPayments: "Previous Total Payments",
  debtNewPayment: "New Mortgage Payment",
  debtMonthlySavings: "Monthly Savings",
  debtTimeSaved: "Time Saved (Debt)",
  debtInterestSaved: "Interest Saved (Debt)",
  skippedPayments: "Skipped Payments",
  escrowRefund: "Escrow Refund",
};

export function RefiFormatToolbar() {
  const activeFormatRow = useRefiStore((s) => s.activeFormatRow);
  const formatting = useRefiStore((s) => s.formatting);
  const setRowFormatting = useRefiStore((s) => s.setRowFormatting);
  const setActiveFormatRow = useRefiStore((s) => s.setActiveFormatRow);
  const clearAllFormatting = useRefiStore((s) => s.clearAllFormatting);

  if (!activeFormatRow) return null;

  const current = formatting[activeFormatRow] ?? {};
  const rowLabel = ROW_LABELS[activeFormatRow] ?? activeFormatRow;

  function toggle(prop: "highlight" | "bold" | "underline") {
    if (!activeFormatRow) return;
    setRowFormatting(activeFormatRow, { [prop]: !current[prop] });
  }

  function setColor(color: string | undefined) {
    if (!activeFormatRow) return;
    setRowFormatting(activeFormatRow, { color });
  }

  function clearRow() {
    if (!activeFormatRow) return;
    setRowFormatting(activeFormatRow, { highlight: false, bold: false, underline: false, color: undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white border rounded-lg shadow-sm">
      <span className="text-sm font-medium text-gray-700 mr-1">{rowLabel}</span>

      <div className="h-5 w-px bg-gray-200" />

      {/* Highlight */}
      <Button
        type="button"
        variant={current.highlight ? "default" : "outline"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => toggle("highlight")}
        title="Highlight"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </Button>

      {/* Bold */}
      <Button
        type="button"
        variant={current.bold ? "default" : "outline"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => toggle("bold")}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>

      {/* Underline */}
      <Button
        type="button"
        variant={current.underline ? "default" : "outline"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => toggle("underline")}
        title="Underline"
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>

      <div className="h-5 w-px bg-gray-200" />

      {/* Color presets */}
      {COLOR_PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          className={`h-6 w-6 rounded-full border-2 transition-colors ${preset.className} ${
            current.color === preset.value ? "border-gray-900 ring-2 ring-gray-300" : "border-transparent"
          }`}
          onClick={() => setColor(preset.value)}
          title={preset.label}
        />
      ))}

      <div className="h-5 w-px bg-gray-200" />

      {/* Clear row formatting */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={clearRow}
        title="Clear formatting"
      >
        <Eraser className="h-3.5 w-3.5" />
      </Button>

      {/* Clear all */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-muted-foreground"
        onClick={clearAllFormatting}
      >
        Clear All
      </Button>

      {/* Close */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 ml-auto"
        onClick={() => setActiveFormatRow(null)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

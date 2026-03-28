"use client";

import { useComparisonStore } from "@/stores/comparison-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ComparisonCategory, ComparisonRow, ValueFormat, ClosingCostSubcategory } from "@/lib/types/comparison";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function formatTotal(format: ValueFormat | undefined, total: number): string {
  if (format === "percentage" || format === "plain") return "";
  return fmt.format(total);
}

function ValueInput({
  row,
  field,
  onChange,
}: {
  row: ComparisonRow;
  field: "userValue" | "competitorValue";
  onChange: (value: number) => void;
}) {
  const format = row.format ?? "currency";
  const value = row[field];

  if (format === "percentage") {
    return (
      <div className="relative">
        <Input
          type="number"
          step="0.001"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-sm pr-6"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
          %
        </span>
      </div>
    );
  }

  if (format === "plain") {
    return (
      <Input
        type="number"
        step="1"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-sm"
      />
    );
  }

  // Default: currency
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
        $
      </span>
      <Input
        type="number"
        step="0.01"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-sm pl-5"
      />
    </div>
  );
}

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

export function ComparisonTableEditor() {
  const { rows, lenderName, setLenderName, headerColor, setHeaderColor, updateRow, addRow, removeRow } =
    useComparisonStore();

  return (
    <div className="space-y-4">
      {/* Lender name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Competitor Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="lenderName">
              Competitor Lender Name
            </label>
            <Input
              id="lenderName"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="e.g. ABC Mortgage"
            />
          </div>
          <div className="space-y-1 mt-3">
            <label className="text-sm font-medium" htmlFor="headerColor">
              Header Color
            </label>
            <div className="flex items-center gap-2">
              <input
                id="headerColor"
                type="color"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{headerColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category sections */}
      {CATEGORY_ORDER.map((category) => {
        const categoryRows = rows.filter((r) => r.category === category);
        const currencyRows = categoryRows.filter((r) => (r.format ?? "currency") === "currency");
        const userTotal = currencyRows.reduce((sum, r) => sum + r.userValue, 0);
        const competitorTotal = currencyRows.reduce(
          (sum, r) => sum + r.competitorValue,
          0
        );

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {CATEGORY_LABELS[category]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_120px_1fr_120px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Your Label</span>
                <span>Your Value</span>
                <span>Competitor Label</span>
                <span>Competitor Value</span>
                <span />
              </div>

              {category === "closing_costs" ? (
                /* Closing costs: group by subcategory */
                CLOSING_COST_GROUP_ORDER.map((group) => {
                  const groupRows = categoryRows.filter(
                    (r) => (r.closingCostCategory ?? "other") === group
                  );

                  const groupUserTotal = groupRows.filter((r) => (r.format ?? "currency") === "currency").reduce((s, r) => s + r.userValue, 0);
                  const groupCompTotal = groupRows.filter((r) => (r.format ?? "currency") === "currency").reduce((s, r) => s + r.competitorValue, 0);

                  return (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center gap-2 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                          {CLOSING_COST_GROUP_LABELS[group]}
                        </p>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>

                      {groupRows.map((row) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-[1fr_120px_1fr_120px_32px] gap-2 items-center"
                        >
                          <Input
                            value={row.userLabel}
                            onChange={(e) =>
                              updateRow(row.id, { userLabel: e.target.value })
                            }
                            placeholder="Label"
                            className="h-8 text-sm"
                          />
                          <ValueInput
                            row={row}
                            field="userValue"
                            onChange={(v) => updateRow(row.id, { userValue: v })}
                          />
                          <Input
                            value={row.competitorLabel}
                            onChange={(e) =>
                              updateRow(row.id, { competitorLabel: e.target.value })
                            }
                            placeholder="Label"
                            className="h-8 text-sm"
                          />
                          <ValueInput
                            row={row}
                            field="competitorValue"
                            onChange={(v) => updateRow(row.id, { competitorValue: v })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeRow(row.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {/* Subcategory subtotal */}
                      {groupRows.length > 0 && (
                        <div className="grid grid-cols-[1fr_120px_1fr_120px_32px] gap-2 items-center text-xs text-muted-foreground italic px-1">
                          <span>Subtotal</span>
                          <span>{fmt.format(groupUserTotal)}</span>
                          <span />
                          <span>{fmt.format(groupCompTotal)}</span>
                          <span />
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => addRow(category, group)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add {CLOSING_COST_GROUP_LABELS[group]}
                      </Button>
                    </div>
                  );
                })
              ) : (
                /* Other categories: flat list */
                <>
                  {categoryRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_120px_1fr_120px_32px] gap-2 items-center"
                    >
                      <Input
                        value={row.userLabel}
                        onChange={(e) =>
                          updateRow(row.id, { userLabel: e.target.value })
                        }
                        placeholder="Label"
                        className="h-8 text-sm"
                      />
                      <ValueInput
                        row={row}
                        field="userValue"
                        onChange={(v) => updateRow(row.id, { userValue: v })}
                      />
                      <Input
                        value={row.competitorLabel}
                        onChange={(e) =>
                          updateRow(row.id, { competitorLabel: e.target.value })
                        }
                        placeholder="Label"
                        className="h-8 text-sm"
                      />
                      <ValueInput
                        row={row}
                        field="competitorValue"
                        onChange={(v) => updateRow(row.id, { competitorValue: v })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeRow(row.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => addRow(category)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Row
                  </Button>
                </>
              )}

              {/* Category total */}
              {categoryRows.length > 0 && category !== "loan_info" && (
                <div className="grid grid-cols-[1fr_120px_1fr_120px_32px] gap-2 items-center pt-2 border-t">
                  <span className="text-sm font-semibold px-1">Total</span>
                  <span className="text-sm font-semibold px-1">
                    {fmt.format(userTotal)}
                  </span>
                  <span />
                  <span className="text-sm font-semibold px-1">
                    {fmt.format(competitorTotal)}
                  </span>
                  <span />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

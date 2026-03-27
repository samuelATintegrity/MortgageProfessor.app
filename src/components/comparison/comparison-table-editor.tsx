"use client";

import { useComparisonStore } from "@/stores/comparison-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ComparisonCategory } from "@/lib/types/comparison";

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

export function ComparisonTableEditor() {
  const { rows, lenderName, setLenderName, updateRow, addRow, removeRow } =
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
        </CardContent>
      </Card>

      {/* Category sections */}
      {CATEGORY_ORDER.map((category) => {
        const categoryRows = rows.filter((r) => r.category === category);
        const userTotal = categoryRows.reduce((sum, r) => sum + r.userValue, 0);
        const competitorTotal = categoryRows.reduce(
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
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.userValue || ""}
                      onChange={(e) =>
                        updateRow(row.id, {
                          userValue: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-sm pl-5"
                    />
                  </div>
                  <Input
                    value={row.competitorLabel}
                    onChange={(e) =>
                      updateRow(row.id, { competitorLabel: e.target.value })
                    }
                    placeholder="Label"
                    className="h-8 text-sm"
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.competitorValue || ""}
                      onChange={(e) =>
                        updateRow(row.id, {
                          competitorValue: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-sm pl-5"
                    />
                  </div>
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

              {/* Totals */}
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

              {/* Add row button */}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => addRow(category)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Row
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

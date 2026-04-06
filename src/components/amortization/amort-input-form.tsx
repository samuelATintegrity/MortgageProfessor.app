"use client";

import { useAmortizationStore } from "@/stores/amortization-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";

export function AmortInputForm() {
  const { scenarios, addScenario, removeScenario, updateScenario } =
    useAmortizationStore();

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <Card
          key={scenario.id}
          className="relative overflow-hidden"
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{ backgroundColor: scenario.color }}
          />
          <CardHeader className="pb-3 pl-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                <Input
                  value={scenario.label}
                  onChange={(e) =>
                    updateScenario(scenario.id, { label: e.target.value })
                  }
                  className="h-8 text-base font-semibold border-none shadow-none px-0 focus-visible:ring-0"
                  placeholder="Scenario name"
                />
              </CardTitle>
              {scenarios.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeScenario(scenario.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-5">
            <CurrencyInput
              label="Loan Amount"
              id={`loan-${scenario.id}`}
              value={scenario.loanAmount}
              onChange={(val) =>
                updateScenario(scenario.id, { loanAmount: val })
              }
            />

            <div className="space-y-1">
              <Label htmlFor={`rate-${scenario.id}`}>Rate %</Label>
              <div className="relative">
                <Input
                  id={`rate-${scenario.id}`}
                  type="number"
                  step="0.125"
                  value={
                    scenario.annualRate
                      ? (scenario.annualRate * 100).toFixed(3)
                      : ""
                  }
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value);
                    if (!isNaN(pct)) {
                      updateScenario(scenario.id, {
                        annualRate: pct / 100,
                      });
                    }
                  }}
                  className="pr-7"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`term-${scenario.id}`}>Loan Term</Label>
              <Select
                id={`term-${scenario.id}`}
                value={String(scenario.termYears)}
                onChange={(e) =>
                  updateScenario(scenario.id, {
                    termYears: parseInt(e.target.value),
                  })
                }
              >
                <SelectOption value="10">10 Years</SelectOption>
                <SelectOption value="15">15 Years</SelectOption>
                <SelectOption value="20">20 Years</SelectOption>
                <SelectOption value="25">25 Years</SelectOption>
                <SelectOption value="30">30 Years</SelectOption>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}

      {scenarios.length < 3 && (
        <Button
          onClick={addScenario}
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Scenario
        </Button>
      )}
    </div>
  );
}

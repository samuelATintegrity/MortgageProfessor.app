"use client";

import { useRefiStore } from "@/stores/refi-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function CurrencyInput({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  id: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          className="pl-7"
          value={value ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

function PercentageInput({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  id: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.001"
          min={0}
          max={100}
          value={value !== undefined ? parseFloat((value * 100).toFixed(3)) : ""}
          onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          %
        </span>
      </div>
    </div>
  );
}

function formatDateForInput(date: Date | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function RefiInputForm() {
  const { input, setInput } = useRefiStore();

  return (
    <div className="space-y-4">
      {/* Current Loan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Loan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Original Loan Amount"
            id="originalLoanAmount"
            value={input.originalLoanAmount}
            onChange={(val) => setInput({ originalLoanAmount: val })}
          />

          <PercentageInput
            label="Original Interest Rate"
            id="originalRate"
            value={input.originalRate}
            onChange={(val) => setInput({ originalRate: val })}
          />

          <div className="space-y-1">
            <Label htmlFor="originalTermYears">Original Loan Term</Label>
            <Select
              id="originalTermYears"
              value={String(input.originalTermYears ?? 30)}
              onChange={(e) =>
                setInput({ originalTermYears: parseInt(e.target.value) })
              }
            >
              <SelectOption value="15">15 Years</SelectOption>
              <SelectOption value="20">20 Years</SelectOption>
              <SelectOption value="25">25 Years</SelectOption>
              <SelectOption value="30">30 Years</SelectOption>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="loanStartDate">Loan Start Date</Label>
            <Input
              id="loanStartDate"
              type="date"
              value={formatDateForInput(input.loanStartDate)}
              onChange={(e) =>
                setInput({ loanStartDate: new Date(e.target.value + "T00:00:00") })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* New Loan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Loan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Current Loan Balance"
              id="currentBalance"
              value={input.currentBalance}
              onChange={(val) => setInput({ currentBalance: val })}
            />

            <CurrencyInput
              label="Cash Out Amount"
              id="cashOutAmount"
              value={input.cashOutAmount}
              onChange={(val) => setInput({ cashOutAmount: val })}
            />

            <CurrencyInput
              label="Refinance Closing Costs"
              id="closingCosts"
              value={input.closingCosts}
              onChange={(val) => setInput({ closingCosts: val })}
            />

            <PercentageInput
              label="New Interest Rate"
              id="newRate"
              value={input.newRate}
              onChange={(val) => setInput({ newRate: val })}
            />

            <div className="space-y-1">
              <Label htmlFor="newTermYears">New Loan Term</Label>
              <Select
                id="newTermYears"
                value={String(input.newTermYears ?? 30)}
                onChange={(e) =>
                  setInput({ newTermYears: parseInt(e.target.value) })
                }
              >
                <SelectOption value="15">15 Years</SelectOption>
                <SelectOption value="20">20 Years</SelectOption>
                <SelectOption value="25">25 Years</SelectOption>
                <SelectOption value="30">30 Years</SelectOption>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="newStartDate">New Loan Start Date</Label>
              <Input
                id="newStartDate"
                type="date"
                value={formatDateForInput(input.newStartDate)}
                onChange={(e) =>
                  setInput({ newStartDate: new Date(e.target.value + "T00:00:00") })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="payingCostsMethod">How to Pay Closing Costs</Label>
              <Select
                id="payingCostsMethod"
                value={input.payingCostsMethod ?? "roll_into_loan"}
                onChange={(e) =>
                  setInput({
                    payingCostsMethod: e.target.value as
                      | "out_of_pocket"
                      | "roll_into_loan"
                      | "split",
                  })
                }
              >
                <SelectOption value="out_of_pocket">Out of Pocket</SelectOption>
                <SelectOption value="roll_into_loan">Roll Into Loan</SelectOption>
                <SelectOption value="split">Split</SelectOption>
              </Select>
            </div>

            {input.payingCostsMethod === "split" && (
              <CurrencyInput
                label="Partial Out of Pocket"
                id="partialOutOfPocket"
                value={input.partialOutOfPocket}
                onChange={(val) => setInput({ partialOutOfPocket: val })}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

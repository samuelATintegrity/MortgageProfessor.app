"use client";

import { useQuoteStore } from "@/stores/quote-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";

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

function NumberInput({
  label,
  value,
  onChange,
  id,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  id: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step ?? 1}
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function QuoteInputForm() {
  const { input, setInput } = useQuoteStore();

  const transactionType = (input as Record<string, unknown>).transactionType as string | undefined ?? "purchase";
  const isRefinance = transactionType === "refinance";
  const isVA = input.loanType === "va";

  return (
    <div className="space-y-4">
      {/* Section 1: Loan Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select
              id="transactionType"
              value={transactionType}
              onChange={(e) =>
                setInput({ transactionType: e.target.value } as Record<string, unknown> as never)
              }
            >
              <SelectOption value="purchase">Purchase</SelectOption>
              <SelectOption value="refinance">Refinance</SelectOption>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="loanType">Loan Type</Label>
            <Select
              id="loanType"
              value={input.loanType ?? "conventional"}
              onChange={(e) =>
                setInput({
                  loanType: e.target.value as
                    | "conventional"
                    | "fha"
                    | "va"
                    | "zero_down",
                })
              }
            >
              <SelectOption value="conventional">Conventional</SelectOption>
              <SelectOption value="fha">FHA</SelectOption>
              <SelectOption value="va">VA</SelectOption>
              <SelectOption value="zero_down">$0 Down</SelectOption>
            </Select>
          </div>

          <NumberInput
            label="FICO Score"
            id="fico"
            value={input.fico}
            onChange={(val) => setInput({ fico: val })}
            min={300}
            max={850}
          />

          <div className="space-y-1">
            <Label htmlFor="isBorrowerPaid">Borrower / Lender Paid</Label>
            <Select
              id="isBorrowerPaid"
              value={input.isBorrowerPaid ? "borrower" : "lender"}
              onChange={(e) =>
                setInput({ isBorrowerPaid: e.target.value === "borrower" })
              }
            >
              <SelectOption value="borrower">Borrower Paid</SelectOption>
              <SelectOption value="lender">Lender Paid</SelectOption>
            </Select>
          </div>

          {input.isBorrowerPaid && (
            <NumberInput
              label="Borrower Comp %"
              id="borrowerPaidCompPercent"
              value={
                input.borrowerPaidCompPercent !== undefined
                  ? parseFloat((input.borrowerPaidCompPercent * 100).toFixed(4))
                  : undefined
              }
              onChange={(val) =>
                setInput({ borrowerPaidCompPercent: val / 100 })
              }
              step={0.001}
              suffix="%"
            />
          )}
        </CardContent>
      </Card>

      {/* Section 2: Property & Loan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Property &amp; Loan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Property Value"
            id="propertyValue"
            value={input.propertyValue}
            onChange={(val) => setInput({ propertyValue: val })}
          />

          <CurrencyInput
            label="Loan Amount"
            id="loanAmount"
            value={input.loanAmount}
            onChange={(val) => setInput({ loanAmount: val })}
          />

          <div className="space-y-1">
            <Label htmlFor="loanTermYears">Loan Term</Label>
            <Select
              id="loanTermYears"
              value={String(input.loanTermYears ?? 30)}
              onChange={(e) =>
                setInput({ loanTermYears: parseInt(e.target.value) })
              }
            >
              <SelectOption value="15">15 Years</SelectOption>
              <SelectOption value="20">20 Years</SelectOption>
              <SelectOption value="25">25 Years</SelectOption>
              <SelectOption value="30">30 Years</SelectOption>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="state">State</Label>
            <Select
              id="state"
              value={input.state ?? "UT"}
              onChange={(e) => setInput({ state: e.target.value })}
            >
              <SelectOption value="UT">Utah</SelectOption>
              <SelectOption value="CO">Colorado</SelectOption>
              <SelectOption value="TX">Texas</SelectOption>
              <SelectOption value="AZ">Arizona</SelectOption>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="lockPeriodDays">Lock Period</Label>
            <Select
              id="lockPeriodDays"
              value={String(input.lockPeriodDays ?? 30)}
              onChange={(e) =>
                setInput({ lockPeriodDays: parseInt(e.target.value) })
              }
            >
              <SelectOption value="15">15 Days</SelectOption>
              <SelectOption value="30">30 Days</SelectOption>
              <SelectOption value="45">45 Days</SelectOption>
              <SelectOption value="60">60 Days</SelectOption>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Escrow & Insurance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escrow &amp; Insurance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Hazard Insurance (monthly)"
            id="hazardInsuranceMonthly"
            value={input.hazardInsuranceMonthly}
            onChange={(val) => setInput({ hazardInsuranceMonthly: val })}
          />

          <CurrencyInput
            label="Mortgage Insurance (monthly)"
            id="mortgageInsuranceMonthly"
            value={input.mortgageInsuranceMonthly}
            onChange={(val) => setInput({ mortgageInsuranceMonthly: val })}
          />

          <CurrencyInput
            label="Property Tax (monthly)"
            id="propertyTaxMonthly"
            value={input.propertyTaxMonthly}
            onChange={(val) => setInput({ propertyTaxMonthly: val })}
          />
        </CardContent>
      </Card>

      {/* Section 4: Additional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Additional</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Prepaid Interest Days"
            id="prepaidInterestDays"
            value={input.prepaidInterestDays}
            onChange={(val) => setInput({ prepaidInterestDays: val })}
            min={0}
            max={31}
          />

          <CurrencyInput
            label="Seller / Realtor Credit"
            id="sellerCredit"
            value={input.sellerCredit}
            onChange={(val) => setInput({ sellerCredit: val })}
          />

          <CurrencyInput
            label="Buydown Amount"
            id="buydownAmount"
            value={input.buydownAmount}
            onChange={(val) => setInput({ buydownAmount: val })}
          />

          {isVA && (
            <CurrencyInput
              label="VA Funding Fee"
              id="vaFundingFee"
              value={input.vaFundingFee}
              onChange={(val) => setInput({ vaFundingFee: val })}
            />
          )}

          {isRefinance && (
            <CurrencyInput
              label="Current Balance"
              id="currentBalance"
              value={
                (input as Record<string, unknown>).currentBalance as
                  | number
                  | undefined
              }
              onChange={(val) =>
                setInput({ currentBalance: val } as Record<string, unknown> as never)
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Section 5: Rate Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rate Tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Low Rate */}
          <div>
            <p className="text-sm font-medium mb-2">Low Rate</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Rate %"
                id="lowRate-rate"
                value={
                  input.lowRate
                    ? parseFloat((input.lowRate.rate * 100).toFixed(4))
                    : undefined
                }
                onChange={(val) =>
                  setInput({
                    lowRate: {
                      rate: val / 100,
                      costCredit: input.lowRate?.costCredit ?? 0,
                    },
                  })
                }
                step={0.001}
                suffix="%"
              />
              <NumberInput
                label="Cost / Credit %"
                id="lowRate-costCredit"
                value={input.lowRate?.costCredit}
                onChange={(val) =>
                  setInput({
                    lowRate: {
                      rate: input.lowRate?.rate ?? 0,
                      costCredit: val,
                    },
                  })
                }
                step={0.001}
                suffix="%"
              />
            </div>
          </div>

          {/* Par Rate */}
          <div>
            <p className="text-sm font-medium mb-2">Par Rate</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Rate %"
                id="parRate-rate"
                value={
                  input.parRate
                    ? parseFloat((input.parRate.rate * 100).toFixed(4))
                    : undefined
                }
                onChange={(val) =>
                  setInput({
                    parRate: {
                      rate: val / 100,
                      costCredit: input.parRate?.costCredit ?? 0,
                    },
                  })
                }
                step={0.001}
                suffix="%"
              />
              <NumberInput
                label="Cost / Credit %"
                id="parRate-costCredit"
                value={input.parRate?.costCredit}
                onChange={(val) =>
                  setInput({
                    parRate: {
                      rate: input.parRate?.rate ?? 0,
                      costCredit: val,
                    },
                  })
                }
                step={0.001}
                suffix="%"
              />
            </div>
          </div>

          {/* Low Cost Rate */}
          <div>
            <p className="text-sm font-medium mb-2">Low Cost</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Rate %"
                id="lowCostRate-rate"
                value={
                  input.lowCostRate
                    ? parseFloat((input.lowCostRate.rate * 100).toFixed(4))
                    : undefined
                }
                onChange={(val) =>
                  setInput({
                    lowCostRate: {
                      rate: val / 100,
                      costCredit: input.lowCostRate?.costCredit ?? 0,
                    },
                  })
                }
                step={0.001}
                suffix="%"
              />
              <NumberInput
                label="Cost / Credit %"
                id="lowCostRate-costCredit"
                value={input.lowCostRate?.costCredit}
                onChange={(val) =>
                  setInput({
                    lowCostRate: {
                      rate: input.lowCostRate?.rate ?? 0,
                      costCredit: val,
                    },
                  })
                }
                step={0.001}
                suffix="%"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Negative cost = borrower pays points, Positive = lender credit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

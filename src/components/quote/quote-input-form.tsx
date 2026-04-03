"use client";

import { useState, useEffect, useRef } from "react";
import { useQuoteStore } from "@/stores/quote-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Eye, EyeOff, Info, X, Plus, Trash2 } from "lucide-react";
import type { TierConfig, BuydownType, CreditLine } from "@/lib/calculations/quote";
import { calculateFinancedFeeAmount } from "@/lib/calculations/fees";
import { CurrencyInput } from "@/components/ui/currency-input";

function NumberInput({
  label,
  value,
  onChange,
  id,
  min,
  max,
  step,
  suffix,
  allowNegative,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  id: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  allowNegative?: boolean;
}) {
  const [rawValue, setRawValue] = useState<string>(value?.toString() ?? "");
  const isFocused = useRef(false);

  // Sync from external value changes when not focused
  useEffect(() => {
    if (!isFocused.current) {
      setRawValue(value?.toString() ?? "");
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={isFocused.current ? rawValue : (value ?? "")}
          onFocus={() => {
            isFocused.current = true;
            setRawValue(value?.toString() ?? "");
          }}
          onChange={(e) => {
            const raw = e.target.value;
            // Allow empty, minus, decimal in progress
            const pattern = allowNegative !== false
              ? /^-?\d*\.?\d*$/
              : /^\d*\.?\d*$/;
            if (!pattern.test(raw) && raw !== "") return;
            setRawValue(raw);
            const parsed = parseFloat(raw);
            if (!isNaN(parsed)) onChange(parsed);
          }}
          onBlur={(e) => {
            isFocused.current = false;
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed)) {
              onChange(parsed);
            } else {
              onChange(0);
            }
            setRawValue("");
          }}
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
  const { input, setInput, stickyLtv, setStickyLtv, stickyMiFactor, setStickyMiFactor } = useQuoteStore();

  const [showVaFeeChart, setShowVaFeeChart] = useState(false);

  const transactionType = input.transactionType ?? "purchase";
  const isRefinance = transactionType === "refinance";
  const loanType = input.loanType ?? "conventional";
  const hasFinancedFee = ["fha", "va", "usda"].includes(loanType);
  const tiers = input.tiers ?? [];
  const piOnlyMode = input.piOnlyMode ?? false;
  const itemizeMode = input.itemizeMode ?? false;
  const buydownType = input.buydownType ?? "none";
  const isStreamline = input.isStreamline ?? false;
  const rollClosingCostsIn = input.rollClosingCostsIn ?? false;

  // Compute financed fee for display
  const baseLoanAmount = input.loanAmount ?? 0;
  const financedFeeInfo = calculateFinancedFeeAmount(
    baseLoanAmount,
    loanType,
    input.vaFundingFeePercent ?? 0,
    input.fhaUfmipRefund ?? 0
  );

  function updateTier(index: number, updates: Partial<TierConfig>) {
    const newTiers = tiers.map((t, i) =>
      i === index ? { ...t, ...updates } : t
    );
    setInput({ tiers: newTiers });
  }

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
              onChange={(e) => {
                const newType = e.target.value as "purchase" | "refinance";
                const updates: Record<string, unknown> = { transactionType: newType };
                // Reset streamline when switching to purchase
                if (newType === "purchase") {
                  updates.isStreamline = false;
                  updates.rollClosingCostsIn = false;
                }
                setInput(updates as Partial<typeof input>);
              }}
            >
              <SelectOption value="purchase">Purchase</SelectOption>
              <SelectOption value="refinance">Refinance</SelectOption>
            </Select>
            {isRefinance && (
              <button
                type="button"
                className={`mt-1.5 px-3 py-1 text-xs rounded-full border transition-colors ${
                  isStreamline
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => {
                  const newStreamline = !isStreamline;
                  if (newStreamline) {
                    // Swap to streamline fees
                    setInput({
                      isStreamline: true,
                      appraisalFee: 0,
                      underwritingFee: 900,
                      voeCreditFee: 0,
                    });
                  } else {
                    // Swap back to standard fees
                    setInput({
                      isStreamline: false,
                      appraisalFee: 620,
                      underwritingFee: 1150,
                      voeCreditFee: 200,
                    });
                  }
                }}
              >
                {isStreamline ? "✓ Streamline Refinance" : "Streamline Refinance"}
              </button>
            )}
            {isRefinance && (
              <button
                type="button"
                className={`mt-1.5 px-3 py-1 text-xs rounded-full border transition-colors ${
                  rollClosingCostsIn
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setInput({ rollClosingCostsIn: !rollClosingCostsIn })}
              >
                {rollClosingCostsIn ? "✓ Roll Costs In" : "Roll Costs In"}
              </button>
            )}
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
                    | "usda"
                    | "non_qm"
                    | "jumbo",
                })
              }
            >
              <SelectOption value="conventional">Conventional</SelectOption>
              <SelectOption value="fha">FHA</SelectOption>
              <SelectOption value="va">VA</SelectOption>
              <SelectOption value="usda">USDA</SelectOption>
              <SelectOption value="non_qm">Non-QM</SelectOption>
              <SelectOption value="jumbo">Jumbo</SelectOption>
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

          <div className="space-y-1">
            <CurrencyInput
              label="Loan Amount"
              id="loanAmount"
              value={input.loanAmount}
              onChange={(val) => setInput({ loanAmount: val })}
            />
            <div className="flex flex-wrap gap-1">
              {[
                { label: "97%", ltv: 0.97 },
                { label: "96.5%", ltv: 0.965 },
                { label: "95%", ltv: 0.95 },
                { label: "90%", ltv: 0.90 },
                { label: "80%", ltv: 0.80 },
                { label: "75%", ltv: 0.75 },
              ].map(({ label, ltv }) => {
                const isActive = stickyLtv === ltv;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (isActive) {
                        // Unstick
                        setStickyLtv(null);
                      } else {
                        // Stick and apply — pass propertyValue so setInput doesn't unstick
                        setStickyLtv(ltv);
                        const pv = input.propertyValue ?? 0;
                        if (pv > 0) {
                          setInput({ loanAmount: Math.round(pv * ltv), propertyValue: pv });
                        }
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Escrow &amp; Insurance</CardTitle>
            <Button
              type="button"
              variant={piOnlyMode ? "default" : "outline"}
              size="sm"
              onClick={() => setInput({ piOnlyMode: !piOnlyMode })}
            >
              {piOnlyMode ? "Quoting P&I Only" : "Quote Principal & Interest Only"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${piOnlyMode ? "opacity-50" : ""}`}>
          <CurrencyInput
            label="Hazard Insurance (monthly)"
            id="hazardInsuranceMonthly"
            value={input.hazardInsuranceMonthly}
            onChange={(val) => setInput({ hazardInsuranceMonthly: val })}
          />

          <div className="space-y-1">
            <CurrencyInput
              label="Mortgage Insurance (monthly)"
              id="mortgageInsuranceMonthly"
              value={input.mortgageInsuranceMonthly}
              onChange={(val) => setInput({ mortgageInsuranceMonthly: val })}
            />
            <div className="flex flex-wrap items-center gap-1">
              {[
                { label: ".55%", factor: 0.0055 },
                { label: ".50%", factor: 0.005 },
                { label: ".35%", factor: 0.0035 },
                { label: ".25%", factor: 0.0025 },
              ].map(({ label, factor }) => {
                const isActive = stickyMiFactor === factor;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (isActive) {
                        setStickyMiFactor(null);
                      } else {
                        setStickyMiFactor(factor);
                        const loan = input.loanAmount ?? 0;
                        const pv = input.propertyValue ?? 0;
                        if (loan > 0) {
                          // Pass loanAmount + propertyValue so neither sticky unsticks
                          setInput({
                            mortgageInsuranceMonthly: Math.round((loan * factor) / 12 * 100) / 100,
                            loanAmount: loan,
                            propertyValue: pv,
                          });
                        }
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Factor %"
                  className={`w-20 px-2 py-0.5 text-xs rounded border text-gray-700 ${
                    stickyMiFactor !== null &&
                    ![0.0055, 0.005, 0.0035, 0.0025].includes(stickyMiFactor)
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-gray-300"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const loan = input.loanAmount ?? 0;
                      const pv = input.propertyValue ?? 0;
                      if (!isNaN(val) && loan > 0) {
                        const factor = val / 100;
                        setStickyMiFactor(factor);
                        setInput({
                          mortgageInsuranceMonthly: Math.round((loan * factor) / 12 * 100) / 100,
                          loanAmount: loan,
                          propertyValue: pv,
                        });
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    const loan = input.loanAmount ?? 0;
                    const pv = input.propertyValue ?? 0;
                    if (!isNaN(val) && val > 0 && loan > 0) {
                      const factor = val / 100;
                      setStickyMiFactor(factor);
                      setInput({
                        mortgageInsuranceMonthly: Math.round((loan * factor) / 12 * 100) / 100,
                        loanAmount: loan,
                        propertyValue: pv,
                      });
                    }
                  }}
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Additional</CardTitle>
            <Button
              type="button"
              variant={itemizeMode ? "default" : "outline"}
              size="sm"
              onClick={() => setInput({ itemizeMode: !itemizeMode })}
            >
              {itemizeMode ? "Itemized View" : "Itemize Everything"}
            </Button>
          </div>
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

          <NumberInput
            label="Escrow Tax Months"
            id="escrowTaxMonths"
            value={input.escrowTaxMonths}
            onChange={(val) => setInput({ escrowTaxMonths: val })}
            min={0}
            max={12}
          />

          <NumberInput
            label="Escrow Hazard Months"
            id="escrowHazardMonths"
            value={input.escrowHazardMonths}
            onChange={(val) => setInput({ escrowHazardMonths: val })}
            min={0}
            max={18}
          />

          {!isRefinance && (
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Credits</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    const credits: CreditLine[] = [...(input.credits ?? [])];
                    credits.push({ id: `credit-${Date.now()}`, label: "", amount: 0 });
                    setInput({ credits });
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Credit
                </Button>
              </div>
              {(input.credits ?? []).map((credit, idx) => (
                <div key={credit.id} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Label</Label>}
                    <Input
                      value={credit.label}
                      onChange={(e) => {
                        const credits = [...(input.credits ?? [])];
                        credits[idx] = { ...credits[idx], label: e.target.value };
                        setInput({ credits });
                      }}
                      placeholder="e.g. Seller Credit"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-36 space-y-1">
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Amount</Label>}
                    <CurrencyInput
                      id={`credit-${credit.id}`}
                      value={credit.amount}
                      onChange={(val) => {
                        const credits = [...(input.credits ?? [])];
                        credits[idx] = { ...credits[idx], amount: val };
                        setInput({ credits });
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => {
                      const credits = (input.credits ?? []).filter((_, i) => i !== idx);
                      setInput({ credits });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {(!input.credits || input.credits.length === 0) && (
                <p className="text-xs text-muted-foreground">No credits added. Click &quot;Add Credit&quot; to add seller credits, realtor credits, etc.</p>
              )}
            </div>
          )}

          {/* Financed Fee Section: FHA UFMIP, USDA Guarantee Fee, VA Funding Fee */}
          {hasFinancedFee && (
            <div className="space-y-1 sm:col-span-2">
              {loanType === "fha" && (
                <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">UFMIP: 1.75%</span>
                    <span className="text-sm text-blue-700">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.grossFee)}
                    </span>
                  </div>
                  {isRefinance && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="fhaUfmipRefund" className="text-xs text-blue-700 whitespace-nowrap">UFMIP Refund:</Label>
                      <div className="relative flex-1 max-w-[180px]">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-blue-400 text-xs">$</span>
                        <Input
                          id="fhaUfmipRefund"
                          type="number"
                          step="0.01"
                          min={0}
                          className="h-7 pl-5 text-xs bg-white/80 border-blue-300"
                          value={input.fhaUfmipRefund ?? ""}
                          onChange={(e) => setInput({ fhaUfmipRefund: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                  {isRefinance && (input.fhaUfmipRefund ?? 0) > 0 && (
                    <p className="text-xs text-blue-600">
                      Net UFMIP: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.feeAmount)}
                      {" "}(after {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.refund)} refund)
                    </p>
                  )}
                  <p className="text-xs text-blue-600">
                    {financedFeeInfo.feeAmount > 0
                      ? `Total Loan Amount: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.totalLoanAmount)} (financed into loan)`
                      : "UFMIP fully refunded — no additional amount financed"}
                  </p>
                </div>
              )}

              {loanType === "usda" && (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Guarantee Fee: 1.00%</span>
                    <span className="text-sm text-green-700">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.feeAmount)}
                      {" "}(financed into loan)
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-0.5">
                    Total Loan Amount: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.totalLoanAmount)}
                  </p>
                </div>
              )}

              {loanType === "va" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="vaFundingFeePercent">VA Funding Fee</Label>
                    <button
                      type="button"
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => setShowVaFeeChart(true)}
                      title="View VA funding fee chart"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      id="vaFundingFeePercent"
                      value={String(input.vaFundingFeePercent ?? 0)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setInput({ vaFundingFeePercent: val });
                      }}
                    >
                      <SelectOption value="0">0% (Exempt)</SelectOption>
                      <SelectOption value="0.005">0.5%</SelectOption>
                      <SelectOption value="0.01">1.0%</SelectOption>
                      <SelectOption value="0.0125">1.25%</SelectOption>
                      <SelectOption value="0.015">1.5%</SelectOption>
                      <SelectOption value="0.0215">2.15%</SelectOption>
                      <SelectOption value="0.0225">2.25%</SelectOption>
                      <SelectOption value="0.033">3.3%</SelectOption>
                    </Select>
                    {financedFeeInfo.feeAmount > 0 && (
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        = {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.feeAmount)}
                      </span>
                    )}
                  </div>
                  {financedFeeInfo.feeAmount > 0 && (
                    <p className="text-xs text-gray-500">
                      Total Loan Amount: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFeeInfo.totalLoanAmount)} (financed into loan)
                    </p>
                  )}
                </div>
              )}
            </div>
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

      {/* Section 5: Temporary Buydown (hidden for refinance) */}
      {!isRefinance && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Temporary Buydown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label htmlFor="buydownType">Buydown Type</Label>
              <Select
                id="buydownType"
                value={buydownType}
                onChange={(e) =>
                  setInput({ buydownType: e.target.value as BuydownType })
                }
              >
                <SelectOption value="none">None</SelectOption>
                <SelectOption value="3-2-1">3-2-1 Buydown</SelectOption>
                <SelectOption value="2-1">2-1 Buydown</SelectOption>
                <SelectOption value="1-1">1-1 Buydown</SelectOption>
                <SelectOption value="1-0">1-0 Buydown</SelectOption>
              </Select>
            </div>
            {buydownType !== "none" && (
              <p className="text-xs text-muted-foreground mt-2">
                Buydown cost is auto-calculated per column based on each rate.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 6: Rate Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rate Tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tiers.map((tier, index) => (
            <div
              key={tier.id}
              className="rounded-lg p-3 space-y-3 border"
              style={{ backgroundColor: `${tier.color}15` }}
            >
              {/* Tier header: name, color, visibility */}
              <div className="flex items-center gap-3">
                <ColorPicker
                  value={tier.color}
                  onChange={(color) => updateTier(index, { color })}
                />
                <Input
                  value={tier.name}
                  onChange={(e) => updateTier(index, { name: e.target.value })}
                  className="h-8 text-sm font-medium flex-1 bg-white/80"
                  placeholder="Tier name"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => updateTier(index, { visible: !tier.visible })}
                  title={tier.visible ? "Hide column" : "Show column"}
                >
                  {tier.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {/* Rate and Cost/Credit inputs */}
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Rate %"
                  id={`tier-${tier.id}-rate`}
                  value={
                    tier.rate
                      ? parseFloat((tier.rate * 100).toFixed(4))
                      : undefined
                  }
                  onChange={(val) =>
                    updateTier(index, { rate: val / 100 })
                  }
                  step={0.001}
                  suffix="%"
                />
                <NumberInput
                  label="Cost / Credit %"
                  id={`tier-${tier.id}-costCredit`}
                  value={tier.costCredit}
                  onChange={(val) =>
                    updateTier(index, { costCredit: val })
                  }
                  step={0.001}
                  suffix="%"
                />
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Negative cost = borrower pays points, Positive = lender credit
          </p>
        </CardContent>
      </Card>

      {/* VA Funding Fee Chart Modal */}
      {showVaFeeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowVaFeeChart(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold">VA Funding Fee Reference Chart</h3>
              <button type="button" onClick={() => setShowVaFeeChart(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-5 text-sm">
              {/* Purchase & Construction */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Purchase & Construction Loans</h4>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-1.5 text-left">Usage</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-left">Down Payment</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-right">Funding Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-gray-300 px-3 py-1.5" rowSpan={3}>First use</td><td className="border border-gray-300 px-3 py-1.5">Less than 5%</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">2.15%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">5% or more</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">1.5%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">10% or more</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">1.25%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5" rowSpan={3}>After first use</td><td className="border border-gray-300 px-3 py-1.5">Less than 5%</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">3.3%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">5% or more</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">1.5%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">10% or more</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">1.25%</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Cash-Out Refinancing */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Cash-Out Refinancing Loans</h4>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-1.5 text-left">First Use</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-left">After First Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-1.5 font-medium">2.15%</td>
                      <td className="border border-gray-300 px-3 py-1.5 font-medium">3.3%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* NADL */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Native American Direct Loan (NADL)</h4>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-1.5 text-left">Type</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-right">Funding Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-gray-300 px-3 py-1.5">Purchase</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">1.25%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">Refinance</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">0.5%</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Other VA */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Other VA Home Loan Types</h4>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-1.5 text-left">Loan Type</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-right">Funding Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-gray-300 px-3 py-1.5">IRRRL</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">0.5%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">Manufactured home (not permanently affixed)</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">1.0%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">Loan assumptions</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">0.5%</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5">Vendee loan</td><td className="border border-gray-300 px-3 py-1.5 text-right font-medium">2.25%</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-500">
                Note: Veterans receiving VA disability compensation are exempt from the VA funding fee.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

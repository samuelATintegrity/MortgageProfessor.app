"use client";

import { useState, useRef, useEffect } from "react";
import { useItemizedStore } from "@/stores/itemized-store";
import { useQuoteStore } from "@/stores/quote-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { calculateFinancedFeeAmount } from "@/lib/calculations/fees";

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

function CustomFeeRows({
  section,
  fees,
  onAdd,
  onUpdate,
  onRemove,
}: {
  section: "A" | "B" | "C";
  fees: Array<{ id: string; label: string; amount: number; section: string }>;
  onAdd: (section: "A" | "B" | "C") => void;
  onUpdate: (id: string, partial: { label?: string; amount?: number }) => void;
  onRemove: (id: string) => void;
}) {
  const sectionFees = fees.filter((f) => f.section === section);
  return (
    <div className="col-span-full space-y-2 pt-2 border-t">
      {sectionFees.map((fee) => (
        <div key={fee.id} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor={`cf-label-${fee.id}`} className="text-xs">Fee Name</Label>
            <Input
              id={`cf-label-${fee.id}`}
              value={fee.label}
              onChange={(e) => onUpdate(fee.id, { label: e.target.value })}
              placeholder="Custom fee name"
              className="h-8 text-sm"
            />
          </div>
          <div className="w-32 space-y-1">
            <Label htmlFor={`cf-amount-${fee.id}`} className="text-xs">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
              <Input
                id={`cf-amount-${fee.id}`}
                type="number"
                step="0.01"
                min={0}
                value={fee.amount || ""}
                onChange={(e) => onUpdate(fee.id, { amount: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm pl-5"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onRemove(fee.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => onAdd(section)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Custom Fee
      </Button>
    </div>
  );
}

export function ItemizedInputForm() {
  const { input, setInput, stickyLtv, setStickyLtv, stickyMiFactor, setStickyMiFactor, addCustomFee, updateCustomFee, removeCustomFee } = useItemizedStore();
  const { sectionHeaderColor, setSectionHeaderColor } = useQuoteStore();
  const isVA = input.loanType === "va";
  const isFHA = input.loanType === "fha";
  const isUSDA = input.loanType === "usda";
  const isRefinance = input.transactionType === "refinance";

  // Calculate financed fee for display
  const financedFee = (isFHA || isVA || isUSDA)
    ? calculateFinancedFeeAmount(
        input.loanAmount ?? 0,
        input.loanType ?? "conventional",
        input.vaFundingFeePercent ?? 0,
        input.fhaUfmipRefund ?? 0
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Loan Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select
              id="transactionType"
              value={input.transactionType ?? "purchase"}
              onChange={(e) =>
                setInput({ transactionType: e.target.value as "purchase" | "refinance" })
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
                        setStickyLtv(null);
                      } else {
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

          <NumberInput
            label="Interest Rate"
            id="interestRate"
            value={
              input.interestRate !== undefined
                ? parseFloat((input.interestRate * 100).toFixed(4))
                : undefined
            }
            onChange={(val) => setInput({ interestRate: val / 100 })}
            step={0.001}
            suffix="%"
          />

          <NumberInput
            label="Cost / Credit %"
            id="costCreditPercent"
            value={input.costCreditPercent}
            onChange={(val) => setInput({ costCreditPercent: val })}
            step={0.001}
            suffix="%"
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

      {/* Section A — Origination Charges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Section A — Origination Charges
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Underwriting Fee"
            id="underwritingFee"
            value={input.underwritingFee}
            onChange={(val) => setInput({ underwritingFee: val })}
          />
          <CurrencyInput
            label="Administration Fee"
            id="adminFee"
            value={input.adminFee}
            onChange={(val) => setInput({ adminFee: val })}
          />
          <CustomFeeRows
            section="A"
            fees={input.customFees ?? []}
            onAdd={addCustomFee}
            onUpdate={updateCustomFee}
            onRemove={removeCustomFee}
          />
        </CardContent>
      </Card>

      {/* Section B — Third-Party Fees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Section B — Third-Party Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Processing Fee"
            id="processingFee"
            value={input.processingFee}
            onChange={(val) => setInput({ processingFee: val })}
          />
          <CurrencyInput
            label="Appraisal Fee"
            id="appraisalFee"
            value={input.appraisalFee}
            onChange={(val) => setInput({ appraisalFee: val })}
          />
          <CurrencyInput
            label="Credit Report / VOE"
            id="creditReportFee"
            value={input.creditReportFee}
            onChange={(val) => setInput({ creditReportFee: val })}
          />
          <CurrencyInput
            label="Flood Certification"
            id="floodCertFee"
            value={input.floodCertFee}
            onChange={(val) => setInput({ floodCertFee: val })}
          />
          <CurrencyInput
            label="Tax Service Fee"
            id="taxServiceFee"
            value={input.taxServiceFee}
            onChange={(val) => setInput({ taxServiceFee: val })}
          />
          <CurrencyInput
            label="MERS Fee"
            id="mersFee"
            value={input.mersFee}
            onChange={(val) => setInput({ mersFee: val })}
          />
          <CurrencyInput
            label="Title Insurance — Lender's"
            id="titleInsuranceLender"
            value={input.titleInsuranceLender}
            onChange={(val) => setInput({ titleInsuranceLender: val })}
          />
          <CurrencyInput
            label="Title Insurance — Owner's"
            id="titleInsuranceOwner"
            value={input.titleInsuranceOwner}
            onChange={(val) => setInput({ titleInsuranceOwner: val })}
          />
          <CurrencyInput
            label="Settlement / Escrow Fee"
            id="settlementFee"
            value={input.settlementFee}
            onChange={(val) => setInput({ settlementFee: val })}
          />
          <CurrencyInput
            label="Recording Fee"
            id="recordingFee"
            value={input.recordingFee}
            onChange={(val) => setInput({ recordingFee: val })}
          />
          <CurrencyInput
            label="Endorsements"
            id="endorsementsFee"
            value={input.endorsementsFee}
            onChange={(val) => setInput({ endorsementsFee: val })}
          />
          <CurrencyInput
            label="Pest Inspection"
            id="pestInspectionFee"
            value={input.pestInspectionFee}
            onChange={(val) => setInput({ pestInspectionFee: val })}
          />
          <CurrencyInput
            label="Survey Fee"
            id="surveyFee"
            value={input.surveyFee}
            onChange={(val) => setInput({ surveyFee: val })}
          />
          <CustomFeeRows
            section="B"
            fees={input.customFees ?? []}
            onAdd={addCustomFee}
            onUpdate={updateCustomFee}
            onRemove={removeCustomFee}
          />
        </CardContent>
      </Card>

      {/* Prepaids & Escrow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prepaids &amp; Escrow</CardTitle>
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
          <CurrencyInput
            label="Hazard Insurance (monthly)"
            id="hazardInsuranceMonthly"
            value={input.hazardInsuranceMonthly}
            onChange={(val) => setInput({ hazardInsuranceMonthly: val })}
          />
          <CurrencyInput
            label="Property Tax (monthly)"
            id="propertyTaxMonthly"
            value={input.propertyTaxMonthly}
            onChange={(val) => setInput({ propertyTaxMonthly: val })}
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
        </CardContent>
      </Card>

      {/* Additional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Credits &amp; Additional</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="space-y-1">
              <Label htmlFor="vaFundingFeePercent">VA Funding Fee %</Label>
              <Select
                id="vaFundingFeePercent"
                value={String(input.vaFundingFeePercent ?? 0)}
                onChange={(e) =>
                  setInput({ vaFundingFeePercent: parseFloat(e.target.value) })
                }
              >
                <SelectOption value="0">0% (Exempt)</SelectOption>
                <SelectOption value="0.005">0.5%</SelectOption>
                <SelectOption value="0.01">1.0%</SelectOption>
                <SelectOption value="0.0125">1.25%</SelectOption>
                <SelectOption value="0.015">1.5%</SelectOption>
                <SelectOption value="0.0215">2.15%</SelectOption>
                <SelectOption value="0.024">2.4%</SelectOption>
                <SelectOption value="0.0225">2.25%</SelectOption>
                <SelectOption value="0.033">3.3%</SelectOption>
              </Select>
              {financedFee && financedFee.feeAmount > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  VA Funding Fee: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFee.feeAmount)} →
                  Total Loan: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFee.totalLoanAmount)}
                </p>
              )}
            </div>
          )}
          {isFHA && (
            <div className="sm:col-span-2">
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <p className="font-medium">UFMIP: 1.75% — auto-calculated</p>
                {financedFee && (
                  <p className="text-xs mt-1">
                    UFMIP: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFee.feeAmount)} →
                    Total Loan: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFee.totalLoanAmount)}
                  </p>
                )}
              </div>
              {isRefinance && (
                <div className="mt-2">
                  <CurrencyInput
                    label="FHA UFMIP Refund"
                    id="fhaUfmipRefund"
                    value={input.fhaUfmipRefund}
                    onChange={(val) => setInput({ fhaUfmipRefund: val })}
                  />
                </div>
              )}
            </div>
          )}
          {isUSDA && (
            <div className="sm:col-span-2">
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                <p className="font-medium">Guarantee Fee: 1.0% — auto-calculated</p>
                {financedFee && (
                  <p className="text-xs mt-1">
                    Fee: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFee.feeAmount)} →
                    Total Loan: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(financedFee.totalLoanAmount)}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="sectionHeaderColor">Section Header Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="sectionHeaderColor"
                type="color"
                value={sectionHeaderColor}
                onChange={(e) => setSectionHeaderColor(e.target.value)}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{sectionHeaderColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

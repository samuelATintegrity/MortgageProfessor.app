"use client";

import { useItemizedStore } from "@/stores/itemized-store";
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

export function ItemizedInputForm() {
  const { input, setInput } = useItemizedStore();

  const isVA = input.loanType === "va";
  const isFHA = input.loanType === "fha";

  return (
    <div className="space-y-4">
      {/* Loan Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            label="Processing Fee"
            id="processingFee"
            value={input.processingFee}
            onChange={(val) => setInput({ processingFee: val })}
          />
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
          <CurrencyInput
            label="Mortgage Insurance (monthly)"
            id="mortgageInsuranceMonthly"
            value={input.mortgageInsuranceMonthly}
            onChange={(val) => setInput({ mortgageInsuranceMonthly: val })}
          />
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
            <CurrencyInput
              label="VA Funding Fee"
              id="vaFundingFee"
              value={input.vaFundingFee}
              onChange={(val) => setInput({ vaFundingFee: val })}
            />
          )}
          {isFHA && (
            <CurrencyInput
              label="FHA Upfront MIP"
              id="fhaUpfrontMIP"
              value={input.fhaUpfrontMIP}
              onChange={(val) => setInput({ fhaUpfrontMIP: val })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

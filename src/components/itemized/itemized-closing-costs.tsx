"use client";

import { forwardRef } from "react";
import { useItemizedStore } from "@/stores/itemized-store";
import type { ItemizedLineItem } from "@/lib/calculations/itemized";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function fmtRate(rate: number) {
  return (rate * 100).toFixed(3) + "%";
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <tr className="bg-gray-800 text-white">
      <td colSpan={2} className="px-4 py-2 font-semibold text-sm">
        {children}
      </td>
    </tr>
  );
}

function LineItemRow({ item }: { item: ItemizedLineItem }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-1.5 text-sm text-gray-700">{item.label}</td>
      <td
        className={`px-4 py-1.5 text-sm text-right tabular-nums ${
          item.isCredit ? "text-emerald-600" : ""
        }`}
      >
        {item.isCredit ? `(${fmt.format(Math.abs(item.amount))})` : fmt.format(item.amount)}
      </td>
    </tr>
  );
}

function SubtotalRow({
  label,
  amount,
  isCredit,
}: {
  label: string;
  amount: number;
  isCredit?: boolean;
}) {
  return (
    <tr className="bg-gray-50 border-b border-gray-200">
      <td className="px-4 py-2 text-sm font-semibold text-gray-800">
        {label}
      </td>
      <td
        className={`px-4 py-2 text-sm font-semibold text-right tabular-nums ${
          isCredit ? "text-emerald-600" : ""
        }`}
      >
        {isCredit ? `(${fmt.format(amount)})` : fmt.format(amount)}
      </td>
    </tr>
  );
}

interface ItemizedClosingCostsProps {
  className?: string;
}

export const ItemizedClosingCosts = forwardRef<
  HTMLDivElement,
  ItemizedClosingCostsProps
>(function ItemizedClosingCosts({ className }, ref) {
  const { input, result } = useItemizedStore();

  if (!result) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Fill in the form to see the itemized breakdown
      </div>
    );
  }

  const loanTypeLabel =
    input.loanType === "conventional"
      ? "Conventional"
      : input.loanType === "fha"
      ? "FHA"
      : input.loanType === "va"
      ? "VA"
      : "$0 Down";

  return (
    <div
      ref={ref}
      className={`bg-white text-gray-900 p-6 rounded-lg ${className ?? ""}`}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Mortgage Professor</h2>
        <p className="text-xs text-gray-500">NMLS# 000000</p>
      </div>

      <h3 className="text-center text-base font-semibold mb-2">
        {loanTypeLabel} Purchase — Itemized Closing Cost Estimate
      </h3>

      {/* Loan Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm mb-4 px-2">
        <div>
          <span className="text-gray-500">Loan Amount:</span>{" "}
          <span className="font-medium">{fmt.format(result.loanAmount)}</span>
        </div>
        <div>
          <span className="text-gray-500">Home Value:</span>{" "}
          <span className="font-medium">
            {fmt.format(result.propertyValue)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">LTV:</span>{" "}
          <span className="font-medium">
            {(result.ltv * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Rate:</span>{" "}
          <span className="font-medium">{fmtRate(result.interestRate)}</span>
        </div>
        <div>
          <span className="text-gray-500">Down Payment:</span>{" "}
          <span className="font-medium">{fmt.format(result.downPayment)}</span>
        </div>
        <div>
          <span className="text-gray-500">Monthly P&amp;I:</span>{" "}
          <span className="font-medium">{fmt.format(result.monthlyPI)}</span>
        </div>
        <div>
          <span className="text-gray-500">Term:</span>{" "}
          <span className="font-medium">{input.loanTermYears} Years</span>
        </div>
        <div>
          <span className="text-gray-500">FICO:</span>{" "}
          <span className="font-medium">{input.fico}</span>
        </div>
      </div>

      {/* Fee Table */}
      <table className="w-full text-sm border-collapse">
        <tbody>
          {/* Section A */}
          <SectionHeader>Section A — Origination Charges</SectionHeader>
          {result.sectionA.map((item, i) => (
            <LineItemRow key={`a-${i}`} item={item} />
          ))}
          {result.sectionA.length === 0 && (
            <tr>
              <td
                colSpan={2}
                className="px-4 py-2 text-sm text-gray-400 italic"
              >
                No origination charges
              </td>
            </tr>
          )}
          <SubtotalRow label="Section A Subtotal" amount={result.sectionATotal} />

          {/* Section B */}
          <SectionHeader>Section B — Third-Party Fees</SectionHeader>
          {result.sectionB.map((item, i) => (
            <LineItemRow key={`b-${i}`} item={item} />
          ))}
          {result.sectionB.length === 0 && (
            <tr>
              <td
                colSpan={2}
                className="px-4 py-2 text-sm text-gray-400 italic"
              >
                No third-party fees
              </td>
            </tr>
          )}
          <SubtotalRow label="Section B Subtotal" amount={result.sectionBTotal} />

          {/* Prepaids */}
          <SectionHeader>Prepaids &amp; Escrow Reserves</SectionHeader>
          {result.prepaids.map((item, i) => (
            <LineItemRow key={`p-${i}`} item={item} />
          ))}
          <SubtotalRow label="Prepaids Subtotal" amount={result.prepaidsTotal} />

          {/* Credits */}
          {result.credits.length > 0 && (
            <>
              <SectionHeader>Credits</SectionHeader>
              {result.credits.map((item, i) => (
                <LineItemRow key={`c-${i}`} item={item} />
              ))}
              <SubtotalRow
                label="Total Credits"
                amount={result.creditsTotal}
                isCredit
              />
            </>
          )}

          {/* Spacer */}
          <tr>
            <td colSpan={2} className="h-2" />
          </tr>

          {/* Totals */}
          <tr className="bg-gray-100 border-y-2 border-gray-300">
            <td className="px-4 py-2 font-bold text-gray-900">
              Total Closing Costs
            </td>
            <td className="px-4 py-2 font-bold text-right tabular-nums">
              {fmt.format(result.totalClosingCosts)}
            </td>
          </tr>
          <tr className="bg-gray-800 text-white">
            <td className="px-4 py-3 font-bold text-base">
              Total Cash at Closing
            </td>
            <td className="px-4 py-3 font-bold text-base text-right tabular-nums">
              {fmt.format(result.totalCashAtClosing)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Monthly Payment Summary */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">
          Monthly Payment Breakdown
        </h4>
        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-1.5 text-gray-700">Principal &amp; Interest</td>
              <td className="px-4 py-1.5 text-right tabular-nums">
                {fmt.format(result.monthlyPI_)}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-1.5 text-gray-700">
                Escrow (Tax + Insurance)
              </td>
              <td className="px-4 py-1.5 text-right tabular-nums">
                {fmt.format(result.monthlyEscrow)}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-1.5 text-gray-700">Mortgage Insurance</td>
              <td className="px-4 py-1.5 text-right tabular-nums">
                {fmt.format(result.monthlyMI)}
              </td>
            </tr>
            <tr className="bg-gray-100 border-t-2 border-gray-300">
              <td className="px-4 py-2 font-bold text-gray-900">
                Total Monthly Payment
              </td>
              <td className="px-4 py-2 font-bold text-right tabular-nums">
                {fmt.format(result.totalMonthlyPayment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
        This is not a loan commitment or guarantee of rates. Rates and fees are
        subject to change without notice. Actual terms may vary based on credit
        profile, property type, and other factors. Contact your loan officer for
        a personalized quote.
      </p>
    </div>
  );
});

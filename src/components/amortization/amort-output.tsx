"use client";

import { useMemo } from "react";
import { useAmortizationStore } from "@/stores/amortization-store";
import {
  amortizationSchedule,
  monthlyPayment,
  totalInterest,
} from "@/lib/calculations/mortgage";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const fmtRound = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function AmortOutput() {
    const { scenarios } = useAmortizationStore();

    const tables = useMemo(() => {
      return scenarios.map((s) => {
        const schedule = amortizationSchedule(
          s.loanAmount,
          s.annualRate,
          s.termYears
        );
        const mp = monthlyPayment(s.loanAmount, s.annualRate, s.termYears);
        const ti = totalInterest(s.loanAmount, s.annualRate, s.termYears);
        return { scenario: s, schedule, monthlyPI: mp, totalInterest: ti };
      });
    }, [scenarios]);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div
          className={`grid gap-4 ${
            tables.length === 1
              ? "grid-cols-1"
              : tables.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
          }`}
        >
          {tables.map(({ scenario, monthlyPI, totalInterest: ti }) => {
            const maxInterest = Math.max(...tables.map((t) => t.totalInterest));
            const savings = maxInterest - ti;
            return (
              <div
                key={scenario.id}
                className="rounded-lg border bg-white p-4 shadow-sm space-y-2"
                style={{ borderTopColor: scenario.color, borderTopWidth: 3 }}
              >
                <p className="font-semibold text-sm" style={{ color: scenario.color }}>
                  {scenario.label}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly P&I</span>
                    <span className="font-medium">{fmt.format(monthlyPI)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Interest</span>
                    <span className="font-medium">{fmtRound.format(ti)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-medium">
                      {fmtRound.format(scenario.loanAmount + ti)}
                    </span>
                  </div>
                  {savings > 0 && tables.length > 1 && (
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-gray-500">Interest Savings</span>
                      <span className="font-medium text-emerald-600">
                        {fmtRound.format(savings)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Side-by-side month-by-month tables */}
        <div
          className={`grid gap-4 ${
            tables.length === 1
              ? "grid-cols-1"
              : tables.length === 2
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1 lg:grid-cols-3"
          }`}
        >
          {tables.map(({ scenario, schedule }) => (
            <div
              key={scenario.id}
              className="rounded-lg border bg-white shadow-sm overflow-hidden"
              style={{ borderTopColor: scenario.color, borderTopWidth: 3 }}
            >
              <div className="px-4 py-3 border-b bg-gray-50">
                <p className="font-semibold text-sm" style={{ color: scenario.color }}>
                  {scenario.label}
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Mo</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Payment</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Principal</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Interest</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      >
                        <td className="px-3 py-1.5 text-gray-600">{row.month}</td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {fmt.format(row.payment)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {fmt.format(row.principal)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {fmt.format(row.interest)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {fmt.format(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}

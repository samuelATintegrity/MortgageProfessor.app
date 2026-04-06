"use client";

import { forwardRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAmortizationStore } from "@/stores/amortization-store";
import {
  amortizationSchedule,
  monthlyPayment,
  totalInterest,
} from "@/lib/calculations/mortgage";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fmtFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

interface ChartDataPoint {
  year: number;
  [key: string]: number;
}

export const AmortOutput = forwardRef<HTMLDivElement>(
  function AmortOutput(_props, ref) {
    const { scenarios } = useAmortizationStore();

    // Build chart data: one point per year for each scenario
    const { chartData, summaries } = useMemo(() => {
      const maxYears = Math.max(...scenarios.map((s) => s.termYears));
      const points: ChartDataPoint[] = [];

      // Year 0 = starting balance
      const yearZero: ChartDataPoint = { year: 0 };
      for (const s of scenarios) {
        yearZero[s.id] = s.loanAmount;
      }
      points.push(yearZero);

      // Compute schedules
      const schedules = scenarios.map((s) => ({
        scenario: s,
        schedule: amortizationSchedule(s.loanAmount, s.annualRate, s.termYears),
      }));

      for (let year = 1; year <= maxYears; year++) {
        const point: ChartDataPoint = { year };
        for (const { scenario, schedule } of schedules) {
          const monthIdx = year * 12 - 1;
          if (monthIdx < schedule.length) {
            point[scenario.id] = schedule[monthIdx].balance;
          } else {
            point[scenario.id] = 0;
          }
        }
        points.push(point);
      }

      // Summary stats
      const sums = scenarios.map((s) => {
        const mp = monthlyPayment(s.loanAmount, s.annualRate, s.termYears);
        const ti = totalInterest(s.loanAmount, s.annualRate, s.termYears);
        return {
          id: s.id,
          label: s.label,
          color: s.color,
          loanAmount: s.loanAmount,
          monthlyPI: mp,
          totalInterest: ti,
          totalPaid: s.loanAmount + ti,
          termYears: s.termYears,
        };
      });

      return { chartData: points, summaries: sums };
    }, [scenarios]);

    // Find the max total interest for savings comparison
    const maxInterest = Math.max(...summaries.map((s) => s.totalInterest));

    return (
      <div ref={ref} className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
        {/* Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Remaining Balance Over Time
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                tickFormatter={(y) => `${y}yr`}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tickFormatter={(v) => fmt.format(v)}
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                width={90}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const scenario = scenarios.find((s) => s.id === name);
                  return [fmt.format(value), scenario?.label ?? name];
                }}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend
                formatter={(value) => {
                  const scenario = scenarios.find((s) => s.id === value);
                  return scenario?.label ?? value;
                }}
              />
              {scenarios.map((s) => (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.08}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Comparison Summary
          </h3>
          <div
            className={`grid gap-4 ${
              summaries.length === 1
                ? "grid-cols-1"
                : summaries.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {summaries.map((s) => {
              const savings = maxInterest - s.totalInterest;
              return (
                <div
                  key={s.id}
                  className="rounded-lg border p-4 space-y-2"
                  style={{ borderTopColor: s.color, borderTopWidth: 3 }}
                >
                  <p className="font-semibold text-sm" style={{ color: s.color }}>
                    {s.label}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monthly P&I</span>
                      <span className="font-medium">{fmtFull.format(s.monthlyPI)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Interest</span>
                      <span className="font-medium">{fmt.format(s.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Paid</span>
                      <span className="font-medium">{fmt.format(s.totalPaid)}</span>
                    </div>
                    {savings > 0 && summaries.length > 1 && (
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-gray-500">Interest Savings</span>
                        <span className="font-medium text-emerald-600">
                          {fmt.format(savings)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

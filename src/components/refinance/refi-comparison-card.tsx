"use client";

import { forwardRef } from "react";
import { useRefiStore } from "@/stores/refi-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  DollarSign,
  TrendingDown,
  Lightbulb,
} from "lucide-react";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function rateDisplay(rate: number): string {
  return (rate * 100).toFixed(3) + "%";
}

export const RefiComparisonCard = forwardRef<HTMLDivElement>(
  function RefiComparisonCard(_props, ref) {
    const result = useRefiStore((s) => s.result);
    const input = useRefiStore((s) => s.input);

    if (!result) {
      return (
        <div ref={ref} className="p-8">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Fill in the loan details to see your refinance comparison.
            </CardContent>
          </Card>
        </div>
      );
    }

    const paymentSavings = result.monthlyPaymentDifference >= 0;
    const interestSavings = result.totalInterestSavings >= 0;

    return (
      <div ref={ref} className="p-6 space-y-5">
        {/* Header */}
        <div className="text-center pb-1">
          <h2 className="text-lg font-bold">Refinance Analysis</h2>
          <p className="text-sm text-muted-foreground">
            {rateDisplay(input.originalRate ?? 0)} {input.originalTermYears ?? 30}yr
            {" "}
            &rarr;{" "}
            {rateDisplay(input.newRate ?? 0)} {input.newTermYears ?? 30}yr
          </p>
        </div>

        {/* Monthly Payment Comparison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Payment Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Current Payment
                </p>
                <p className="text-xl font-bold">
                  {fmt.format(result.currentMonthlyPayment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  New Payment
                </p>
                <p className="text-xl font-bold">
                  {fmt.format(result.newMonthlyPayment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Difference
                </p>
                <div className="flex items-center justify-center gap-1">
                  {paymentSavings ? (
                    <ArrowDown className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowUp className="h-4 w-4 text-red-600" />
                  )}
                  <p
                    className={`text-xl font-bold ${
                      paymentSavings ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmt.format(Math.abs(result.monthlyPaymentDifference))}
                  </p>
                </div>
                <p
                  className={`text-xs ${
                    paymentSavings ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {paymentSavings ? "lower" : "higher"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interest Savings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Interest Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Current Loan&apos;s Remaining Interest
              </span>
              <span className="font-semibold">
                {fmt.format(result.currentRemainingInterest)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                New Loan Total Interest
              </span>
              <span className="font-semibold">
                {fmt.format(result.newTotalInterest)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Total Interest Savings
              </span>
              <span
                className={`text-lg font-bold ${
                  interestSavings ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {fmt.format(Math.abs(result.totalInterestSavings))}
                <span className="text-xs ml-1">
                  {interestSavings ? "saved" : "more"}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Break-Even Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Break-Even Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Refinance Costs
              </span>
              <span className="font-semibold">
                {fmt.format(input.closingCosts ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Time to Recoup Fees
              </span>
              <span className="font-semibold">
                {result.breakEvenMonths >= 0
                  ? `${result.breakEvenMonths} months`
                  : "N/A (payment increases)"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Daily Interest Saved
              </span>
              <span
                className={`font-semibold ${
                  result.dailyInterestSaved >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {fmt.format(Math.abs(result.dailyInterestSaved))}/day
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Lightbulb className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {result.summaryText}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

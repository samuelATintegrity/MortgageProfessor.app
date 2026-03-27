import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";

export type BuydownType = "none" | "3-2-1" | "2-1" | "1-1" | "1-0";

export interface BuydownYearResult {
  year: number;
  rateReduction: number;
  rate: number;
  monthlyPI: number;
  monthlyTotal: number; // PI or PITI depending on mode — set by caller
}

export interface BuydownResult {
  type: BuydownType;
  years: BuydownYearResult[];
  fullRate: number;
  fullPayment: number;
  buydownCost: number;
}

/** Rate reductions per year for each buydown type */
const BUYDOWN_REDUCTIONS: Record<Exclude<BuydownType, "none">, number[]> = {
  "3-2-1": [3, 2, 1],
  "2-1": [2, 1],
  "1-1": [1, 1],
  "1-0": [1],
};

/**
 * Calculate temporary buydown costs and payments.
 * Each year in the buydown period has a reduced rate.
 * Buydown cost = sum of monthly P&I savings across all reduced years.
 */
export function calculateBuydown(
  loanAmount: number,
  fullRate: number,
  termYears: number,
  type: Exclude<BuydownType, "none">
): BuydownResult {
  const fullPayment = monthlyPayment(loanAmount, fullRate, termYears);
  const reductions = BUYDOWN_REDUCTIONS[type];

  let totalCost = new Decimal(0);
  const years: BuydownYearResult[] = [];

  for (let i = 0; i < reductions.length; i++) {
    const reduction = reductions[i];
    const rate = Math.max(0, new Decimal(fullRate).minus(reduction / 100).toNumber());
    const pi = monthlyPayment(loanAmount, rate, termYears);
    const yearlySavings = new Decimal(fullPayment).minus(pi).mul(12);
    totalCost = totalCost.plus(yearlySavings);

    years.push({
      year: i + 1,
      rateReduction: reduction,
      rate,
      monthlyPI: pi,
      monthlyTotal: pi, // default to PI, caller overrides with PITI if needed
    });
  }

  return {
    type,
    years,
    fullRate,
    fullPayment,
    buydownCost: totalCost.toDecimalPlaces(2).toNumber(),
  };
}

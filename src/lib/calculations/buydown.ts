import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";

export interface BuydownResult {
  type: "2-1" | "3-2-1";
  year1Rate: number;
  year1Payment: number;
  year2Rate: number;
  year2Payment: number;
  year3Rate?: number;
  year3Payment?: number;
  fullRate: number;
  fullPayment: number;
  buydownCost: number;
}

/**
 * Calculate temporary buydown costs and payments.
 */
export function calculateBuydown(
  loanAmount: number,
  fullRate: number,
  termYears: number,
  type: "2-1" | "3-2-1"
): BuydownResult {
  const fullPayment = monthlyPayment(loanAmount, fullRate, termYears);

  if (type === "2-1") {
    const year1Rate = new Decimal(fullRate).minus(0.02).toNumber();
    const year2Rate = new Decimal(fullRate).minus(0.01).toNumber();
    const year1Payment = monthlyPayment(loanAmount, Math.max(0, year1Rate), termYears);
    const year2Payment = monthlyPayment(loanAmount, Math.max(0, year2Rate), termYears);

    const year1Savings = new Decimal(fullPayment).minus(year1Payment).mul(12);
    const year2Savings = new Decimal(fullPayment).minus(year2Payment).mul(12);
    const cost = year1Savings.plus(year2Savings).toDecimalPlaces(2).toNumber();

    return {
      type: "2-1",
      year1Rate: Math.max(0, year1Rate),
      year1Payment,
      year2Rate: Math.max(0, year2Rate),
      year2Payment,
      fullRate,
      fullPayment,
      buydownCost: cost,
    };
  }

  // 3-2-1
  const year1Rate = new Decimal(fullRate).minus(0.03).toNumber();
  const year2Rate = new Decimal(fullRate).minus(0.02).toNumber();
  const year3Rate = new Decimal(fullRate).minus(0.01).toNumber();
  const year1Payment = monthlyPayment(loanAmount, Math.max(0, year1Rate), termYears);
  const year2Payment = monthlyPayment(loanAmount, Math.max(0, year2Rate), termYears);
  const year3Payment = monthlyPayment(loanAmount, Math.max(0, year3Rate), termYears);

  const year1Savings = new Decimal(fullPayment).minus(year1Payment).mul(12);
  const year2Savings = new Decimal(fullPayment).minus(year2Payment).mul(12);
  const year3Savings = new Decimal(fullPayment).minus(year3Payment).mul(12);
  const cost = year1Savings
    .plus(year2Savings)
    .plus(year3Savings)
    .toDecimalPlaces(2)
    .toNumber();

  return {
    type: "3-2-1",
    year1Rate: Math.max(0, year1Rate),
    year1Payment,
    year2Rate: Math.max(0, year2Rate),
    year2Payment,
    year3Rate: Math.max(0, year3Rate),
    year3Payment,
    fullRate,
    fullPayment,
    buydownCost: cost,
  };
}

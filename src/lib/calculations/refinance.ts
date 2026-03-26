import Decimal from "decimal.js";
import {
  monthlyPayment,
  totalInterest,
  remainingInterest,
  dailyInterest,
} from "./mortgage";
import { differenceInMonths } from "date-fns";

export interface RefiInput {
  // Current loan
  originalLoanAmount: number;
  originalRate: number; // annual decimal, e.g. 0.07125
  originalTermYears: number;
  loanStartDate: Date;

  // New loan
  currentBalance: number;
  cashOutAmount: number;
  closingCosts: number;
  newRate: number;
  newTermYears: number;
  newStartDate: Date;

  // How to pay closing costs
  payingCostsMethod: "out_of_pocket" | "roll_into_loan" | "split";
  partialOutOfPocket?: number; // for split
}

export interface RefiResult {
  // Current loan info
  currentMonthlyPayment: number;
  currentMonthsPaid: number;
  currentRemainingInterest: number;

  // New loan info
  newLoanAmount: number;
  newMonthlyPayment: number;
  newTotalInterest: number;

  // Comparison
  monthlyPaymentDifference: number; // positive = savings
  totalInterestSavings: number;
  breakEvenMonths: number;
  dailyInterestSaved: number;

  // Summary
  summaryText: string;
}

export function calculateRefinance(input: RefiInput): RefiResult {
  // Calculate months paid on current loan
  const currentMonthsPaid = differenceInMonths(
    input.newStartDate,
    input.loanStartDate
  );

  // Current monthly payment
  const currentPayment = monthlyPayment(
    input.originalLoanAmount,
    input.originalRate,
    input.originalTermYears
  );

  // Remaining interest on current loan
  const currentRemainingInt = remainingInterest(
    input.originalLoanAmount,
    input.originalRate,
    input.originalTermYears,
    currentMonthsPaid
  );

  // New loan amount based on how costs are paid
  let newLoanAmt: number;
  if (input.payingCostsMethod === "roll_into_loan") {
    newLoanAmt = input.currentBalance + input.cashOutAmount + input.closingCosts;
  } else if (input.payingCostsMethod === "split") {
    const rolledIn = input.closingCosts - (input.partialOutOfPocket ?? 0);
    newLoanAmt = input.currentBalance + input.cashOutAmount + Math.max(0, rolledIn);
  } else {
    newLoanAmt = input.currentBalance + input.cashOutAmount;
  }

  // New monthly payment
  const newPayment = monthlyPayment(newLoanAmt, input.newRate, input.newTermYears);

  // New total interest
  const newTotalInt = totalInterest(newLoanAmt, input.newRate, input.newTermYears);

  // Monthly savings
  const monthlySavings = new Decimal(currentPayment)
    .minus(newPayment)
    .toDecimalPlaces(2)
    .toNumber();

  // Total interest savings
  const interestSavings = new Decimal(currentRemainingInt)
    .minus(newTotalInt)
    .toDecimalPlaces(2)
    .toNumber();

  // Break-even in months
  const breakEven =
    monthlySavings > 0
      ? new Decimal(input.closingCosts)
          .div(monthlySavings)
          .toDecimalPlaces(1)
          .toNumber()
      : monthlySavings < 0
      ? -1 // Payment goes up
      : 0;

  // Daily interest saved
  const currentDaily = dailyInterest(input.currentBalance, input.originalRate);
  const newDaily = dailyInterest(newLoanAmt, input.newRate);
  const dailySaved = new Decimal(currentDaily)
    .minus(newDaily)
    .toDecimalPlaces(2)
    .toNumber();

  // Generate summary
  const paymentDirection = monthlySavings >= 0 ? "lower" : "raise";
  const absMonthlySavings = Math.abs(monthlySavings);
  const absInterestSavings = Math.abs(interestSavings);

  let summaryText: string;
  if (monthlySavings >= 0) {
    summaryText =
      `This refinance will ${paymentDirection} your payment by $${absMonthlySavings.toLocaleString("en-US", { minimumFractionDigits: 2 })} ` +
      `and you'll pay $${absInterestSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${interestSavings >= 0 ? "less" : "more"} in interest. ` +
      `It will take ${breakEven} months to recover the refinance costs of $${input.closingCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`;
  } else {
    summaryText =
      `This refinance will ${paymentDirection} your payment by $${absMonthlySavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}, ` +
      `but you'll pay $${absInterestSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${interestSavings >= 0 ? "less" : "more"} in total interest.`;
  }

  return {
    currentMonthlyPayment: currentPayment,
    currentMonthsPaid: currentMonthsPaid,
    currentRemainingInterest: currentRemainingInt,
    newLoanAmount: newLoanAmt,
    newMonthlyPayment: newPayment,
    newTotalInterest: newTotalInt,
    monthlyPaymentDifference: monthlySavings,
    totalInterestSavings: interestSavings,
    breakEvenMonths: breakEven,
    dailyInterestSaved: dailySaved,
    summaryText,
  };
}

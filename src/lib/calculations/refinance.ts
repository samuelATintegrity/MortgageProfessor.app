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

  // Additional benefits
  escrowRefundAmount: number; // refund from current escrow account
  currentPaymentIncludesEscrow: boolean; // whether current payment includes taxes/insurance
  skippedMonths: number; // 1 or 2 months skipped during refi

  // Debt payoff (cash-out refi)
  debtPayoffAmount: number; // amount of debt being paid off
  debtMonthlyPayments: number; // current total monthly debt payments being eliminated
}

export interface AcceleratedPayoff {
  termMonths: number;
  monthsSaved: number;
  yearsSaved: number;
  interestSaved: number;
}

export interface DebtPayoffResult {
  totalOldPayments: number; // old mortgage + old debt payments
  monthlySavingsWithDebt: number; // totalOldPayments - newMortgage
  acceleratedPayoffMonths: number; // months to pay off maintaining totalOldPayments
  acceleratedPayoffYearsSaved: number;
  acceleratedPayoffInterestSaved: number;
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

  // Accelerated payoff
  acceleratedPayoff: AcceleratedPayoff | null;

  // Debt payoff
  debtPayoff: DebtPayoffResult | null;

  // Additional benefits
  additionalBenefits: {
    skippedPaymentsValue: number;
    skippedMonths: number;
    escrowRefundValue: number;
  };

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

  // Accelerated payoff: if current payment > new payment, how fast would the new loan pay off?
  let acceleratedPayoff: AcceleratedPayoff | null = null;
  if (currentPayment > newPayment && newLoanAmt > 0) {
    const monthlyRate = new Decimal(input.newRate).div(12);
    let balance = new Decimal(newLoanAmt);
    let accelMonths = 0;
    let accelInterest = new Decimal(0);
    const accelPayment = new Decimal(currentPayment);
    const fullTermMonths = input.newTermYears * 12;

    while (balance.gt(0) && accelMonths < fullTermMonths) {
      const interest = balance.mul(monthlyRate).toDecimalPlaces(2);
      accelInterest = accelInterest.plus(interest);
      let principal = accelPayment.minus(interest);
      if (principal.gt(balance)) {
        principal = balance;
      }
      balance = balance.minus(principal);
      accelMonths++;
    }

    const monthsSaved = fullTermMonths - accelMonths;
    const accelInterestSaved = new Decimal(newTotalInt)
      .minus(accelInterest)
      .toDecimalPlaces(2)
      .toNumber();

    if (monthsSaved > 0) {
      acceleratedPayoff = {
        termMonths: accelMonths,
        monthsSaved,
        yearsSaved: parseFloat((monthsSaved / 12).toFixed(1)),
        interestSaved: accelInterestSaved,
      };
    }
  }

  // Debt payoff analysis
  let debtPayoff: DebtPayoffResult | null = null;
  if (input.debtMonthlyPayments > 0) {
    const totalOldPayments = new Decimal(currentPayment)
      .plus(input.debtMonthlyPayments)
      .toDecimalPlaces(2)
      .toNumber();
    const monthlySavingsWithDebt = new Decimal(totalOldPayments)
      .minus(newPayment)
      .toDecimalPlaces(2)
      .toNumber();

    // Accelerated payoff: maintain totalOldPayments toward new mortgage
    let debtAccelMonths = 0;
    let debtAccelInterest = new Decimal(0);
    const fullTermMonths = input.newTermYears * 12;

    if (totalOldPayments > newPayment && newLoanAmt > 0) {
      const monthlyRate = new Decimal(input.newRate).div(12);
      let balance = new Decimal(newLoanAmt);
      const debtAccelPayment = new Decimal(totalOldPayments);

      while (balance.gt(0) && debtAccelMonths < fullTermMonths) {
        const interest = balance.mul(monthlyRate).toDecimalPlaces(2);
        debtAccelInterest = debtAccelInterest.plus(interest);
        let principal = debtAccelPayment.minus(interest);
        if (principal.gt(balance)) {
          principal = balance;
        }
        balance = balance.minus(principal);
        debtAccelMonths++;
      }
    }

    const debtMonthsSaved = fullTermMonths - debtAccelMonths;
    const debtAccelInterestSaved = new Decimal(newTotalInt)
      .minus(debtAccelInterest)
      .toDecimalPlaces(2)
      .toNumber();

    debtPayoff = {
      totalOldPayments,
      monthlySavingsWithDebt,
      acceleratedPayoffMonths: debtAccelMonths,
      acceleratedPayoffYearsSaved: parseFloat((debtMonthsSaved / 12).toFixed(1)),
      acceleratedPayoffInterestSaved: debtAccelInterestSaved,
    };
  }

  // Additional benefits
  const skippedPaymentsValue = new Decimal(currentPayment).mul(input.skippedMonths ?? 2).toDecimalPlaces(2).toNumber();
  const escrowRefundValue = input.escrowRefundAmount ?? 0;

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
    acceleratedPayoff,
    debtPayoff,
    additionalBenefits: {
      skippedPaymentsValue,
      skippedMonths: input.skippedMonths ?? 2,
      escrowRefundValue,
    },
    summaryText,
  };
}

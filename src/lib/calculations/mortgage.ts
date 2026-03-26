import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate monthly P&I payment.
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function monthlyPayment(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  const P = new Decimal(loanAmount);
  const r = new Decimal(annualRate).div(12);
  const n = new Decimal(termYears).mul(12);

  if (r.isZero()) {
    return P.div(n).toDecimalPlaces(2).toNumber();
  }

  const onePlusR = r.plus(1);
  const onePlusRtoN = onePlusR.pow(n);
  const numerator = P.mul(r).mul(onePlusRtoN);
  const denominator = onePlusRtoN.minus(1);

  return numerator.div(denominator).toDecimalPlaces(2).toNumber();
}

/**
 * Generate full amortization schedule.
 */
export function amortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termYears: number
): AmortizationRow[] {
  const payment = monthlyPayment(loanAmount, annualRate, termYears);
  const r = new Decimal(annualRate).div(12);
  const totalMonths = termYears * 12;
  let balance = new Decimal(loanAmount);
  const rows: AmortizationRow[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const interest = balance.mul(r).toDecimalPlaces(2);
    const principal = new Decimal(payment).minus(interest);
    balance = balance.minus(principal);

    if (balance.lessThan(0)) {
      balance = new Decimal(0);
    }

    rows.push({
      month,
      payment,
      principal: principal.toDecimalPlaces(2).toNumber(),
      interest: interest.toDecimalPlaces(2).toNumber(),
      balance: balance.toDecimalPlaces(2).toNumber(),
    });
  }

  return rows;
}

/**
 * Calculate remaining balance after N months of payments.
 */
export function remainingBalance(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  monthsPaid: number
): number {
  const P = new Decimal(loanAmount);
  const r = new Decimal(annualRate).div(12);
  const n = new Decimal(termYears).mul(12);

  if (r.isZero()) {
    const monthlyPmt = P.div(n);
    return P.minus(monthlyPmt.mul(monthsPaid)).toDecimalPlaces(2).toNumber();
  }

  const onePlusR = r.plus(1);
  const onePlusRtoN = onePlusR.pow(n);
  const onePlusRtoP = onePlusR.pow(monthsPaid);

  const balance = P.mul(
    onePlusRtoN.minus(onePlusRtoP).div(onePlusRtoN.minus(1))
  );

  return balance.toDecimalPlaces(2).toNumber();
}

/**
 * Total interest paid over the life of the loan.
 */
export function totalInterest(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  const payment = monthlyPayment(loanAmount, annualRate, termYears);
  const totalPayments = new Decimal(payment).mul(termYears * 12);
  return totalPayments.minus(loanAmount).toDecimalPlaces(2).toNumber();
}

/**
 * Remaining interest from monthsPaid through end of loan.
 */
export function remainingInterest(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  monthsPaid: number
): number {
  const payment = monthlyPayment(loanAmount, annualRate, termYears);
  const totalMonths = termYears * 12;
  const remainingMonths = totalMonths - monthsPaid;
  const currentBalance = remainingBalance(
    loanAmount,
    annualRate,
    termYears,
    monthsPaid
  );
  const totalRemainingPayments = new Decimal(payment).mul(remainingMonths);
  return totalRemainingPayments
    .minus(currentBalance)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Daily interest on a loan.
 */
export function dailyInterest(
  balance: number,
  annualRate: number
): number {
  return new Decimal(balance)
    .mul(annualRate)
    .div(365)
    .toDecimalPlaces(2)
    .toNumber();
}

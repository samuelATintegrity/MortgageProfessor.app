import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";

/**
 * Calculate APR using Newton's method.
 * APR is the rate that makes the present value of all payments
 * equal to the loan amount minus total fees.
 */
export function calculateAPR(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  totalFees: number,
  maxIterations: number = 100,
  tolerance: number = 0.0000001
): number {
  const payment = monthlyPayment(loanAmount, annualRate, termYears);
  const n = termYears * 12;
  const netLoan = new Decimal(loanAmount).minus(totalFees).toNumber();

  // Initial guess is the nominal rate
  let aprGuess = annualRate;

  for (let i = 0; i < maxIterations; i++) {
    const r = new Decimal(aprGuess).div(12);

    if (r.isZero()) {
      // Degenerate case
      const pv = new Decimal(payment).mul(n);
      if (pv.minus(netLoan).abs().lessThan(tolerance)) break;
      aprGuess = annualRate + 0.001;
      continue;
    }

    const onePlusR = r.plus(1);
    const onePlusRtoN = onePlusR.pow(n);

    // PV of annuity = payment * [(1 - (1+r)^-n) / r]
    const pvFactor = new Decimal(1).minus(onePlusRtoN.pow(-1)).div(r);
    const pv = new Decimal(payment).mul(pvFactor);

    // f(apr) = PV - netLoan (we want this to be 0)
    const f = pv.minus(netLoan);

    if (f.abs().lessThan(tolerance)) break;

    // f'(apr) = d(PV)/d(apr) - derivative with respect to monthly rate, times 1/12
    // d(PV)/dr = payment * [(-n*(1+r)^(-n-1)*r - (1-(1+r)^-n)) / r^2]
    const onePlusRtoNeg = onePlusRtoN.pow(-1);
    const onePlusRtoNegN1 = onePlusR.pow(new Decimal(-n).minus(1));
    const numerator = new Decimal(-n)
      .mul(onePlusRtoNegN1)
      .mul(r)
      .minus(new Decimal(1).minus(onePlusRtoNeg));
    const dPVdr = new Decimal(payment).mul(numerator).div(r.pow(2));
    const fPrime = dPVdr.div(12); // chain rule: d/d(apr) = d/dr * dr/d(apr) = d/dr * 1/12

    if (fPrime.isZero()) break;

    const adjustment = f.div(fPrime);
    aprGuess = new Decimal(aprGuess).minus(adjustment).toNumber();

    if (aprGuess < 0) aprGuess = 0.001;
  }

  return new Decimal(aprGuess).toDecimalPlaces(6).toNumber();
}

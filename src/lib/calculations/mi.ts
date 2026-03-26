import Decimal from "decimal.js";

/**
 * FHA upfront mortgage insurance premium (1.75% of base loan amount).
 */
export function fhaUpfrontMIP(baseLoanAmount: number): number {
  return new Decimal(baseLoanAmount)
    .mul(0.0175)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * FHA annual MIP rate based on term and LTV.
 * Returns annual rate as decimal.
 */
export function fhaAnnualMIPRate(
  termYears: number,
  ltv: number,
  loanAmount: number
): number {
  // Standard FHA MIP rates for loans <= $726,200
  if (termYears <= 15) {
    if (ltv <= 0.9) return 0.0015;
    return 0.004;
  }
  // 30-year term
  if (loanAmount <= 726200) {
    if (ltv <= 0.95) return 0.005;
    return 0.0055;
  }
  // High-balance
  if (ltv <= 0.95) return 0.007;
  return 0.0075;
}

/**
 * FHA monthly mortgage insurance.
 */
export function fhaMonthlyMI(
  loanAmount: number,
  termYears: number,
  ltv: number
): number {
  const annualRate = fhaAnnualMIPRate(termYears, ltv, loanAmount);
  return new Decimal(loanAmount)
    .mul(annualRate)
    .div(12)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Conventional PMI monthly estimate.
 * Simplified lookup based on LTV and FICO.
 * Returns monthly MI amount.
 */
export function conventionalMonthlyMI(
  loanAmount: number,
  ltv: number,
  fico: number
): number {
  if (ltv <= 0.8) return 0; // No MI needed at 80% LTV or below

  // Approximate annual PMI rates by FICO and LTV
  let annualRate: number;

  if (fico >= 760) {
    if (ltv <= 0.85) annualRate = 0.0019;
    else if (ltv <= 0.9) annualRate = 0.0029;
    else if (ltv <= 0.95) annualRate = 0.0046;
    else annualRate = 0.0055;
  } else if (fico >= 740) {
    if (ltv <= 0.85) annualRate = 0.0025;
    else if (ltv <= 0.9) annualRate = 0.0035;
    else if (ltv <= 0.95) annualRate = 0.0055;
    else annualRate = 0.0068;
  } else if (fico >= 720) {
    if (ltv <= 0.85) annualRate = 0.0033;
    else if (ltv <= 0.9) annualRate = 0.0046;
    else if (ltv <= 0.95) annualRate = 0.0068;
    else annualRate = 0.0085;
  } else if (fico >= 700) {
    if (ltv <= 0.85) annualRate = 0.0041;
    else if (ltv <= 0.9) annualRate = 0.0058;
    else if (ltv <= 0.95) annualRate = 0.0086;
    else annualRate = 0.0105;
  } else if (fico >= 680) {
    if (ltv <= 0.85) annualRate = 0.0052;
    else if (ltv <= 0.9) annualRate = 0.0073;
    else if (ltv <= 0.95) annualRate = 0.011;
    else annualRate = 0.0136;
  } else {
    // Below 680
    if (ltv <= 0.85) annualRate = 0.0073;
    else if (ltv <= 0.9) annualRate = 0.0098;
    else if (ltv <= 0.95) annualRate = 0.0146;
    else annualRate = 0.0175;
  }

  return new Decimal(loanAmount)
    .mul(annualRate)
    .div(12)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * VA funding fee calculation.
 * Returns the funding fee amount.
 */
export function vaFundingFee(
  loanAmount: number,
  downPaymentPercent: number,
  isFirstUse: boolean = true,
  isReserves: boolean = false
): number {
  let rate: number;

  if (downPaymentPercent >= 0.1) {
    rate = 0.0125;
  } else if (downPaymentPercent >= 0.05) {
    rate = 0.015;
  } else {
    // Less than 5% down
    if (isFirstUse) {
      rate = isReserves ? 0.0225 : 0.0215;
    } else {
      rate = 0.033;
    }
  }

  return new Decimal(loanAmount)
    .mul(rate)
    .toDecimalPlaces(2)
    .toNumber();
}

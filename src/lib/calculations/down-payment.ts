import Decimal from "decimal.js";

export interface DownPaymentOption {
  percentage: number;
  amount: number;
  loanAmount: number;
  ltv: number;
}

const DEFAULT_PERCENTAGES = [0.03, 0.035, 0.05, 0.1, 0.2, 0.25];

export function calculateDownPaymentOptions(
  propertyValue: number,
  percentages: number[] = DEFAULT_PERCENTAGES
): DownPaymentOption[] {
  const value = new Decimal(propertyValue);

  return percentages.map((pct) => {
    const dp = value.mul(pct).toDecimalPlaces(2);
    const loan = value.minus(dp).toDecimalPlaces(2);
    const ltv = loan.div(value).toDecimalPlaces(4);

    return {
      percentage: pct,
      amount: dp.toNumber(),
      loanAmount: loan.toNumber(),
      ltv: ltv.toNumber(),
    };
  });
}

export function calculateLTV(
  loanAmount: number,
  propertyValue: number
): number {
  if (propertyValue === 0) return 0;
  return new Decimal(loanAmount)
    .div(propertyValue)
    .toDecimalPlaces(4)
    .toNumber();
}

export function calculateDownPayment(
  propertyValue: number,
  loanAmount: number
): number {
  return new Decimal(propertyValue)
    .minus(loanAmount)
    .toDecimalPlaces(2)
    .toNumber();
}

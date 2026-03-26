import Decimal from "decimal.js";

export interface LoanCosts {
  appraisalFee: number;
  processingFee: number;
  underwritingFee: number;
  voeCreditFee: number;
  taxFee: number;
  mersFee: number;
  borrowerPaidComp: number; // as decimal, e.g. 0.009021
}

export const DEFAULT_LOAN_COSTS: LoanCosts = {
  appraisalFee: 620,
  processingFee: 700,
  underwritingFee: 1150,
  voeCreditFee: 200,
  taxFee: 80,
  mersFee: 30,
  borrowerPaidComp: 0.009021,
};

export interface TitleFeeScheduleEntry {
  loanAmountMin: number;
  loanAmountMax: number;
  titleFee: number;
  escrowFee: number | null;
}

/**
 * Lookup title fee from schedule based on loan amount.
 */
export function lookupTitleFee(
  schedule: TitleFeeScheduleEntry[],
  loanAmount: number
): { titleFee: number; escrowFee: number } {
  const entry = schedule.find(
    (e) => loanAmount >= e.loanAmountMin && loanAmount <= e.loanAmountMax
  );

  if (!entry) {
    // Use the highest bracket
    const last = schedule[schedule.length - 1];
    return {
      titleFee: last?.titleFee ?? 0,
      escrowFee: last?.escrowFee ?? 0,
    };
  }

  return {
    titleFee: entry.titleFee,
    escrowFee: entry.escrowFee ?? 0,
  };
}

/**
 * Calculate prepaid interest.
 * Daily interest = (loan amount * annual rate) / 365
 * Prepaid = daily interest * days
 */
export function prepaidInterest(
  loanAmount: number,
  annualRate: number,
  days: number
): number {
  return new Decimal(loanAmount)
    .mul(annualRate)
    .div(365)
    .mul(days)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate points/discount cost from cost/credit percentage.
 * Negative cost = borrower pays points (cost to borrower)
 * Positive cost = lender credit (credit to borrower)
 */
export function calculatePoints(
  loanAmount: number,
  costCreditPercent: number
): number {
  // costCreditPercent comes from rate sheet: negative = cost, positive = credit
  // Points cost to borrower = loanAmount * |negative percent| / 100
  // Lender credit to borrower = loanAmount * positive percent / 100
  return new Decimal(loanAmount)
    .mul(costCreditPercent)
    .div(100)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate company compensation.
 */
export function calculateCompanyComp(
  loanAmount: number,
  compPercent: number
): number {
  return new Decimal(loanAmount)
    .mul(compPercent)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate total lender fees.
 */
export function calculateLenderFees(
  costs: LoanCosts,
  loanAmount: number,
  isBorrowerPaid: boolean
): number {
  let total = new Decimal(costs.underwritingFee)
    .plus(costs.processingFee)
    .plus(costs.voeCreditFee)
    .plus(costs.taxFee)
    .plus(costs.mersFee);

  if (isBorrowerPaid) {
    const comp = calculateCompanyComp(loanAmount, costs.borrowerPaidComp);
    total = total.plus(comp);
  }

  return total.toDecimalPlaces(2).toNumber();
}

/**
 * Calculate prepaid & third-party fees.
 */
export function calculatePrepaidThirdParty(
  loanAmount: number,
  annualRate: number,
  prepaidDays: number,
  propertyTaxMonthly: number,
  hazardMonthly: number,
  appraisalFee: number,
  titleFee: number,
  escrowFee: number,
  escrowMonths: number = 3
): number {
  const prepaid = prepaidInterest(loanAmount, annualRate, prepaidDays);
  const prepaidTaxes = new Decimal(propertyTaxMonthly).mul(escrowMonths);
  const prepaidHazard = new Decimal(hazardMonthly).mul(15); // 15 months for initial escrow

  return new Decimal(prepaid)
    .plus(prepaidTaxes)
    .plus(prepaidHazard)
    .plus(appraisalFee)
    .plus(titleFee)
    .plus(escrowFee)
    .toDecimalPlaces(2)
    .toNumber();
}

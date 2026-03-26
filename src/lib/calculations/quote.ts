import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";
import { calculatePoints, prepaidInterest } from "./fees";

export interface RateTier {
  rate: number; // annual rate as decimal, e.g. 0.0625
  costCredit: number; // cost/credit percentage, e.g. -0.437 or 1.286
}

export interface QuoteInput {
  loanAmount: number;
  propertyValue: number;
  loanTermYears: number;
  loanType: "conventional" | "fha" | "va" | "zero_down";
  fico: number;
  state: string;
  lockPeriodDays: number;
  isBorrowerPaid: boolean;
  borrowerPaidCompPercent: number; // decimal, e.g. 0.009021

  // Escrow
  hazardInsuranceMonthly: number;
  mortgageInsuranceMonthly: number;
  propertyTaxMonthly: number;

  // Fees
  prepaidInterestDays: number;
  sellerCredit: number;
  buydownAmount: number;
  vaFundingFee: number;

  // Loan costs
  appraisalFee: number;
  processingFee: number;
  underwritingFee: number;
  voeCreditFee: number;
  taxFee: number;
  mersFee: number;

  // Title fees
  titleFee: number;
  escrowFee: number;

  // Rate tiers
  lowRate: RateTier;
  parRate: RateTier;
  lowCostRate: RateTier;
}

export interface TierResult {
  tierName: string;
  interestRate: number;
  monthlyPI: number;
  pointsBuydown: number; // positive = cost to borrower, negative = lender credit
  isLenderCredit: boolean;
  prepaidThirdPartyFees: number;
  lenderFees: number;
  tempBuydown: number;
  downPayment: number;
  sellerCredit: number;
  vaFundingFee: number;
  totalCashAtClosing: number;
  monthlyEscrow: number;
  monthlyMI: number;
  totalMonthlyPayment: number;
}

export interface QuoteResult {
  loanAmount: number;
  propertyValue: number;
  ltv: number;
  assumptionsText: string;
  lowRate: TierResult;
  parRate: TierResult;
  lowCost: TierResult;
}

function calculateTier(
  tierName: string,
  tier: RateTier,
  input: QuoteInput,
  downPayment: number
): TierResult {
  const loanAmount = input.loanAmount;

  // Monthly P&I
  const pi = monthlyPayment(loanAmount, tier.rate, input.loanTermYears);

  // Points: negative costCredit = cost to borrower, positive = credit
  const pointsCredit = calculatePoints(loanAmount, tier.costCredit);
  // For display: positive pointsBuydown = borrower pays, negative = lender credit
  const pointsBuydown = new Decimal(pointsCredit).neg().toNumber();
  const isLenderCredit = pointsBuydown < 0;

  // Lender fees
  const baseLenderFees = new Decimal(input.underwritingFee)
    .plus(input.processingFee)
    .plus(input.voeCreditFee)
    .plus(input.taxFee)
    .plus(input.mersFee);

  let lenderFees: Decimal;
  if (input.isBorrowerPaid) {
    const comp = new Decimal(loanAmount).mul(input.borrowerPaidCompPercent);
    lenderFees = baseLenderFees.plus(comp);
  } else {
    lenderFees = baseLenderFees;
  }

  // Prepaid interest
  const prepaid = prepaidInterest(loanAmount, tier.rate, input.prepaidInterestDays);

  // Prepaid & third-party fees
  const prepaidTaxes = new Decimal(input.propertyTaxMonthly).mul(5); // ~5 months escrow cushion
  const prepaidHazard = new Decimal(input.hazardInsuranceMonthly).mul(15);
  const prepaidThirdParty = new Decimal(prepaid)
    .plus(prepaidTaxes)
    .plus(prepaidHazard)
    .plus(input.appraisalFee)
    .plus(input.titleFee)
    .plus(input.escrowFee)
    .toDecimalPlaces(2)
    .toNumber();

  // Monthly escrow
  const monthlyEscrow = new Decimal(input.hazardInsuranceMonthly)
    .plus(input.propertyTaxMonthly)
    .toDecimalPlaces(2)
    .toNumber();

  // Total cash at closing
  const totalCash = new Decimal(downPayment)
    .plus(pointsBuydown)
    .plus(prepaidThirdParty)
    .plus(lenderFees)
    .plus(input.buydownAmount)
    .plus(input.vaFundingFee)
    .minus(input.sellerCredit)
    .toDecimalPlaces(2)
    .toNumber();

  // Total monthly payment
  const totalMonthly = new Decimal(pi)
    .plus(monthlyEscrow)
    .plus(input.mortgageInsuranceMonthly)
    .toDecimalPlaces(2)
    .toNumber();

  return {
    tierName,
    interestRate: tier.rate,
    monthlyPI: pi,
    pointsBuydown,
    isLenderCredit,
    prepaidThirdPartyFees: prepaidThirdParty,
    lenderFees: lenderFees.toDecimalPlaces(2).toNumber(),
    tempBuydown: input.buydownAmount,
    downPayment,
    sellerCredit: input.sellerCredit,
    vaFundingFee: input.vaFundingFee,
    totalCashAtClosing: totalCash,
    monthlyEscrow,
    monthlyMI: input.mortgageInsuranceMonthly,
    totalMonthlyPayment: totalMonthly,
  };
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const downPayment = new Decimal(input.propertyValue)
    .minus(input.loanAmount)
    .toDecimalPlaces(2)
    .toNumber();

  const ltv = new Decimal(input.loanAmount)
    .div(input.propertyValue)
    .toDecimalPlaces(4)
    .toNumber();

  const lowRate = calculateTier("Low Rate", input.lowRate, input, downPayment);
  const parRate = calculateTier("Low Cost", input.parRate, input, downPayment);
  const lowCost = calculateTier("Lowest Cost", input.lowCostRate, input, downPayment);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loanTypeLabel =
    input.loanType === "conventional"
      ? "Conventional"
      : input.loanType === "fha"
      ? "FHA"
      : input.loanType === "va"
      ? "VA"
      : "$0 Down";

  const assumptionsText =
    `All loan options assume a ${input.fico} credit score, today's rates, ${today}, ` +
    `a ${input.lockPeriodDays} day lock, a loan amount of $${input.loanAmount.toLocaleString()}, ` +
    `a home value of $${input.propertyValue.toLocaleString()} ` +
    `and a Loan-to-Value ratio of ${(ltv * 100).toFixed(0)}%.`;

  return {
    loanAmount: input.loanAmount,
    propertyValue: input.propertyValue,
    ltv,
    assumptionsText,
    lowRate,
    parRate,
    lowCost,
  };
}

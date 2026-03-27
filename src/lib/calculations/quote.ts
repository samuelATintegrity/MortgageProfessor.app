import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";
import { calculatePoints, prepaidInterest } from "./fees";
import { calculateBuydown, type BuydownType, type BuydownYearResult } from "./buydown";

export type { BuydownType } from "./buydown";

export interface TierConfig {
  id: string;
  name: string;
  rate: number;       // annual rate as decimal, e.g. 0.0625
  costCredit: number; // cost/credit percentage, e.g. -0.437 or 1.286
  color: string;      // hex color, e.g. "#1e40af"
  visible: boolean;
}

export interface QuoteInput {
  transactionType: "purchase" | "refinance";
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

  // Rate tiers (dynamic)
  tiers: TierConfig[];

  // Modes
  buydownType: BuydownType;
  piOnlyMode: boolean;
}

export interface TierResult {
  id: string;
  tierName: string;
  color: string;
  visible: boolean;
  interestRate: number;
  monthlyPI: number;
  pointsBuydown: number; // positive = cost to borrower, negative = lender credit
  isLenderCredit: boolean;
  titleFees: number;
  prepaidCosts: number;
  lenderFees: number;
  buydownCost: number;
  downPayment: number;
  sellerCredit: number;
  vaFundingFee: number;
  totalCashAtClosing: number;
  monthlyEscrow: number;
  monthlyMI: number;
  totalMonthlyPayment: number;
  buydownYears: BuydownYearResult[];
}

export interface QuoteResult {
  loanAmount: number;
  propertyValue: number;
  ltv: number;
  assumptionsText: string;
  tiers: TierResult[];
  piOnlyMode: boolean;
  buydownType: BuydownType;
  transactionType: "purchase" | "refinance";
}

function calculateTier(
  tierConfig: TierConfig,
  input: QuoteInput,
  downPayment: number
): TierResult {
  const loanAmount = input.loanAmount;
  const isRefinance = input.transactionType === "refinance";

  // Monthly P&I
  const pi = monthlyPayment(loanAmount, tierConfig.rate, input.loanTermYears);

  // Points: negative costCredit = cost to borrower, positive = credit
  const pointsCredit = calculatePoints(loanAmount, tierConfig.costCredit);
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

  // Title fees (separate line)
  const titleFees = new Decimal(input.titleFee)
    .plus(input.escrowFee)
    .toDecimalPlaces(2)
    .toNumber();

  // Prepaid interest
  const prepaid = prepaidInterest(loanAmount, tierConfig.rate, input.prepaidInterestDays);

  // Prepaid costs (without title fees)
  const prepaidTaxes = new Decimal(input.propertyTaxMonthly).mul(5);
  const prepaidHazard = new Decimal(input.hazardInsuranceMonthly).mul(15);
  const prepaidCosts = new Decimal(prepaid)
    .plus(prepaidTaxes)
    .plus(prepaidHazard)
    .plus(input.appraisalFee)
    .toDecimalPlaces(2)
    .toNumber();

  // Monthly escrow
  const monthlyEscrow = new Decimal(input.hazardInsuranceMonthly)
    .plus(input.propertyTaxMonthly)
    .toDecimalPlaces(2)
    .toNumber();

  // Buydown calculation (per-tier, since each tier has different rate)
  let buydownCost = 0;
  let buydownYears: BuydownYearResult[] = [];
  if (input.buydownType !== "none" && !isRefinance) {
    const bd = calculateBuydown(loanAmount, tierConfig.rate, input.loanTermYears, input.buydownType);
    buydownCost = bd.buydownCost;
    buydownYears = bd.years.map((y) => ({
      ...y,
      // Add escrow to monthly total if not PI-only
      monthlyTotal: input.piOnlyMode
        ? y.monthlyPI
        : new Decimal(y.monthlyPI).plus(monthlyEscrow).plus(input.mortgageInsuranceMonthly).toDecimalPlaces(2).toNumber(),
    }));
  }

  // Effective values for refinance
  const effectiveDownPayment = isRefinance ? 0 : downPayment;
  const effectiveSellerCredit = isRefinance ? 0 : input.sellerCredit;
  const effectivePrepaidCosts = input.piOnlyMode ? 0 : prepaidCosts;

  // Total cash at closing
  const totalCash = new Decimal(effectiveDownPayment)
    .plus(pointsBuydown)
    .plus(titleFees)
    .plus(effectivePrepaidCosts)
    .plus(lenderFees)
    .plus(buydownCost)
    .plus(input.vaFundingFee)
    .minus(effectiveSellerCredit)
    .toDecimalPlaces(2)
    .toNumber();

  // Total monthly payment
  const effectiveEscrow = input.piOnlyMode ? 0 : monthlyEscrow;
  const effectiveMI = input.piOnlyMode ? 0 : input.mortgageInsuranceMonthly;
  const totalMonthly = new Decimal(pi)
    .plus(effectiveEscrow)
    .plus(effectiveMI)
    .toDecimalPlaces(2)
    .toNumber();

  return {
    id: tierConfig.id,
    tierName: tierConfig.name,
    color: tierConfig.color,
    visible: tierConfig.visible,
    interestRate: tierConfig.rate,
    monthlyPI: pi,
    pointsBuydown,
    isLenderCredit,
    titleFees,
    prepaidCosts: effectivePrepaidCosts,
    lenderFees: lenderFees.toDecimalPlaces(2).toNumber(),
    buydownCost,
    downPayment: effectiveDownPayment,
    sellerCredit: effectiveSellerCredit,
    vaFundingFee: input.vaFundingFee,
    totalCashAtClosing: totalCash,
    monthlyEscrow: effectiveEscrow,
    monthlyMI: effectiveMI,
    totalMonthlyPayment: totalMonthly,
    buydownYears,
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

  const tiers = input.tiers.map((tierConfig) =>
    calculateTier(tierConfig, input, downPayment)
  );

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
    tiers,
    piOnlyMode: input.piOnlyMode,
    buydownType: input.buydownType,
    transactionType: input.transactionType,
  };
}

import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";
import { calculatePoints, prepaidInterest, calculateFinancedFeeAmount } from "./fees";
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
  loanType: "conventional" | "fha" | "va" | "usda" | "non_qm" | "jumbo";
  fico: number;
  state: string;
  lockPeriodDays: number;
  isBorrowerPaid: boolean;
  borrowerPaidCompPercent: number; // decimal, e.g. 0.009021

  // Escrow
  hazardInsuranceMonthly: number;
  mortgageInsuranceMonthly: number;
  propertyTaxMonthly: number;

  // Prepaids & Escrow
  prepaidInterestDays: number;
  escrowTaxMonths: number;
  escrowHazardMonths: number;
  sellerCredit: number;
  vaFundingFeePercent: number; // decimal, e.g. 0.0215 for 2.15%
  fhaUfmipRefund: number; // dollar amount refunded on FHA refi, reduces UFMIP

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
  isStreamline: boolean;
  itemizeMode: boolean;
  rollClosingCostsIn: boolean;
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
  financedFee: number;
  totalCashAtClosing: number;
  monthlyEscrow: number;
  monthlyMI: number;
  totalMonthlyPayment: number;
  buydownYears: BuydownYearResult[];
  // Roll costs in (refinance only)
  rolledInLoanAmount: number;
  closingCostsRolledIn: number;
  // Itemized breakdowns
  itemized: {
    prepaidInterest: number;
    prepaidTaxes: number;
    prepaidHazard: number;
    appraisalFee: number;
    underwritingFee: number;
    processingFee: number;
    voeCreditFee: number;
    taxServiceFee: number;
    mersFee: number;
    borrowerComp: number;
    titleFee: number;
    escrowFee: number;
  };
}

export interface QuoteResult {
  loanAmount: number;          // base loan amount (backward compat)
  baseLoanAmount: number;      // same as loanAmount
  totalLoanAmount: number;     // base + financed fee
  financedFeeAmount: number;   // the fee financed in (0 for conv/jumbo/non_qm)
  financedFeePercent: number;  // fee percentage (0 for conv/jumbo/non_qm)
  financedFeeLabel: string;    // "UFMIP" | "Guarantee Fee" | "VA Funding Fee" | ""
  propertyValue: number;
  ltv: number;
  assumptionsText: string;
  tiers: TierResult[];
  piOnlyMode: boolean;
  itemizeMode: boolean;
  buydownType: BuydownType;
  transactionType: "purchase" | "refinance";
  rollClosingCostsIn: boolean;
}

function calculateTier(
  tierConfig: TierConfig,
  input: QuoteInput,
  downPayment: number,
  totalLoanAmount: number,
  financedFeeAmount: number
): TierResult {
  const baseLoanAmount = input.loanAmount;
  const isRefinance = input.transactionType === "refinance";

  // Monthly P&I — based on TOTAL loan amount (includes financed fee)
  const pi = monthlyPayment(totalLoanAmount, tierConfig.rate, input.loanTermYears);

  // Points: calculated on BASE loan amount (industry standard)
  const pointsCredit = calculatePoints(baseLoanAmount, tierConfig.costCredit);
  const pointsBuydown = new Decimal(pointsCredit).neg().toNumber();
  const isLenderCredit = pointsBuydown < 0;

  // Lender fees — comp on base loan amount + appraisal
  const baseLenderFees = new Decimal(input.underwritingFee)
    .plus(input.processingFee)
    .plus(input.voeCreditFee)
    .plus(input.taxFee)
    .plus(input.mersFee)
    .plus(input.appraisalFee);

  let lenderFees: Decimal;
  if (input.isBorrowerPaid) {
    const comp = new Decimal(baseLoanAmount).mul(input.borrowerPaidCompPercent);
    lenderFees = baseLenderFees.plus(comp);
  } else {
    lenderFees = baseLenderFees;
  }

  // Title fees (separate line)
  const titleFees = new Decimal(input.titleFee)
    .plus(input.escrowFee)
    .toDecimalPlaces(2)
    .toNumber();

  // Prepaid interest — on total loan amount (interest accrues on full balance)
  const prepaid = prepaidInterest(totalLoanAmount, tierConfig.rate, input.prepaidInterestDays);

  // Prepaid costs = prepaid interest + escrow reserves only
  const prepaidTaxes = new Decimal(input.propertyTaxMonthly).mul(input.escrowTaxMonths);
  const prepaidHazard = new Decimal(input.hazardInsuranceMonthly).mul(input.escrowHazardMonths);
  const prepaidCosts = new Decimal(prepaid)
    .plus(prepaidTaxes)
    .plus(prepaidHazard)
    .toDecimalPlaces(2)
    .toNumber();

  // Monthly escrow
  const monthlyEscrow = new Decimal(input.hazardInsuranceMonthly)
    .plus(input.propertyTaxMonthly)
    .toDecimalPlaces(2)
    .toNumber();

  // Buydown calculation — on total loan amount
  let buydownCost = 0;
  let buydownYears: BuydownYearResult[] = [];
  if (input.buydownType !== "none" && !isRefinance) {
    const bd = calculateBuydown(totalLoanAmount, tierConfig.rate, input.loanTermYears, input.buydownType);
    buydownCost = bd.buydownCost;
    buydownYears = bd.years.map((y) => ({
      ...y,
      monthlyTotal: input.piOnlyMode
        ? y.monthlyPI
        : new Decimal(y.monthlyPI).plus(monthlyEscrow).plus(input.mortgageInsuranceMonthly).toDecimalPlaces(2).toNumber(),
    }));
  }

  // Effective values for refinance
  const effectiveDownPayment = isRefinance ? 0 : downPayment;
  const effectiveSellerCredit = isRefinance ? 0 : input.sellerCredit;
  const effectivePrepaidCosts = input.piOnlyMode ? 0 : prepaidCosts;

  // Total cash at closing (before roll-in)
  const closingCostsTotal = new Decimal(pointsBuydown)
    .plus(titleFees)
    .plus(effectivePrepaidCosts)
    .plus(lenderFees)
    .plus(buydownCost)
    .minus(effectiveSellerCredit)
    .toDecimalPlaces(2)
    .toNumber();

  const totalCashBeforeRollIn = new Decimal(effectiveDownPayment)
    .plus(closingCostsTotal)
    .toDecimalPlaces(2)
    .toNumber();

  // Roll closing costs into loan (refinance only)
  let finalPI = pi;
  let rolledInLoanAmount = 0;
  let closingCostsRolledIn = 0;
  let totalCash = totalCashBeforeRollIn;

  if (isRefinance && input.rollClosingCostsIn && closingCostsTotal > 0) {
    closingCostsRolledIn = closingCostsTotal;
    rolledInLoanAmount = new Decimal(totalLoanAmount).plus(closingCostsRolledIn).toDecimalPlaces(2).toNumber();
    finalPI = monthlyPayment(rolledInLoanAmount, tierConfig.rate, input.loanTermYears);
    // Keep totalCash unchanged — closing costs still display even when rolled in
  }

  // Total monthly payment
  const effectiveEscrow = input.piOnlyMode ? 0 : monthlyEscrow;
  const effectiveMI = input.piOnlyMode ? 0 : input.mortgageInsuranceMonthly;
  const totalMonthly = new Decimal(finalPI)
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
    monthlyPI: finalPI,
    pointsBuydown,
    isLenderCredit,
    titleFees,
    prepaidCosts: effectivePrepaidCosts,
    lenderFees: lenderFees.toDecimalPlaces(2).toNumber(),
    buydownCost,
    downPayment: effectiveDownPayment,
    sellerCredit: effectiveSellerCredit,
    financedFee: financedFeeAmount,
    totalCashAtClosing: totalCash,
    monthlyEscrow: effectiveEscrow,
    monthlyMI: effectiveMI,
    totalMonthlyPayment: totalMonthly,
    buydownYears,
    rolledInLoanAmount,
    closingCostsRolledIn,
    itemized: {
      prepaidInterest: prepaid,
      prepaidTaxes: prepaidTaxes.toDecimalPlaces(2).toNumber(),
      prepaidHazard: prepaidHazard.toDecimalPlaces(2).toNumber(),
      appraisalFee: input.appraisalFee,
      underwritingFee: input.underwritingFee,
      processingFee: input.processingFee,
      voeCreditFee: input.voeCreditFee,
      taxServiceFee: input.taxFee,
      mersFee: input.mersFee,
      borrowerComp: input.isBorrowerPaid
        ? new Decimal(baseLoanAmount).mul(input.borrowerPaidCompPercent).toDecimalPlaces(2).toNumber()
        : 0,
      titleFee: input.titleFee,
      escrowFee: input.escrowFee,
    },
  };
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  // Calculate financed fee (FHA UFMIP, USDA Guarantee Fee, VA Funding Fee)
  const { feeAmount, totalLoanAmount, feePercent, feeLabel } =
    calculateFinancedFeeAmount(input.loanAmount, input.loanType, input.vaFundingFeePercent, input.fhaUfmipRefund ?? 0);

  const downPayment = new Decimal(input.propertyValue)
    .minus(input.loanAmount)
    .toDecimalPlaces(2)
    .toNumber();

  // LTV based on total loan amount (e.g. FHA LTV can exceed 97% with financed UFMIP)
  const ltv = new Decimal(totalLoanAmount)
    .div(input.propertyValue)
    .toDecimalPlaces(4)
    .toNumber();

  const tiers = input.tiers.map((tierConfig) =>
    calculateTier(tierConfig, input, downPayment, totalLoanAmount, feeAmount)
  );

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loanTypeLabels: Record<string, string> = {
    conventional: "Conventional",
    fha: "FHA",
    va: "VA",
    usda: "USDA",
    non_qm: "Non-QM",
    jumbo: "Jumbo",
  };
  const loanTypeLabel = loanTypeLabels[input.loanType] ?? input.loanType;

  const loanAmountText = feeAmount > 0
    ? `a base loan amount of $${input.loanAmount.toLocaleString()} (total loan amount of $${totalLoanAmount.toLocaleString()} including ${feeLabel})`
    : `a loan amount of $${input.loanAmount.toLocaleString()}`;

  const assumptionsText =
    `All loan options assume a ${input.fico} credit score, today's rates, ${today}, ` +
    `a ${input.lockPeriodDays} day lock, ${loanAmountText}, ` +
    `a home value of $${input.propertyValue.toLocaleString()} ` +
    `and a Loan-to-Value ratio of ${parseFloat((ltv * 100).toFixed(1))}%.`;

  return {
    loanAmount: input.loanAmount,
    baseLoanAmount: input.loanAmount,
    totalLoanAmount,
    financedFeeAmount: feeAmount,
    financedFeePercent: feePercent,
    financedFeeLabel: feeLabel,
    propertyValue: input.propertyValue,
    ltv,
    assumptionsText,
    tiers,
    piOnlyMode: input.piOnlyMode,
    itemizeMode: input.itemizeMode,
    buydownType: input.buydownType,
    transactionType: input.transactionType,
    rollClosingCostsIn: input.rollClosingCostsIn ?? false,
  };
}

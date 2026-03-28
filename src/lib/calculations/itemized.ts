import Decimal from "decimal.js";
import { monthlyPayment } from "./mortgage";
import { prepaidInterest, calculatePoints, calculateFinancedFeeAmount } from "./fees";

export interface ItemizedInput {
  // Loan details
  loanAmount: number;
  propertyValue: number;
  loanTermYears: number;
  loanType: "conventional" | "fha" | "va" | "usda" | "non_qm" | "jumbo";
  interestRate: number; // annual rate as decimal, e.g. 0.065
  costCreditPercent: number; // rate sheet cost/credit %, e.g. -0.437
  fico: number;
  state: string;
  lockPeriodDays: number;
  isBorrowerPaid: boolean;
  borrowerPaidCompPercent: number;

  // Escrow & insurance
  hazardInsuranceMonthly: number;
  mortgageInsuranceMonthly: number;
  propertyTaxMonthly: number;

  // Prepaids
  prepaidInterestDays: number;
  escrowTaxMonths: number;
  escrowHazardMonths: number;

  // Section A — Origination Charges
  processingFee: number;
  underwritingFee: number;
  adminFee: number;

  // Section B — Third-Party Fees
  appraisalFee: number;
  creditReportFee: number;
  floodCertFee: number;
  taxServiceFee: number;
  mersFee: number;
  titleInsuranceLender: number;
  titleInsuranceOwner: number;
  settlementFee: number;
  recordingFee: number;
  endorsementsFee: number;
  pestInspectionFee: number;
  surveyFee: number;

  // Additional
  transactionType: "purchase" | "refinance";
  sellerCredit: number;
  buydownAmount: number;
  vaFundingFeePercent: number; // decimal, e.g. 0.0215 for 2.15%
  fhaUfmipRefund: number; // dollar amount refunded on FHA refi
}

export interface ItemizedLineItem {
  label: string;
  amount: number;
  isCredit?: boolean;
}

export interface ItemizedResult {
  // Loan summary
  loanAmount: number;
  baseLoanAmount: number;
  totalLoanAmount: number;
  financedFeeAmount: number;
  financedFeePercent: number;
  financedFeeLabel: string;
  propertyValue: number;
  ltv: number;
  downPayment: number;
  interestRate: number;
  monthlyPI: number;

  // Section A — Origination Charges
  sectionA: ItemizedLineItem[];
  sectionATotal: number;

  // Section B — Third-Party Fees
  sectionB: ItemizedLineItem[];
  sectionBTotal: number;

  // Section C — Title Charges
  sectionC: ItemizedLineItem[];
  sectionCTotal: number;

  // Prepaids & Escrow Reserves
  prepaids: ItemizedLineItem[];
  prepaidsTotal: number;

  // Credits
  credits: ItemizedLineItem[];
  creditsTotal: number;

  // Totals
  totalClosingCosts: number;
  totalCashAtClosing: number;

  // Monthly payment breakdown
  monthlyPI_: number;
  monthlyEscrow: number;
  monthlyMI: number;
  totalMonthlyPayment: number;
}

export function calculateItemized(input: ItemizedInput): ItemizedResult {
  const baseLoan = input.loanAmount;
  const downPayment = new Decimal(input.propertyValue)
    .minus(baseLoan)
    .toDecimalPlaces(2)
    .toNumber();

  // Calculate financed fee (UFMIP, Guarantee Fee, VA Funding Fee)
  const { feeAmount: financedFeeAmount, totalLoanAmount, feePercent: financedFeePercent, feeLabel: financedFeeLabel } =
    calculateFinancedFeeAmount(baseLoan, input.loanType, input.vaFundingFeePercent, input.fhaUfmipRefund);

  const ltv = new Decimal(totalLoanAmount)
    .div(input.propertyValue)
    .toDecimalPlaces(4)
    .toNumber();

  // P&I uses total loan amount (includes financed fee)
  const pi = monthlyPayment(totalLoanAmount, input.interestRate, input.loanTermYears);

  // Points calculated on BASE loan amount (industry standard)
  const pointsAmount = calculatePoints(baseLoan, input.costCreditPercent);
  // Negative costCredit = cost to borrower (points), Positive = lender credit
  const pointsCost = new Decimal(pointsAmount).neg().toNumber();

  // Borrower-paid comp
  const compAmount = input.isBorrowerPaid
    ? new Decimal(baseLoan).mul(input.borrowerPaidCompPercent).toDecimalPlaces(2).toNumber()
    : 0;

  // ---- Section A: Origination Charges ----
  const sectionA: ItemizedLineItem[] = [];

  if (pointsCost > 0) {
    sectionA.push({ label: "Discount Points / Buydown", amount: pointsCost });
  } else if (pointsCost < 0) {
    sectionA.push({ label: "Lender Credit", amount: pointsCost, isCredit: true });
  }

  if (input.underwritingFee > 0) {
    sectionA.push({ label: "Underwriting Fee", amount: input.underwritingFee });
  }
  if (input.adminFee > 0) {
    sectionA.push({ label: "Administration Fee", amount: input.adminFee });
  }
  if (compAmount > 0) {
    sectionA.push({ label: "Origination Fee", amount: compAmount });
  }

  const sectionATotal = sectionA.reduce(
    (sum, item) => new Decimal(sum).plus(item.amount).toNumber(),
    0
  );

  // ---- Section B: Third-Party Fees ----
  const sectionB: ItemizedLineItem[] = [];

  if (input.processingFee > 0) {
    sectionB.push({ label: "Processing Fee", amount: input.processingFee });
  }
  if (input.appraisalFee > 0) {
    sectionB.push({ label: "Appraisal Fee", amount: input.appraisalFee });
  }
  if (input.creditReportFee > 0) {
    sectionB.push({ label: "Credit Report / VOE", amount: input.creditReportFee });
  }
  if (input.floodCertFee > 0) {
    sectionB.push({ label: "Flood Certification", amount: input.floodCertFee });
  }
  if (input.taxServiceFee > 0) {
    sectionB.push({ label: "Tax Service Fee", amount: input.taxServiceFee });
  }
  if (input.mersFee > 0) {
    sectionB.push({ label: "MERS Fee", amount: input.mersFee });
  }
  if (input.pestInspectionFee > 0) {
    sectionB.push({ label: "Pest Inspection", amount: input.pestInspectionFee });
  }
  if (input.surveyFee > 0) {
    sectionB.push({ label: "Survey Fee", amount: input.surveyFee });
  }

  const sectionBTotal = sectionB.reduce(
    (sum, item) => new Decimal(sum).plus(item.amount).toNumber(),
    0
  );

  // ---- Section C: Title Charges ----
  const sectionC: ItemizedLineItem[] = [];

  if (input.titleInsuranceLender > 0) {
    sectionC.push({ label: "Title Insurance — Lender's Policy", amount: input.titleInsuranceLender });
  }
  if (input.titleInsuranceOwner > 0) {
    sectionC.push({ label: "Title Insurance — Owner's Policy", amount: input.titleInsuranceOwner });
  }
  if (input.settlementFee > 0) {
    sectionC.push({ label: "Settlement / Escrow Fee", amount: input.settlementFee });
  }
  if (input.recordingFee > 0) {
    sectionC.push({ label: "Recording Fee", amount: input.recordingFee });
  }
  if (input.endorsementsFee > 0) {
    sectionC.push({ label: "Endorsements", amount: input.endorsementsFee });
  }

  const sectionCTotal = sectionC.reduce(
    (sum, item) => new Decimal(sum).plus(item.amount).toNumber(),
    0
  );

  // ---- Prepaids & Escrow Reserves ----
  const prepaids: ItemizedLineItem[] = [];

  const prepaidInt = prepaidInterest(totalLoanAmount, input.interestRate, input.prepaidInterestDays);
  if (prepaidInt > 0) {
    prepaids.push({
      label: `Prepaid Interest (${input.prepaidInterestDays} days)`,
      amount: new Decimal(prepaidInt).toDecimalPlaces(2).toNumber(),
    });
  }

  const escrowTax = new Decimal(input.propertyTaxMonthly)
    .mul(input.escrowTaxMonths)
    .toDecimalPlaces(2)
    .toNumber();
  if (escrowTax > 0) {
    prepaids.push({
      label: `Property Tax Reserve (${input.escrowTaxMonths} mo)`,
      amount: escrowTax,
    });
  }

  const escrowHazard = new Decimal(input.hazardInsuranceMonthly)
    .mul(input.escrowHazardMonths)
    .toDecimalPlaces(2)
    .toNumber();
  if (escrowHazard > 0) {
    prepaids.push({
      label: `Homeowner's Insurance Reserve (${input.escrowHazardMonths} mo)`,
      amount: escrowHazard,
    });
  }

  if (financedFeeAmount > 0) {
    prepaids.push({
      label: `${financedFeeLabel} (${(financedFeePercent * 100).toFixed(financedFeePercent * 100 % 1 === 0 ? 0 : 2)}%)`,
      amount: financedFeeAmount,
    });
  }

  if (input.buydownAmount > 0) {
    prepaids.push({ label: "Temporary Buydown", amount: input.buydownAmount });
  }

  const prepaidsTotal = prepaids.reduce(
    (sum, item) => new Decimal(sum).plus(item.amount).toNumber(),
    0
  );

  // ---- Credits ----
  const credits: ItemizedLineItem[] = [];

  if (input.sellerCredit > 0) {
    credits.push({
      label: "Seller / Realtor Credit",
      amount: input.sellerCredit,
      isCredit: true,
    });
  }

  // If lender credit (pointsCost is negative), it's already in Section A
  // but also show as a credit line for clarity
  if (pointsCost < 0) {
    credits.push({
      label: "Lender Credit (from rate)",
      amount: Math.abs(pointsCost),
      isCredit: true,
    });
  }

  const creditsTotal = credits.reduce(
    (sum, item) => new Decimal(sum).plus(item.amount).toNumber(),
    0
  );

  // ---- Totals ----
  const totalClosingCosts = new Decimal(sectionATotal)
    .plus(sectionBTotal)
    .plus(sectionCTotal)
    .plus(prepaidsTotal)
    .toDecimalPlaces(2)
    .toNumber();

  const totalCashAtClosing = new Decimal(downPayment)
    .plus(totalClosingCosts)
    .minus(creditsTotal)
    .toDecimalPlaces(2)
    .toNumber();

  // ---- Monthly Payment ----
  const monthlyEscrow = new Decimal(input.hazardInsuranceMonthly)
    .plus(input.propertyTaxMonthly)
    .toDecimalPlaces(2)
    .toNumber();

  const totalMonthlyPayment = new Decimal(pi)
    .plus(monthlyEscrow)
    .plus(input.mortgageInsuranceMonthly)
    .toDecimalPlaces(2)
    .toNumber();

  return {
    loanAmount: baseLoan,
    baseLoanAmount: baseLoan,
    totalLoanAmount,
    financedFeeAmount,
    financedFeePercent,
    financedFeeLabel,
    propertyValue: input.propertyValue,
    ltv,
    downPayment,
    interestRate: input.interestRate,
    monthlyPI: pi,
    sectionA,
    sectionATotal: new Decimal(sectionATotal).toDecimalPlaces(2).toNumber(),
    sectionB,
    sectionBTotal: new Decimal(sectionBTotal).toDecimalPlaces(2).toNumber(),
    sectionC,
    sectionCTotal: new Decimal(sectionCTotal).toDecimalPlaces(2).toNumber(),
    prepaids,
    prepaidsTotal: new Decimal(prepaidsTotal).toDecimalPlaces(2).toNumber(),
    credits,
    creditsTotal: new Decimal(creditsTotal).toDecimalPlaces(2).toNumber(),
    totalClosingCosts,
    totalCashAtClosing,
    monthlyPI_: pi,
    monthlyEscrow,
    monthlyMI: input.mortgageInsuranceMonthly,
    totalMonthlyPayment,
  };
}

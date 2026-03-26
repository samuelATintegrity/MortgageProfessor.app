import { create } from "zustand";
import {
  calculateItemized,
  type ItemizedInput,
  type ItemizedResult,
} from "@/lib/calculations/itemized";

interface ItemizedState {
  input: Partial<ItemizedInput>;
  result: ItemizedResult | null;
  setInput: (partial: Partial<ItemizedInput>) => void;
  calculate: () => void;
  reset: () => void;
}

const defaultInput: Partial<ItemizedInput> = {
  loanAmount: 300000,
  propertyValue: 400000,
  loanTermYears: 30,
  loanType: "conventional",
  interestRate: 0.065,
  costCreditPercent: 0,
  fico: 740,
  state: "UT",
  lockPeriodDays: 30,
  isBorrowerPaid: true,
  borrowerPaidCompPercent: 0.009021,
  hazardInsuranceMonthly: 65,
  mortgageInsuranceMonthly: 0,
  propertyTaxMonthly: 217,
  prepaidInterestDays: 15,
  escrowTaxMonths: 5,
  escrowHazardMonths: 15,
  processingFee: 700,
  underwritingFee: 1150,
  adminFee: 0,
  appraisalFee: 620,
  creditReportFee: 200,
  floodCertFee: 12,
  taxServiceFee: 80,
  mersFee: 30,
  titleInsuranceLender: 575,
  titleInsuranceOwner: 0,
  settlementFee: 850,
  recordingFee: 50,
  endorsementsFee: 150,
  pestInspectionFee: 0,
  surveyFee: 0,
  sellerCredit: 0,
  buydownAmount: 0,
  vaFundingFee: 0,
  fhaUpfrontMIP: 0,
};

export const useItemizedStore = create<ItemizedState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
    get().calculate();
  },
  calculate: () => {
    const { input } = get();
    try {
      const result = calculateItemized(input as ItemizedInput);
      set({ result });
    } catch {
      // Input not complete yet
    }
  },
  reset: () => set({ input: { ...defaultInput }, result: null }),
}));

import { create } from "zustand";
import { calculateQuote, type QuoteInput, type QuoteResult } from "@/lib/calculations/quote";

interface QuoteState {
  input: Partial<QuoteInput>;
  result: QuoteResult | null;
  setInput: (partial: Partial<QuoteInput>) => void;
  calculate: () => void;
  reset: () => void;
}

const defaultInput: Partial<QuoteInput> = {
  loanAmount: 300000,
  propertyValue: 400000,
  loanTermYears: 30,
  loanType: "conventional",
  fico: 740,
  state: "UT",
  lockPeriodDays: 30,
  isBorrowerPaid: true,
  borrowerPaidCompPercent: 0.009021,
  hazardInsuranceMonthly: 65,
  mortgageInsuranceMonthly: 0,
  propertyTaxMonthly: 217,
  prepaidInterestDays: 15,
  sellerCredit: 0,
  buydownAmount: 0,
  vaFundingFee: 0,
  appraisalFee: 620,
  processingFee: 700,
  underwritingFee: 1150,
  voeCreditFee: 200,
  taxFee: 80,
  mersFee: 30,
  titleFee: 575,
  escrowFee: 850,
  lowRate: { rate: 0.0625, costCredit: -0.437 },
  parRate: { rate: 0.065, costCredit: 0.65 },
  lowCostRate: { rate: 0.06625, costCredit: 1.286 },
};

export const useQuoteStore = create<QuoteState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
    // Auto-calculate
    get().calculate();
  },
  calculate: () => {
    const { input } = get();
    try {
      const result = calculateQuote(input as QuoteInput);
      set({ result });
    } catch {
      // Input not complete yet
    }
  },
  reset: () => set({ input: { ...defaultInput }, result: null }),
}));

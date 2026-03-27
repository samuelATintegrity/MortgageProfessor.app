import { create } from "zustand";
import { calculateQuote, type QuoteInput, type QuoteResult } from "@/lib/calculations/quote";

interface QuoteState {
  input: Partial<QuoteInput>;
  result: QuoteResult | null;
  brandingImageUrl: string | null;
  headlineFont: string;
  setInput: (partial: Partial<QuoteInput>) => void;
  setBrandingImageUrl: (url: string | null) => void;
  setHeadlineFont: (font: string) => void;
  calculate: () => void;
  reset: () => void;
}

const defaultInput: Partial<QuoteInput> = {
  transactionType: "purchase",
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
  vaFundingFee: 0,
  appraisalFee: 620,
  processingFee: 700,
  underwritingFee: 1150,
  voeCreditFee: 200,
  taxFee: 80,
  mersFee: 30,
  titleFee: 575,
  escrowFee: 850,
  buydownType: "none",
  piOnlyMode: false,
  tiers: [
    {
      id: "tier1",
      name: "Low Rate",
      rate: 0.0625,
      costCredit: -0.437,
      color: "#1e40af",
      visible: true,
    },
    {
      id: "tier2",
      name: "Par Rate",
      rate: 0.065,
      costCredit: 0.65,
      color: "#166534",
      visible: true,
    },
    {
      id: "tier3",
      name: "Low Cost",
      rate: 0.06625,
      costCredit: 1.286,
      color: "#b45309",
      visible: true,
    },
  ],
};

export const useQuoteStore = create<QuoteState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  brandingImageUrl: null,
  headlineFont: "Inter",
  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
    // Auto-calculate
    get().calculate();
  },
  setBrandingImageUrl: (url) => set({ brandingImageUrl: url }),
  setHeadlineFont: (font) => set({ headlineFont: font }),
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

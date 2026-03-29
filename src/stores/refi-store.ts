import { create } from "zustand";
import { calculateRefinance, type RefiInput, type RefiResult } from "@/lib/calculations/refinance";

export interface SectionVisibility {
  monthlyPayment: boolean;
  interestSavings: boolean;
  breakEven: boolean;
  acceleratedPayoff: boolean;
  additionalBenefits: boolean;
  showSkippedPayments: boolean;
  debtPayoff: boolean;
  summary: boolean;
}

interface RefiState {
  input: Partial<RefiInput>;
  result: RefiResult | null;
  sectionVisibility: SectionVisibility;
  setInput: (partial: Partial<RefiInput>) => void;
  setSectionVisibility: (partial: Partial<SectionVisibility>) => void;
  calculate: () => void;
  reset: () => void;
}

const defaultInput: Partial<RefiInput> = {
  originalLoanAmount: 500000,
  originalRate: 0.07125,
  originalTermYears: 30,
  loanStartDate: new Date("2022-10-01"),
  currentBalance: 400000,
  cashOutAmount: 0,
  closingCosts: 5000,
  newRate: 0.05,
  newTermYears: 30,
  newStartDate: new Date(),
  payingCostsMethod: "roll_into_loan",
  partialOutOfPocket: 0,
  escrowRefundAmount: 0,
  currentPaymentIncludesEscrow: true,
  skippedMonths: 2,
  debtPayoffAmount: 0,
  debtMonthlyPayments: 0,
};

const defaultVisibility: SectionVisibility = {
  monthlyPayment: true,
  interestSavings: true,
  breakEven: true,
  acceleratedPayoff: true,
  additionalBenefits: true,
  showSkippedPayments: true,
  debtPayoff: true,
  summary: true,
};

export const useRefiStore = create<RefiState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  sectionVisibility: { ...defaultVisibility },
  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
    get().calculate();
  },
  setSectionVisibility: (partial) =>
    set((state) => ({ sectionVisibility: { ...state.sectionVisibility, ...partial } })),
  calculate: () => {
    const { input } = get();
    try {
      const result = calculateRefinance(input as RefiInput);
      set({ result });
    } catch {
      // incomplete input
    }
  },
  reset: () => set({ input: { ...defaultInput }, result: null, sectionVisibility: { ...defaultVisibility } }),
}));

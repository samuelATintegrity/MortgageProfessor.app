import { create } from "zustand";
import { calculateRefinance, type RefiInput, type RefiResult } from "@/lib/calculations/refinance";

export interface RowFormatting {
  highlight?: boolean;
  bold?: boolean;
  underline?: boolean;
  color?: string;
}

export interface SectionVisibility {
  monthlyPayment: boolean;
  interestSavings: boolean;
  breakEven: boolean;
  acceleratedPayoff: boolean;
  additionalBenefits: boolean;
  showSkippedPayments: boolean;
  debtPayoff: boolean;
}

interface RefiState {
  input: Partial<RefiInput>;
  result: RefiResult | null;
  sectionVisibility: SectionVisibility;
  formatting: Record<string, RowFormatting>;
  activeFormatRow: string | null;
  setInput: (partial: Partial<RefiInput>) => void;
  setSectionVisibility: (partial: Partial<SectionVisibility>) => void;
  setRowFormatting: (key: string, fmt: RowFormatting) => void;
  clearAllFormatting: () => void;
  setActiveFormatRow: (key: string | null) => void;
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
  escrowSetupCosts: 0,
};

const defaultVisibility: SectionVisibility = {
  monthlyPayment: true,
  interestSavings: true,
  breakEven: true,
  acceleratedPayoff: true,
  additionalBenefits: true,
  showSkippedPayments: true,
  debtPayoff: true,
};

export const useRefiStore = create<RefiState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  sectionVisibility: { ...defaultVisibility },
  formatting: {},
  activeFormatRow: null,
  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
    get().calculate();
  },
  setSectionVisibility: (partial) =>
    set((state) => ({ sectionVisibility: { ...state.sectionVisibility, ...partial } })),
  setRowFormatting: (key, fmt) =>
    set((state) => ({
      formatting: { ...state.formatting, [key]: { ...state.formatting[key], ...fmt } },
    })),
  clearAllFormatting: () => set({ formatting: {}, activeFormatRow: null }),
  setActiveFormatRow: (key) => set({ activeFormatRow: key }),
  calculate: () => {
    const { input } = get();
    try {
      const result = calculateRefinance(input as RefiInput);
      set({ result });
    } catch {
      // incomplete input
    }
  },
  reset: () => set({ input: { ...defaultInput }, result: null, sectionVisibility: { ...defaultVisibility }, formatting: {}, activeFormatRow: null }),
}));

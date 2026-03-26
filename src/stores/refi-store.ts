import { create } from "zustand";
import { calculateRefinance, type RefiInput, type RefiResult } from "@/lib/calculations/refinance";

interface RefiState {
  input: Partial<RefiInput>;
  result: RefiResult | null;
  setInput: (partial: Partial<RefiInput>) => void;
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
  newTermYears: 15,
  newStartDate: new Date(),
  payingCostsMethod: "roll_into_loan",
  partialOutOfPocket: 0,
};

export const useRefiStore = create<RefiState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
    get().calculate();
  },
  calculate: () => {
    const { input } = get();
    try {
      const result = calculateRefinance(input as RefiInput);
      set({ result });
    } catch {
      // incomplete input
    }
  },
  reset: () => set({ input: { ...defaultInput }, result: null }),
}));

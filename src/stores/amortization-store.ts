import { create } from "zustand";

export interface AmortizationScenario {
  id: string;
  label: string;
  loanAmount: number;
  annualRate: number; // decimal, e.g. 0.065
  termYears: number;
  color: string;
}

const COLORS = ["#1e40af", "#059669", "#d97706"];

interface AmortizationState {
  scenarios: AmortizationScenario[];
  addScenario: () => void;
  removeScenario: (id: string) => void;
  updateScenario: (id: string, partial: Partial<AmortizationScenario>) => void;
}

export const useAmortizationStore = create<AmortizationState>((set) => ({
  scenarios: [
    {
      id: "s1",
      label: "30 Year",
      loanAmount: 400000,
      annualRate: 0.065,
      termYears: 30,
      color: COLORS[0],
    },
  ],

  addScenario: () =>
    set((state) => {
      if (state.scenarios.length >= 3) return state;
      const idx = state.scenarios.length;
      const prev = state.scenarios[state.scenarios.length - 1];
      const terms = [15, 20, 25, 30];
      // Pick a term not already used, or default to 15
      const usedTerms = state.scenarios.map((s) => s.termYears);
      const nextTerm = terms.find((t) => !usedTerms.includes(t)) ?? 15;
      return {
        scenarios: [
          ...state.scenarios,
          {
            id: `s${Date.now()}`,
            label: `${nextTerm} Year`,
            loanAmount: prev.loanAmount,
            annualRate: prev.annualRate,
            termYears: nextTerm,
            color: COLORS[idx] ?? "#6b7280",
          },
        ],
      };
    }),

  removeScenario: (id) =>
    set((state) => {
      if (state.scenarios.length <= 1) return state;
      return { scenarios: state.scenarios.filter((s) => s.id !== id) };
    }),

  updateScenario: (id, partial) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
    })),
}));

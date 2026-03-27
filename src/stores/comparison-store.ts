import { create } from "zustand";
import type {
  CompetitorParseResult,
  ComparisonRow,
  ComparisonCategory,
} from "@/lib/types/comparison";

interface ComparisonState {
  competitorData: CompetitorParseResult | null;
  competitorFileName: string | null;
  lenderName: string;
  rows: ComparisonRow[];
  isProcessing: boolean;
  parseError: string | null;

  setProcessing: (val: boolean) => void;
  setParseError: (err: string | null) => void;
  setCompetitorData: (data: CompetitorParseResult, fileName: string) => void;
  setLenderName: (name: string) => void;
  updateRow: (id: string, partial: Partial<ComparisonRow>) => void;
  addRow: (category: ComparisonCategory) => void;
  removeRow: (id: string) => void;
  reset: () => void;
}

function buildRowsFromParseResult(data: CompetitorParseResult): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // Loan info rows
  const loanInfoItems: { label: string; value: number }[] = [
    { label: "Loan Amount", value: data.loanInfo.loanAmount },
    { label: "Property Value", value: data.loanInfo.propertyValue },
    { label: "Interest Rate", value: data.loanInfo.interestRate },
    { label: "Loan Term (Years)", value: data.loanInfo.loanTerm },
  ];

  for (const item of loanInfoItems) {
    rows.push({
      id: crypto.randomUUID(),
      category: "loan_info",
      competitorLabel: item.label,
      userLabel: item.label,
      competitorValue: item.value,
      userValue: 0,
    });
  }

  // Closing cost rows
  for (const item of data.closingCosts) {
    rows.push({
      id: crypto.randomUUID(),
      category: "closing_costs",
      competitorLabel: item.label,
      userLabel: item.label,
      competitorValue: item.value,
      userValue: 0,
    });
  }

  // Monthly payment rows
  for (const item of data.monthlyPayment) {
    rows.push({
      id: crypto.randomUUID(),
      category: "monthly_payment",
      competitorLabel: item.label,
      userLabel: item.label,
      competitorValue: item.value,
      userValue: 0,
    });
  }

  return rows;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  competitorData: null,
  competitorFileName: null,
  lenderName: "",
  rows: [],
  isProcessing: false,
  parseError: null,

  setProcessing: (val) => set({ isProcessing: val }),
  setParseError: (err) => set({ parseError: err }),

  setCompetitorData: (data, fileName) => {
    const rows = buildRowsFromParseResult(data);
    set({
      competitorData: data,
      competitorFileName: fileName,
      lenderName: data.lenderName,
      rows,
      parseError: null,
    });
  },

  setLenderName: (name) => set({ lenderName: name }),

  updateRow: (id, partial) =>
    set((state) => ({
      rows: state.rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    })),

  addRow: (category) =>
    set((state) => ({
      rows: [
        ...state.rows,
        {
          id: crypto.randomUUID(),
          category,
          competitorLabel: "",
          userLabel: "",
          competitorValue: 0,
          userValue: 0,
        },
      ],
    })),

  removeRow: (id) =>
    set((state) => ({
      rows: state.rows.filter((r) => r.id !== id),
    })),

  reset: () =>
    set({
      competitorData: null,
      competitorFileName: null,
      lenderName: "",
      rows: [],
      isProcessing: false,
      parseError: null,
    }),
}));

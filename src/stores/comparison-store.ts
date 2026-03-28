import { create } from "zustand";
import type {
  CompetitorParseResult,
  ComparisonRow,
  ComparisonCategory,
  ClosingCostSubcategory,
} from "@/lib/types/comparison";

interface ComparisonState {
  competitorData: CompetitorParseResult | null;
  competitorFileName: string | null;
  lenderName: string;
  companyName: string;
  rows: ComparisonRow[];
  isProcessing: boolean;
  parseError: string | null;
  savedId: string | null;
  headerColor: string;

  setProcessing: (val: boolean) => void;
  setParseError: (err: string | null) => void;
  setCompetitorData: (data: CompetitorParseResult, fileName: string) => void;
  setLenderName: (name: string) => void;
  setCompanyName: (name: string) => void;
  setSavedId: (id: string | null) => void;
  setHeaderColor: (color: string) => void;
  updateRow: (id: string, partial: Partial<ComparisonRow>) => void;
  addRow: (category: ComparisonCategory, closingCostCategory?: ClosingCostSubcategory) => void;
  removeRow: (id: string) => void;
  importFromQuote: (quoteData: SavedQuoteData, tierIndex: number) => void;
  loadSavedComparison: (data: SavedComparisonData) => void;
  reset: () => void;
}

/** Shape of saved quote data passed to importFromQuote */
export interface SavedQuoteData {
  baseLoanAmount: number;
  propertyValue: number;
  loanTermYears: number;
  tiers: Array<{
    tierName: string;
    interestRate: number;
    monthlyPI: number;
    titleFees: number;
    prepaidCosts: number;
    lenderFees: number;
    financedFee: number;
    downPayment: number;
    sellerCredit: number;
    monthlyEscrow: number;
    monthlyMI: number;
    totalMonthlyPayment: number;
    pointsBuydown: number;
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
  }>;
}

/** Shape of data loaded from Supabase comparisons table */
export interface SavedComparisonData {
  id: string;
  name: string | null;
  competitor_lender: string | null;
  competitor_file_name: string | null;
  company_name: string | null;
  rows: ComparisonRow[];
}

const CLOSING_COST_CATEGORY_MAP: Record<string, ClosingCostSubcategory> = {
  lender_fees: "lender_fees",
  title_fees: "title_fees",
  prepaid: "prepaid",
  government: "government",
  other: "other",
};

function buildRowsFromParseResult(data: CompetitorParseResult): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // Loan info rows
  rows.push({
    id: crypto.randomUUID(),
    category: "loan_info",
    competitorLabel: "Loan Amount",
    userLabel: "Loan Amount",
    competitorValue: data.loanInfo.loanAmount,
    userValue: 0,
    format: "currency",
  });
  rows.push({
    id: crypto.randomUUID(),
    category: "loan_info",
    competitorLabel: "Property Value",
    userLabel: "Property Value",
    competitorValue: data.loanInfo.propertyValue,
    userValue: 0,
    format: "currency",
  });
  rows.push({
    id: crypto.randomUUID(),
    category: "loan_info",
    competitorLabel: "Interest Rate",
    userLabel: "Interest Rate",
    // Convert decimal to display percentage (0.065 → 6.5)
    competitorValue: data.loanInfo.interestRate > 0 && data.loanInfo.interestRate < 1
      ? parseFloat((data.loanInfo.interestRate * 100).toFixed(4))
      : data.loanInfo.interestRate,
    userValue: 0,
    format: "percentage",
  });
  rows.push({
    id: crypto.randomUUID(),
    category: "loan_info",
    competitorLabel: "Loan Term (Years)",
    userLabel: "Loan Term (Years)",
    competitorValue: data.loanInfo.loanTerm,
    userValue: 0,
    format: "plain",
  });

  // Closing cost rows — carry subcategory from AI
  for (const item of data.closingCosts) {
    rows.push({
      id: crypto.randomUUID(),
      category: "closing_costs",
      competitorLabel: item.label,
      userLabel: item.label,
      competitorValue: item.value,
      userValue: 0,
      closingCostCategory: CLOSING_COST_CATEGORY_MAP[item.category] ?? "other",
      format: "currency",
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
      format: "currency",
    });
  }

  return rows;
}

/** Label normalization for fuzzy matching during import */
function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  competitorData: null,
  competitorFileName: null,
  lenderName: "",
  companyName: "",
  rows: [],
  isProcessing: false,
  parseError: null,
  savedId: null,
  headerColor: "#1f2937",

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
      savedId: null,
    });
  },

  setLenderName: (name) => set({ lenderName: name }),
  setCompanyName: (name) => set({ companyName: name }),
  setSavedId: (id) => set({ savedId: id }),
  setHeaderColor: (color) => set({ headerColor: color }),

  updateRow: (id, partial) =>
    set((state) => ({
      rows: state.rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    })),

  addRow: (category, closingCostCategory?) =>
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
          format: "currency",
          ...(category === "closing_costs" ? { closingCostCategory: closingCostCategory ?? "other" } : {}),
        },
      ],
    })),

  removeRow: (id) =>
    set((state) => ({
      rows: state.rows.filter((r) => r.id !== id),
    })),

  importFromQuote: (quoteData, tierIndex) => {
    const tier = quoteData.tiers[tierIndex];
    if (!tier) return;

    const { rows } = get();

    // Build a map of user values to fill in
    const userValues: Array<{ label: string; value: number; category: ComparisonCategory; closingCostCategory?: ClosingCostSubcategory; format?: "currency" | "percentage" | "plain" }> = [
      // Loan Info
      { label: "Loan Amount", value: quoteData.baseLoanAmount, category: "loan_info", format: "currency" },
      { label: "Property Value", value: quoteData.propertyValue, category: "loan_info", format: "currency" },
      { label: "Interest Rate", value: parseFloat((tier.interestRate * 100).toFixed(4)), category: "loan_info", format: "percentage" },
      { label: "Loan Term (Years)", value: quoteData.loanTermYears, category: "loan_info", format: "plain" },
      // Closing Costs — itemized
      { label: "Appraisal Fee", value: tier.itemized.appraisalFee, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Processing Fee", value: tier.itemized.processingFee, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Underwriting Fee", value: tier.itemized.underwritingFee, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Credit Report / VOE", value: tier.itemized.voeCreditFee, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Tax Service Fee", value: tier.itemized.taxServiceFee, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "MERS Fee", value: tier.itemized.mersFee, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Origination Fee", value: tier.itemized.borrowerComp, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Discount Points / Buydown", value: tier.pointsBuydown > 0 ? tier.pointsBuydown : 0, category: "closing_costs", closingCostCategory: "lender_fees" },
      { label: "Title Fee", value: tier.itemized.titleFee, category: "closing_costs", closingCostCategory: "title_fees" },
      { label: "Escrow Fee", value: tier.itemized.escrowFee, category: "closing_costs", closingCostCategory: "title_fees" },
      { label: "Prepaid Interest", value: tier.itemized.prepaidInterest, category: "closing_costs", closingCostCategory: "prepaid" },
      { label: "Property Taxes", value: tier.itemized.prepaidTaxes, category: "closing_costs", closingCostCategory: "prepaid" },
      { label: "Homeowner's Insurance", value: tier.itemized.prepaidHazard, category: "closing_costs", closingCostCategory: "prepaid" },
      // Monthly Payment
      { label: "Principal & Interest", value: tier.monthlyPI, category: "monthly_payment" },
      { label: "Property Taxes", value: tier.monthlyEscrow > 0 ? Math.round(tier.monthlyEscrow / 2 * 100) / 100 : 0, category: "monthly_payment" },
      { label: "Homeowner's Insurance", value: tier.monthlyEscrow > 0 ? Math.round(tier.monthlyEscrow / 2 * 100) / 100 : 0, category: "monthly_payment" },
      { label: "Mortgage Insurance", value: tier.monthlyMI, category: "monthly_payment" },
    ];

    // Try to match user values to existing rows by normalized label
    const updatedRows = [...rows];
    const matched = new Set<string>();

    for (const uv of userValues) {
      if (uv.value === 0) continue;
      const normalizedUv = normalizeLabel(uv.label);

      // Find matching row in same category
      const matchIdx = updatedRows.findIndex(
        (r) =>
          r.category === uv.category &&
          !matched.has(r.id) &&
          (normalizeLabel(r.competitorLabel).includes(normalizedUv) ||
           normalizedUv.includes(normalizeLabel(r.competitorLabel)) ||
           normalizeLabel(r.userLabel).includes(normalizedUv))
      );

      if (matchIdx >= 0) {
        updatedRows[matchIdx] = {
          ...updatedRows[matchIdx],
          userLabel: uv.label,
          userValue: uv.value,
        };
        matched.add(updatedRows[matchIdx].id);
      } else {
        // Create a new row for unmatched user values
        updatedRows.push({
          id: crypto.randomUUID(),
          category: uv.category,
          competitorLabel: "",
          userLabel: uv.label,
          competitorValue: 0,
          userValue: uv.value,
          closingCostCategory: uv.closingCostCategory,
          format: uv.format ?? "currency",
        });
      }
    }

    set({ rows: updatedRows });
  },

  loadSavedComparison: (data) => {
    set({
      competitorData: null,
      competitorFileName: data.competitor_file_name ?? null,
      lenderName: data.competitor_lender ?? "",
      companyName: data.company_name ?? "",
      rows: data.rows,
      savedId: data.id,
      isProcessing: false,
      parseError: null,
    });
  },

  reset: () =>
    set({
      competitorData: null,
      competitorFileName: null,
      lenderName: "",
      rows: [],
      isProcessing: false,
      parseError: null,
      savedId: null,
      headerColor: "#1f2937",
    }),
}));

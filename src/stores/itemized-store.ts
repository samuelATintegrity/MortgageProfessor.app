import { create } from "zustand";
import {
  calculateItemized,
  type ItemizedInput,
  type ItemizedResult,
  type CustomFee,
} from "@/lib/calculations/itemized";

interface ItemizedState {
  input: Partial<ItemizedInput>;
  result: ItemizedResult | null;
  stickyLtv: number | null;
  stickyMiFactor: number | null;
  setInput: (partial: Partial<ItemizedInput>) => void;
  setStickyLtv: (ltv: number | null) => void;
  setStickyMiFactor: (factor: number | null) => void;
  addCustomFee: (section: "A" | "B" | "C") => void;
  updateCustomFee: (id: string, partial: Partial<Omit<CustomFee, "id">>) => void;
  removeCustomFee: (id: string) => void;
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
  transactionType: "purchase",
  sellerCredit: 0,
  credits: [],
  buydownAmount: 0,
  vaFundingFeePercent: 0,
  fhaUfmipRefund: 0,
  customFees: [],
};

export const useItemizedStore = create<ItemizedState>((set, get) => ({
  input: { ...defaultInput },
  result: null,
  stickyLtv: null,
  stickyMiFactor: null,
  setInput: (partial) => {
    const { stickyLtv, stickyMiFactor } = get();
    const updates: Partial<ItemizedInput> = { ...partial };
    const unstick: Partial<Pick<ItemizedState, "stickyLtv" | "stickyMiFactor">> = {};

    // If property value changed and LTV is sticky, recalc loan amount
    if ("propertyValue" in partial && stickyLtv !== null) {
      const pv = partial.propertyValue ?? 0;
      updates.loanAmount = Math.round(pv * stickyLtv);
    }

    // If loan amount manually changed (not from property value + sticky LTV), unstick LTV
    if ("loanAmount" in partial && !("propertyValue" in partial)) {
      unstick.stickyLtv = null;
    }

    // If MI manually changed, unstick MI factor
    if ("mortgageInsuranceMonthly" in partial && !("loanAmount" in partial)) {
      unstick.stickyMiFactor = null;
    }

    // If loan amount changed and MI factor is sticky, recalc MI
    const effectiveMiFactor = "mortgageInsuranceMonthly" in partial ? null : stickyMiFactor;
    if (effectiveMiFactor !== null && ("loanAmount" in updates || "propertyValue" in partial)) {
      const merged = { ...get().input, ...updates };
      const loan = merged.loanAmount ?? 0;
      if (loan > 0) {
        updates.mortgageInsuranceMonthly = Math.round((loan * effectiveMiFactor) / 12 * 100) / 100;
      }
    }

    set((state) => ({ ...unstick, input: { ...state.input, ...updates } }));
    get().calculate();
  },
  setStickyLtv: (ltv) => set({ stickyLtv: ltv }),
  setStickyMiFactor: (factor) => set({ stickyMiFactor: factor }),
  addCustomFee: (section) => {
    const { input } = get();
    const customFees = [...(input.customFees ?? []), { id: crypto.randomUUID(), label: "", amount: 0, section }];
    set((state) => ({ input: { ...state.input, customFees } }));
    get().calculate();
  },
  updateCustomFee: (id, partial) => {
    const { input } = get();
    const customFees = (input.customFees ?? []).map((cf) =>
      cf.id === id ? { ...cf, ...partial } : cf
    );
    set((state) => ({ input: { ...state.input, customFees } }));
    get().calculate();
  },
  removeCustomFee: (id) => {
    const { input } = get();
    const customFees = (input.customFees ?? []).filter((cf) => cf.id !== id);
    set((state) => ({ input: { ...state.input, customFees } }));
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
  reset: () => set({ input: { ...defaultInput }, result: null, stickyLtv: null, stickyMiFactor: null }),
}));

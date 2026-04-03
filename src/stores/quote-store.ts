import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateQuote, type QuoteInput, type QuoteResult } from "@/lib/calculations/quote";

interface ProfileInfo {
  fullName: string;
  companyName: string;
  nmlsNumber: string;
}

interface BrandingToggles {
  showName: boolean;
  showCompany: boolean;
  showNmls: boolean;
}

interface QuoteState {
  input: Partial<QuoteInput>;
  result: QuoteResult | null;
  brandingImageUrl: string | null;
  headlineFont: string;
  profile: ProfileInfo;
  brandingToggles: BrandingToggles;
  stickyLtv: number | null;
  stickyMiFactor: number | null;
  sectionHeaderColor: string;
  setInput: (partial: Partial<QuoteInput>) => void;
  setBrandingImageUrl: (url: string | null) => void;
  setHeadlineFont: (font: string) => void;
  setProfile: (profile: Partial<ProfileInfo>) => void;
  setBrandingToggles: (toggles: Partial<BrandingToggles>) => void;
  setStickyLtv: (ltv: number | null) => void;
  setStickyMiFactor: (factor: number | null) => void;
  setSectionHeaderColor: (color: string) => void;
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
  escrowTaxMonths: 5,
  escrowHazardMonths: 15,
  sellerCredit: 0,
  credits: [],
  vaFundingFeePercent: 0,
  fhaUfmipRefund: 0,
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
  isStreamline: false,
  itemizeMode: false,
  rollClosingCostsIn: false,
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

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      input: { ...defaultInput },
      result: null,
      brandingImageUrl: null,
      headlineFont: "Inter",
      profile: { fullName: "", companyName: "", nmlsNumber: "" },
      brandingToggles: { showName: true, showCompany: true, showNmls: true },
      stickyLtv: null,
      stickyMiFactor: null,
      sectionHeaderColor: "#1f2937",
      setInput: (partial) => {
        const { stickyLtv, stickyMiFactor } = get();
        const updates: Partial<QuoteInput> = { ...partial };
        const unstick: Partial<QuoteState> = {};

        // If property value changed and LTV is sticky, recalc loan amount
        if ("propertyValue" in partial && stickyLtv !== null) {
          const pv = partial.propertyValue ?? 0;
          updates.loanAmount = Math.round(pv * stickyLtv);
        }

        // If loan amount manually changed (not from property value + sticky LTV), unstick LTV
        if ("loanAmount" in partial && !("propertyValue" in partial)) {
          unstick.stickyLtv = null;
        }

        // If MI manually changed (not from sticky button — detected by loanAmount NOT being in the call), unstick MI factor
        if ("mortgageInsuranceMonthly" in partial && !("loanAmount" in partial)) {
          unstick.stickyMiFactor = null;
        }

        // If loan amount changed and MI factor is sticky, recalc MI
        // (This runs after the unstick check above, but we only recalc if stickyMiFactor
        //  hasn't been cleared in this call — i.e., MI wasn't directly changed)
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
      setBrandingImageUrl: (url) => set({ brandingImageUrl: url }),
      setHeadlineFont: (font) => set({ headlineFont: font }),
      setProfile: (p) => set((state) => ({ profile: { ...state.profile, ...p } })),
      setBrandingToggles: (t) => set((state) => ({ brandingToggles: { ...state.brandingToggles, ...t } })),
      setStickyLtv: (ltv) => set({ stickyLtv: ltv }),
      setStickyMiFactor: (factor) => set({ stickyMiFactor: factor }),
      setSectionHeaderColor: (color) => set({ sectionHeaderColor: color }),
      calculate: () => {
        const { input } = get();
        try {
          const result = calculateQuote(input as QuoteInput);
          set({ result });
        } catch {
          // Input not complete yet
        }
      },
      reset: () => set({ input: { ...defaultInput }, result: null, stickyLtv: null, stickyMiFactor: null }),
    }),
    {
      name: "quote-store",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 1) {
          // Rename vaFundingFee (dollar) → vaFundingFeePercent (decimal)
          const inp = state.input as Record<string, unknown> | undefined;
          if (inp && "vaFundingFee" in inp) {
            inp.vaFundingFeePercent = 0;
            delete inp.vaFundingFee;
          }
        }
        if (version < 2) {
          // Migrate sellerCredit → credits array
          const inp = state.input as Record<string, unknown> | undefined;
          if (inp && !inp.credits) {
            const sellerCredit = (inp.sellerCredit as number) || 0;
            inp.credits = sellerCredit > 0
              ? [{ id: "credit-1", label: "Seller / Realtor Credit", amount: sellerCredit }]
              : [];
          }
        }
        return state;
      },
      // Only persist the settings that should survive a refresh — not the calculated result
      partialize: (state) => ({
        input: state.input,
        brandingImageUrl: state.brandingImageUrl,
        headlineFont: state.headlineFont,
        profile: state.profile,
        brandingToggles: state.brandingToggles,
        stickyLtv: state.stickyLtv,
        stickyMiFactor: state.stickyMiFactor,
        sectionHeaderColor: state.sectionHeaderColor,
      }),
    }
  )
);

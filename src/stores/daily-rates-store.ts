import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LoanProduct {
  id: string;
  label: string;
  rate: number; // decimal, e.g. 0.065 = 6.5%
  show: boolean;
  isHomeReady?: boolean;
  // Per-product scenario
  propertyValue: number;
  loanAmount: number;
  creditScore: number;
}

export interface DailyRatesInput {
  // Ordered loan products
  products: LoanProduct[];
  // Background
  backgroundImage: string;
  customBackgroundImage: string | null;
  backgroundPosition: number; // 0-100 for object-position vertical %
  overlayOpacity: number; // 0-1
  whiteOverlayOpacity: number; // 0-1
  showRateCardBg: boolean;
  blurIntensity: number; // 0-20 px
  rateCardLayout: "sides" | "center";
  // Typography
  headlineFont: string;
  headlineFontSize: number; // px
  headlineColor: string; // hex
  rateTextColor: string; // hex
  // Dimensions
  outputWidth: number;
  outputHeight: number;
  // Scenario descriptions
  showScenarioDescriptions: boolean;
  // Date
  date: string;
}

interface DailyRatesState {
  input: DailyRatesInput;
  setInput: (partial: Partial<DailyRatesInput>) => void;
  setProduct: (id: string, partial: Partial<LoanProduct>) => void;
  reorderProducts: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

/** Legacy flat array — kept for backward compatibility */
export const BUNDLED_BACKGROUNDS = [
  "/images/backgrounds/nature-1.svg",
  "/images/backgrounds/nature-2.svg",
  "/images/backgrounds/nature-3.svg",
  "/images/backgrounds/nature-4.svg",
  "/images/backgrounds/nature-5.svg",
];

/** Backgrounds organized by dimension key (WxH) */
export const BACKGROUNDS_BY_DIMENSION: Record<string, string[]> = {
  "all": [
    "/images/backgrounds/nature-1.svg",
    "/images/backgrounds/nature-2.svg",
    "/images/backgrounds/nature-3.svg",
    "/images/backgrounds/nature-4.svg",
    "/images/backgrounds/nature-5.svg",
  ],
  "1080x1920": [
    "/images/backgrounds/1080x1920 White Home 1.png",
    "/images/backgrounds/1080x1920 White Home 2.png",
    "/images/backgrounds/1080x1920 White Home 3.png",
    "/images/backgrounds/1080x1920 Aerial Coastline 1.png",
    "/images/backgrounds/1080x1920 Aerial Coastline 2.png",
    "/images/backgrounds/1080x1920 Aerial Coastline 3.png",
    "/images/backgrounds/1080x1920 Southern UT 1.png",
    "/images/backgrounds/1080x1920 Southern UT 2.png",
    "/images/backgrounds/1080x1920 Southern UT 3.png",
    "/images/backgrounds/1080x1920 Mountains 1.png",
    "/images/backgrounds/1080x1920 Mountains 2.png",
    "/images/backgrounds/1080x1920 Road.png",
    "/images/backgrounds/1080x1920 Townhomes.png",
  ],
};

/** Get backgrounds for a given dimension, falling back to "all" */
export function getBackgroundsForDimension(w: number, h: number): string[] {
  const key = `${w}x${h}`;
  const dimensionSpecific = BACKGROUNDS_BY_DIMENSION[key] ?? [];
  const universal = BACKGROUNDS_BY_DIMENSION["all"] ?? [];
  // Show dimension-specific first, then universal ones
  if (dimensionSpecific.length > 0) {
    // Deduplicate in case universal images are also in the dimension set
    const combined = [...dimensionSpecific];
    for (const bg of universal) {
      if (!combined.includes(bg)) combined.push(bg);
    }
    return combined;
  }
  return universal;
}

export const DIMENSION_PRESETS = [
  { label: "IG Story", w: 1080, h: 1920 },
  { label: "IG Post", w: 1080, h: 1080 },
  { label: "Pinterest", w: 1000, h: 1500 },
];

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Oswald",
  "Lora",
  "Roboto Slab",
  "Priestacy",
];

// Fonts loaded via @font-face (not Google CDN)
export const BUNDLED_FONTS = ["Priestacy"];

const today = new Date().toISOString().split("T")[0];

const defaultProducts: LoanProduct[] = [
  { id: "conventional", label: "Conventional", rate: 0.065, show: true, propertyValue: 400000, loanAmount: 380000, creditScore: 740 },
  { id: "fha", label: "FHA", rate: 0.06, show: true, propertyValue: 400000, loanAmount: 380000, creditScore: 740 },
  { id: "va", label: "VA", rate: 0.058, show: true, propertyValue: 400000, loanAmount: 380000, creditScore: 740 },
  { id: "usda", label: "USDA", rate: 0.062, show: true, propertyValue: 400000, loanAmount: 380000, creditScore: 740 },
  { id: "homeReady", label: "HomeReady", rate: 0.063, show: false, isHomeReady: true, propertyValue: 400000, loanAmount: 380000, creditScore: 740 },
];

const defaultInput: DailyRatesInput = {
  products: defaultProducts.map((p) => ({ ...p })),
  backgroundImage: BUNDLED_BACKGROUNDS[0],
  customBackgroundImage: null,
  backgroundPosition: 50,
  overlayOpacity: 0.5,
  whiteOverlayOpacity: 0,
  showRateCardBg: true,
  blurIntensity: 0,
  rateCardLayout: "sides",
  headlineFont: "Inter",
  headlineFontSize: 24,
  headlineColor: "#FFFFFF",
  rateTextColor: "#FFFFFF",
  outputWidth: 1080,
  outputHeight: 1920,
  showScenarioDescriptions: false,
  date: today,
};

export const useDailyRatesStore = create<DailyRatesState>()(
  persist(
    (set) => ({
      input: { ...defaultInput, products: defaultProducts.map((p) => ({ ...p })) },
      setInput: (partial) =>
        set((state) => ({ input: { ...state.input, ...partial } })),
      setProduct: (id, partial) =>
        set((state) => ({
          input: {
            ...state.input,
            products: state.input.products.map((p) =>
              p.id === id ? { ...p, ...partial } : p
            ),
          },
        })),
      reorderProducts: (fromIndex, toIndex) =>
        set((state) => {
          const products = [...state.input.products];
          const [moved] = products.splice(fromIndex, 1);
          products.splice(toIndex, 0, moved);
          return { input: { ...state.input, products } };
        }),
      reset: () =>
        set({
          input: {
            ...defaultInput,
            products: defaultProducts.map((p) => ({ ...p })),
            date: new Date().toISOString().split("T")[0],
          },
        }),
    }),
    {
      name: "daily-rates-storage",
      version: 7,
      migrate: (persisted: unknown) => {
        const old = persisted as { input?: Record<string, unknown> };
        const oldInput = old?.input ?? {};
        // Migrate from flat fields to products array
        if (!oldInput.products) {
          const products: LoanProduct[] = [
            { id: "conventional", label: "Conventional", rate: (oldInput.conventional as number) ?? 0.065, show: (oldInput.showConventional as boolean) ?? true, propertyValue: (oldInput.propertyValue as number) ?? 400000, loanAmount: (oldInput.loanAmount as number) ?? 380000, creditScore: (oldInput.creditScore as number) ?? 740 },
            { id: "fha", label: "FHA", rate: (oldInput.fha as number) ?? 0.06, show: (oldInput.showFha as boolean) ?? true, propertyValue: (oldInput.propertyValue as number) ?? 400000, loanAmount: (oldInput.loanAmount as number) ?? 380000, creditScore: (oldInput.creditScore as number) ?? 740 },
            { id: "va", label: "VA", rate: (oldInput.va as number) ?? 0.058, show: (oldInput.showVa as boolean) ?? true, propertyValue: (oldInput.propertyValue as number) ?? 400000, loanAmount: (oldInput.loanAmount as number) ?? 380000, creditScore: (oldInput.creditScore as number) ?? 740 },
            { id: "usda", label: "USDA", rate: (oldInput.usda as number) ?? 0.062, show: (oldInput.showUsda as boolean) ?? true, propertyValue: (oldInput.propertyValue as number) ?? 400000, loanAmount: (oldInput.loanAmount as number) ?? 380000, creditScore: (oldInput.creditScore as number) ?? 740 },
            { id: "homeReady", label: "HomeReady", rate: (oldInput.homeReady as number) ?? 0.063, show: (oldInput.showHomeReady as boolean) ?? false, isHomeReady: true, propertyValue: (oldInput.propertyValue as number) ?? 400000, loanAmount: (oldInput.loanAmount as number) ?? 380000, creditScore: (oldInput.creditScore as number) ?? 740 },
          ];
          return { input: { ...defaultInput, ...oldInput, products } };
        }
        return { input: { ...defaultInput, ...(oldInput as Partial<DailyRatesInput>) } };
      },
    }
  )
);

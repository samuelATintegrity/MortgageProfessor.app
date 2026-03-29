import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailyRatesInput {
  // Rates (as decimals, e.g. 0.065 = 6.5%)
  conventional: number;
  fha: number;
  va: number;
  usda: number;
  homeReady: number;
  // Visibility toggles
  showConventional: boolean;
  showFha: boolean;
  showVa: boolean;
  showUsda: boolean;
  showHomeReady: boolean;
  // Background
  backgroundImage: string;
  customBackgroundImage: string | null;
  backgroundPosition: number; // 0-100 for object-position vertical %
  overlayOpacity: number; // 0-1
  whiteOverlayOpacity: number; // 0-1
  showRateCardBg: boolean;
  blurIntensity: number; // 0-20 px
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
  propertyValue: number;
  loanAmount: number;
  creditScore: number;
  // Date
  date: string;
}

interface DailyRatesState {
  input: DailyRatesInput;
  setInput: (partial: Partial<DailyRatesInput>) => void;
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
  // Dimension-specific backgrounds will be added here as images are created:
  // "1080x1920": ["/images/backgrounds/ig-story/..."],
  // "1080x1080": ["/images/backgrounds/ig-post/..."],
  // "820x312":   ["/images/backgrounds/fb-cover/..."],
  // "1200x675":  ["/images/backgrounds/x-post/..."],
  // "1000x1500": ["/images/backgrounds/pinterest/..."],
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
  { label: "FB Cover", w: 820, h: 312 },
  { label: "X Post", w: 1200, h: 675 },
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

const defaultInput: DailyRatesInput = {
  conventional: 0.065,
  fha: 0.06,
  va: 0.058,
  usda: 0.062,
  homeReady: 0.063,
  showConventional: true,
  showFha: true,
  showVa: true,
  showUsda: true,
  showHomeReady: false,
  backgroundImage: BUNDLED_BACKGROUNDS[0],
  customBackgroundImage: null,
  backgroundPosition: 50,
  overlayOpacity: 0.5,
  whiteOverlayOpacity: 0,
  showRateCardBg: true,
  blurIntensity: 0,
  headlineFont: "Inter",
  headlineFontSize: 24,
  headlineColor: "#FFFFFF",
  rateTextColor: "#FFFFFF",
  outputWidth: 1080,
  outputHeight: 1920,
  showScenarioDescriptions: false,
  propertyValue: 400000,
  loanAmount: 380000,
  creditScore: 740,
  date: today,
};

export const useDailyRatesStore = create<DailyRatesState>()(
  persist(
    (set) => ({
      input: { ...defaultInput },
      setInput: (partial) =>
        set((state) => ({ input: { ...state.input, ...partial } })),
      reset: () =>
        set({
          input: {
            ...defaultInput,
            date: new Date().toISOString().split("T")[0],
          },
        }),
    }),
    {
      name: "daily-rates-storage",
      version: 5,
      migrate: (persisted: unknown) => {
        const old = persisted as { input?: Partial<DailyRatesInput> };
        return {
          input: { ...defaultInput, ...(old?.input ?? {}) },
        };
      },
    }
  )
);

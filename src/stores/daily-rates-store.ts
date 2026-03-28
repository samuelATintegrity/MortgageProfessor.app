import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailyRatesInput {
  conventional: number;
  fha: number;
  va: number;
  usda: number;
  showConventional: boolean;
  showFha: boolean;
  showVa: boolean;
  showUsda: boolean;
  backgroundImage: string;
  backgroundPosition: number; // 0-100 for object-position vertical %
  date: string;
}

interface DailyRatesState {
  input: DailyRatesInput;
  setInput: (partial: Partial<DailyRatesInput>) => void;
  reset: () => void;
}

const BUNDLED_BACKGROUNDS = [
  "/images/backgrounds/nature-1.svg",
  "/images/backgrounds/nature-2.svg",
  "/images/backgrounds/nature-3.svg",
  "/images/backgrounds/nature-4.svg",
  "/images/backgrounds/nature-5.svg",
];

export { BUNDLED_BACKGROUNDS };

const today = new Date().toISOString().split("T")[0];

const defaultInput: DailyRatesInput = {
  conventional: 0.065,
  fha: 0.06,
  va: 0.058,
  usda: 0.062,
  showConventional: true,
  showFha: true,
  showVa: true,
  showUsda: true,
  backgroundImage: BUNDLED_BACKGROUNDS[0],
  backgroundPosition: 50,
  date: today,
};

export const useDailyRatesStore = create<DailyRatesState>()(
  persist(
    (set) => ({
      input: { ...defaultInput },
      setInput: (partial) =>
        set((state) => ({ input: { ...state.input, ...partial } })),
      reset: () => set({ input: { ...defaultInput, date: new Date().toISOString().split("T")[0] } }),
    }),
    {
      name: "daily-rates-storage",
    }
  )
);

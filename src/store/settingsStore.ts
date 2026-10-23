import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const SETTINGS_STORAGE_KEY = 'uppping.settings';

interface SettingsState {
  intervalS: number;
  timeoutS: number;
  autoSaveCsv: boolean;
  setIntervalS: (value: number) => void;
  setTimeoutS: (value: number) => void;
  setAutoSaveCsv: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      intervalS: 1,
      timeoutS: 3,
      autoSaveCsv: false,
      setIntervalS: (intervalS) => set({ intervalS }),
      setTimeoutS: (timeoutS) => set({ timeoutS }),
      setAutoSaveCsv: (autoSaveCsv) => set({ autoSaveCsv }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
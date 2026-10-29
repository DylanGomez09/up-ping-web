import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const SETTINGS_STORAGE_KEY = 'uppping.settings';

interface SettingsState {
  intervalS: number;
  timeoutS: number;
  setIntervalS: (value: number) => void;
  setTimeoutS: (value: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      intervalS: 1,
      timeoutS: 3,
      setIntervalS: (intervalS) => set({ intervalS }),
      setTimeoutS: (timeoutS) => set({ timeoutS }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

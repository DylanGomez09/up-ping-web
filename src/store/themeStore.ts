import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemeName } from '@/lib/theme/tokens';

const THEME_STORAGE_KEY = 'uppping.theme';

interface ThemeState {
  theme: ThemeName;
  /** True once persisted theme has been rehydrated from storage. */
  _hydrated: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

/**
 * The app starts in light mode and deliberately does NOT follow the system
 * theme — the Settings screen says so explicitly. Demo mode does not change it.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      _hydrated: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ _hydrated: true });
      },
    }
  )
);
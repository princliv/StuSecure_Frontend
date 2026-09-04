import { create } from 'zustand';

interface AppState {
  /** Whether the app has finished initial bootstrapping */
  isReady: boolean;
  /** Global error message (e.g. network offline) */
  globalError: string | null;

  setReady: (ready: boolean) => void;
  setGlobalError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  globalError: null,

  setReady: (ready) => set({ isReady: ready }),
  setGlobalError: (error) => set({ globalError: error }),
}));

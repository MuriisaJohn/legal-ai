import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Jurisdiction = {
  code: string; // e.g., "UG"
  name: string; // e.g., "Uganda"
};

interface SettingsStore {
  jurisdiction: Jurisdiction;
  setJurisdiction: (jurisdiction: Jurisdiction) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      jurisdiction: { code: 'UG', name: 'Uganda' },
      setJurisdiction: (jurisdiction) => set({ jurisdiction }),
    }),
    {
      name: 'settings-store',
    }
  )
);



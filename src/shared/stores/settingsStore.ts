import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Jurisdiction = {
  code: string; // e.g., "UG"
  name: string; // e.g., "Uganda"
};

interface SettingsStore {
  jurisdiction: Jurisdiction;
  voiceURI: string | null;
  setJurisdiction: (jurisdiction: Jurisdiction) => void;
  setVoice: (voiceURI: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      jurisdiction: { code: 'UG', name: 'Uganda' },
      voiceURI: null,
      setJurisdiction: (jurisdiction) => set({ jurisdiction }),
      setVoice: (voiceURI) => set({ voiceURI }),
    }),
    {
      name: 'settings-store',
    }
  )
);



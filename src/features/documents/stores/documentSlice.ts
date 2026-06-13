import { StateCreator } from 'zustand';
import type { Document } from '@/stores/types';

export interface DocumentSlice {
  activeDocument: Document | null;

  setActiveDocument: (document: Document | null) => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice, [], [], DocumentSlice> = (set) => ({
  activeDocument: null,

  setActiveDocument: (document) => {
    set({ activeDocument: document });
  },
});

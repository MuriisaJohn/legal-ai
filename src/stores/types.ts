export type {
  Message,
  ConversationEntry,
  SavedHistory,
} from '@/features/chat/types';

export interface Document {
  id: string;
  name: string;
  type?: string;
  date?: string;
  starred?: boolean;
  content?: string;
}

import { supabase } from './supabaseClient';

export const saveChatMessage = async (userId: string, message: any) => {
  // Save a single message
  return supabase.from('chats').insert([{ user_id: userId, ...message }]);
};

export const getRecentChats = async (userId: string, limit = 20) => {
  // Get the last 20 messages for the user, ordered by timestamp
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return { data, error };
};

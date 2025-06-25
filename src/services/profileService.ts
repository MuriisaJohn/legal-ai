import { supabase } from './supabaseClient';

export const createProfile = async (user_id: string, email: string) => {
  return supabase.from('profiles').insert([{ user_id, email }]);
};

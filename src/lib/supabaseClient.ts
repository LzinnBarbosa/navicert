import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rylsnzsxfwirfzmrdybk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YRx8d_PABQN-1j6MUAkDw_Ti34E_AR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
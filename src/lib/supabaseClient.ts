import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rylsnzsxfwirfzmrdybk.supabase.co';

// Cole aqui a chave anon obtida ao clicar em "View legacy API keys" no dashboard
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bHNuenN4ZndpcmZ6bXJkeWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzUwNDgsImV4cCI6MjEwOTE1MTA0OH0.tbp0SATEuX2GIVVH9cQQ_u1_i_NFDH-F-NLvCiVAZ8c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Listener global para gerenciar e limpar o armazenamento local automaticamente
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    localStorage.clear();
    sessionStorage.clear();
  }
});
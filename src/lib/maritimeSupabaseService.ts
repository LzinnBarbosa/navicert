import { supabase } from './supabaseClient';
import { Vessel, Certificate, PrazosConfig, User } from '../types/maritime';
import { sanitizarPayloadPerfil } from '../utils/sanitizePayload';

// ---------------------------------------------------------------------------
// 1. USUÁRIOS E PERFIS
// ---------------------------------------------------------------------------
export const fetchUsersFromSupabase = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Erro ao buscar perfis no Supabase:', error);
    return [];
  }
  return data || [];
};

export const saveUserProfileToSupabase = async (user: User): Promise<boolean> => {
  // 1. Sanitiza o payload para conter apenas colunas válidas da tabela 'profiles'
  const payloadSeguro = sanitizarPayloadPerfil(user);
  payloadSeguro.updated_at = new Date().toISOString();

  // 2. Executa a atualização (HTTP PATCH) filtrando pelo e-mail do utilizador
  const { data, error } = await supabase
    .from('profiles')
    .update(payloadSeguro)
    .eq('email', user.email)
    .select();

  if (error) {
    console.error('Erro ao salvar perfil no Supabase:', error);
    throw error;
  }

  // 3. Caso o utilizador ainda não exista na base de dados, realiza o insert inicial
  if (!data || data.length === 0) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(payloadSeguro);

    if (insertError) {
      console.error('Erro ao inserir novo perfil:', insertError);
      throw insertError;
    }
  }

  return true;
};

export const updateUserProfile = async (userId: string, profileData: Partial<User>): Promise<boolean> => {
  const payloadSeguro = sanitizarPayloadPerfil(profileData);
  payloadSeguro.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(payloadSeguro)
    .eq('id', userId);

  if (error) {
    console.error('Erro ao atualizar perfil no Supabase:', error);
    throw error;
  }
  return true;
};

export const deleteUserFromSupabase = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) {
    console.error('Erro ao deletar perfil no Supabase:', error);
    throw error;
  }
  return true;
};

// ---------------------------------------------------------------------------
// 2. CONFIGURAÇÕES E EMPRESA
// ---------------------------------------------------------------------------
export const fetchConfigFromSupabase = async (): Promise<PrazosConfig | null> => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error || !data) return null;
  return (data.config_json as PrazosConfig) || null;
};

export const saveConfigToSupabase = async (config: PrazosConfig): Promise<boolean> => {
  const { error } = await supabase.from('company_settings').upsert({
    id: 'default',
    empresa_nome: config.empresa_nome,
    config_json: config,
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error('Erro ao salvar configurações no Supabase:', error);
    throw error;
  }
  return true;
};

// ---------------------------------------------------------------------------
// 3. ENGINE DE TEMPO REAL (REALTIME WEBSOCKET)
// ---------------------------------------------------------------------------
export const subscribeToGlobalRealtime = (onUpdateCallback: () => void) => {
  const channel = supabase
    .channel('global-navcert-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log('⚡ [Realtime] Alteração detectada na tabela:', payload.table);
        onUpdateCallback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
import { supabase } from '../lib/supabaseClient';
import { User, Vessel, Certificate, PrazosConfig } from '../types/maritime';
import { sanitizarPayloadPerfil } from '../utils/sanitizePayload';
import { saveUserProfileToSupabase, fetchUsersFromSupabase } from '../lib/maritimeSupabaseService';
import { PRAZOS_PADRAO } from '../lib/maritime-utils';

export class StorageService {
  // ---------------------------------------------------------------------------
  // 1. INICIALIZAÇÃO & SESSÃO LOCAL
  // ---------------------------------------------------------------------------

  static init(): { currentUser: User | null } {
    try {
      const userRaw = localStorage.getItem('navcert_current_user');
      return { currentUser: userRaw ? JSON.parse(userRaw) : null };
    } catch {
      return { currentUser: null };
    }
  }

  static saveCurrentUser(user: User): void {
    localStorage.setItem('navcert_current_user', JSON.stringify(user));
  }

  static logout(): void {
    localStorage.removeItem('navcert_current_user');
    supabase.auth.signOut();
  }

  static saveConfig(config: PrazosConfig): void {
    localStorage.setItem('navcert_config', JSON.stringify(config));
  }

  static resetToDefaults(): { vessels: Vessel[]; certificates: Certificate[]; config: PrazosConfig } {
    return { vessels: [], certificates: [], config: PRAZOS_PADRAO };
  }

  // ---------------------------------------------------------------------------
  // 2. GESTÃO DE UTILIZADORES / PERFIS
  // ---------------------------------------------------------------------------

  static async updateUser(user: User): Promise<boolean> {
    return await saveUserProfileToSupabase(user);
  }

  static async updateProfileData(data: { nome: string; email: string; cargo: string }): Promise<boolean> {
    const payloadSeguro = sanitizarPayloadPerfil({
      nome: data.nome,
      email: data.email,
      cargo: data.cargo,
      updated_at: new Date().toISOString()
    });

    const { error } = await supabase
      .from('profiles')
      .update(payloadSeguro)
      .eq('email', data.email);

    if (error) throw error;
    return true;
  }

  static async getUsers(): Promise<User[]> {
    return await fetchUsersFromSupabase();
  }

  static async loginUser(email: string, senha: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const emailFormatado = email.trim().toLowerCase();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailFormatado)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        return { success: false, error: 'Utilizador não cadastrado na plataforma.' };
      }

      if (profile.is_blocked || profile.status === 'bloqueado') {
        return { success: false, error: 'Conta bloqueada ou suspensa pela administração.' };
      }

      if (profile.senha_hash && profile.senha_hash !== senha) {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      await supabase
        .from('profiles')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', profile.id);

      return { success: true, user: profile as User };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao realizar login.' };
    }
  }

  static async registerUser(userData: {
    nome: string;
    email: string;
    senha: string;
    cargo?: string;
    role?: string;
    termosLgpd: boolean;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const emailFormatado = userData.email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFormatado,
        password: userData.senha,
        options: { data: { nome: userData.nome } }
      });

      if (authError) throw authError;

      const newProfile: Record<string, any> = {
        id: authData.user?.id || `usr_${Date.now()}`,
        nome: userData.nome,
        email: emailFormatado,
        cargo: userData.cargo || '',
        role: userData.role || 'auditor',
        senha_hash: userData.senha,
        senha_alterada_em: new Date().toISOString(),
        historico_senhas: [userData.senha],
        status: 'pendente',
        email_confirmado: false,
        termos_aceitos: true,
        termos_lgpd_aceitos: userData.termosLgpd,
        data_aceite_lgpd: new Date().toISOString()
      };

      const payloadSeguro = sanitizarPayloadPerfil(newProfile);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(payloadSeguro, { onConflict: 'email' });

      if (profileError) throw profileError;

      return { success: true, user: payloadSeguro as User };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao criar conta.' };
    }
  }

  // ---------------------------------------------------------------------------
  // 3. OPERAÇÕES DE EMBARCAÇÕES & CERTIFICADOS (API SUPABASE)
  // ---------------------------------------------------------------------------

  static async carregarEmbarcacoesAPI(): Promise<any[]> {
    const { data: vessels, error: vErr } = await supabase.from('vessels').select('*');
    if (vErr) return [];

    const { data: certs } = await supabase.from('certificates').select('*');

    return (vessels || []).map((v: any) => ({
      ...v,
      certificados: (certs || []).filter((c: any) => String(c.vessel_id) === String(v.id))
    }));
  }

  static async salvarEmbarcacaoAPI(vessel: Vessel): Promise<boolean> {
    const { error } = await supabase.from('vessels').upsert(vessel);
    if (error) throw error;
    return true;
  }

  static async atualizarEmbarcacaoAPI(id: string, vessel: Partial<Vessel>): Promise<boolean> {
    const { error } = await supabase.from('vessels').update(vessel).eq('id', id);
    if (error) throw error;
    return true;
  }

  static async deletarEmbarcacaoAPI(id: string): Promise<boolean> {
    const { error } = await supabase.from('vessels').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  static async salvarCertificadoAPI(cert: Partial<Certificate>): Promise<boolean> {
    const { error } = await supabase.from('certificates').upsert(cert);
    if (error) throw error;
    return true;
  }

  static async atualizarCertificadoAPI(id: string, cert: Partial<Certificate>): Promise<boolean> {
    const { error } = await supabase.from('certificates').update(cert).eq('id', id);
    if (error) throw error;
    return true;
  }

  static async deletarCertificadoAPI(id: string): Promise<boolean> {
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
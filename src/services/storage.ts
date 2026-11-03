import { supabase } from '../lib/supabaseClient';
import { User, Vessel, Certificate, PrazosConfig } from '../types/maritime';
import { sanitizarPayloadPerfil } from '../utils/sanitizePayload';
import { saveUserProfileToSupabase, fetchUsersFromSupabase } from '../lib/maritimeSupabaseService';

export class StorageService {
  // ---------------------------------------------------------------------------
  // 1. GESTÃO E ATUALIZAÇÃO DE UTILIZADORES / PERFIS
  // ---------------------------------------------------------------------------

  /**
   * Atualiza o perfil do utilizador no Supabase garantindo a sanitização
   * e a atualização por e-mail (HTTP PATCH) sem disparar 409 Conflict.
   */
  static async updateUser(user: User): Promise<boolean> {
    try {
      return await saveUserProfileToSupabase(user);
    } catch (error) {
      console.error('Erro ao atualizar utilizador via StorageService:', error);
      throw error;
    }
  }

  /**
   * Atualização direta de campos básicos do perfil (Nome, E-mail, Cargo).
   */
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

    if (error) {
      console.error('Erro ao atualizar dados do perfil via StorageService:', error);
      throw error;
    }
    return true;
  }

  /**
   * Busca a lista de utilizadores registados na tabela 'profiles'.
   */
  static async getUsers(): Promise<User[]> {
    return await fetchUsersFromSupabase();
  }

  // ---------------------------------------------------------------------------
  // 2. AUTENTICAÇÃO E REGISTO DE UTILIZADORES
  // ---------------------------------------------------------------------------

  /**
   * Validação manual de credenciais contra a tabela 'profiles'.
   */
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
        return {
          success: false,
          error: 'Utilizador não cadastrado na plataforma. Solicite o seu registo.'
        };
      }

      if (profile.is_blocked || profile.status === 'bloqueado') {
        return {
          success: false,
          error: 'Conta bloqueada ou suspensa pela administração.'
        };
      }

      if (profile.senha_hash && profile.senha_hash !== senha) {
        return {
          success: false,
          error: 'E-mail ou senha incorretos.'
        };
      }

      // Atualizar o timestamp do último login
      await supabase
        .from('profiles')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', profile.id);

      return { success: true, user: profile as User };
    } catch (err: any) {
      console.error('Erro no login (StorageService):', err);
      return { success: false, error: err.message || 'Erro inesperado ao realizar login.' };
    }
  }

  /**
   * Registo de novo utilizador com perfil inicial de auditor.
   */
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

      // Registo no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFormatado,
        password: userData.senha,
        options: {
          data: { nome: userData.nome }
        }
      });

      if (authError) throw authError;

      const newProfile: Partial<User> = {
        id: authData.user?.id || `usr_${Date.now()}`,
        nome: userData.nome,
        email: emailFormatado,
        cargo: userData.cargo || '',
        role: (userData.role as any) || 'auditor',
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
      console.error('Erro no registo (StorageService):', err);
      return { success: false, error: err.message || 'Erro ao criar conta.' };
    }
  }

  // ---------------------------------------------------------------------------
  // 3. OPERAÇÕES DE EMBARCAÇÕES E CERTIFICADOS
  // ---------------------------------------------------------------------------

  static async getVessels(): Promise<Vessel[]> {
    const { data, error } = await supabase.from('vessels').select('*');
    if (error) {
      console.error('Erro ao buscar embarcações:', error);
      return [];
    }
    return data || [];
  }

  static async saveVessel(vessel: Vessel): Promise<boolean> {
    const { error } = await supabase.from('vessels').upsert(vessel);
    if (error) {
      console.error('Erro ao salvar embarcação:', error);
      throw error;
    }
    return true;
  }

  static async deleteVessel(id: string): Promise<boolean> {
    const { error } = await supabase.from('vessels').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar embarcação:', error);
      throw error;
    }
    return true;
  }

  static async getCertificates(): Promise<Certificate[]> {
    const { data, error } = await supabase.from('certificates').select('*');
    if (error) {
      console.error('Erro ao buscar certificados:', error);
      return [];
    }
    return data || [];
  }

  static async saveCertificate(cert: Certificate): Promise<boolean> {
    const { error } = await supabase.from('certificates').upsert(cert);
    if (error) {
      console.error('Erro ao salvar certificado:', error);
      throw error;
    }
    return true;
  }

  static async deleteCertificate(id: string): Promise<boolean> {
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar certificado:', error);
      throw error;
    }
    return true;
  }
}
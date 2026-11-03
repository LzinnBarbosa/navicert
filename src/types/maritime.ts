// ---------------------------------------------------------------------------
// 1. TIPOS DE PERMISSÃO E UTILIZADOR
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'operador' | 'auditor';

export interface UserPermissions {
  can_create_vessel?: boolean;
  can_edit_vessel?: boolean;
  can_delete_vessel?: boolean;
  can_create_cert?: boolean;
  can_edit_cert?: boolean;
  can_delete_cert?: boolean;
  can_export_reports?: boolean;
  can_access_ai?: boolean;
  can_manage_users?: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  role: UserRole;
  is_blocked?: boolean;
  status?: string;
  email_confirmado?: boolean;
  permissions?: UserPermissions | Record<string, boolean>;

  // Autenticação & Regras de Senha
  senha_hash?: string;
  senha_alterada_em?: string;
  historico_senhas?: string[];
  ultimo_login?: string;

  // Metadados & LGPD
  telefone?: string;
  avatar_url?: string;
  modulo_acesso?: string;
  data_aceite_lgpd?: string;
  termos_aceitos?: boolean;
  termos_lgpd_aceitos?: boolean;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// 2. EMBARCAÇÕES E CERTIFICADOS
// ---------------------------------------------------------------------------

export interface Vessel {
  id: string;
  nome: string;
  tipo: string;
  imo?: string;
  inscricao?: string;
  bandeira?: string;
  ano_construcao?: number;
  created_at?: string;
}

export interface Certificate {
  id: string;
  vessel_id: string;
  tipo: string;
  numero?: string;
  data_emissao?: string;
  data_validade: string;
  orgao_emissor?: string;
  observacoes?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// 3. CONFIGURAÇÕES DA EMPRESA
// ---------------------------------------------------------------------------

export interface PrazosConfig {
  empresa_nome: string;
  alerta_amarelo_dias?: number;
  alerta_vermelho_dias?: number;
  [key: string]: any;
}
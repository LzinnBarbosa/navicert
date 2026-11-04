// ---------------------------------------------------------------------------
// 1. TIPOS DE NAVEGAÇÃO E ABAS
// ---------------------------------------------------------------------------

export type ActiveTab = 
  | 'painel' 
  | 'embarcacoes' 
  | 'certificados' 
  | 'alertas' 
  | 'relatorios' 
  | 'consultor' 
  | 'usuarios' 
  | 'configuracoes';

// ---------------------------------------------------------------------------
// 2. TIPOS DE PERMISSÃO E UTILIZADOR
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
// 3. EMBARCAÇÕES E CERTIFICADOS
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
// 4. CONFIGURAÇÕES DA EMPRESA
// ---------------------------------------------------------------------------

export interface PrazosConfig {
  empresa_nome: string;
  alerta_amarelo_dias?: number;
  alerta_vermelho_dias?: number;
  [key: string]: any;
}
// --- PERMISSÕES PADRÃO POR PERFIL ---
export const DEFAULT_ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    can_create_vessel: true,
    can_edit_vessel: true,
    can_delete_vessel: true,
    can_create_cert: true,
    can_edit_cert: true,
    can_delete_cert: true,
    can_access_ai: true,
    can_export_reports: true,
    can_manage_settings: true,
    can_manage_users: true,
  },
  operador: {
    can_create_vessel: true,
    can_edit_vessel: true,
    can_delete_vessel: false,
    can_create_cert: true,
    can_edit_cert: true,
    can_delete_cert: false,
    can_access_ai: true,
    can_export_reports: true,
    can_manage_settings: false,
    can_manage_users: false,
  },
  auditor: {
    can_create_vessel: false,
    can_edit_vessel: false,
    can_delete_vessel: false,
    can_create_cert: false,
    can_edit_cert: false,
    can_delete_cert: false,
    can_access_ai: true,
    can_export_reports: true,
    can_manage_settings: false,
    can_manage_users: false,
  },
};

// --- LISTA DE TIPOS DE EMBARCAÇÃO ---
export const TIPOS_EMBARCACAO = [
  "Empurrador",
  "Balsa",
  "Rebocador",
  "Lancha",
  "Carga Geral",
  "Passageiros",
  "Ferry-boat",
  "Balsa Tanque / Combustível",
  "Flutuante / Dique",
  "Barcaça",
  "Draga",
  "Pesqueiro",
  "Apoio Marítimo / Off-shore",
  "Outro"
] as const;
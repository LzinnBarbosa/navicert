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
  can_manage_settings?: boolean;
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
// 3. EMBARCAÇÕES, CERTIFICADOS E TIPOS ASSOCIADOS
// ---------------------------------------------------------------------------

export type CertTipo = string;
export type CertStatus = 'vencido' | 'critico' | 'atencao' | 'valido';
export type SituacaoEmbarcacao = 'Ativa' | 'Em Manutenção' | 'Em Doca' | 'Parada' | string;
export type TipoVistoria = 'Inicial' | 'Anual' | 'Intermediária' | 'Periódica' | 'Renovação' | string;

export interface Vessel {
  id: string;
  nome: string;
  tipo: string;
  imo?: string;
  inscricao?: string;
  bandeira?: string;
  ano_construcao?: number | string;
  proprietario?: string;
  armador?: string;
  construtor?: string;
  situacao?: SituacaoEmbarcacao;
  trecho?: string;
  arqueacao_bruta?: string | number;
  porto_inscricao?: string;
  documento_propriedade?: string;
  indicativo_chamada?: string;
  created_at?: string;
}

export interface Certificate {
  id: string;
  vessel_id: string;
  embarcacao_id?: string;
  tipo: string;
  numero?: string;
  data_emissao?: string;
  data_validade: string;
  vencimento?: string;
  janela_inicio?: string;
  orgao_emissor?: string;
  observacoes?: string;
  tipo_vistoria?: TipoVistoria;
  categoria?: string;
  url_documento?: string;
  arquivo_anexo_url?: string;
  arquivo_path?: string;
  path_documento?: string;
  responsavel_tecnico?: string;
  tipo_teste?: string;
  numero_art?: string;
  tracao_estatica_ton?: string | number;
  pressao_teste?: string | number;
  lacre_tag?: string;
  local_compensacao?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// 4. CONFIGURAÇÕES DA EMPRESA E RELATÓRIOS
// ---------------------------------------------------------------------------

export interface PrazosConfig {
  empresa_nome: string;
  responsavel_tecnico?: string;
  registro_crea?: string;
  email_notificacao?: string;
  dias_critico?: number;
  dias_atencao?: number;
  alerta_amarelo_dias?: number;
  alerta_vermelho_dias?: number;
  prazo_critico_dias?: number;
  prazo_atencao_dias?: number;
  [key: string]: any;
}

export interface FiltrosRelatorio {
  tipoRelatorio: 'CONSOLIDADO' | 'CADASTRO' | 'CERTIFICADOS' | 'TERMO_TECNICO' | 'INDIVIDUAL' | string;
  armador: string;
  tipoEmbarcacao: string;
  statusValidade?: string;
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
  "Balsa / Carga Geral",
  "Rebocador",
  "Petroleira",
  "Lancha",
  "Balsa Tanque / Combustível",
  "Dique Flutuante",
  "Módulo Flutuante",
  "Barcaça",
] as const;
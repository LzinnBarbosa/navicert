export const TIPOS_EMBARCACAO = [
  "EMPURRADOR FLUVIAL",
  "BALSA",
  "BALSA TANQUE (PETROLEIRA)",
  "REBOCADOR",
  "MÓDULOS RAMPAS",
] as const;

export type TipoEmbarcacao = typeof TIPOS_EMBARCACAO[number];

// ============================================================================
// CATEGORIAS E TIPOS DE DOCUMENTOS / TESTES
// ============================================================================

export type CategoriaDocumento = 
  | 'CERTIFICADO' 
  | 'TESTE_EQUIPAMENTO' 
  | 'TESTE_OPERACIONAL';

export type CertTipo = 
  | "CSN" 
  | "BL" 
  | "CASCO" 
  | "MAQUINAS"
  | "DECLARACAO_CONFORMIDADE"
  | "COMPENSACAO_AGULHA"
  | "TRACAO_ESTATICA"
  | "OXIMETRO"
  | "TRENA_PROFUNDIDADE"
  | "EXPLOSIMETRO"
  | "TERMOMETRO"
  | "DENSIMETRO"
  | "CARGA_DESCARGA"
  | "ESTANQUEIDADE"
  | "MANGOTES"
  | "VALVULAS"
  | string;

export type CertStatus = "vencido" | "critico" | "atencao" | "valido";

export type TipoVistoria = 
  | "Inicial" 
  | "Anual" 
  | "1ª Vistoria Anual"
  | "2ª Vistoria Anual"
  | "3ª Vistoria Anual"
  | "4ª Vistoria Anual"
  | "1ª Inspeção Periódica"
  | "2ª Inspeção Periódica"
  | "3ª Inspeção Periódica"
  | "4ª Inspeção Periódica"
  | "Manutenção de Classe - MC1"
  | "Manutenção de Classe - MC2"
  | "Manutenção de Classe - MC3"
  | "Manutenção de Classe - MC4"
  | "Renovação de Classe / Docagem"
  | "Intermediária" 
  | "Periódica" 
  | "Renovação" 
  | "Isento" 
  | string;

export type TipoTesteMetodo = "Hidrostático" | "Pneumático" | "Inspeção Visual" | "Isento" | string;

export type SituacaoEmbarcacao = "Ativa" | "Em Manutenção" | "Em Doca" | "Parada";

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

export interface Vessel {
  id: string;
  nome: string;
  inscricao: string;
  tipo: TipoEmbarcacao | string;
  trecho?: string;
  situacao: SituacaoEmbarcacao;
  indicativo_chamada?: string;
  documento_propriedade?: string;
  arqueacao_bruta?: number;
  proprietario?: string;
  construtor?: string;
  ano_construcao?: number;
  porto_inscricao?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  vessel_id: string;
  vessel_name?: string;
  categoria?: CategoriaDocumento;
  tipo: CertTipo;
  tipo_teste?: TipoTesteMetodo;
  numero: string;
  data_emissao?: string;
  data_validade: string;
  janela_inicio?: string;
  orgao_emissor: string;
  responsavel_tecnico?: string;
  tipo_vistoria?: TipoVistoria;
  numero_art?: string;
  
  // Campos para Calibração de Equipamentos (Instrutherm, Incoterm, Exata, Starrett)
  fabricante_equipamento?: string;
  modelo_equipamento?: string;
  numero_serie_equipamento?: string;
  faixa_medicao?: string;
  laboratorio_calibracao?: string;

  // Campos para Tração Estática (Bollard Pull)
  tracao_estatica_ton?: string;

  // Campos para Agulha Magnética
  marca_agulha?: string;
  serie_agulha?: string;
  local_compensacao?: string;

  // Campos para Mangotes e Válvulas PV
  pressao_trabalho?: string;
  pressao_teste?: string;
  lacre_tag?: string;
  tanque_vinculado?: string;
  continuidade_eletrica?: string;

  arquivo_anexo_url?: string;
  observacoes?: string;
  created_at?: string;
}

export interface PrazosConfig {
  dias_critico: number;
  dias_atencao: number;
  empresa_nome: string;
  responsavel_tecnico: string;
  registro_crea: string;
  email_notificacao: string;
}

export interface UserPermissions {
  can_create_vessel: boolean;
  can_edit_vessel: boolean;
  can_delete_vessel: boolean;
  can_create_cert: boolean;
  can_edit_cert: boolean;
  can_delete_cert: boolean;
  can_access_ai: boolean;
  can_export_reports: boolean;
  can_manage_settings: boolean;
  can_manage_users: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<"admin" | "operador" | "auditor", UserPermissions> = {
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

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  role: "admin" | "operador" | "auditor";
  permissions: UserPermissions;
  is_blocked?: boolean;
  termos_lgpd_aceitos: boolean;
  data_aceite_lgpd?: string;
  created_at: string;
  ultimo_login?: string;
  senha_hash?: string;
}

export type ActiveTab = 
  | "painel"
  | "embarcacoes"
  | "certificados"
  | "alertas"
  | "relatorios"
  | "consultor"
  | "usuarios"
  | "configuracoes";

export type TipoRelatorio = 'CADASTRO' | 'CERTIFICADOS' | 'TERMO_TECNICO' | 'CONSOLIDADO';

export interface FiltrosRelatorio {
  tipoRelatorio: TipoRelatorio;
  armador: string;
  tipoEmbarcacao: string; 
  statusValidade: string;
  categoriaDocumento?: string;
}
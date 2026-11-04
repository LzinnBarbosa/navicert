import { CertTipo, CertStatus, PrazosConfig, Vessel, Certificate, TipoVistoria, User, DEFAULT_ROLE_PERMISSIONS } from "../types/maritime";

export const CERT_TIPOS: { value: CertTipo; label: string; sigla: string; descricao: string }[] = [
  { 
    value: "CSN", 
    sigla: "CSN", 
    label: "CSN – Certificado de Segurança da Navegação", 
    descricao: "Atesta as condições de navegabilidade, estabilidade, salvatagem e combate a incêndio (NORMAM 202)." 
  },
  { 
    value: "BL", 
    sigla: "Borda Livre", 
    label: "BL – Certificado Nacional de Borda Livre", 
    descricao: "Determina a reserva de flutuabilidade e fixa a marcação oficial no costado." 
  },
  { 
    value: "CASCO", 
    sigla: "Casco", 
    label: "Termo de Vistoria de Casco (Docagem / Fundo)", 
    descricao: "Inspeção estrutural periódica a seco em dique, carreira ou varadouro." 
  },
  { 
    value: "MAQUINAS", 
    sigla: "Máquinas", 
    label: "Termo de Vistoria de Máquinas & Propulsão", 
    descricao: "Vistoria dos motores principais, geradores, eixos propulsores, leme e esgoto." 
  },
];

export const tipoCurto: Record<CertTipo, string> = {
  CSN: "CSN",
  BL: "Borda Livre",
  CASCO: "Casco",
  MAQUINAS: "Máquinas",
};

export const TIPOS_VISTORIA: TipoVistoria[] = [
  "Inicial",
  "Anual",
  "Intermediária",
  "Periódica",
  "Renovação"
];

export const SITUACOES_EMBARCACAO = [
  "Ativa",
  "Em Manutenção",
  "Em Doca",
  "Parada"
] as const;

export const PRAZOS_PADRAO: PrazosConfig = {
  empresa_nome: "Navegação e Logística Marítima Amazônia S/A",
  responsavel_tecnico: "Eng. Naval / Tecnólogo Resp.",
  dias_critico: 30,
  dias_atencao: 90,
  alerta_amarelo_dias: 90,
  alerta_vermelho_dias: 30,
};

/**
 * Sanitiza a entrada do usuário removendo caracteres de injeção XSS
 */
export function sanitizeInput(str: string): string {
  if (!str) return "";
  return str.replace(/[<>]/g, "").trim();
}

/**
 * Calcula a quantidade de dias restantes até o vencimento da data estipulada.
 */
export function diasParaVencer(dataValidade: string): number {
  if (!dataValidade) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const partes = dataValidade.split("-");
  if (partes.length !== 3) return 0;

  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const validade = new Date(ano, mes, dia);
  validade.setHours(0, 0, 0, 0);

  const diffTempo = validade.getTime() - hoje.getTime();
  return Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o status do certificado com base nos prazos de alerta configurados.
 */
export function statusCertificado(dataValidade: string, prazos: PrazosConfig = PRAZOS_PADRAO): CertStatus {
  const dias = diasParaVencer(dataValidade);
  const limiteCritico = prazos?.dias_critico ?? prazos?.alerta_vermelho_dias ?? 30;
  const limiteAtencao = prazos?.dias_atencao ?? prazos?.alerta_amarelo_dias ?? 90;

  if (dias < 0) return "vencido";
  if (dias <= limiteCritico) return "critico";
  if (dias <= limiteAtencao) return "atencao";
  return "valido";
}

/**
 * Formata data ISO (AAAA-MM-DD) para formato legível brasileiro (DD/MM/AAAA).
 */
export function formatarDataBR(dataIso?: string): string {
  if (!dataIso) return "—";
  const partes = dataIso.split("T")[0].split("-");
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Compara dois nomes de embarcação ordenando adequadamente números romanos e numerações.
 */
export function compararNomesEmbarcacoes(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

/**
 * Retorna as permissões efetivas do usuário baseado no seu perfil ou permissões customizadas.
 */
export function obterPermissoesUsuario(user: User | null) {
  if (!user) {
    return DEFAULT_ROLE_PERMISSIONS.auditor;
  }

  const basePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.auditor;

  if (user.permissions && typeof user.permissions === "object") {
    return {
      ...basePermissions,
      ...user.permissions,
    };
  }

  return basePermissions;
}
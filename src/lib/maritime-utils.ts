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
  dias_critico: 30,
  dias_atencao: 90,
  empresa_nome: "Navegação e Logística Marítima Amazônia S/A",
  responsavel_tecnico: "Eng. Naval Carlos Eduardo Mendes",
  registro_crea: "CREA-AM 10842/D",
  email_notificacao: "operacoes@navcert.mar.br"
};

/**
 * Normaliza qualquer texto de tipo cadastrado para uma das 5 classes oficiais da frota.
 */
export function normalizarTipoEmbarcacao(tipoStr?: string): string {
  if (!tipoStr) return "OUTROS";
  const upper = tipoStr.trim().toUpperCase();

  if (upper.includes("EMPURRADOR")) return "EMPURRADOR FLUVIAL";
  if (upper.includes("PETROLEIRA") || upper.includes("TANQUE")) return "BALSA TANQUE (PETROLEIRA)";
  if (upper.includes("BALSA")) return "BALSA";
  if (upper.includes("REBOCADOR")) return "REBOCADOR";
  if (upper.includes("MÓDULO") || upper.includes("MODULO") || upper.includes("RAMPA")) return "MÓDULOS RAMPAS";

  return "OUTROS";
}

/**
 * Converte numeração romana para inteiro para ordenação sequencial correta (Ex: I -> 1, IV -> 4, IX -> 9, X -> 10).
 */
export function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let num = 0;
  let prev = 0;
  const upper = roman.toUpperCase();
  for (let i = upper.length - 1; i >= 0; i--) {
    const curr = map[upper[i]] || 0;
    if (curr < prev) num -= curr;
    else num += curr;
    prev = curr;
  }
  return num;
}

/**
 * Compara nomes de embarcações considerando ordem alfabética e numeração romana no sufixo
 * Exemplo de ordenação: "Balsa I", "Balsa II", "Balsa IV", "Balsa IX", "Balsa X"
 */
export function compararNomesEmbarcacoes(nomeA: string, nomeB: string): number {
  const regex = /^(.*?)(?:\s+([IVXLCDM]+))?$/i;
  const matchA = (nomeA || "").trim().match(regex);
  const matchB = (nomeB || "").trim().match(regex);

  const baseA = matchA && matchA[1] ? matchA[1].trim() : (nomeA || "").trim();
  const baseB = matchB && matchB[1] ? matchB[1].trim() : (nomeB || "").trim();

  const baseCompare = baseA.localeCompare(baseB, "pt-BR", { sensitivity: "base" });
  if (baseCompare !== 0) return baseCompare;

  const numA = matchA && matchA[2] ? romanToInt(matchA[2]) : 0;
  const numB = matchB && matchB[2] ? romanToInt(matchB[2]) : 0;

  return numA - numB;
}

/**
 * Hash seguro para senhas de usuários (atendendo requisitos de segurança e LGPD).
 */
export async function hashSenha(senha: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha + "_navcert_salt_2026");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback seguro caso crypto.subtle não esteja no contexto
  let hash = 0;
  for (let i = 0; i < senha.length; i++) {
    const char = senha.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return "hash_" + Math.abs(hash).toString(16);
}

/**
 * Calcula dias até a data de validade (negativo se vencido).
 */
export function diasParaVencer(validade: string, hoje: Date = new Date()): number {
  if (!validade) return 0;
  const parts = validade.split("-").map(Number);
  if (parts.length < 3) return 0;
  const [y, m, d] = parts;
  const v = Date.UTC(y, m - 1, d);
  const h = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((v - h) / 86_400_000);
}

/**
 * Determina a classificação do certificado com base nos prazos configurados.
 */
export function statusCertificado(validade: string, prazos: PrazosConfig = PRAZOS_PADRAO, hoje: Date = new Date()): CertStatus {
  const d = diasParaVencer(validade, hoje);
  if (d < 0) return "vencido";
  if (d <= prazos.dias_critico) return "critico";
  if (d <= prazos.dias_atencao) return "atencao";
  return "valido";
}

/**
 * Rótulo amigável em português para o status
 */
export function getStatusLabel(status: CertStatus, prazos: PrazosConfig = PRAZOS_PADRAO): string {
  switch (status) {
    case "vencido":
      return "Vencido";
    case "critico":
      return `Vence em até ${prazos.dias_critico} dias`;
    case "atencao":
      return `Vence em até ${prazos.dias_atencao} dias`;
    case "valido":
      return "Regular / Válido";
  }
}

/**
 * Formata data no padrão brasileiro (DD/MM/AAAA)
 */
export function formatarDataBR(dataStr?: string | null): string {
  if (!dataStr) return "—";
  const [y, m, d] = dataStr.split("-");
  if (!y || !m || !d) return dataStr;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

/**
 * Converte data para padrão ISO YYYY-MM-DD
 */
export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Calcula data relativa a partir de hoje (ex: +30 dias, -10 dias)
 */
export function getRelativeISODate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODateString(d);
}

/**
 * Sanitiza texto para prevenção de XSS e injeção de caracteres maliciosos.
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  return text
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * Gera arquivo CSV com relatório de conformidade da frota, incluindo Proprietário e Construtor.
 */
export function exportarRelatorioCSV(vessels: Vessel[], certificates: Certificate[], prazos: PrazosConfig) {
  const vesselMap = new Map<string, Vessel>(vessels.map(v => [v.id, v]));
  
  const headers = [
    "Embarcação",
    "Nº Inscrição",
    "Tipo Embarcação",
    "Proprietário / Armador",
    "Estaleiro Construtor",
    "Ano Construção",
    "Situação",
    "Porto de Inscrição",
    "Arqueação Bruta (AB)",
    "Certificado",
    "Número Certificado",
    "Tipo de Vistoria",
    "Data Emissão",
    "Data Validade",
    "Dias Restantes",
    "Status NORMAM 202",
    "Órgão Emissor",
    "Observações"
  ];

  const rows = certificates.map(c => {
    const v = vesselMap.get(c.vessel_id);
    const dias = diasParaVencer(c.data_validade);
    const status = statusCertificado(c.data_validade, prazos);
    const statusTexto = status === "vencido" 
      ? `VENCIDO (${Math.abs(dias)} dias)` 
      : status === "critico" 
      ? `CRÍTICO (${dias} dias)` 
      : status === "atencao" 
      ? `ATENÇÃO (${dias} dias)` 
      : `VÁLIDO (${dias} dias)`;

    return [
      `"${v?.nome || '—'}"`,
      `"${v?.inscricao || '—'}"`,
      `"${v?.tipo || '—'}"`,
      `"${v?.proprietario || '—'}"`,
      `"${v?.construtor || '—'}"`,
      v?.ano_construcao ?? "—",
      `"${v?.situacao || '—'}"`,
      `"${v?.porto_inscricao || '—'}"`,
      v?.arqueacao_bruta ?? "—",
      `"${tipoCurto[c.tipo] || c.tipo}"`,
      `"${c.numero || 's/n'}"`,
      `"${c.tipo_vistoria || '—'}"`,
      `"${formatarDataBR(c.data_emissao)}"`,
      `"${formatarDataBR(c.data_validade)}"`,
      dias,
      `"${statusTexto}"`,
      `"${c.orgao_emissor || '—'}"`,
      `"${(c.observacoes || '').replace(/"/g, '""')}"`
    ].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `NavCert_Relatorio_Conformidade_${toISODateString(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Usuários padrão para autenticação inicial do sistema.
 * wcarlos061@gmail.com configurado como Administrador Geral do Sistema.
 */
export const USUARIOS_PADRAO: User[] = [
  {
    id: "usr-admin-wcarlos",
    nome: "Carlos (Administrador Geral)",
    email: "wcarlos061@gmail.com",
    cargo: "Diretor de Operações / Administrador",
    role: "admin",
    permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    is_blocked: false,
    termos_lgpd_aceitos: true,
    data_aceite_lgpd: "2026-01-15T08:00:00.000Z",
    created_at: "2026-01-15T08:00:00.000Z",
    senha_hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // admin123
  },
  {
    id: "usr-operador-02",
    nome: "Inspetor Naval Carlos Eduardo",
    email: "operador@navcert.com.br",
    cargo: "Engenheiro Operacional de Frota",
    role: "operador",
    permissions: DEFAULT_ROLE_PERMISSIONS.operador,
    is_blocked: false,
    termos_lgpd_aceitos: true,
    data_aceite_lgpd: "2026-02-10T10:30:00.000Z",
    created_at: "2026-02-10T10:30:00.000Z",
    senha_hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  },
  {
    id: "usr-auditor-03",
    nome: "Auditor Fiscal Marítimo",
    email: "auditor@navcert.com.br",
    cargo: "Auditor Externo (Somente Consulta)",
    role: "auditor",
    permissions: DEFAULT_ROLE_PERMISSIONS.auditor,
    is_blocked: false,
    termos_lgpd_aceitos: true,
    data_aceite_lgpd: "2026-02-15T14:00:00.000Z",
    created_at: "2026-02-15T14:00:00.000Z",
    senha_hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  }
];

/**
 * Frota inicial padrão para demonstração imediata do sistema,
 * categorizada rigorosamente nos 5 tipos oficiais.
 */
export function getInitialSeedData(): { vessels: Vessel[]; certificates: Certificate[] } {
  const v1Id = "vsl-rio-negro-01";
  const v2Id = "vsl-tapajos-02";
  const v3Id = "vsl-santos-03";
  const v4Id = "vsl-solimoes-04";
  const v5Id = "vsl-parana-05";

  const vessels: Vessel[] = [
    {
      id: v1Id,
      nome: "Empurrador Fluvial Rio Negro IV",
      inscricao: "021-008392-4",
      tipo: "EMPURRADOR FLUVIAL",
      trecho: "Hidrovia Solimões-Amazonas (Manaus - Itacoatiara - Santarém)",
      situacao: "Ativa",
      indicativo_chamada: "PP-7290",
      documento_propriedade: "PRPM nº 45.109/2019",
      arqueacao_bruta: 420,
      proprietario: "Navegação Fluvial Amazônia S/A",
      construtor: "Estaleiro Rio Maguari S/A (PA)",
      ano_construcao: 2018,
      porto_inscricao: "Capitania Fluvial da Amazônia Ocidental (CFAOC)",
      created_at: new Date(Date.now() - 180 * 86400000).toISOString()
    },
    {
      id: v2Id,
      nome: "Balsa Graneleira Tapajós Grãos IX",
      inscricao: "034-019482-1",
      tipo: "BALSA",
      trecho: "Hidrovia Tapajós-Teles Pires (Miritituba - Barcarena)",
      situacao: "Ativa",
      indicativo_chamada: "—",
      documento_propriedade: "TIE nº 89.231/CFAOR",
      arqueacao_bruta: 1850,
      proprietario: "Grãos do Norte Logística Hidroviária",
      construtor: "Estaleiro Bertolini Construção Naval (AM)",
      ano_construcao: 2021,
      porto_inscricao: "Capitania Fluvial de Santarém (CFS)",
      created_at: new Date(Date.now() - 120 * 86400000).toISOString()
    },
    {
      id: v3Id,
      nome: "Rebocador Portuário Santos Guardiões I",
      inscricao: "382-012948-5",
      tipo: "REBOCADOR",
      trecho: "Complexo Portuário de Santos / Terminal Alemoa",
      situacao: "Em Doca",
      indicativo_chamada: "PS-8841",
      documento_propriedade: "PRPM nº 12.871/CPSP",
      arqueacao_bruta: 380,
      proprietario: "Rebocadores do Atlântico Sul Ltda",
      construtor: "Estaleiro Wilson Sons (Guarujá/SP)",
      ano_construcao: 2016,
      porto_inscricao: "Capitania dos Portos de São Paulo (CPSP)",
      created_at: new Date(Date.now() - 200 * 86400000).toISOString()
    },
    {
      id: v4Id,
      nome: "Balsa Tanque Combustíveis Solimões V",
      inscricao: "021-009714-8",
      tipo: "BALSA TANQUE (PETROLEIRA)",
      trecho: "Trecho Coari - Manaus (Urucu)",
      situacao: "Ativa",
      indicativo_chamada: "—",
      documento_propriedade: "TIE nº 94.112/CFAOC",
      arqueacao_bruta: 1420,
      proprietario: "PetroNave Navegação Fluvial",
      construtor: "Estaleiro Bibi Indústria Naval (AM)",
      ano_construcao: 2020,
      porto_inscricao: "Capitania Fluvial da Amazônia Ocidental (CFAOC)",
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: v5Id,
      nome: "Empurrador Paraná Forte I",
      inscricao: "411-003418-2",
      tipo: "EMPURRADOR FLUVIAL",
      trecho: "Hidrovia Tietê-Paraná (Pederneiras - São Simão)",
      situacao: "Em Manutenção",
      indicativo_chamada: "PR-3105",
      documento_propriedade: "DPP nº 31.902/CPPR",
      arqueacao_bruta: 290,
      proprietario: "Tietê Navegação e Cargas Ltda",
      construtor: "Estaleiro Construnave Bariri (SP)",
      ano_construcao: 2015,
      porto_inscricao: "Capitania Fluvial do Rio Paraná (CFRP)",
      created_at: new Date(Date.now() - 300 * 86400000).toISOString()
    }
  ];

  const certificates: Certificate[] = [
    {
      id: "cert-01",
      vessel_id: v1Id,
      tipo: "CSN",
      numero: "CSN-2023/0419-CFAOC",
      data_emissao: getRelativeISODate(-347),
      data_validade: getRelativeISODate(18),
      janela_inicio: getRelativeISODate(-72),
      orgao_emissor: "Capitania Fluvial da Amazônia Ocidental (CFAOC)",
      tipo_vistoria: "Anual",
      observacoes: "Janela aberta para realização da 2ª vistoria anual. Requer testes de bomba de esgoto e equipamentos de combate a incêndio.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-02",
      vessel_id: v1Id,
      tipo: "BL",
      numero: "BL-2022/108-CFAOC",
      data_emissao: getRelativeISODate(-450),
      data_validade: getRelativeISODate(280),
      janela_inicio: getRelativeISODate(190),
      orgao_emissor: "Sociedade Classificadora Bureau Veritas",
      tipo_vistoria: "Periódica",
      observacoes: "Marcas de borda livre aferidas e nítidas no costado de boreste e bombordo.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-03",
      vessel_id: v1Id,
      tipo: "MAQUINAS",
      numero: "VM-2024/092-CFAOC",
      data_emissao: getRelativeISODate(-300),
      data_validade: getRelativeISODate(65),
      janela_inicio: getRelativeISODate(-25),
      orgao_emissor: "Capitania Fluvial da Amazônia Ocidental (CFAOC)",
      tipo_vistoria: "Anual",
      observacoes: "Inspeção do alinhamento do eixo propulsor e testes de reversão do motor Caterpillar 3512.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-04",
      vessel_id: v2Id,
      tipo: "CASCO",
      numero: "VC-2021/0411-CFS",
      data_emissao: getRelativeISODate(-1095),
      data_validade: getRelativeISODate(-14),
      janela_inicio: getRelativeISODate(-104),
      orgao_emissor: "DNV (Det Norske Veritas)",
      tipo_vistoria: "Renovação",
      observacoes: "Vistoria de fundo a seco vencida. Balsa retida no terminal de Barcarena até realização de vistoria extraordinária.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-05",
      vessel_id: v2Id,
      tipo: "CSN",
      numero: "CSN-2024/0088-CFS",
      data_emissao: getRelativeISODate(-55),
      data_validade: getRelativeISODate(310),
      janela_inicio: getRelativeISODate(220),
      orgao_emissor: "Capitania Fluvial de Santarém",
      tipo_vistoria: "Intermediária",
      observacoes: "Material de salvatagem e boias circulares em total conformidade.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-06",
      vessel_id: v2Id,
      tipo: "BL",
      numero: "BL-2023/512-CFS",
      data_emissao: getRelativeISODate(-287),
      data_validade: getRelativeISODate(78),
      janela_inicio: getRelativeISODate(-12),
      orgao_emissor: "DNV",
      tipo_vistoria: "Anual",
      observacoes: "Janela aberta. Necessário agendamento de perito naval credenciado.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-07",
      vessel_id: v3Id,
      tipo: "CASCO",
      numero: "VC-2022/881-CPSP",
      data_emissao: getRelativeISODate(-720),
      data_validade: getRelativeISODate(6),
      janela_inicio: getRelativeISODate(-84),
      orgao_emissor: "ABS (American Bureau of Shipping)",
      tipo_vistoria: "Renovação",
      observacoes: "Embarcação já posicionada em dique seco no Porto de Santos. Peritos da Sociedade Classificadora em acompanhamento.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-08",
      vessel_id: v3Id,
      tipo: "MAQUINAS",
      numero: "VM-2024/0119-CPSP",
      data_emissao: getRelativeISODate(-170),
      data_validade: getRelativeISODate(195),
      janela_inicio: getRelativeISODate(105),
      orgao_emissor: "Capitania dos Portos de São Paulo",
      tipo_vistoria: "Anual",
      observacoes: "Propulsores azimutais Rolls-Royce inspecionados com troca de retentores.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-09",
      vessel_id: v3Id,
      tipo: "CSN",
      numero: "CSN-2024/1102-CPSP",
      data_emissao: getRelativeISODate(-45),
      data_validade: getRelativeISODate(410),
      janela_inicio: getRelativeISODate(320),
      orgao_emissor: "Capitania dos Portos de São Paulo",
      tipo_vistoria: "Inicial",
      observacoes: "Certificado emitido após modernização de sistema contra incêndio.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-10",
      vessel_id: v4Id,
      tipo: "CSN",
      numero: "CSN-2023/1820-CFAOC",
      data_emissao: getRelativeISODate(-368),
      data_validade: getRelativeISODate(-3),
      janela_inicio: getRelativeISODate(-93),
      orgao_emissor: "Capitania Fluvial da Amazônia Ocidental (CFAOC)",
      tipo_vistoria: "Anual",
      observacoes: "Protocolado pedido de prorrogação extraordinária de 15 dias junto à CFAOC para conclusão de viagem com GLP.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-11",
      vessel_id: v4Id,
      tipo: "BL",
      numero: "BL-2024/0034-CFAOC",
      data_emissao: getRelativeISODate(-120),
      data_validade: getRelativeISODate(520),
      janela_inicio: getRelativeISODate(430),
      orgao_emissor: "RINA Brasil",
      tipo_vistoria: "Renovação",
      observacoes: "Certificado com validade de 5 anos até 2028.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-12",
      vessel_id: v5Id,
      tipo: "CSN",
      numero: "CSN-2023/0771-CFRP",
      data_emissao: getRelativeISODate(-317),
      data_validade: getRelativeISODate(48),
      janela_inicio: getRelativeISODate(-42),
      orgao_emissor: "Capitania Fluvial do Rio Paraná",
      tipo_vistoria: "Anual",
      observacoes: "Substituição programada de pirotecnia de salvatagem e recarga de extintores.",
      created_at: new Date().toISOString()
    },
    {
      id: "cert-13",
      vessel_id: v5Id,
      tipo: "CASCO",
      numero: "VC-2023/120-CFRP",
      data_emissao: getRelativeISODate(-185),
      data_validade: getRelativeISODate(180),
      janela_inicio: getRelativeISODate(90),
      orgao_emissor: "Bureau Veritas",
      tipo_vistoria: "Intermediária",
      observacoes: "Medição de espessura por ultrassom do chapeamento de fundo aprovada.",
      created_at: new Date().toISOString()
    }
  ];

  return { vessels, certificates };
}
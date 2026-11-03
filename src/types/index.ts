export interface Certificado {
  id?: string;
  tipo: 'CSN' | 'Borda Livre' | 'Casco' | 'Máquinas' | string;
  numero: string;
  vencimento: string;
  status: 'OK' | 'ATENCAO' | 'CRITICO' | string;
}

export interface Embarcacao {
  id: string;
  nome: string;
  inscricao: string;
  tipo: 'Empurrador Fluvial' | 'Balsa' | 'Rebocador Portuário' | string;
  armador: string;
  estaleiroAno: string;
  dimensoes: string;
  abTpb: string;
  potenciaMcp: string;
  certificados: Certificado[];
}

export type TipoRelatorio = 'CADASTRO' | 'CERTIFICADOS' | 'TERMO_TECNICO' | 'CONSOLIDADO';

export interface FiltrosRelatorio {
  tipoRelatorio: TipoRelatorio;
  armador: string;
  tipoEmbarcacao: string; // 'Todos', 'Empurrador Fluvial', 'Balsa', 'Rebocador Portuário'
  statusValidade: string;
}
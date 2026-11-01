import React, { useState } from 'react';
import { 
  Vessel, 
  Certificate, 
  PrazosConfig, 
  FiltrosRelatorio, 
  TIPOS_EMBARCACAO 
} from '../types/maritime';
import { ReportPrintView } from '../components/ReportPrintView';
import { FileText, Printer, Ship, CheckCircle2, ShieldCheck, Layers } from 'lucide-react';

interface ReportsViewProps {
  vessels: Vessel[];
  certificates: Certificate[];
  config: PrazosConfig;
  canExport?: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  vessels,
  certificates,
  config,
  canExport = true,
}) => {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: 'CONSOLIDADO',
    armador: 'Todos',
    tipoEmbarcacao: 'Todos',
    statusValidade: 'Todos',
  });

  const handleImprimir = () => {
    // Pequena pausa para garantir renderização no portal antes de abrir a janela do PDF
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Lista de proprietários / armadores únicos
  const armadoresUnicos = Array.from(
    new Set(vessels.map((v) => v.proprietario).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#062433] p-5 rounded-2xl border border-teal-500/20 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-teal-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" /> Central de Emissão de Relatórios Navais
          </h1>
          <p className="text-xs text-teal-300/70 mt-1">
            Selecione o modelo desejado e exporte documentos impressos em formato A4 Paisagem
          </p>
        </div>

        {canExport && (
          <button
            onClick={handleImprimir}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:brightness-110 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
          </button>
        )}
      </div>

      {/* 1. SELEÇÃO DE MODELOS DE RELATÓRIO */}
      <div>
        <label className="block text-xs font-bold text-teal-400 tracking-wider uppercase mb-3">
          1. Selecione o Modelo de Relatório:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'CADASTRO' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'CADASTRO'
                ? 'bg-teal-500/20 border-teal-400 text-white shadow-xl'
                : 'bg-[#062433]/60 border-teal-900/40 text-teal-200/70 hover:border-teal-500/40'
            }`}
          >
            <div className="font-bold text-xs sm:text-sm text-teal-100 flex items-center gap-2">
              <Ship className="w-4 h-4 text-teal-400" /> Cadastro da Frota
            </div>
            <div className="text-[11px] text-teal-300/60 mt-1">Listagem cadastral por tipo e construtor</div>
          </button>

          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'CERTIFICADOS' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'CERTIFICADOS'
                ? 'bg-teal-500/20 border-teal-400 text-white shadow-xl'
                : 'bg-[#062433]/60 border-teal-900/40 text-teal-200/70 hover:border-teal-500/40'
            }`}
          >
            <div className="font-bold text-xs sm:text-sm text-teal-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matriz de Certificados
            </div>
            <div className="text-[11px] text-teal-300/60 mt-1">CSN, Borda Livre, Casco e Máquinas</div>
          </button>

          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'TERMO_TECNICO' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'TERMO_TECNICO'
                ? 'bg-teal-500/20 border-teal-400 text-white shadow-xl'
                : 'bg-[#062433]/60 border-teal-900/40 text-teal-200/70 hover:border-teal-500/40'
            }`}
          >
            <div className="font-bold text-xs sm:text-sm text-teal-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Termo de Responsabilidade
            </div>
            <div className="text-[11px] text-teal-300/60 mt-1">Assinatura e parecer do Tecnólogo Naval</div>
          </button>

          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'CONSOLIDADO' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'CONSOLIDADO'
                ? 'bg-teal-500/20 border-teal-400 text-white shadow-xl'
                : 'bg-[#062433]/60 border-teal-900/40 text-teal-200/70 hover:border-teal-500/40'
            }`}
          >
            <div className="font-bold text-xs sm:text-sm text-teal-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" /> Consolidado Completo
            </div>
            <div className="text-[11px] text-teal-300/60 mt-1">Documento A4 corporativo em 3 Páginas</div>
          </button>
        </div>
      </div>

      {/* 2. PAINEL DE FILTROS */}
      <div className="bg-[#062433]/80 border border-teal-900/40 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-teal-300/80 mb-1">
            TIPO DE EMBARCAÇÃO
          </label>
          <select
            value={filtros.tipoEmbarcacao}
            onChange={(e) => setFiltros({ ...filtros, tipoEmbarcacao: e.target.value })}
            className="w-full bg-[#031923] border border-teal-800/50 text-teal-100 rounded-lg px-3 py-2 text-xs focus:border-teal-400 outline-none"
          >
            <option value="Todos">Todas as Embarcações (Geral)</option>
            {TIPOS_EMBARCACAO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-teal-300/80 mb-1">
            ARMADOR / PROPRIETÁRIO
          </label>
          <select
            value={filtros.armador}
            onChange={(e) => setFiltros({ ...filtros, armador: e.target.value })}
            className="w-full bg-[#031923] border border-teal-800/50 text-teal-100 rounded-lg px-3 py-2 text-xs focus:border-teal-400 outline-none"
          >
            <option value="Todos">Todos os Armadores</option>
            {armadoresUnicos.map((armador) => (
              <option key={armador} value={armador}>
                {armador}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setFiltros({ tipoRelatorio: 'CONSOLIDADO', armador: 'Todos', tipoEmbarcacao: 'Todos', statusValidade: 'Todos' })}
            className="w-full bg-[#02131b] border border-teal-900/60 text-teal-300 hover:bg-teal-900/30 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* 3. VISUALIZAÇÃO PRÉVIA NA TELA */}
      <div className="bg-[#062433] border border-teal-500/20 p-5 rounded-2xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">
            Modelo Selecionado: {filtros.tipoRelatorio} | Categoria: {filtros.tipoEmbarcacao}
          </span>
          <span className="text-[11px] text-teal-300/60">Formato: A4 Paisagem</span>
        </div>

        <div className="bg-slate-100 text-slate-900 p-5 rounded-xl text-xs space-y-2">
          <div className="border-b border-teal-600 pb-2 flex justify-between font-bold">
            <span>{config.empresa_nome || 'Navegação e Logística Marítima Amazônia S/A'}</span>
            <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <p className="text-slate-700">
            Relatório pronto para exportação com <b>{vessels.length} embarcação(ões)</b> e <b>{certificates.length} certificado(s)</b>. Clique em <b>"Imprimir / Salvar PDF"</b> para abrir a folha A4 em fundo branco.
          </p>
        </div>
      </div>

      {/* Engine de Impressão via Portal */}
      <ReportPrintView
        vessels={vessels}
        certificates={certificates}
        filtros={filtros}
        config={config}
      />
    </div>
  );
};
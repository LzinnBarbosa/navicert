import React, { useState, useEffect } from 'react';
import { ReportPrintView } from '../components/ReportPrintView';
import { Embarcacao, FiltrosRelatorio, TipoRelatorio } from '../types';

// Dados de fallback caso o SQLite ainda não tenha retornado registros
const DADOS_EXEMPLO: Embarcacao[] = [
  {
    id: '1',
    nome: 'Empurrador Solimões I',
    inscricao: '021-008412-3',
    tipo: 'Empurrador Fluvial',
    armador: 'Navegação Amazônia S/A',
    estaleiroAno: 'Estaleiro Rio Negro (2018)',
    dimensoes: '28,50m x 8,50m x 2,20m',
    abTpb: '180 / 120 t',
    potenciaMcp: '2x 800 BHP',
    certificados: [
      { id: 'c1', tipo: 'CSN', numero: 'CSN-2022/101', vencimento: '15/11/2026', status: 'OK' },
      { id: 'c2', tipo: 'Borda Livre', numero: 'BL-8842/20', vencimento: '10/04/2027', status: 'OK' },
      { id: 'c3', tipo: 'Casco', numero: 'VC-2021/040', vencimento: '12/12/2026', status: 'ATENCAO' },
      { id: 'c4', tipo: 'Máquinas', numero: 'VM-2021/041', vencimento: '12/12/2026', status: 'OK' }
    ]
  },
  {
    id: '2',
    nome: 'Balsa Graneleira Tapajós IX',
    inscricao: '034-019482-1',
    tipo: 'Balsa',
    armador: 'Grãos do Norte Logística',
    estaleiroAno: 'Estaleiro Bertolini (2020)',
    dimensoes: '60,00m x 16,00m x 3,50m',
    abTpb: '1.250 / 3.000 t',
    potenciaMcp: 'N/A (Sem Propulsão)',
    certificados: [
      { id: 'c5', tipo: 'CSN', numero: 'CSN-2021/002', vencimento: '10/10/2026', status: 'CRITICO' },
      { id: 'c6', tipo: 'Borda Livre', numero: 'BL-3310/19', vencimento: '15/08/2027', status: 'OK' },
      { id: 'c7', tipo: 'Casco', numero: 'VC-2019/112', vencimento: '20/05/2028', status: 'OK' }
    ]
  },
  {
    id: '3',
    nome: 'Rebocador Portuário Santos Guardiões',
    inscricao: '382-012948-5',
    tipo: 'Rebocador Portuário',
    armador: 'Rebocadores do Brasil Ltda',
    estaleiroAno: 'Estaleiro Wilson Sons (2021)',
    dimensoes: '24,00m x 10,00m x 3,80m',
    abTpb: '220 / 150 t',
    potenciaMcp: '2x 1600 BHP',
    certificados: [
      { id: 'c8', tipo: 'CSN', numero: 'CSN-2024/1102', vencimento: '11/12/2027', status: 'OK' },
      { id: 'c9', tipo: 'Casco', numero: 'VC-2022/881', vencimento: '02/11/2026', status: 'ATENCAO' },
      { id: 'c10', tipo: 'Máquinas', numero: 'VM-2024/0119', vencimento: '10/05/2027', status: 'OK' }
    ]
  }
];

export const RelatoriosView: React.FC = () => {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: 'CONSOLIDADO',
    armador: 'Todos',
    tipoEmbarcacao: 'Todos',
    statusValidade: 'Todos',
  });

  const [embarcacoes, setEmbarcacoes] = useState<Embarcacao[]>(DADOS_EXEMPLO);

  useEffect(() => {
    fetch('/api/embarcacoes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEmbarcacoes(data);
        }
      })
      .catch(() => {
        setEmbarcacoes(DADOS_EXEMPLO);
      });
  }, []);

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios de Frota & Vistorias</h1>
          <p className="text-sm text-slate-400">Gere relatórios gerenciais para controle da frota, proprietários, estaleiros e exporte planilhas</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleImprimir}
            className="btn-primary text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-lg cursor-pointer hover:brightness-110 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* SELEÇÃO DO MODELO DE RELATÓRIO */}
      <div>
        <label className="block text-xs font-bold text-sky-400 tracking-wider uppercase mb-2">
          1. Selecione o Modelo de Relatório a Gerar:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'CADASTRO' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'CADASTRO'
                ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg'
                : 'glass-panel text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="text-lg">📄</span> Cadastro da Frota
            </div>
            <div className="text-xs text-slate-400 mt-1">Gera o relatório cadastral por tipo de embarcação</div>
          </button>

          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'CERTIFICADOS' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'CERTIFICADOS'
                ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg'
                : 'glass-panel text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="text-lg">📋</span> Matriz de Certificados
            </div>
            <div className="text-xs text-slate-400 mt-1">CSN, Borda Livre, Casco e Máquinas</div>
          </button>

          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'TERMO_TECNICO' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'TERMO_TECNICO'
                ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg'
                : 'glass-panel text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="text-lg">🖋️</span> Termo de Responsabilidade
            </div>
            <div className="text-xs text-slate-400 mt-1">Parecer técnico e assinatura do Tecnólogo Naval</div>
          </button>

          <button
            onClick={() => setFiltros({ ...filtros, tipoRelatorio: 'CONSOLIDADO' })}
            className={`p-4 rounded-xl text-left border transition cursor-pointer ${
              filtros.tipoRelatorio === 'CONSOLIDADO'
                ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg'
                : 'glass-panel text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="text-lg">📑</span> Consolidado Completo
            </div>
            <div className="text-xs text-slate-400 mt-1">Documento A4 oficial de 3 páginas</div>
          </button>
        </div>
      </div>

      {/* FILTROS ESPECÍFICOS */}
      <div className="glass-panel p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">TIPO DE EMBARCAÇÃO</label>
          <select
            value={filtros.tipoEmbarcacao}
            onChange={(e) => setFiltros({ ...filtros, tipoEmbarcacao: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-sky-500 outline-none"
          >
            <option value="Todos">Todas as Embarcações (Geral)</option>
            <option value="Empurrador Fluvial">Empurrador Fluvial</option>
            <option value="Balsa">Balsa e Chata</option>
            <option value="Rebocador Portuário">Rebocador Portuário</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">ARMADOR / PROPRIETÁRIO</label>
          <select
            value={filtros.armador}
            onChange={(e) => setFiltros({ ...filtros, armador: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-sky-500 outline-none"
          >
            <option value="Todos">Todos os Armadores</option>
            <option value="Navegação Amazônia S/A">Navegação Amazônia S/A</option>
            <option value="Grãos do Norte Logística">Grãos do Norte Logística</option>
            <option value="Rebocadores do Brasil Ltda">Rebocadores do Brasil Ltda</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setFiltros({ tipoRelatorio: 'CONSOLIDADO', armador: 'Todos', tipoEmbarcacao: 'Todos', statusValidade: 'Todos' })}
            className="w-full bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* PREVIEW DA IMPRESSÃO */}
      <div className="glass-panel p-4 rounded-xl border border-slate-700">
        <div className="text-xs font-bold text-sky-400 mb-2">
          MODELO SELECIONADO: {filtros.tipoRelatorio} ({filtros.tipoEmbarcacao})
        </div>
        <p className="text-xs text-slate-300">
          Clique no botão <b className="text-sky-400">"Imprimir / Salvar PDF"</b> no topo direito para gerar o documento formatado em papel A4 sem as barras do sistema.
        </p>
      </div>

      {/* Componente de Impressão via Portal */}
      <ReportPrintView dados={embarcacoes} filtros={filtros} />
    </div>
  );
};
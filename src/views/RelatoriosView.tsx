import React, { useState, useMemo } from 'react';
import { Vessel, Certificate, PrazosConfig } from '../types/maritime';
import { statusCertificado, formatarDataBR, PRAZOS_PADRAO } from '../lib/maritime-utils';
import { Printer, FileText, Anchor, ShieldCheck, Layers } from 'lucide-react';

interface ReportsViewProps {
  vessels?: Vessel[];
  certificates?: Certificate[];
  config?: PrazosConfig;
  canExport?: boolean;
}

const TIPOS_EMBARCACAO = [
  "Empurrador Fluvial",
  "Balsa",
  "Petroleira",
  "Rebocador",
  "Módulo",
  "Rampas",
  "Outro"
];

// Função auxiliar local para calcular dias em falta até ao vencimento
function getDiasParaVencimento(dataStr?: string): number {
  if (!dataStr) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const target = new Date(dataStr);
  if (isNaN(target.getTime())) return 0;
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
}

export function ReportsView({
  vessels = [],
  certificates = [],
  config = PRAZOS_PADRAO,
  canExport = true,
}: ReportsViewProps) {
  
  // --- ESTADOS DE FILTRAGEM ---
  const [tipoRelatorio, setTipoRelatorio] = useState<'CONSOLIDADO' | 'CADASTRO' | 'CERTIFICADOS' | 'TERMO_TECNICO' | 'INDIVIDUAL'>('CONSOLIDADO');
  const [filtroArmador, setFiltroArmador] = useState<string>('Todos');
  const [filtroTipoVessel, setFiltroTipoVessel] = useState<string>('Todos');
  const [filtroStatusCert, setFiltroStatusCert] = useState<string>('Todos');
  const [vesselSelecionadaId, setVesselSelecionadaId] = useState<string>('');

  // --- EXTRAÇÃO ÚNICA DE ARMADORES / PROPRIETÁRIOS ---
  const armadoresDisponiveis = useMemo(() => {
    const lista = new Set<string>();
    vessels.forEach((v) => {
      const armador = v.proprietario || (v as any).armador;
      if (armador && armador.trim() !== '') {
        lista.add(armador.trim());
      }
    });
    return Array.from(lista).sort();
  }, [vessels]);

  // --- FILTRAGEM DINÂMICA DAS EMBARCAÇÕES ---
  const embarcacoesFiltradas = useMemo(() => {
    return vessels.filter((v) => {
      const armadorVessel = (v.proprietario || (v as any).armador || '').trim();
      
      // Filtro por Armador
      if (filtroArmador !== 'Todos' && armadorVessel.toLowerCase() !== filtroArmador.toLowerCase()) {
        return false;
      }

      // Filtro por Tipo de Embarcação
      if (filtroTipoVessel !== 'Todos' && v.tipo.toLowerCase() !== filtroTipoVessel.toLowerCase()) {
        return false;
      }

      // Filtro por Ficha Individual
      if (tipoRelatorio === 'INDIVIDUAL' && vesselSelecionadaId) {
        if (String(v.id) !== String(vesselSelecionadaId)) return false;
      }

      return true;
    });
  }, [vessels, filtroArmador, filtroTipoVessel, tipoRelatorio, vesselSelecionadaId]);

  // Disparador de impressão
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-100 min-h-screen pb-12">
      
      {/* SEÇÃO 1: PAINEL DE CONTROLE DE FILTROS (OCULTO NA IMPRESSÃO) */}
      <div className="bg-[#062433] border border-teal-900/60 rounded-xl p-5 shadow-xl no-print">
        
        {/* Cabeçalho da View */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-teal-900/40">
          <div>
            <h1 className="text-xl font-bold text-teal-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-400" />
              Central de Relatórios & Vistorias Regulatórias
            </h1>
            <p className="text-xs text-teal-300/70 mt-1">
              Gere relatórios gerenciais, fichas técnicas individuais por armador ou matrizes de conformidade prontas para impressão A4.
            </p>
          </div>

          <button
            onClick={handlePrint}
            disabled={!canExport || embarcacoesFiltradas.length === 0}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>

        {/* SELEÇÃO DO MODELO DE RELATÓRIO */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            1. Selecione o Modelo de Relatório a Gerar:
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            <button
              onClick={() => setTipoRelatorio('CONSOLIDADO')}
              className={`p-3.5 rounded-xl text-left border transition text-xs font-semibold cursor-pointer ${
                tipoRelatorio === 'CONSOLIDADO'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-100 shadow-md ring-1 ring-teal-400'
                  : 'bg-[#031923] border-teal-900/60 text-slate-300 hover:border-teal-700'
              }`}
            >
              <div className="font-bold flex items-center gap-2 text-teal-200">📑 Consolidado Geral</div>
              <div className="text-[10px] text-teal-300/60 mt-1 font-normal">Dossiê completo de todas as embarcações</div>
            </button>

            <button
              onClick={() => setTipoRelatorio('CADASTRO')}
              className={`p-3.5 rounded-xl text-left border transition text-xs font-semibold cursor-pointer ${
                tipoRelatorio === 'CADASTRO'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-100 shadow-md ring-1 ring-teal-400'
                  : 'bg-[#031923] border-teal-900/60 text-slate-300 hover:border-teal-700'
              }`}
            >
              <div className="font-bold flex items-center gap-2 text-teal-200">📄 Cadastro da Frota</div>
              <div className="text-[10px] text-teal-300/60 mt-1 font-normal">Especificações técnicas e estaleiro</div>
            </button>

            <button
              onClick={() => setTipoRelatorio('CERTIFICADOS')}
              className={`p-3.5 rounded-xl text-left border transition text-xs font-semibold cursor-pointer ${
                tipoRelatorio === 'CERTIFICADOS'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-100 shadow-md ring-1 ring-teal-400'
                  : 'bg-[#031923] border-teal-900/60 text-slate-300 hover:border-teal-700'
              }`}
            >
              <div className="font-bold flex items-center gap-2 text-teal-200">📋 Matriz Certificados</div>
              <div className="text-[10px] text-teal-300/60 mt-1 font-normal">Prazos CSN, Borda Livre, Casco e ARTs</div>
            </button>

            <button
              onClick={() => setTipoRelatorio('INDIVIDUAL')}
              className={`p-3.5 rounded-xl text-left border transition text-xs font-semibold cursor-pointer ${
                tipoRelatorio === 'INDIVIDUAL'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-100 shadow-md ring-1 ring-teal-400'
                  : 'bg-[#031923] border-teal-900/60 text-slate-300 hover:border-teal-700'
              }`}
            >
              <div className="font-bold flex items-center gap-2 text-teal-200">🔍 Ficha Individual</div>
              <div className="text-[10px] text-teal-300/60 mt-1 font-normal">Dossiê de 1 embarcação específica</div>
            </button>

            <button
              onClick={() => setTipoRelatorio('TERMO_TECNICO')}
              className={`p-3.5 rounded-xl text-left border transition text-xs font-semibold cursor-pointer ${
                tipoRelatorio === 'TERMO_TECNICO'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-100 shadow-md ring-1 ring-teal-400'
                  : 'bg-[#031923] border-teal-900/60 text-slate-300 hover:border-teal-700'
              }`}
            >
              <div className="font-bold flex items-center gap-2 text-teal-200">🖋️ Parecer Técnico</div>
              <div className="text-[10px] text-teal-300/60 mt-1 font-normal">Termo de responsabilidade para auditoria</div>
            </button>

          </div>
        </div>

        {/* FILTROS COMBINADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#031923] p-4 rounded-xl border border-teal-900/40">
          
          {/* Armador / Proprietário */}
          <div>
            <label className="block text-[11px] font-semibold text-teal-300 uppercase tracking-wider mb-1">
              Armador / Proprietário
            </label>
            <select
              value={filtroArmador}
              onChange={(e) => setFiltroArmador(e.target.value)}
              className="w-full bg-[#062433] border border-teal-800 text-teal-100 rounded-lg px-3 py-2 text-xs focus:border-teal-400 outline-none"
            >
              <option value="Todos">Todos os Armadores (Geral)</option>
              {armadoresDisponiveis.map((arm) => (
                <option key={arm} value={arm}>{arm}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Embarcação */}
          <div>
            <label className="block text-[11px] font-semibold text-teal-300 uppercase tracking-wider mb-1">
              Tipo de Embarcação
            </label>
            <select
              value={filtroTipoVessel}
              onChange={(e) => setFiltroTipoVessel(e.target.value)}
              className="w-full bg-[#062433] border border-teal-800 text-teal-100 rounded-lg px-3 py-2 text-xs focus:border-teal-400 outline-none"
            >
              <option value="Todos">Todos os Tipos</option>
              {TIPOS_EMBARCACAO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status do Certificado */}
          <div>
            <label className="block text-[11px] font-semibold text-teal-300 uppercase tracking-wider mb-1">
              Status do Certificado
            </label>
            <select
              value={filtroStatusCert}
              onChange={(e) => setFiltroStatusCert(e.target.value)}
              className="w-full bg-[#062433] border border-teal-800 text-teal-100 rounded-lg px-3 py-2 text-xs focus:border-teal-400 outline-none"
            >
              <option value="Todos">Todos os Status</option>
              <option value="vencido">Apenas Vencidos</option>
              <option value="critico">Críticos (≤ 30 dias)</option>
              <option value="atencao">Atenção (≤ 60 dias)</option>
              <option value="valido">Válidos</option>
            </select>
          </div>

          {/* Limpar Filtros */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setTipoRelatorio('CONSOLIDADO');
                setFiltroArmador('Todos');
                setFiltroTipoVessel('Todos');
                setFiltroStatusCert('Todos');
                setVesselSelecionadaId('');
              }}
              className="w-full bg-teal-900/40 text-teal-300 hover:bg-teal-900/70 border border-teal-800 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>

        </div>

        {/* Seleção de Embarcação Individual */}
        {tipoRelatorio === 'INDIVIDUAL' && (
          <div className="mt-4 pt-4 border-t border-teal-900/40">
            <label className="block text-[11px] font-semibold text-teal-300 uppercase tracking-wider mb-1.5">
              Selecione a Embarcação para a Ficha Técnica Individual:
            </label>
            <select
              value={vesselSelecionadaId}
              onChange={(e) => setVesselSelecionadaId(e.target.value)}
              className="w-full sm:w-1/2 bg-[#031923] border border-teal-400 text-teal-100 rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="">-- Escolha uma embarcação da lista --</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome} ({v.inscricao}) - {v.tipo} [{v.proprietario || (v as any).armador || 'Armador N/I'}]
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* SEÇÃO 2: DOCUMENTO A4 FORMATADO DE IMPRESSÃO */}
      <div className="print-document bg-white text-slate-900 p-8 rounded-xl shadow-2xl mx-auto max-w-[1120px]">
        
        {/* CABEÇALHO OFICIAL DE AUDITORIA */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg">
              <Anchor className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                {config.empresa_nome || "NavCert - Gestão Marítima"}
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Relatório de Conformidade Regulatória & Dossiê Técnico da Frota
              </p>
            </div>
          </div>
          
          <div className="text-right text-[10px] text-slate-500 font-medium leading-tight">
            <p className="font-bold text-slate-900 text-[11px]">Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Modelo: <strong className="text-slate-800">{tipoRelatorio}</strong></p>
            <p>Armador: <strong className="text-slate-800">{filtroArmador}</strong> | Tipo: <strong className="text-slate-800">{filtroTipoVessel}</strong></p>
            <p>Norma de Referência: <strong>NORMAM-202 / Capitania dos Portos</strong></p>
          </div>
        </div>

        {/* CORPO DO RELATÓRIO */}
        {embarcacoesFiltradas.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-300">
            Nenhuma embarcação cadastrada corresponde aos filtros selecionados.
          </div>
        ) : (
          <div className="space-y-6">
            {embarcacoesFiltradas.map((vessel) => {
              // Certificados pertencentes a esta embarcação
              const certsDaEmbarcacao = certificates.filter((c) => {
                const pertence = String(c.vessel_id || (c as any).embarcacao_id) === String(vessel.id);
                if (!pertence) return false;

                if (filtroStatusCert !== 'Todos') {
                  const st = statusCertificado(c.data_validade || (c as any).vencimento, config);
                  if (st !== filtroStatusCert) return false;
                }
                return true;
              });

              return (
                <div 
                  key={vessel.id} 
                  className="vessel-card border border-slate-300 rounded-lg overflow-hidden break-inside-avoid bg-white shadow-sm mb-6"
                >
                  {/* FAIXA DA EMBARCAÇÃO */}
                  <div className="bg-slate-900 text-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wide text-teal-300 flex items-center gap-2">
                        {vessel.nome}
                        <span className="text-[10px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-medium border border-slate-700">
                          {vessel.tipo}
                        </span>
                      </h2>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                        Inscrição: <strong className="text-white">{vessel.inscricao}</strong> | Porto: <strong className="text-white">{vessel.porto_inscricao || 'N/I'}</strong> | Situação: <strong className="text-white">{vessel.situacao || 'Em Operação'}</strong>
                      </p>
                    </div>

                    <div className="sm:text-right text-[11px]">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Armador / Proprietário</span>
                      <strong className="text-teal-200 font-bold text-xs">{vessel.proprietario || (vessel as any).armador || 'Não Informado'}</strong>
                    </div>
                  </div>

                  {/* TABELA DE DADOS CADASTRAIS / ESPECIFICAÇÕES TÉCNICAS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-2.5 text-[10px] border-b border-slate-300 text-slate-700">
                    <div>Ano Construção: <strong className="text-slate-900">{vessel.ano_construcao || (vessel as any).estaleiroAno || 'N/I'}</strong></div>
                    <div>Arqueação Bruta (AB): <strong className="text-slate-900">{vessel.arqueacao_bruta || (vessel as any).abTpb || 'N/I'}</strong></div>
                    <div>Construtor/Estaleiro: <strong className="text-slate-900">{vessel.construtor || 'N/I'}</strong></div>
                    <div>Trecho de Operação: <strong className="text-slate-900">{vessel.trecho || 'Nacional'}</strong></div>
                  </div>

                  {/* TABELA DE CERTIFICADOS */}
                  {tipoRelatorio !== 'CADASTRO' && (
                    <div className="p-3">
                      <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                        Certificados, Testes Técnicos & Vistorias Regulatórias:
                      </div>

                      <table className="w-full border-collapse table-fixed text-left">
                        <thead>
                          <tr className="bg-slate-800 text-white text-[9px] uppercase tracking-wider">
                            <th className="p-1.5 border border-slate-700 w-[20%]">Documento / Tipo</th>
                            <th className="p-1.5 border border-slate-700 w-[15%]">Nº Registro</th>
                            <th className="p-1.5 border border-slate-700 w-[16%]">Órgão / Resp. Técnico</th>
                            <th className="p-1.5 border border-slate-700 w-[12%]">Emissão</th>
                            <th className="p-1.5 border border-slate-700 w-[12%]">Validade</th>
                            <th className="p-1.5 border border-slate-700 w-[13%]">Detalhamento Técnico</th>
                            <th className="p-1.5 border border-slate-700 w-[12%] text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px] divide-y divide-slate-200 leading-tight">
                          {certsDaEmbarcacao.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-3 text-center text-slate-500 italic bg-slate-50">
                                Nenhum certificado registrado para os parâmetros selecionados.
                              </td>
                            </tr>
                          ) : (
                            certsDaEmbarcacao.map((c) => {
                              const dataVal = c.data_validade || (c as any).vencimento;
                              const st = statusCertificado(dataVal, config);
                              const dias = getDiasParaVencimento(dataVal);

                              let statusBadge = "bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold";
                              let statusTexto = `Válido (${dias}d)`;

                              if (st === "vencido") {
                                statusBadge = "bg-red-100 text-red-900 border-red-400 font-bold";
                                statusTexto = `VENCIDO (${Math.abs(dias)}d)`;
                              } else if (st === "critico") {
                                statusBadge = "bg-orange-100 text-orange-900 border-orange-400 font-bold";
                                statusTexto = `Crítico (${dias}d)`;
                              } else if (st === "atencao") {
                                statusBadge = "bg-amber-100 text-amber-900 border-amber-400 font-semibold";
                                statusTexto = `Atenção (${dias}d)`;
                              }

                              return (
                                <tr key={c.id} className="bg-white hover:bg-slate-50 transition-colors">
                                  {/* Coluna 1: Tipo */}
                                  <td className="p-1.5 border border-slate-200 font-bold text-slate-900 break-words">
                                    {c.tipo}
                                    {c.tipo_teste && (
                                      <span className="block text-[8px] text-slate-500 font-normal">{c.tipo_teste}</span>
                                    )}
                                  </td>

                                  {/* Coluna 2: Número */}
                                  <td className="p-1.5 border border-slate-200 text-slate-700 break-words font-mono text-[9px]">
                                    {c.numero || 'S/N'}
                                  </td>

                                  {/* Coluna 3: Órgão / Técnico */}
                                  <td className="p-1.5 border border-slate-200 text-slate-700 break-words">
                                    {c.orgao_emissor || c.responsavel_tecnico || 'N/I'}
                                    {c.numero_art && (
                                      <span className="block text-[8px] text-slate-500">ART: {c.numero_art}</span>
                                    )}
                                  </td>

                                  {/* Coluna 4: Emissão */}
                                  <td className="p-1.5 border border-slate-200 text-slate-600">
                                    {formatarDataBR(c.data_emissao)}
                                  </td>

                                  {/* Coluna 5: Validade */}
                                  <td className="p-1.5 border border-slate-200 font-bold text-slate-900">
                                    {formatarDataBR(dataVal)}
                                  </td>

                                  {/* Coluna 6: Detalhes Técnicos */}
                                  <td className="p-1.5 border border-slate-200 text-[8px] text-slate-600 leading-tight break-words">
                                    {c.tracao_estatica_ton && <div>Tração: {c.tracao_estatica_ton} Ton</div>}
                                    {c.pressao_teste && <div>Pressão: {c.pressao_teste}</div>}
                                    {c.lacre_tag && <div>Lacre: {c.lacre_tag}</div>}
                                    {c.local_compensacao && <div>Compensação: {c.local_compensacao}</div>}
                                    {!c.tracao_estatica_ton && !c.pressao_teste && !c.lacre_tag && !c.local_compensacao && (
                                      <span className="text-slate-400">Conformidade NORMAM</span>
                                    )}
                                  </td>

                                  {/* Coluna 7: Status */}
                                  <td className="p-1.5 border border-slate-200 text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] border ${statusBadge}`}>
                                      {statusTexto}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TERMO DE RESPONSABILIDADE TÉCNICA (SE SELECIONADO) */}
                  {tipoRelatorio === 'TERMO_TECNICO' && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-700 space-y-2">
                      <div className="font-bold text-slate-900 uppercase">Parecer do Responsável Técnico Marítimo / Tecnólogo Naval:</div>
                      <p className="leading-relaxed">
                        Atesto para os devidos fins de vistoria e fiscalização da Capitania dos Portos que a embarcação <strong>{vessel.nome}</strong> (Inscrição: <strong>{vessel.inscricao}</strong>) encontra-se com sua documentação e testes de salvatagem/estabilidade revisados conforme diretrizes da NORMAM-202.
                      </p>
                      <div className="pt-6 flex justify-between items-end text-[9px] text-slate-500">
                        <div>
                          <div>Local e Data: __________________________, _____ / _____ / ________</div>
                        </div>
                        <div className="text-center">
                          <div className="w-48 border-b border-slate-400 mb-1"></div>
                          <div>Assinatura do Técnico / Engenheiro Naval</div>
                          <div>CREA / CONFEA Nº: ____________________</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* RODAPÉ DO DOCUMENTO PARA AUDITORIA */}
        <div className="mt-8 border-t-2 border-slate-900 pt-3 flex items-center justify-between text-[9px] text-slate-500">
          <div>
            <p className="font-bold text-slate-800">NavCert Maritime SaaS Platform · Gestão de Conformidade e Vistorias</p>
            <p>Documento gerado eletronicamente com validação de segurança JWT.</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Página 1 de 1</p>
            <p className="font-mono">AUTENTICADOR: NAV-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          </div>
        </div>

      </div>

      {/* REGRAS CSS EXCLUSIVAS DE IMPRESSÃO */}
      <style>{`
        @media print {
          .no-print, nav, sidebar, header, footer {
            display: none !important;
          }

          body, html {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 9pt !important;
          }

          .print-document {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
          }

          .vessel-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 24px !important;
            border: 1px solid #94a3b8 !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }

          th, td {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            hyphens: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

export const RelatoriosView = ReportsView;
export default ReportsView;
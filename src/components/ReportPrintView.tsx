import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Vessel, Certificate, PrazosConfig, FiltrosRelatorio } from '../types/maritime';

// Tipos estendidos corrigidos com Omit para aceitar id como number | string
type ExtendedCertificate = Omit<Partial<Certificate>, 'id'> & {
  id?: number | string;
  tipo?: string;
  numero?: string;
  data_emissao?: string;
  data_vencimento?: string;
  data_validade?: string;
  status?: string;
}

type ExtendedVessel = Omit<Partial<Vessel>, 'id' | 'certificates'> & {
  id?: number | string;
  nome?: string;
  inscricao?: string;
  tipo?: string;
  proprietario?: string;
  construtor?: string;
  ano_construcao?: number;
  porto_inscricao?: string;
  arqueacao_bruta?: number;
  certificados?: ExtendedCertificate[];
  certificates?: ExtendedCertificate[];
}

interface ReportPrintViewProps {
  vessels?: Vessel[];
  certificates?: Certificate[];
  filtros?: FiltrosRelatorio;
  config?: PrazosConfig;
  reportType?: string;
  empresaName?: string;
  docId?: string;
  dataEmissao?: string;
  armadorFiltro?: string;
  onClose?: () => void;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  vessels = [],
  certificates = [],
  filtros,
  config,
  reportType,
  empresaName,
  docId = 'REL-2026/010',
  dataEmissao = new Date().toLocaleDateString('pt-BR'),
  armadorFiltro,
  onClose
}) => {
  // --- ESTADOS EDITÁVEIS PARA ASSINATURA E CABEÇALHO ---
  const [nomeTecnologo, setNomeTecnologo] = useState('Marcos Vinícius Barbosa');
  const [tituloProfissional, setTituloProfissional] = useState('Tecnólogo em Construção Naval / Tecnólogo Naval');
  const [registroProfissional, setRegistroProfissional] = useState('Reg. CFT/CREA-AM Nº 184920-A');
  const [nomeEmpresa, setNomeEmpresa] = useState(config?.empresa_nome || empresaName || 'Navegação e Logística Amazônia S/A');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('04.128.901/0001-90');
  const [cargoGerencia, setCargoGerencia] = useState('GERÊNCIA DE OPERAÇÕES DE FROTA');

  const printRoot = typeof window !== 'undefined'
    ? (document.getElementById('print-root') || document.body)
    : null;

  if (!printRoot) return null;

  const castVessels = vessels as ExtendedVessel[];

  const activeReportType = (filtros?.tipoRelatorio || reportType || 'CONSOLIDADO').toUpperCase();
  const activeArmador = (filtros?.armador && filtros.armador !== 'Todos')
    ? filtros.armador
    : (armadorFiltro || `Todos os Armadores (${castVessels.length} Cadastrados)`);

  const isCadastro = activeReportType.includes('CADASTRO');
  const isMatriz = activeReportType.includes('MATRIZ') || activeReportType.includes('CERTIFICADO');
  const isTermo = activeReportType.includes('TERMO') || activeReportType.includes('DIAGNOSTICO') || activeReportType.includes('RESPONSABILIDADE');
  const isConsolidado = activeReportType.includes('CONSOLIDADO');

  // Coleta centralizada de certificados reais com suporte duplo (certificados / certificates)
  const todosCertificados: { cert: ExtendedCertificate; vessel: ExtendedVessel }[] = [];
  castVessels.forEach((v: ExtendedVessel) => {
    const listaCert = v.certificados || v.certificates || [];
    listaCert.forEach((c: ExtendedCertificate) => {
      todosCertificados.push({ cert: c, vessel: v });
    });
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const getVencimentoStr = (c: ExtendedCertificate) => c.data_vencimento || c.data_validade || '';

  // Filtro de certificados por vencimento
  const certsVencidos = todosCertificados.filter(({ cert }) => {
    const vencStr = getVencimentoStr(cert);
    if (!vencStr) return false;
    return new Date(vencStr) < hoje;
  });

  const certsCriticos = todosCertificados.filter(({ cert }) => {
    const vencStr = getVencimentoStr(cert);
    if (!vencStr) return false;
    const dv = new Date(vencStr);
    const diffDias = Math.ceil((dv.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diffDias >= 0 && diffDias <= 30;
  });

  const certsValidos = todosCertificados.filter(({ cert }) => {
    const vencStr = getVencimentoStr(cert);
    if (!vencStr) return true;
    const dv = new Date(vencStr);
    const diffDias = Math.ceil((dv.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diffDias > 30;
  });

  // Agrupamento de embarcações por Tipo
  const embarcacoesPorTipo = castVessels.reduce((acc, v) => {
    const tipo = v.tipo || 'OUTROS';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(v);
    return acc;
  }, {} as Record<string, ExtendedVessel[]>);

  return createPortal(
    <div className="w-full bg-white text-black p-6 font-sans text-xs">
      
      {/* PAINEL DE AÇÕES E CONFIGURAÇÃO DE NOMES (ESCONDIDO NA IMPRESSÃO) */}
      <div className="mb-6 p-4 bg-slate-900 text-white rounded-lg print:hidden shadow-lg border border-slate-700">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700 mb-4">
          <div>
            <h3 className="font-bold text-base text-amber-400">Opções & Assinaturas do Relatório</h3>
            <p className="text-xs text-slate-300">Ajuste as informações da empresa e do responsável técnico antes de gerar o PDF/Imprimir.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded font-bold text-xs shadow transition-all flex items-center gap-1"
            >
              🖨️ Imprimir / Salvar PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-semibold text-xs transition-all"
              >
                Fechar
              </button>
            )}
          </div>
        </div>

        {/* Campos de Edição de Nomes e CNPJ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nome do Tecnólogo / Eng.:</label>
            <input
              type="text"
              value={nomeTecnologo}
              onChange={(e) => setNomeTecnologo(e.target.value)}
              className="w-full p-1.5 rounded bg-slate-800 border border-slate-600 text-white font-medium focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Título Profissional:</label>
            <input
              type="text"
              value={tituloProfissional}
              onChange={(e) => setTituloProfissional(e.target.value)}
              className="w-full p-1.5 rounded bg-slate-800 border border-slate-600 text-white font-medium focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Reg. CREA / CFT:</label>
            <input
              type="text"
              value={registroProfissional}
              onChange={(e) => setRegistroProfissional(e.target.value)}
              className="w-full p-1.5 rounded bg-slate-800 border border-slate-600 text-white font-medium focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nome da Empresa / Armador:</label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="w-full p-1.5 rounded bg-slate-800 border border-slate-600 text-white font-medium focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">CNPJ da Empresa:</label>
            <input
              type="text"
              value={cnpjEmpresa}
              onChange={(e) => setCnpjEmpresa(e.target.value)}
              className="w-full p-1.5 rounded bg-slate-800 border border-slate-600 text-white font-medium focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Cargo / Departamento:</label>
            <input
              type="text"
              value={cargoGerencia}
              onChange={(e) => setCargoGerencia(e.target.value)}
              className="w-full p-1.5 rounded bg-slate-800 border border-slate-600 text-white font-medium focus:border-amber-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* MODELO 1: CADASTRO GERAL DE EMBARCAÇÕES */}
      {(isCadastro || isConsolidado) && (
        <div className="report-container mb-8">
          <header className="border-b-2 border-blue-900 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-blue-900">NavCert | Gestão de Frota Naval</h1>
                <h2 className="text-base font-bold uppercase text-gray-800 mt-1">
                  RELATÓRIO 1: CADASTRO GERAL DE EMBARCAÇÕES
                </h2>
              </div>
              <div className="text-right text-2xl font-mono text-gray-400 font-bold">
                NavCert
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-200 text-gray-700 text-[11px]">
              <div>
                <p><strong>Doc ID:</strong> {docId}</p>
                <p><strong>Data:</strong> {dataEmissao}</p>
                <p><strong>Empresa:</strong> {nomeEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> {activeArmador}</p>
                <p><strong>Total de Unidades:</strong> {castVessels.length} Embarcações</p>
              </div>
            </div>
          </header>

          {castVessels.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-300 rounded text-gray-500 my-4">
              Nenhuma embarcação cadastrada na base de dados no momento.
            </div>
          ) : (
            Object.entries(embarcacoesPorTipo).map(([tipo, listaEmb], index) => (
              <section key={tipo} className="mb-6 page-break-avoid">
                <div className="bg-blue-900 text-white font-bold px-2 py-1 flex justify-between text-[11px]">
                  <span>{index + 1}. CATEGORIA: {tipo.toUpperCase()}</span>
                  <span>{String(listaEmb.length).padStart(2, '0')} UNIDADE(S)</span>
                </div>
                <table className="w-full border-collapse border border-gray-300 mt-1 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 text-left border-b border-gray-300">
                      <th className="p-1.5 border-r border-gray-300 w-8">ITEM</th>
                      <th className="p-1.5 border-r border-gray-300">NOME DA EMBARCAÇÃO</th>
                      <th className="p-1.5 border-r border-gray-300">Nº INSCRIÇÃO (RTM)</th>
                      <th className="p-1.5 border-r border-gray-300">PROPRIETÁRIO / ARMADOR</th>
                      <th className="p-1.5 border-r border-gray-300">CONSTRUTOR / ANO</th>
                      <th className="p-1.5">PORTO / ARQUEAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaEmb.map((v, idx) => (
                      <tr key={v.id || idx} className={`border-b border-gray-200 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}>
                        <td className="p-1.5 border-r border-gray-300 font-semibold">{idx + 1}.</td>
                        <td className="p-1.5 border-r border-gray-300 font-bold">{v.nome}</td>
                        <td className="p-1.5 border-r border-gray-300">{v.inscricao || 'N/I'}</td>
                        <td className="p-1.5 border-r border-gray-300">{v.proprietario || nomeEmpresa}</td>
                        <td className="p-1.5 border-r border-gray-300">{v.construtor || 'N/A'} ({v.ano_construcao || 'S/D'})</td>
                        <td className="p-1.5">{v.porto_inscricao || 'N/I'} | AB: {v.arqueacao_bruta || 'N/I'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))
          )}

          <footer className="mt-8 pt-2 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
            <span>NavCert - Sistema Integrado de Registro & Controle Naval</span>
            <span>Página 1</span>
          </footer>
        </div>
      )}

      {/* MODELO 2: MATRIZ DE CERTIFICADOS & VENCIMENTOS */}
      {(isMatriz || isConsolidado) && (
        <div className="report-container mb-8 page-break-avoid">
          <header className="border-b-2 border-blue-900 pb-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-blue-900">NavCert | Inspeção Regulatória</h1>
                <h2 className="text-base font-bold uppercase text-gray-800 mt-1">
                  RELATÓRIO 2: MATRIZ DE CERTIFICADOS & VENCIMENTOS
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-gray-700">
              <div>
                <p><strong>Doc ID:</strong> {docId}</p>
                <p><strong>Data:</strong> {dataEmissao}</p>
                <p><strong>Empresa:</strong> {nomeEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> {activeArmador}</p>
                <p><strong>Normativa:</strong> NORMAM-202/DPC</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-[10px] font-bold">
              <div className="bg-gray-100 p-1.5 rounded border border-gray-300">
                TOTAL CERTIFICADOS: <span className="text-blue-900 text-xs block">{todosCertificados.length} DOCS</span>
              </div>
              <div className="bg-green-100 p-1.5 rounded border border-green-300 text-green-800">
                VÁLIDOS: <span className="text-xs block">{certsValidos.length} UN</span>
              </div>
              <div className="bg-yellow-100 p-1.5 rounded border border-yellow-300 text-yellow-800">
                A VENCER (ATÉ 30 DIAS): <span className="text-xs block">{certsCriticos.length} UN</span>
              </div>
              <div className="bg-red-100 p-1.5 rounded border border-red-300 text-red-800">
                VENCIDOS: <span className="text-xs block">{certsVencidos.length} UN</span>
              </div>
            </div>
          </header>

          <section className="mb-4">
            {castVessels.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-300 rounded text-gray-500 my-4">
                Nenhum certificado registrado na base de dados.
              </div>
            ) : (
              <table className="w-full border-collapse border border-gray-300 mt-1 text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-left">
                    <th className="p-1.5 border-r border-gray-300">EMBARCAÇÃO / ARMADOR</th>
                    <th className="p-1.5 border-r border-gray-300">CERTIFICADO / TIPO</th>
                    <th className="p-1.5 border-r border-gray-300">NÚMERO</th>
                    <th className="p-1.5 border-r border-gray-300">EMISSÃO</th>
                    <th className="p-1.5 border-r border-gray-300">VENCIMENTO</th>
                    <th className="p-1.5">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {castVessels.map((v: ExtendedVessel) => {
                    const certs: ExtendedCertificate[] = v.certificados || v.certificates || [];
                    if (certs.length === 0) {
                      return (
                        <tr key={v.id} className="border-b border-gray-200">
                          <td className="p-1.5 border-r border-gray-300 font-bold">{v.nome}</td>
                          <td colSpan={5} className="p-1.5 text-gray-400 italic">Nenhum certificado atrelado.</td>
                        </tr>
                      );
                    }
                    return certs.map((c: ExtendedCertificate, cIdx: number) => {
                      const vencStr = getVencimentoStr(c);
                      const dataVenc = vencStr ? new Date(vencStr) : null;
                      const isExpired = dataVenc && dataVenc < hoje;
                      return (
                        <tr key={c.id || `${v.id}-${cIdx}`} className={`border-b border-gray-200 ${isExpired ? 'bg-red-50' : ''}`}>
                          {cIdx === 0 && (
                            <td rowSpan={certs.length} className="p-1.5 border-r border-gray-300 font-bold align-top bg-white">
                              {v.nome}<br/>
                              <span className="font-normal text-gray-600">{v.proprietario || nomeEmpresa}</span>
                            </td>
                          )}
                          <td className="p-1.5 border-r border-gray-300 font-semibold">{c.tipo}</td>
                          <td className="p-1.5 border-r border-gray-300">{c.numero || 'S/N'}</td>
                          <td className="p-1.5 border-r border-gray-300">{c.data_emissao || '-'}</td>
                          <td className={`p-1.5 border-r border-gray-300 font-bold ${isExpired ? 'text-red-700' : ''}`}>
                            {vencStr || '-'}
                          </td>
                          <td className={`p-1.5 font-bold text-center ${isExpired ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-50'}`}>
                            {isExpired ? 'VENCIDO' : 'OK'}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            )}
          </section>

          <footer className="mt-8 pt-2 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
            <span>NavCert - Sistema Integrado de Registro & Controle Naval</span>
            <span>Página 2</span>
          </footer>
        </div>
      )}

      {/* MODELO 3: DIAGNÓSTICO DE PENDÊNCIAS & LAUDO VISTORIA */}
      {(isTermo || isConsolidado) && (
        <div className="report-container mb-8 page-break-avoid">
          <header className="border-b-2 border-blue-900 pb-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-blue-900">NavCert | Laudos & Ação Técnica</h1>
                <h2 className="text-base font-bold uppercase text-gray-800 mt-1">
                  RELATÓRIO 3: DIAGNÓSTICO DE PENDÊNCIAS & LAUDO VISTORIA
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-gray-700">
              <div>
                <p><strong>Doc ID:</strong> {docId}</p>
                <p><strong>Data:</strong> {dataEmissao}</p>
                <p><strong>Empresa:</strong> {nomeEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> {activeArmador}</p>
                <p><strong>Filtro:</strong> Certificados Pendentes e Notificações</p>
              </div>
            </div>
          </header>

          <section className="mb-6">
            <div className="bg-blue-900 text-white font-bold px-2 py-1 text-[11px]">
              1. MATRIZ DE AÇÃO E REGULARIZAÇÃO PRIORITÁRIA (Vistorias Expiradas e Notificações)
            </div>
            
            {[...certsVencidos, ...certsCriticos].length === 0 ? (
              <div className="p-6 text-center border border-dashed border-emerald-300 bg-emerald-50 rounded text-emerald-800 my-3 font-semibold">
                ✅ Nenhuma pendência crítica ou certificado vencido localizado na frota cadastrada.
              </div>
            ) : (
              <table className="w-full border-collapse border border-gray-300 mt-1 text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-left">
                    <th className="p-1.5 border-r border-gray-300">EMBARCAÇÃO / ARMADOR</th>
                    <th className="p-1.5 border-r border-gray-300">DOCUMENTO PENDENTE</th>
                    <th className="p-1.5 border-r border-gray-300">VENCIMENTO</th>
                    <th className="p-1.5 border-r border-gray-300">SITUAÇÃO</th>
                    <th className="p-1.5">PLANO DE AÇÃO TÉCNICO RECOMENDADO</th>
                  </tr>
                </thead>
                <tbody>
                  {[...certsVencidos, ...certsCriticos].map(({ cert, vessel }, idx) => {
                    const vencStr = getVencimentoStr(cert);
                    const isVencido = vencStr && new Date(vencStr) < hoje;
                    return (
                      <tr key={idx} className="border-b border-gray-200 bg-red-50">
                        <td className="p-1.5 border-r border-gray-300 font-bold">
                          {vessel.nome}<br/>
                          <span className="font-normal text-gray-600">{vessel.proprietario || nomeEmpresa}</span>
                        </td>
                        <td className="p-1.5 border-r border-gray-300">{cert.tipo}</td>
                        <td className="p-1.5 border-r border-gray-300 font-bold text-red-700">{vencStr}</td>
                        <td className="p-1.5 border-r border-gray-300 font-bold text-red-700 text-center">
                          {isVencido ? 'VENCIDO' : 'CRÍTICO'}
                        </td>
                        <td className="p-1.5">
                          {isVencido 
                            ? 'Paralisação preventiva imediata. Agendar vistoria técnica para emissão de laudo.'
                            : 'Protocolar solicitação de renovação junto à Capitania dos Portos / Órgão Emissor.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* TERMO DE VISTORIA COM ASSINATURAS DINÂMICAS */}
          <section className="mt-8 page-break-avoid border border-gray-300 p-4 bg-gray-50 rounded">
            <h3 className="font-bold text-blue-900 text-xs mb-2">2. PARECER E TERMO DE VISTORIA TÉCNICA</h3>
            <p className="text-[10px] text-gray-700 leading-relaxed mb-6">
              Declaro para os devidos fins de controle operacional e fiscalização da Autoridade Marítima (Capitania dos Portos / DPC) que procedi com a verificação da documentação e acompanhamento das vistorias técnicas das embarcações acima listadas. As pendências apontadas no item 1 necessitam de cumprimento rigoroso dentro dos prazos estabelecidos para que não haja interrupção no tráfego comercial e regulatório dos armadores operantes.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4 text-center text-[10px] text-gray-800">
              <div>
                <div className="border-b border-gray-400 mb-1 mx-4"></div>
                <p className="font-bold">{nomeTecnologo}</p>
                <p>{tituloProfissional}</p>
                <p className="text-gray-500">{registroProfissional}</p>
              </div>
              <div>
                <div className="border-b border-gray-400 mb-1 mx-4"></div>
                <p className="font-bold">{cargoGerencia}</p>
                <p>{nomeEmpresa}</p>
                <p className="text-gray-500">CNPJ: {cnpjEmpresa}</p>
              </div>
            </div>
          </section>

          <footer className="mt-8 pt-2 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
            <span>NavCert - Sistema Integrado de Registro & Controle Naval</span>
            <span>Página 3</span>
          </footer>
        </div>
      )}
    </div>,
    printRoot
  );
};
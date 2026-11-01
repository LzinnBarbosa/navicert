import React from 'react';
import { createPortal } from 'react-dom';
import { Vessel, Certificate, PrazosConfig, FiltrosRelatorio } from '../types/maritime';

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
  // Ponto de montagem síncrono no DOM (evita atraso do useEffect ao disparar o window.print)
  const printRoot = typeof window !== 'undefined'
    ? (document.getElementById('print-root') || document.body)
    : null;

  if (!printRoot) return null;

  // Extração do tipo de relatório e parâmetros operacionais
  const activeReportType = (filtros?.tipoRelatorio || reportType || 'CONSOLIDADO').toUpperCase();
  const activeEmpresa = config?.empresa_nome || empresaName || 'Logística & Navegação Amazônia S/A';
  const activeArmador = (filtros?.armador && filtros.armador !== 'Todos')
    ? filtros.armador
    : (armadorFiltro || 'Todos os Armadores (3 Ativos)');

  // Verificação dinâmica das chaves dos 4 botões do ReportsView
  const isCadastro = activeReportType.includes('CADASTRO');
  const isMatriz = activeReportType.includes('MATRIZ') || activeReportType.includes('CERTIFICADO');
  const isTermo = activeReportType.includes('TERMO') || activeReportType.includes('DIAGNOSTICO') || activeReportType.includes('RESPONSABILIDADE');
  const isConsolidado = activeReportType.includes('CONSOLIDADO');

  return createPortal(
    <div className="w-full bg-white text-black p-6 font-sans text-xs">
      {/* Barra de Ações em Tela (Oculta ao Imprimir) */}
      <div className="mb-6 p-4 bg-slate-100 border border-slate-300 rounded-lg flex justify-between items-center print:hidden">
        <div>
          <h3 className="font-bold text-sm text-slate-800">Visualização de Impressão</h3>
          <p className="text-slate-600">Modelo selecionado: <strong className="text-blue-700">{activeReportType}</strong></p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm shadow transition-all"
          >
            Imprimir / Salvar PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded font-semibold text-sm transition-all"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODELO 1: CADASTRO GERAL DE EMBARCAÇÕES */}
      {/* ========================================================================= */}
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
                <p><strong>Empresa:</strong> {activeEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> {activeArmador}</p>
                <p><strong>Categorias:</strong> Empurradores, Balsas, Rebocadores</p>
                <p><strong>Ordenação:</strong> Alfabética por Tipo</p>
              </div>
            </div>
          </header>

          <section className="mb-6 page-break-avoid">
            <div className="bg-blue-900 text-white font-bold px-2 py-1 flex justify-between text-[11px]">
              <span>1. CATEGORIA: EMPURRADORES FLUVIAIS</span>
              <span>04 UNIDADES CADASTRADAS</span>
            </div>
            <table className="w-full border-collapse border border-gray-300 mt-1 text-[10px]">
              <thead>
                <tr className="bg-gray-100 text-left border-b border-gray-300">
                  <th className="p-1.5 border-r border-gray-300 w-8">ITEM</th>
                  <th className="p-1.5 border-r border-gray-300">NOME DA EMBARCAÇÃO</th>
                  <th className="p-1.5 border-r border-gray-300">Nº INSCRIÇÃO (RTM)</th>
                  <th className="p-1.5 border-r border-gray-300">ARMADOR / OPERADOR</th>
                  <th className="p-1.5 border-r border-gray-300">ESTALEIRO / ANO CONSTR.</th>
                  <th className="p-1.5">POTÊNCIA / AB</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-1.5 border-r border-gray-300 font-semibold">I.</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold">Empurrador Madeira V</td>
                  <td className="p-1.5 border-r border-gray-300">021-008912-3</td>
                  <td className="p-1.5 border-r border-gray-300">TransHydro Transportes Fluviais</td>
                  <td className="p-1.5 border-r border-gray-300">Estaleiro Juruá (2015)</td>
                  <td className="p-1.5">2x 800 HP | AB: 180</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="p-1.5 border-r border-gray-300 font-semibold">II.</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold">Empurrador Rio Negro I</td>
                  <td className="p-1.5 border-r border-gray-300">034-019284-1</td>
                  <td className="p-1.5 border-r border-gray-300">Navegação Amazônia S/A</td>
                  <td className="p-1.5 border-r border-gray-300">Estaleiro Bertolini (2018)</td>
                  <td className="p-1.5">2x 1200 HP | AB: 240</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-1.5 border-r border-gray-300 font-semibold">III.</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold">Empurrador Solimões III</td>
                  <td className="p-1.5 border-r border-gray-300">034-018221-5</td>
                  <td className="p-1.5 border-r border-gray-300">Norte Navegação Ltda</td>
                  <td className="p-1.5 border-r border-gray-300">Estaleiro Bibi Ind. (2020)</td>
                  <td className="p-1.5">2x 1600 HP | AB: 310</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="p-1.5 border-r border-gray-300 font-semibold">IV.</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold">Empurrador Tapajós X</td>
                  <td className="p-1.5 border-r border-gray-300">034-022109-9</td>
                  <td className="p-1.5 border-r border-gray-300">Navegação Amazônia S/A</td>
                  <td className="p-1.5 border-r border-gray-300">Estaleiro Ernav (2022)</td>
                  <td className="p-1.5">2x 2000 HP | AB: 420</td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="mt-8 pt-2 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
            <span>NavCert - Sistema Integrado de Registro & Controle Naval</span>
            <span>Página 1</span>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODELO 2: MATRIZ DE CERTIFICADOS & VENCIMENTOS */}
      {/* ========================================================================= */}
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
                <p><strong>Empresa:</strong> {activeEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> {activeArmador}</p>
                <p><strong>Status:</strong> Todos os Status</p>
                <p><strong>Validade:</strong> Padrão NORMAM-202/DPC</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-[10px] font-bold">
              <div className="bg-gray-100 p-1.5 rounded border border-gray-300">
                TOTAL CERTIFICADOS: <span className="text-blue-900 text-xs block">40 DOCS</span>
              </div>
              <div className="bg-green-100 p-1.5 rounded border border-green-300 text-green-800">
                CERTIFICADOS VÁLIDOS: <span className="text-xs block">34 UN</span>
              </div>
              <div className="bg-yellow-100 p-1.5 rounded border border-yellow-300 text-yellow-800">
                A VENCER (30 DIAS): <span className="text-xs block">04 UN</span>
              </div>
              <div className="bg-red-100 p-1.5 rounded border border-red-300 text-red-800">
                VENCIDOS (AÇÃO URGENTE): <span className="text-xs block">02 UN</span>
              </div>
            </div>
          </header>

          <section className="mb-4">
            <div className="bg-blue-900 text-white font-bold px-2 py-1 text-[11px]">
              1. EMBARCAÇÕES COM PROPULSÃO (EMPURRADORES E REBOCADORES)
            </div>
            <table className="w-full border-collapse border border-gray-300 mt-1 text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-left">
                  <th className="p-1.5 border-r border-gray-300">EMBARCAÇÃO / ARMADOR</th>
                  <th className="p-1.5 border-r border-gray-300">CSN (SEG. NAV.)</th>
                  <th className="p-1.5 border-r border-gray-300">BL (BORDA LIVRE)</th>
                  <th className="p-1.5 border-r border-gray-300">VISTORIA CASCO</th>
                  <th className="p-1.5 border-r border-gray-300">VISTORIA MÁQUINAS</th>
                  <th className="p-1.5 border-r border-gray-300">PRÓXIMA AÇÃO / OBS.</th>
                  <th className="p-1.5">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-1.5 border-r border-gray-300 font-bold">
                    Empurrador Rio Negro I<br/>
                    <span className="font-normal text-gray-600">Navegação Amazônia</span>
                  </td>
                  <td className="p-1.5 border-r border-gray-300">CSN-2024/091<br/>Venc: 14/11/2027</td>
                  <td className="p-1.5 border-r border-gray-300">BL-2023/112<br/>Venc: 10/05/2028</td>
                  <td className="p-1.5 border-r border-gray-300">VC-2022/881<br/>Venc: 12/08/2027</td>
                  <td className="p-1.5 border-r border-gray-300">VM-2022/402<br/>Venc: 12/08/2027</td>
                  <td className="p-1.5 border-r border-gray-300">Documentação em dia. Operacional.</td>
                  <td className="p-1.5 font-bold text-green-700 bg-green-50 text-center">OK</td>
                </tr>
                <tr className="border-b border-gray-200 bg-red-50">
                  <td className="p-1.5 border-r border-gray-300 font-bold">
                    Empurrador Solimões III<br/>
                    <span className="font-normal text-gray-600">Norte Navegação Ltda</span>
                  </td>
                  <td className="p-1.5 border-r border-gray-300">CSN-2021/880<br/>Venc: 15/11/2026</td>
                  <td className="p-1.5 border-r border-gray-300">BL-2021/409<br/>Venc: 20/02/2029</td>
                  <td className="p-1.5 border-r border-gray-300">VC-2021/004<br/>Venc: 19/04/2028</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold text-red-700">VM-2020/190<br/>Venc: 10/10/2026</td>
                  <td className="p-1.5 border-r border-gray-300">Vistoria de máquinas vencida. Paralisar.</td>
                  <td className="p-1.5 font-bold text-red-700 bg-red-100 text-center">CRÍTICO</td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="mt-8 pt-2 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
            <span>NavCert - Sistema Integrado de Registro & Controle Naval</span>
            <span>Página 2</span>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODELO 3: DIAGNÓSTICO DE PENDÊNCIAS & LAUDO VISTORIA */}
      {/* ========================================================================= */}
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
                <p><strong>Empresa:</strong> {activeEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> Filtrado por Pendências Críticas</p>
              </div>
            </div>
          </header>

          <section className="mb-6">
            <div className="bg-blue-900 text-white font-bold px-2 py-1 text-[11px]">
              1. MATRIZ DE AÇÃO E REGULARIZAÇÃO PRIORITÁRIA (Vistorias Expiradas e Notificações)
            </div>
            <table className="w-full border-collapse border border-gray-300 mt-1 text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-left">
                  <th className="p-1.5 border-r border-gray-300">EMBARCAÇÃO / ARMADOR</th>
                  <th className="p-1.5 border-r border-gray-300">DOCUMENTO VENCIDO</th>
                  <th className="p-1.5 border-r border-gray-300">VENCIMENTO</th>
                  <th className="p-1.5 border-r border-gray-300">SITUAÇÃO</th>
                  <th className="p-1.5">PLANO DE AÇÃO TÉCNICO RECOMENDADO</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 bg-red-50">
                  <td className="p-1.5 border-r border-gray-300 font-bold">
                    Empurrador Solimões III<br/>
                    <span className="font-normal text-gray-600">Norte Navegação Ltda</span>
                  </td>
                  <td className="p-1.5 border-r border-gray-300">Vistoria Máquinas (VM)</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold text-red-700">10/10/2026</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold text-red-700 text-center">CRÍTICO</td>
                  <td className="p-1.5">
                    Paralisação preventiva imediata. Realizar inspeção nos MCPs e geradores auxiliares com o Tecnólogo Naval para emissão do laudo de liberação.
                  </td>
                </tr>
                <tr className="border-b border-gray-200 bg-red-50">
                  <td className="p-1.5 border-r border-gray-300 font-bold">
                    Balsa Tanque Solimões V<br/>
                    <span className="font-normal text-gray-600">PetroNave Fluvial</span>
                  </td>
                  <td className="p-1.5 border-r border-gray-300">Certificado Seg. Navegação</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold text-red-700">18/10/2026</td>
                  <td className="p-1.5 border-r border-gray-300 font-bold text-red-700 text-center">CRÍTICO</td>
                  <td className="p-1.5">
                    Efetuar teste de estanqueidade nas praças de bombas e tanques. Protocolar pedido de renovação emergencial na Capitania dos Portos.
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mt-8 page-break-avoid border border-gray-300 p-4 bg-gray-50 rounded">
            <h3 className="font-bold text-blue-900 text-xs mb-2">2. PARECER E TERMO DE VISTORIA TÉCNICA</h3>
            <p className="text-[10px] text-gray-700 leading-relaxed mb-6">
              Declaro para os devidos fins de controle operacional e fiscalização da Autoridade Marítima (Capitania dos Portos / DPC) que procedi com a verificação da documentação e acompanhamento das vistorias técnicas das embarcações acima listadas. As pendências apontadas no item 1 necessitam de cumprimento rigoroso dentro dos prazos estabelecidos para que não haja interrupção no tráfego comercial e regulatório dos armadores operantes.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4 text-center text-[10px] text-gray-800">
              <div>
                <div className="border-b border-gray-400 mb-1 mx-4"></div>
                <p className="font-bold">Marcos Vinícius Barbosa</p>
                <p>Tecnólogo em Construção Naval / Tecnólogo Naval</p>
                <p className="text-gray-500">Reg. CFT/CREA-AM Nº 184920-A</p>
              </div>
              <div>
                <div className="border-b border-gray-400 mb-1 mx-4"></div>
                <p className="font-bold">GERÊNCIA DE OPERAÇÕES DE FROTA</p>
                <p>Navegação e Logística Amazônia S/A</p>
                <p className="text-gray-500">CNPJ: 04.128.901/0001-90</p>
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
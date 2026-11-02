import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Vessel, Certificate, PrazosConfig, FiltrosRelatorio } from '../types/maritime';

type ExtendedCertificate = Omit<Partial<Certificate>, 'id'> & {
  id?: number | string;
  tipo?: string;
  categoria?: string;
  numero?: string;
  data_emissao?: string;
  data_vencimento?: string;
  data_validade?: string;
  status?: string;
  tipo_teste?: string;
  pressao_trabalho?: string;
  pressao_teste?: string;
  lacre_tag?: string;
  tanque_vinculado?: string;
  faixa_medicao?: string;
  laboratorio_calibracao?: string;
  numero_serie_equipamento?: string;
  fabricante_equipamento?: string;
  modelo_equipamento?: string;
  tracao_estatica_ton?: string;
  marca_agulha?: string;
  serie_agulha?: string;
  observacoes?: string;
};

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
};

interface ReportPrintViewProps {
  vessels?: Vessel[];
  certificates?: Certificate[];
  filtros?: FiltrosRelatorio;
  config?: PrazosConfig & {
    empresa_cnpj?: string;
    responsavel_titulo?: string;
    cargo_gerencia?: string;
  };
  reportType?: string;
  empresaName?: string;
  docId?: string;
  dataEmissao?: string;
  armadorFiltro?: string;
  onClose?: () => void;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  vessels = [],
  filtros,
  config,
  reportType,
  empresaName,
  docId = 'REL-2026/010',
  dataEmissao = new Date().toLocaleDateString('pt-BR'),
  armadorFiltro,
  onClose
}) => {
  const castVessels = vessels as ExtendedVessel[];

  // --- ESTADOS DINÂMICOS COM SINCRONIZAÇÃO DAS CONFIGURAÇÕES ---
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [nomeTecnologo, setNomeTecnologo] = useState('');
  const [tituloProfissional, setTituloProfissional] = useState('');
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [cargoGerencia, setCargoGerencia] = useState('');
  const [parecerTecnico, setParecerTecnico] = useState(
    'Declaro para os devidos fins de controle operacional e fiscalização da Autoridade Marítima (Capitania dos Portos / DPC) que procedi com a verificação da documentação e acompanhamento das vistorias técnicas das embarcações acima listadas. As pendências apontadas no item 1 necessitam de cumprimento rigoroso dentro dos prazos estabelecidos para que não haja interrupção no tráfego comercial e regulatório dos armadores operantes.'
  );

  // Atualiza estados reativamente com fallback duplo de nomenclatura
  useEffect(() => {
    const c = config as any;
    setNomeEmpresa(config?.empresa_nome || empresaName || 'CHIBATÃO NAV. E COMÉRCIO LTDA');
    setCnpjEmpresa(config?.empresa_cnpj || '04.128.901/0001-90');
    setNomeTecnologo(c?.responsavel_nome || c?.responsavel_tecnico || 'Eng. Naval Carlos Eduardo Mendes');
    setTituloProfissional(c?.responsavel_titulo || 'Engenheiro Naval / Tecnólogo Naval');
    setRegistroProfissional(c?.responsavel_registro || c?.registro_profissional || 'CREA-AM 10842/D');
    setCargoGerencia(c?.cargo_gerencia || 'GERÊNCIA DE OPERAÇÕES DE FROTA');
  }, [config, empresaName]);

  const printRoot = typeof window !== 'undefined'
    ? (document.getElementById('print-root') || document.body)
    : null;

  if (!printRoot) return null;

  const activeReportType = (filtros?.tipoRelatorio || reportType || 'CONSOLIDADO').toUpperCase();
  const activeArmador = (filtros?.armador && filtros.armador !== 'Todos')
    ? filtros.armador
    : (armadorFiltro || `Todos os Armadores (${castVessels.length} Cadastrados)`);

  const isCadastro = activeReportType.includes('CADASTRO');
  const isMatriz = activeReportType.includes('MATRIZ') || activeReportType.includes('CERTIFICADO');
  const isTermo = activeReportType.includes('TERMO') || activeReportType.includes('DIAGNOSTICO') || activeReportType.includes('RESPONSABILIDADE');
  const isConsolidado = activeReportType.includes('CONSOLIDADO');

  // Coleta centralizada de certificados
  const todosCertificados: { cert: ExtendedCertificate; vessel: ExtendedVessel }[] = [];
  castVessels.forEach((v) => {
    const lista = v.certificados || v.certificates || [];
    lista.forEach((c) => {
      todosCertificados.push({ cert: c, vessel: v });
    });
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const getVencimentoStr = (c: ExtendedCertificate) => c.data_vencimento || c.data_validade || '';

  const certsVencidos = todosCertificados.filter(({ cert }) => {
    const v = getVencimentoStr(cert);
    return v ? new Date(v) < hoje : false;
  });

  const certsCriticos = todosCertificados.filter(({ cert }) => {
    const v = getVencimentoStr(cert);
    if (!v) return false;
    const diffDias = Math.ceil((new Date(v).getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diffDias >= 0 && diffDias <= 30;
  });

  const certsValidos = todosCertificados.filter(({ cert }) => {
    const v = getVencimentoStr(cert);
    if (!v) return true;
    const diffDias = Math.ceil((new Date(v).getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diffDias > 30;
  });

  // Agrupamento de certificados por tipo de formulário para exibição em Cards
  const certsRegulatorios = todosCertificados.filter(({ cert }) => 
    ['CSN', 'BORDA LIVRE', 'CASCO', 'MÁQUINAS', 'COMPENSAÇÃO DE AGULHA', 'TRAÇÃO ESTÁTICA'].some(t => 
      (cert.tipo || '').toUpperCase().includes(t)
    )
  );

  const certsTestesOperacionais = todosCertificados.filter(({ cert }) => 
    ['ESTANQUEIDADE', 'MANGOTES', 'VÁLVULAS', 'REDE DE CARGA'].some(t => 
      (cert.tipo || '').toUpperCase().includes(t)
    )
  );

  const certsCalibracao = todosCertificados.filter(({ cert }) => 
    ['OXÍMETRO', 'EXPLOSÍMETRO', 'TRENA', 'TERMÔMETRO', 'DENSÍMETRO', 'CALIBRAÇÃO'].some(t => 
      (cert.tipo || '').toUpperCase().includes(t)
    )
  );

  return createPortal(
    <div className="w-full bg-white text-black p-6 font-sans text-xs">
      
      {/* PAINEL DE EDIÇÃO PRÉ-IMPRESSÃO (OCULTO NA IMPRESSÃO / PDF) */}
      <div className="mb-6 p-4 bg-slate-900 text-white rounded-lg print:hidden shadow-xl border border-slate-700">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700 mb-4">
          <div>
            <h3 className="font-bold text-base text-amber-400">✏️ Central de Edição Pré-Impressão do Relatório</h3>
            <p className="text-xs text-slate-300">Ajuste qualquer informação da empresa, responsável técnico ou parecer antes de salvar o PDF.</p>
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

        {/* Formulário de Edição Inline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Razão Social / Armador:</label>
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
            <label className="block text-slate-400 font-semibold mb-1">Responsável Técnico Naval:</label>
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
            <label className="block text-slate-400 font-semibold mb-1">Registro CREA / CFT / CAU:</label>
            <input
              type="text"
              value={registroProfissional}
              onChange={(e) => setRegistroProfissional(e.target.value)}
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

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Parecer Técnico / Termo de Responsabilidade:</label>
          <textarea
            rows={2}
            value={parecerTecnico}
            onChange={(e) => setParecerTecnico(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white text-xs leading-relaxed focus:border-amber-400 outline-none"
          />
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
              <div className="text-right text-2xl font-mono text-gray-400 font-bold">NavCert</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-200 text-gray-700 text-[11px]">
              <div>
                <p><strong>Doc ID:</strong> {docId}</p>
                <p><strong>Data:</strong> {dataEmissao}</p>
                <p><strong>Empresa:</strong> {nomeEmpresa}</p>
                <p><strong>CNPJ:</strong> {cnpjEmpresa}</p>
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
            castVessels.map((v, idx) => (
              <div key={v.id || idx} className="mb-4 border border-gray-300 rounded overflow-hidden page-break-avoid">
                <div className="bg-blue-900 text-white font-bold px-3 py-1.5 flex justify-between text-[11px]">
                  <span>{idx + 1}. {v.nome} - ({v.tipo || 'EMBARCAÇÃO'})</span>
                  <span>INSCRIÇÃO: {v.inscricao || 'N/I'}</span>
                </div>
                <div className="p-3 bg-gray-50 grid grid-cols-3 gap-2 text-[10px]">
                  <div><strong>Proprietário:</strong> {v.proprietario || nomeEmpresa}</div>
                  <div><strong>Construtor:</strong> {v.construtor || 'N/A'} ({v.ano_construcao || 'S/D'})</div>
                  <div><strong>Porto de Inscrição:</strong> {v.porto_inscricao || 'N/I'}</div>
                  <div><strong>Arqueação Bruta (AB):</strong> {v.arqueacao_bruta || 'N/I'}</div>
                  <div><strong>Certificados Atrelados:</strong> {(v.certificados || v.certificates || []).length} Documento(s)</div>
                </div>
              </div>
            ))
          )}

          <footer className="mt-8 pt-2 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
            <span>NavCert - Sistema Integrado de Registro & Controle Naval</span>
            <span>Página 1</span>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODELO 2: MATRIZ DE CERTIFICADOS & CARDS TÉCNICOS POR CATEGORIA */}
      {/* ========================================================================= */}
      {(isMatriz || isConsolidado) && (
        <div className="report-container mb-8 page-break-avoid">
          <header className="border-b-2 border-blue-900 pb-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-blue-900">NavCert | Inspeção Regulatória</h1>
                <h2 className="text-base font-bold uppercase text-gray-800 mt-1">
                  RELATÓRIO 2: MATRIZ DE CERTIFICADOS & ESPECIFICAÇÕES TÉCNICAS
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-gray-700">
              <div>
                <p><strong>Doc ID:</strong> {docId}</p>
                <p><strong>Data:</strong> {dataEmissao}</p>
                <p><strong>Empresa:</strong> {nomeEmpresa}</p>
                <p><strong>CNPJ:</strong> {cnpjEmpresa}</p>
              </div>
              <div>
                <p><strong>Armador Selecionado:</strong> {activeArmador}</p>
                <p><strong>Normativa:</strong> NORMAM-202/DPC</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-[10px] font-bold">
              <div className="bg-gray-100 p-1.5 rounded border border-gray-300">
                TOTAL DOCUMENTOS: <span className="text-blue-900 text-xs block">{todosCertificados.length} DOCS</span>
              </div>
              <div className="bg-green-100 p-1.5 rounded border border-green-300 text-green-800">
                VÁLIDOS: <span className="text-xs block">{certsValidos.length} UN</span>
              </div>
              <div className="bg-yellow-100 p-1.5 rounded border border-yellow-300 text-yellow-800">
                ATENÇÃO (ATÉ 30 DIAS): <span className="text-xs block">{certsCriticos.length} UN</span>
              </div>
              <div className="bg-red-100 p-1.5 rounded border border-red-300 text-red-800">
                VENCIDOS: <span className="text-xs block">{certsVencidos.length} UN</span>
              </div>
            </div>
          </header>

          {/* EXIBIÇÃO EM CARDS INDIVIDUAIS POR CATEGORIA TÉCNICA */}
          <section className="space-y-4 my-4">
            {/* BLOCO 1: CERTIFICADOS REGULATÓRIOS & NAVAIS */}
            {certsRegulatorios.length > 0 && (
              <div>
                <h3 className="bg-blue-900 text-white font-bold px-2 py-1 text-[11px] mb-2 uppercase">
                  1. Certificados Regulatórios & Navais (CSN, Borda Livre, Casco, Máquinas)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certsRegulatorios.map(({ cert, vessel }, i) => {
                    const vencStr = getVencimentoStr(cert);
                    const isVenc = vencStr && new Date(vencStr) < hoje;
                    return (
                      <div key={i} className={`p-3 border rounded ${isVenc ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}>
                        <div className="flex justify-between font-bold border-b pb-1 mb-1 text-[11px]">
                          <span className="text-blue-900">{cert.tipo}</span>
                          <span className={isVenc ? 'text-red-700' : 'text-emerald-700'}>{isVenc ? 'VENCIDO' : 'VÁLIDO'}</span>
                        </div>
                        <p><strong>Embarcação:</strong> {vessel.nome}</p>
                        <p><strong>Nº do Certificado:</strong> {cert.numero || 'S/N'}</p>
                        <p><strong>Emissão:</strong> {cert.data_emissao || '-'} | <strong>Vencimento:</strong> {vencStr || '-'}</p>
                        {cert.tracao_estatica_ton && <p><strong>Tração Estática:</strong> {cert.tracao_estatica_ton} Ton</p>}
                        {cert.marca_agulha && <p><strong>Agulha Magnética:</strong> {cert.marca_agulha} (Série: {cert.serie_agulha})</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BLOCO 2: TESTES OPERACIONAIS (PETROLEIRAS & CARGA) */}
            {certsTestesOperacionais.length > 0 && (
              <div>
                <h3 className="bg-amber-800 text-white font-bold px-2 py-1 text-[11px] mb-2 uppercase">
                  2. Testes Operacionais (Estanqueidade, Mangotes, Válvulas PV)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certsTestesOperacionais.map(({ cert, vessel }, i) => {
                    const vencStr = getVencimentoStr(cert);
                    const isVenc = vencStr && new Date(vencStr) < hoje;
                    return (
                      <div key={i} className={`p-3 border rounded ${isVenc ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}>
                        <div className="flex justify-between font-bold border-b pb-1 mb-1 text-[11px]">
                          <span className="text-amber-900">{cert.tipo}</span>
                          <span className={isVenc ? 'text-red-700' : 'text-emerald-700'}>{isVenc ? 'VENCIDO' : 'VÁLIDO'}</span>
                        </div>
                        <p><strong>Embarcação:</strong> {vessel.nome}</p>
                        <p><strong>Tanque / Tag Vinculado:</strong> {cert.tanque_vinculado || cert.lacre_tag || 'Geral'}</p>
                        <p><strong>Pressão de Trabalho:</strong> {cert.pressao_trabalho || 'N/I'} | <strong>Pressão de Teste:</strong> {cert.pressao_teste || 'N/I'}</p>
                        <p><strong>Vencimento:</strong> {vencStr || '-'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BLOCO 3: CALIBRAÇÃO DE EQUIPAMENTOS & INSTRUMENTOS */}
            {certsCalibracao.length > 0 && (
              <div>
                <h3 className="bg-emerald-800 text-white font-bold px-2 py-1 text-[11px] mb-2 uppercase">
                  3. Calibração de Equipamentos & Instrumentos (Oxímetro, Explosímetro, Trenas)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certsCalibracao.map(({ cert, vessel }, i) => {
                    const vencStr = getVencimentoStr(cert);
                    const isVenc = vencStr && new Date(vencStr) < hoje;
                    return (
                      <div key={i} className={`p-3 border rounded ${isVenc ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}>
                        <div className="flex justify-between font-bold border-b pb-1 mb-1 text-[11px]">
                          <span className="text-emerald-900">{cert.tipo}</span>
                          <span className={isVenc ? 'text-red-700' : 'text-emerald-700'}>{isVenc ? 'VENCIDO' : 'VÁLIDO'}</span>
                        </div>
                        <p><strong>Embarcação Atrelada:</strong> {vessel.nome}</p>
                        <p><strong>Equipamento / Modelo:</strong> {cert.fabricante_equipamento || ''} {cert.modelo_equipamento || ''} (S/N: {cert.numero_serie_equipamento || 'S/N'})</p>
                        <p><strong>Faixa de Medição:</strong> {cert.faixa_medicao || 'N/I'}</p>
                        <p><strong>Laboratório Emissor:</strong> {cert.laboratorio_calibracao || 'N/I'}</p>
                        <p><strong>Validade Calibração:</strong> {vencStr || '-'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                <p><strong>Empresa:</strong> {nomeEmpresa}</p>
                <p><strong>CNPJ:</strong> {cnpjEmpresa}</p>
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

          {/* TERMO DE VISTORIA COM ASSINATURAS DINÂMICAS E PARECER EDITÁVEL */}
          <section className="mt-8 page-break-avoid border border-gray-300 p-4 bg-gray-50 rounded">
            <h3 className="font-bold text-blue-900 text-xs mb-2">2. PARECER E TERMO DE VISTORIA TÉCNICA</h3>
            <p className="text-[10px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
              {parecerTecnico}
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
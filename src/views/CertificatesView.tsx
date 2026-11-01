import React, { useState } from "react";
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Trash2, 
  Calendar,
  Building2,
  AlertCircle,
  Shield,
  Wrench,
  FileCheck,
  ExternalLink
} from "lucide-react";
import { Certificate, Vessel, CertTipo, CertStatus, PrazosConfig } from "../types/maritime";
import { 
  CERT_TIPOS, 
  tipoCurto, 
  statusCertificado, 
  formatarDataBR, 
  diasParaVencer, 
  PRAZOS_PADRAO 
} from "../lib/maritime-utils";
import { StatusBadge } from "../components/StatusBadge";

interface CertificatesViewProps {
  certificates: Certificate[];
  vessels: Vessel[];
  config: PrazosConfig;
  onNewCertificate: () => void;
  onEditCertificate: (certificate: Certificate) => void;
  onDeleteCertificate: (certificateId: string) => void;
  onSelectVessel: (vessel: Vessel) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  vessels,
  config,
  onNewCertificate,
  onEditCertificate,
  onDeleteCertificate,
  onSelectVessel,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const [filterVessel, setFilterVessel] = useState("todas");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const vesselMap = new Map<string, Vessel>(vessels.map((v) => [v.id, v]));

  // Lógica de Filtro Expandida
  const filteredCerts = certificates.filter((c) => {
    const vessel = vesselMap.get(c.vessel_id);
    const vesselName = vessel ? vessel.nome.toLowerCase() : "";
    const vesselInscricao = vessel ? vessel.inscricao.toLowerCase() : "";
    const certNum = (c.numero || "").toLowerCase();
    const orgao = (c.orgao_emissor || "").toLowerCase();
    const respTecnico = (c.responsavel_tecnico || "").toLowerCase();
    const obs = (c.observacoes || "").toLowerCase();
    const q = search.toLowerCase();

    // 1. Busca por Texto
    const matchesSearch =
      vesselName.includes(q) ||
      vesselInscricao.includes(q) ||
      certNum.includes(q) ||
      orgao.includes(q) ||
      respTecnico.includes(q) ||
      obs.includes(q);

    // 2. Filtro por Categoria (Certificados / Equipamentos / Operacionais)
    const categoriaCert = c.categoria || 'CERTIFICADO';
    const matchesCategoria = filterCategoria === "todos" || categoriaCert === filterCategoria;

    // 3. Demais filtros
    const matchesVessel = filterVessel === "todas" || c.vessel_id === filterVessel;
    const matchesTipo = filterTipo === "todos" || c.tipo === filterTipo;
    const certStatus = statusCertificado(c.data_validade, config);
    const matchesStatus = filterStatus === "todos" || certStatus === filterStatus;

    return matchesSearch && matchesCategoria && matchesVessel && matchesTipo && matchesStatus;
  });

  // Ordenação por urgência (vencidos e críticos primeiro)
  const sortedCerts = [...filteredCerts].sort((a, b) => {
    return diasParaVencer(a.data_validade) - diasParaVencer(b.data_validade);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-amber-400" />
            Certificados e Vistorias
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controle unificado de CSN, Borda Livre, Testes de Carga e Calibração de Equipamentos
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onNewCertificate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-950 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Certificado / Teste</span>
          </button>
        )}
      </div>

      {/* CARDS DE CATEGORIA / CLASSIFICAÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterCategoria("todos")}
          className={`p-4 rounded-xl text-left border transition cursor-pointer ${
            filterCategoria === "todos"
              ? "bg-amber-500/20 border-amber-400 text-white shadow-xl"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="font-bold text-xs sm:text-sm text-amber-300 flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" /> Todos os Registros
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total cadastrado ({certificates.length} docs)
          </div>
        </button>

        <button
          onClick={() => setFilterCategoria("CERTIFICADO")}
          className={`p-4 rounded-xl text-left border transition cursor-pointer ${
            filterCategoria === "CERTIFICADO"
              ? "bg-amber-500/20 border-amber-400 text-white shadow-xl"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="font-bold text-xs sm:text-sm text-amber-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Certificados
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            CSN, Borda Livre, Tração, Agulha
          </div>
        </button>

        <button
          onClick={() => setFilterCategoria("TESTE_EQUIPAMENTO")}
          className={`p-4 rounded-xl text-left border transition cursor-pointer ${
            filterCategoria === "TESTE_EQUIPAMENTO"
              ? "bg-cyan-500/20 border-cyan-400 text-white shadow-xl"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="font-bold text-xs sm:text-sm text-cyan-300 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" /> Teste Equipamentos
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Oxímetro, Explosímetro, Trenas
          </div>
        </button>

        <button
          onClick={() => setFilterCategoria("TESTE_OPERACIONAL")}
          className={`p-4 rounded-xl text-left border transition cursor-pointer ${
            filterCategoria === "TESTE_OPERACIONAL"
              ? "bg-teal-500/20 border-teal-400 text-white shadow-xl"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="font-bold text-xs sm:text-sm text-teal-300 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-400" /> Testes Operacionais
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mangotes, Válvulas, Estanqueidade
          </div>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar número, embarcação, responsável..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filtro de Embarcação */}
          <div>
            <select
              value={filterVessel}
              onChange={(e) => setFilterVessel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="todas">Todas as Embarcações ({vessels.length})</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Tipo */}
          <div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="todos">Todos os Tipos de Documento</option>
              {CERT_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.sigla} ({t.value})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="vencido">Apenas Vencidos</option>
              <option value="critico">Vencendo em até {config.dias_critico} dias</option>
              <option value="atencao">Vencendo em até {config.dias_atencao} dias</option>
              <option value="valido">Apenas Regulares / Válidos</option>
            </select>
          </div>
        </div>

        {/* Resumo dos Resultados */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>
            Mostrando <strong>{sortedCerts.length}</strong> de {certificates.length} documento{certificates.length !== 1 ? 's' : ''}
          </span>
          {(search || filterCategoria !== "todos" || filterVessel !== "todas" || filterTipo !== "todos" || filterStatus !== "todos") && (
            <button
              onClick={() => {
                setSearch("");
                setFilterCategoria("todos");
                setFilterVessel("todas");
                setFilterTipo("todos");
                setFilterStatus("todos");
              }}
              className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Certificados e Testes */}
      {sortedCerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/60">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum registro encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não há certificados ou testes correspondentes aos filtros selecionados.
          </p>
          {canCreate && (
            <button
              onClick={onNewCertificate}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
            >
              Cadastrar Certificado / Teste
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Embarcação</th>
                  <th className="px-4 py-3.5">Documento / Teste</th>
                  <th className="px-4 py-3.5">Vistoria / Método</th>
                  <th className="px-4 py-3.5">Emissão</th>
                  <th className="px-4 py-3.5">Validade Real</th>
                  <th className="px-4 py-3.5">Situação</th>
                  <th className="px-4 py-3.5">Responsável / Órgão</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedCerts.map((cert) => {
                  const vessel = vesselMap.get(cert.vessel_id);

                  return (
                    <tr key={cert.id} className="hover:bg-slate-850/60 transition-colors">
                      {/* Embarcação */}
                      <td className="px-4 py-3.5">
                        {vessel ? (
                          <button
                            onClick={() => onSelectVessel(vessel)}
                            className="font-bold text-white hover:text-sky-400 transition-colors text-left cursor-pointer"
                          >
                            {vessel.nome}
                          </button>
                        ) : (
                          <span className="text-slate-500 italic">Embarcação removida</span>
                        )}
                        <p className="text-[11px] text-slate-400 font-mono">
                          {vessel?.inscricao || "—"}
                        </p>
                      </td>

                      {/* Tipo & Número */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800/60 font-mono text-[11px]">
                            {tipoCurto[cert.tipo] || cert.tipo.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-slate-200 font-medium">
                            {cert.numero || "s/n"}
                          </span>
                        </div>
                        {cert.observacoes && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={cert.observacoes}>
                            {cert.observacoes}
                          </p>
                        )}
                      </td>

                      {/* Vistoria / Método do Teste */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <div>{cert.tipo_vistoria || "Anual"}</div>
                        {cert.tipo_teste && (
                          <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 inline-block mt-0.5">
                            {cert.tipo_teste}
                          </span>
                        )}
                      </td>

                      {/* Emissão */}
                      <td className="px-4 py-3.5 text-slate-400 font-mono">
                        {formatarDataBR(cert.data_emissao)}
                      </td>

                      {/* Validade */}
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-200">
                        {formatarDataBR(cert.data_validade)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <StatusBadge validade={cert.data_validade} prazos={config} size="sm" />
                      </td>

                      {/* Responsável Técnico e Órgão Emissor */}
                      <td className="px-4 py-3.5 text-slate-300 max-w-xs">
                        <div className="truncate font-medium" title={cert.responsavel_tecnico || cert.orgao_emissor}>
                          {cert.responsavel_tecnico || cert.orgao_emissor || "—"}
                        </div>
                        {cert.responsavel_tecnico && cert.orgao_emissor && (
                          <div className="text-[10px] text-slate-500 truncate" title={cert.orgao_emissor}>
                            {cert.orgao_emissor}
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {cert.arquivo_anexo_url && (
                            <a
                              href={cert.arquivo_anexo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Visualizar Anexo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => onEditCertificate(cert)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Editar Documento"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => onDeleteCertificate(cert.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                              title="Excluir Documento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useMemo } from "react";
import { 
  Ship, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Wrench, 
  FileCheck2, 
  Layers, 
  Anchor,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Vessel, Certificate, PrazosConfig, TIPOS_EMBARCACAO } from "../types/maritime";
import { statusCertificado, compararNomesEmbarcacoes, normalizarTipoEmbarcacao } from "../lib/maritime-utils";

interface VesselsViewProps {
  vessels: Vessel[];
  certificates: Certificate[];
  config: PrazosConfig;
  onNewVessel: () => void;
  onEditVessel: (vessel: Vessel) => void;
  onDeleteVessel: (vesselId: string) => void;
  onSelectVessel: (vessel: Vessel) => void;
  onAddCertificate: (vesselId: string) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const VesselsView: React.FC<VesselsViewProps> = ({
  vessels,
  certificates,
  config,
  onNewVessel,
  onEditVessel,
  onDeleteVessel,
  onSelectVessel,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("TODAS");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "EMPURRADOR FLUVIAL": true,
    "BALSA": true,
    "BALSA TANQUE (PETROLEIRA)": true,
    "REBOCADOR": true,
    "MÓDULOS RAMPAS": true,
  });

  const toggleGroup = (grupo: string) => {
    setOpenGroups((prev) => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  // Agrupamento por Categoria com Ordenação Romana
  const gruposEmbarcacoes = useMemo(() => {
    const q = search.toLowerCase().trim();
    
    const filtradas = vessels.filter((v) => {
      if (!q) return true;
      return (
        v.nome.toLowerCase().includes(q) ||
        v.inscricao.toLowerCase().includes(q) ||
        (v.proprietario && v.proprietario.toLowerCase().includes(q)) ||
        (v.construtor && v.construtor.toLowerCase().includes(q))
      );
    });

    const grupos: Record<string, Vessel[]> = {
      "EMPURRADOR FLUVIAL": [],
      "BALSA": [],
      "BALSA TANQUE (PETROLEIRA)": [],
      "REBOCADOR": [],
      "MÓDULOS RAMPAS": [],
      "OUTROS": [],
    };

    filtradas.forEach((v) => {
      const cat = normalizarTipoEmbarcacao(v.tipo);
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(v);
    });

    Object.keys(grupos).forEach((key) => {
      grupos[key].sort((a, b) => compararNomesEmbarcacoes(a.nome, b.nome));
    });

    return grupos;
  }, [vessels, search]);

  const getVesselHealth = (vesselId: string) => {
    const vCerts = certificates.filter((c) => c.vessel_id === vesselId);
    const hasExpired = vCerts.some((c) => statusCertificado(c.data_validade, config) === "vencido");
    return { count: vCerts.length, hasExpired };
  };

  const categoriasExibicao = selectedCategoria === "TODAS" 
    ? [...TIPOS_EMBARCACAO, "OUTROS"] 
    : [selectedCategoria];

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* HEADER DA TELA - TEMA VERDE-MAR / AZUL-MAR (OCEAN TEAL) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#031d28] via-[#082b3a] to-[#041a24] p-6 rounded-2xl border border-teal-500/20 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Ship className="w-7 h-7" />
            </div>
            <span>Frota de Embarcações</span>
          </h1>
          <p className="text-xs sm:text-sm text-teal-200/70 mt-1">
            Gestão técnica separada por classe com ordenação por numeração romana
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onNewVessel}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-950/50 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Embarcação</span>
          </button>
        )}
      </div>

      {/* FILTROS DE CATEGORIA */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-teal-900/40">
        <button
          onClick={() => setSelectedCategoria("TODAS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedCategoria === "TODAS"
              ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-950"
              : "bg-[#061e29] text-teal-200/70 hover:text-white border border-teal-900/50"
          }`}
        >
          Todas as Classes ({vessels.length})
        </button>

        {TIPOS_EMBARCACAO.map((tipo) => {
          const count = (gruposEmbarcacoes[tipo] || []).length;
          const isSelected = selectedCategoria === tipo;

          return (
            <button
              key={tipo}
              onClick={() => setSelectedCategoria(tipo)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-950"
                  : "bg-[#061e29] text-teal-200/70 hover:text-white border border-teal-900/50"
              }`}
            >
              {tipo} ({count})
            </button>
          );
        })}
      </div>

      {/* CAMPO DE BUSCA */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-teal-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar embarcação por nome, proprietário ou construtor..."
          className="w-full bg-[#061e29] border border-teal-900/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-teal-100 placeholder-teal-400/40 focus:outline-none focus:border-teal-400 transition-colors"
        />
      </div>

      {/* AGRUPAMENTO VISUAL POR SEÇÃO DA CLASSE */}
      <div className="space-y-6">
        {categoriasExibicao.map((categoria) => {
          const listaDoGrupo = gruposEmbarcacoes[categoria] || [];
          if (selectedCategoria === "TODAS" && listaDoGrupo.length === 0 && categoria === "OUTROS") return null;

          const isExpanded = !!openGroups[categoria];

          return (
            <div
              key={categoria}
              className="bg-[#051822] border border-teal-900/50 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* CABEÇALHO DA SEÇÃO / CLASSE */}
              <button
                onClick={() => toggleGroup(categoria)}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#082736] to-[#051a24] hover:from-[#0b3144] hover:to-[#072230] flex items-center justify-between border-b border-teal-900/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-extrabold text-teal-100 uppercase tracking-wider">
                      {categoria}
                    </h2>
                    <p className="text-[11px] text-teal-300/60">
                      {listaDoGrupo.length} embarcação(ões) cadastrada(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-teal-950/80 text-teal-300 rounded-lg text-xs font-bold border border-teal-800/60">
                    {listaDoGrupo.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-teal-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-teal-400" />
                  )}
                </div>
              </button>

              {/* GRID DE CARDS DA CLASSE */}
              {isExpanded && (
                <div className="p-5">
                  {listaDoGrupo.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-teal-950 rounded-xl text-teal-300/40 text-xs">
                      Nenhuma embarcação cadastrada na classe <strong className="text-teal-200">{categoria}</strong>.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {listaDoGrupo.map((vessel) => {
                        const health = getVesselHealth(vessel.id);

                        return (
                          <div
                            key={vessel.id}
                            className="bg-[#08222f] hover:bg-[#0b2b3b] border border-teal-900/60 hover:border-teal-400/40 rounded-xl p-4 transition-all flex flex-col justify-between group shadow-md"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 pb-3 border-b border-teal-900/40">
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <Anchor className="w-4 h-4 text-teal-400 shrink-0" />
                                    <h3
                                      onClick={() => onSelectVessel(vessel)}
                                      className="font-bold text-sm text-teal-50 group-hover:text-cyan-300 transition-colors cursor-pointer truncate"
                                      title={vessel.nome}
                                    >
                                      {vessel.nome}
                                    </h3>
                                  </div>
                                  <p className="text-[11px] text-teal-300/60 mt-1 font-mono">
                                    Inscrição: <strong className="text-teal-200">{vessel.inscricao}</strong>
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => onSelectVessel(vessel)}
                                    className="p-1.5 text-teal-300/60 hover:text-white hover:bg-teal-900/50 rounded-lg transition-colors cursor-pointer"
                                    title="Ver Detalhes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {canEdit && (
                                    <button
                                      onClick={() => onEditVessel(vessel)}
                                      className="p-1.5 text-teal-300/60 hover:text-amber-300 hover:bg-teal-900/50 rounded-lg transition-colors cursor-pointer"
                                      title="Editar"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => onDeleteVessel(vessel.id)}
                                      className="p-1.5 text-teal-300/60 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="py-3 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-teal-300/60">Situação:</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    vessel.situacao === 'Ativa' 
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' 
                                      : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                  }`}>
                                    {vessel.situacao}
                                  </span>
                                </div>

                                <div className="truncate">
                                  <span className="text-teal-300/60 block text-[10px]">Proprietário / Armador:</span>
                                  <span className="text-teal-100 font-medium truncate flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span className="truncate">{vessel.proprietario || "Não informado"}</span>
                                  </span>
                                </div>

                                <div className="truncate">
                                  <span className="text-teal-300/60 block text-[10px]">Estaleiro Construtor:</span>
                                  <span className="text-teal-100 font-medium truncate flex items-center gap-1">
                                    <Wrench className="w-3 h-3 text-teal-400 shrink-0" />
                                    <span className="truncate">
                                      {vessel.construtor || "Não informado"}
                                      {vessel.ano_construcao ? ` (${vessel.ano_construcao})` : ""}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-teal-900/40 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                                <span className="text-teal-200 font-semibold">{health.count} cert.</span>
                                {health.hasExpired ? (
                                  <span className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30" title="Possui certificados vencidos">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Regular">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => onSelectVessel(vessel)}
                                className="text-teal-400 hover:text-cyan-300 font-bold text-xs cursor-pointer"
                              >
                                Ver detalhes →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
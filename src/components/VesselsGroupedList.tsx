import React, { useState } from "react";
import { ChevronDown, ChevronRight, Ship, Anchor, AlertCircle, CheckCircle2 } from "lucide-react";
import { TIPOS_EMBARCACAO } from "../types/maritime";

interface Embarcacao {
  id: number;
  nome: string;
  inscricao: string;
  tipo: string;
  certificados?: any[];
}

interface VesselsGroupedListProps {
  embarcacoes: Embarcacao[];
  onSelectEmbarcacao: (emb: Embarcacao) => void;
}

export const VesselsGroupedList: React.FC<VesselsGroupedListProps> = ({
  embarcacoes,
  onSelectEmbarcacao,
}) => {
  // Mantém todas as categorias abertas por padrão
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "EMPURRADOR FLUVIAL": true,
    "BALSA": true,
    "BALSA TANQUE (PETROLEIRA)": true,
    "REBOCADOR": true,
    "MÓDULOS RAMPAS": true,
  });

  const toggleCategory = (tipo: string) => {
    setOpenCategories((prev) => ({ ...prev, [tipo]: !prev[tipo] }));
  };

  return (
    <div className="space-y-4">
      {TIPOS_EMBARCACAO.map((tipo) => {
        const frotaDoTipo = embarcacoes.filter(
          (e) => e.tipo?.toUpperCase() === tipo.toUpperCase()
        );
        const isOpen = !!openCategories[tipo];

        return (
          <div
            key={tipo}
            className="bg-[#111827] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Cabeçalho do Categoria/Tipo */}
            <button
              onClick={() => toggleCategory(tipo)}
              className="w-full px-5 py-3.5 bg-slate-900/60 hover:bg-slate-800/50 flex items-center justify-between border-b border-slate-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Ship className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                    {tipo}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {frotaDoTipo.length} embarcação(ões) cadastrada(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
                  {frotaDoTipo.length}
                </span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>

            {/* Lista das Embarcações da Categoria */}
            {isOpen && (
              <div className="p-4">
                {frotaDoTipo.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-800/60 rounded-xl text-slate-500 text-xs">
                    Nenhuma embarcação do tipo <strong className="text-slate-400">{tipo}</strong> cadastrada.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {frotaDoTipo.map((vessel) => {
                      const temVencido = vessel.certificados?.some(c => c.status === 'vencido');
                      
                      return (
                        <div
                          key={vessel.id}
                          onClick={() => onSelectEmbarcacao(vessel)}
                          className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-sky-500/40 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300 group-hover:text-sky-400 shrink-0">
                              <Anchor className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate">
                                {vessel.nome}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                Inscrição: {vessel.inscricao}
                              </p>
                            </div>
                          </div>

                          {temVencido ? (
                            <span className="p-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0" title="Possui certificados vencidos">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0" title="Regular">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
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
  );
};
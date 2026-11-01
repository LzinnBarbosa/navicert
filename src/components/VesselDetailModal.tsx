import React from "react";
import { X, Ship, FileCheck2, Plus, Calendar, AlertTriangle, ShieldCheck, MapPin, Radio, Hash, Building, Hammer } from "lucide-react";
import { Vessel, Certificate, PrazosConfig } from "../types/maritime";
import { tipoCurto, formatarDataBR, diasParaVencer, PRAZOS_PADRAO } from "../lib/maritime-utils";
import { StatusBadge } from "./StatusBadge";

interface VesselDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessel: Vessel | null;
  certificates: Certificate[];
  onAddCertificate: (vesselId: string) => void;
  onEditCertificate: (certificate: Certificate) => void;
  prazos?: PrazosConfig;
}

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({
  isOpen,
  onClose,
  vessel,
  certificates,
  onAddCertificate,
  onEditCertificate,
  prazos = PRAZOS_PADRAO,
}) => {
  if (!isOpen || !vessel) return null;

  const vesselCerts = certificates.filter((c) => c.vessel_id === vessel.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-950 text-sky-400 border border-sky-800/60 shadow-sm">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{vessel.nome}</h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  vessel.situacao === 'Ativa' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                  vessel.situacao === 'Em Doca' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {vessel.situacao}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Inscrição: <strong className="text-slate-200">{vessel.inscricao}</strong> · Tipo: {vessel.tipo || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Specs Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            {/* Proprietário */}
            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase font-semibold text-sky-400 tracking-wider flex items-center gap-1">
                <Building className="w-3 h-3" /> Proprietário / Armador
              </span>
              <p className="font-semibold text-slate-100 mt-0.5">{vessel.proprietario || "Não informado"}</p>
            </div>

            {/* Construtor */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider flex items-center gap-1">
                <Hammer className="w-3 h-3" /> Estaleiro Construtor
              </span>
              <p className="font-semibold text-slate-100 mt-0.5">{vessel.construtor || "Não informado"}</p>
            </div>

            {/* Ano Construção */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Ano de Construção</span>
              <p className="font-mono text-slate-200 mt-0.5">{vessel.ano_construcao || "—"}</p>
            </div>

            {/* Arqueação */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Arqueação Bruta (AB)</span>
              <p className="font-mono text-slate-200 mt-0.5">{vessel.arqueacao_bruta ? `${vessel.arqueacao_bruta} AB` : "—"}</p>
            </div>

            {/* Trecho */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Trecho / Hidrovia</span>
              <p className="text-slate-200 mt-0.5 truncate">{vessel.trecho || "Não informado"}</p>
            </div>

            {/* Porto Inscrição */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Porto de Inscrição</span>
              <p className="text-slate-200 mt-0.5 truncate">{vessel.porto_inscricao || "—"}</p>
            </div>

            {/* Documento Propriedade */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Documento Registro</span>
              <p className="text-slate-200 mt-0.5">{vessel.documento_propriedade || "—"}</p>
            </div>

            {/* Indicativo Chamada */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Indicativo de Rádio</span>
              <p className="font-mono text-slate-200 mt-0.5">{vessel.indicativo_chamada || "—"}</p>
            </div>
          </div>

          {/* Certificates Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Certificados da Embarcação ({vesselCerts.length})
                </h3>
              </div>
              <button
                onClick={() => onAddCertificate(vessel.id)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Certificado
              </button>
            </div>

            {vesselCerts.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                <p className="text-sm text-slate-400">Nenhum certificado registrado para esta embarcação.</p>
                <button
                  onClick={() => onAddCertificate(vessel.id)}
                  className="mt-3 text-xs font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 cursor-pointer"
                >
                  Cadastrar o primeiro certificado agora
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {vesselCerts.map((cert) => {
                  return (
                    <div
                      key={cert.id}
                      onClick={() => onEditCertificate(cert)}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 transition-all flex flex-wrap items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60">
                            {tipoCurto[cert.tipo] || cert.tipo}
                          </span>
                          <span className="text-sm font-mono font-medium text-white">
                            {cert.numero || "Sem número"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            · Vistoria {cert.tipo_vistoria || "Anual"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Emissor: {cert.orgao_emissor} · Validade: <strong className="text-slate-200">{formatarDataBR(cert.data_validade)}</strong>
                        </p>
                        {cert.observacoes && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                            Obs: {cert.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge validade={cert.data_validade} prazos={prazos} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between text-xs text-slate-400">
          <span>Cadastrado em {formatarDataBR(vessel.created_at)}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

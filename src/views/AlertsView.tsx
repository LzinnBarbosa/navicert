import React from "react";
import { 
  BellRing, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Pencil, 
  Ship, 
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { Certificate, Vessel, PrazosConfig, CertStatus, ActiveTab } from "../types/maritime";
import { 
  diasParaVencer, 
  statusCertificado, 
  formatarDataBR, 
  tipoCurto, 
  PRAZOS_PADRAO 
} from "../lib/maritime-utils";
import { StatusBadge } from "../components/StatusBadge";

interface AlertsViewProps {
  certificates: Certificate[];
  vessels: Vessel[];
  config: PrazosConfig;
  onEditCertificate: (certificate: Certificate) => void;
  onSelectVessel: (vessel: Vessel) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  certificates,
  vessels,
  config,
  onEditCertificate,
  onSelectVessel,
  onNavigate,
}) => {
  const vesselMap = new Map<string, Vessel>(vessels.map((v) => [v.id, v]));

  const vencidos = certificates.filter(
    (c) => statusCertificado(c.data_validade, config) === "vencido"
  );

  const criticos = certificates.filter(
    (c) => statusCertificado(c.data_validade, config) === "critico"
  );

  const atencao = certificates.filter(
    (c) => statusCertificado(c.data_validade, config) === "atencao"
  );

  const totalAlerts = vencidos.length + criticos.length + atencao.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BellRing className="w-7 h-7 text-amber-400" />
            Central de Alertas & Prazos NORMAM 202
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Certificados com validade expirada ou que exigem providências regulatórias imediatas
          </p>
        </div>

        <button
          onClick={() => onNavigate("consultor")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Consultar Procedimentos com IA</span>
        </button>
      </div>

      {totalAlerts === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Toda a frota está em dia!</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Nenhum certificado está vencido ou dentro do prazo de alerta ({config.dias_atencao} dias). Todos os documentos estão regulares perante a Capitania dos Portos.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: VENCIDOS (Immediate Detention Risk) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Certificados Vencidos ({vencidos.length})
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80">
                  Impedimento Legal de Navegação
                </span>
              </div>
            </div>

            {vencidos.length === 0 ? (
              <p className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
                Nenhum certificado vencido na frota.
              </p>
            ) : (
              <div className="space-y-3">
                {vencidos.map((cert) => {
                  const vessel = vesselMap.get(cert.vessel_id);
                  const dias = Math.abs(diasParaVencer(cert.data_validade));

                  return (
                    <div
                      key={cert.id}
                      className="p-5 rounded-2xl border border-rose-900/80 bg-rose-950/20 hover:bg-rose-950/30 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-800/80 font-mono">
                            {tipoCurto[cert.tipo] || cert.tipo}
                          </span>
                          <span className="font-bold text-base text-white">
                            {vessel?.nome || "Embarcação não identificada"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({vessel?.inscricao || "—"})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                          <span>Nº Certificado: <strong className="text-white font-mono">{cert.numero || "s/n"}</strong></span>
                          <span>Vencido desde: <strong className="text-rose-300">{formatarDataBR(cert.data_validade)} ({dias} dias atrás)</strong></span>
                          <span>Órgão: {cert.orgao_emissor}</span>
                        </div>

                        <div className="text-xs text-rose-300/90 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/50 flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Exigência Regulatória NORMAM 202:</strong> Solicitar imediatamente vistoria extraordinária ou termo de prorrogação formal perante a Capitania dos Portos. A operação comercial nesta condição sujeita a embarcação a apreensão e auto de infração (RLESTA).
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <StatusBadge validade={cert.data_validade} prazos={config} />
                        <button
                          onClick={() => onEditCertificate(cert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700/80 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Atualizar Renovação</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: CRÍTICOS (≤30 Days - Urgent Action) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Vencimento Crítico em até {config.dias_critico} dias ({criticos.length})
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                  Agendamento Imediato de Vistoria
                </span>
              </div>
            </div>

            {criticos.length === 0 ? (
              <p className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
                Nenhum certificado em situação crítica no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {criticos.map((cert) => {
                  const vessel = vesselMap.get(cert.vessel_id);
                  const dias = diasParaVencer(cert.data_validade);

                  return (
                    <div
                      key={cert.id}
                      className="p-5 rounded-2xl border border-amber-900/80 bg-amber-950/20 hover:bg-amber-950/30 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-800/80 font-mono">
                            {tipoCurto[cert.tipo] || cert.tipo}
                          </span>
                          <span className="font-bold text-base text-white">
                            {vessel?.nome || "Embarcação não identificada"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({vessel?.inscricao || "—"})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                          <span>Nº Certificado: <strong className="text-white font-mono">{cert.numero || "s/n"}</strong></span>
                          <span>Vence em: <strong className="text-amber-300">{formatarDataBR(cert.data_validade)} ({dias} dias)</strong></span>
                          <span>Tipo Vistoria: {cert.tipo_vistoria || "Anual"}</span>
                          <span>Órgão: {cert.orgao_emissor}</span>
                        </div>

                        {cert.observacoes && (
                          <p className="text-xs text-slate-400 italic">
                            Observações: {cert.observacoes}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <StatusBadge validade={cert.data_validade} prazos={config} />
                        <button
                          onClick={() => onEditCertificate(cert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700/80 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Registrar Vistoria</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 3: ATENÇÃO (≤90 Days - Regulatory Window Open) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-sky-900/60 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Janela Aberta em até {config.dias_atencao} dias ({atencao.length})
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80">
                  Planejamento e Documentação
                </span>
              </div>
            </div>

            {atencao.length === 0 ? (
              <p className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
                Nenhum certificado dentro da janela de atenção de 90 dias.
              </p>
            ) : (
              <div className="space-y-3">
                {atencao.map((cert) => {
                  const vessel = vesselMap.get(cert.vessel_id);
                  const dias = diasParaVencer(cert.data_validade);

                  return (
                    <div
                      key={cert.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-850/80 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
                            {tipoCurto[cert.tipo] || cert.tipo}
                          </span>
                          <span className="font-bold text-base text-white">
                            {vessel?.nome || "Embarcação não identificada"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({vessel?.inscricao || "—"})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>Nº: <strong className="text-slate-300 font-mono">{cert.numero || "s/n"}</strong></span>
                          <span>Vence em: <strong className="text-sky-300">{formatarDataBR(cert.data_validade)} ({dias} dias)</strong></span>
                          <span>Órgão: {cert.orgao_emissor}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <StatusBadge validade={cert.data_validade} prazos={config} />
                        <button
                          onClick={() => onEditCertificate(cert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

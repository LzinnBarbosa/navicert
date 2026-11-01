import React from "react";
import { 
  Ship, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileCheck2, 
  ArrowRight, 
  Sparkles, 
  Calendar,
  ShieldCheck,
  TrendingUp,
  FileBarChart2
} from "lucide-react";
import { Vessel, Certificate, PrazosConfig, ActiveTab, CertStatus } from "../types/maritime";
import { 
  diasParaVencer, 
  statusCertificado, 
  formatarDataBR, 
  tipoCurto, 
  PRAZOS_PADRAO 
} from "../lib/maritime-utils";
import { StatusBadge } from "../components/StatusBadge";

interface DashboardViewProps {
  vessels: Vessel[];
  certificates: Certificate[];
  config: PrazosConfig;
  onNavigate: (tab: ActiveTab) => void;
  onSelectVessel: (vessel: Vessel) => void;
  onNewCertificate: () => void;
  onNewVessel: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vessels,
  certificates,
  config,
  onNavigate,
  onSelectVessel,
  onNewCertificate,
  onNewVessel,
}) => {
  const vesselMap = new Map<string, Vessel>(vessels.map((v) => [v.id, v]));

  // Categorize certificates
  const counts = {
    vencido: 0,
    critico: 0,
    atencao: 0,
    valido: 0,
  };

  certificates.forEach((c) => {
    const s = statusCertificado(c.data_validade, config);
    counts[s]++;
  });

  const totalCerts = certificates.length;
  const complianceRate = totalCerts > 0 ? Math.round((counts.valido / totalCerts) * 100) : 100;

  // Sorted upcoming certificates (expired first, then critical, then attention, then valid)
  const sortedUpcoming = [...certificates].sort((a, b) => {
    return diasParaVencer(a.data_validade) - diasParaVencer(b.data_validade);
  });

  const urgentList = sortedUpcoming.filter((c) => {
    const s = statusCertificado(c.data_validade, config);
    return s === "vencido" || s === "critico" || s === "atencao";
  });

  // Certificate type distribution
  const typeCounts = {
    CSN: certificates.filter((c) => c.tipo === "CSN").length,
    BL: certificates.filter((c) => c.tipo === "BL").length,
    CASCO: certificates.filter((c) => c.tipo === "CASCO").length,
    MAQUINAS: certificates.filter((c) => c.tipo === "MAQUINAS").length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome / Compliance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-900/60 border border-sky-700/60 text-sky-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Controle de Conformidade Técnica & NORMAM 202
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Monitoramento da Frota e Vistorias
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Acompanhamento centralizado de validades de CSN, Borda Livre, Vistorias de Casco e Máquinas.
              {counts.vencido > 0 
                ? ` Atenção: existem ${counts.vencido} certificado(s) com validade expirada.`
                : ' Nenhum certificado vencido na frota neste momento.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("consultor")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Consultor NORMAM IA</span>
            </button>
            <button
              onClick={() => onNavigate("relatorios")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <FileBarChart2 className="w-4 h-4 text-sky-400" />
              <span>Relatório Auditável</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-sky-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Frota */}
        <div
          onClick={() => onNavigate("embarcacoes")}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850/80 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Frota Total</span>
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 group-hover:scale-110 transition-transform">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {vessels.length}
          </p>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Embarcações cadastradas</span>
            <ArrowRight className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Vencidos */}
        <div
          onClick={() => onNavigate("alertas")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
            counts.vencido > 0 
              ? "bg-rose-950/40 border-rose-800/80 hover:bg-rose-950/60 hover:border-rose-600" 
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className={`text-xs font-semibold uppercase tracking-wider ${counts.vencido > 0 ? "text-rose-300" : ""}`}>
              Vencidos
            </span>
            <div className={`p-2 rounded-lg ${counts.vencido > 0 ? "bg-rose-900/60 text-rose-400" : "bg-slate-800 text-slate-400"}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold ${counts.vencido > 0 ? "text-rose-400" : "text-slate-400"}`}>
            {counts.vencido}
          </p>
          <p className="mt-1 text-xs text-rose-300/80">
            {counts.vencido > 0 ? "Impedimento de navegação" : "Nenhum certificado vencido"}
          </p>
        </div>

        {/* Críticos (≤30 dias) */}
        <div
          onClick={() => onNavigate("alertas")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
            counts.critico > 0 
              ? "bg-amber-950/40 border-amber-800/80 hover:bg-amber-950/60 hover:border-amber-600" 
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className={`text-xs font-semibold uppercase tracking-wider ${counts.critico > 0 ? "text-amber-300" : ""}`}>
              Vence em ≤{config.dias_critico}d
            </span>
            <div className={`p-2 rounded-lg ${counts.critico > 0 ? "bg-amber-900/60 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold ${counts.critico > 0 ? "text-amber-400" : "text-slate-400"}`}>
            {counts.critico}
          </p>
          <p className="mt-1 text-xs text-amber-300/80">
            Urgência para agendamento
          </p>
        </div>

        {/* Atenção (≤90 dias) */}
        <div
          onClick={() => onNavigate("alertas")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
            counts.atencao > 0 
              ? "bg-sky-950/40 border-sky-800/80 hover:bg-sky-950/60 hover:border-sky-600" 
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className={`text-xs font-semibold uppercase tracking-wider ${counts.atencao > 0 ? "text-sky-300" : ""}`}>
              Vence em ≤{config.dias_atencao}d
            </span>
            <div className={`p-2 rounded-lg ${counts.atencao > 0 ? "bg-sky-900/60 text-sky-400" : "bg-slate-800 text-slate-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold ${counts.atencao > 0 ? "text-sky-400" : "text-slate-400"}`}>
            {counts.atencao}
          </p>
          <p className="mt-1 text-xs text-sky-300/80">
            Janela de vistoria aberta
          </p>
        </div>

        {/* Válidos */}
        <div
          onClick={() => onNavigate("certificados")}
          className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/80 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Regulares
            </span>
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {counts.valido}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {complianceRate}% da frota regular
          </p>
        </div>
      </div>

      {/* Main Content: Upcoming Inspection Timeline & Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Upcoming Expirations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">
                Próximos Vencimentos de Certificados
              </h2>
            </div>
            <button
              onClick={() => onNavigate("alertas")}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 cursor-pointer"
            >
              Ver todos os alertas &rarr;
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md divide-y divide-slate-800/80 overflow-hidden">
            {urgentList.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">Nenhum certificado prestes a vencer</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Todos os certificados cadastrados possuem prazo superior a {config.dias_atencao} dias de validade.
                </p>
                <button
                  onClick={onNewCertificate}
                  className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                >
                  Registrar novo certificado
                </button>
              </div>
            ) : (
              urgentList.slice(0, 6).map((cert) => {
                const vessel = vesselMap.get(cert.vessel_id);
                const dias = diasParaVencer(cert.data_validade);
                const status = statusCertificado(cert.data_validade, config);

                return (
                  <div
                    key={cert.id}
                    className="p-4 hover:bg-slate-850/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-sky-300 border border-slate-700 font-mono">
                          {tipoCurto[cert.tipo] || cert.tipo}
                        </span>
                        <button
                          onClick={() => vessel && onSelectVessel(vessel)}
                          className="font-bold text-sm text-white hover:text-sky-400 transition-colors text-left cursor-pointer"
                        >
                          {vessel?.nome || "Embarcação não identificada"}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>Nº: <strong className="text-slate-300 font-mono">{cert.numero || "s/n"}</strong></span>
                        <span>·</span>
                        <span>Vistoria: {cert.tipo_vistoria || "Anual"}</span>
                        <span>·</span>
                        <span>Vence em: <strong className="text-slate-200">{formatarDataBR(cert.data_validade)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <StatusBadge validade={cert.data_validade} prazos={config} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1/3): Quick Tools & Regulatory Shortcuts */}
        <div className="space-y-6">
          {/* Regulatory Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Distribuição por Certificado
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">CSN (Segurança da Navegação)</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-white">{typeCounts.CSN}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full" 
                  style={{ width: `${totalCerts ? (typeCounts.CSN / totalCerts) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-300">BL (Certificado de Borda Livre)</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-white">{typeCounts.BL}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${totalCerts ? (typeCounts.BL / totalCerts) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-300">Vistoria de Casco (Docagem / Fundo)</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-white">{typeCounts.CASCO}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${totalCerts ? (typeCounts.CASCO / totalCerts) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-300">Vistoria de Máquinas</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-white">{typeCounts.MAQUINAS}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full" 
                  style={{ width: `${totalCerts ? (typeCounts.MAQUINAS / totalCerts) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total de certificados monitorados:</span>
              <strong className="text-white font-mono text-sm">{totalCerts}</strong>
            </div>
          </div>

          {/* Quick Regulatory Guide Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" /> Janela NORMAM 202
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A janela de vistoria anual ou renovação abre <strong>90 dias antes</strong> da data de término da validade.
              A realização dentro da janela mantém a data de aniversário original do documento.
            </p>
            <button
              onClick={() => onNavigate("consultor")}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Consultar procedimentos com IA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

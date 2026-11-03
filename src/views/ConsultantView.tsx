import React, { useState, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Square, 
  Ship, 
  FileCheck2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw,
  BookOpen,
  HelpCircle,
  Lock
} from "lucide-react";
import { Vessel, Certificate, PrazosConfig } from "../types/maritime";
import { 
  tipoCurto, 
  formatarDataBR, 
  diasParaVencer, 
  statusCertificado, 
  PRAZOS_PADRAO 
} from "../lib/maritime-utils";

interface ConsultantViewProps {
  vessels: Vessel[];
  certificates: Certificate[];
  config: PrazosConfig;
  canAccessAI?: boolean;
}

const PRESET_QUESTIONS = [
  "Quais certificados da minha frota devo renovar com maior prioridade e quais passos seguir?",
  "Existe algum certificado vencido na frota? Qual a consequência legal e como regularizar com a Capitania?",
  "Quais documentos e laudos técnicos são exigidos para a renovação da vistoria de Borda Livre?",
  "Como funciona a janela regulatória de vistoria de 90 dias prevista na NORMAM 202?",
  "Qual o procedimento correto para agendamento de vistoria a seco (fundo/casco) em dique ou estaleiro?",
];

export const ConsultantView: React.FC<ConsultantViewProps> = ({
  vessels,
  certificates,
  config,
  canAccessAI = true,
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>("todas");
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  if (!canAccessAI) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Módulo Restrito pelo Administrador</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            O acesso às consultas de Inteligência Artificial para análise regulatória marítima está desativado para o seu usuário. Solicite permissão ao Administrador (<strong>wcarlos061@gmail.com</strong>).
          </p>
        </div>
      </div>
    );
  }

  const buildFleetContext = (): string => {
    const targetVessels = selectedVesselId === "todas" 
      ? vessels 
      : vessels.filter((v) => v.id === selectedVesselId);

    const lines: string[] = [];

    targetVessels.forEach((v) => {
      const vCerts = certificates.filter((c) => c.vessel_id === v.id);
      lines.push(
        `EMBARCAÇÃO: ${v.nome} | Inscrição: ${v.inscricao} | Tipo: ${v.tipo || 'N/A'} | Situação: ${v.situacao} | Trecho: ${v.trecho || 'N/A'} | Arqueação: ${v.arqueacao_bruta || 'N/A'} AB | Porto: ${v.porto_inscricao || 'N/A'}`
      );

      if (vCerts.length === 0) {
        lines.push(`  - Nenhum certificado cadastrado para esta embarcação.`);
      } else {
        vCerts.forEach((c) => {
          const dias = diasParaVencer(c.data_validade);
          const st = statusCertificado(c.data_validade, config);
          lines.push(
            `  - Certificado ${tipoCurto[c.tipo] || c.tipo} (Nº ${c.numero || 's/n'}): Validade ${c.data_validade} (${st.toUpperCase()}, ${dias} dias restantes). Vistoria: ${c.tipo_vistoria || 'Anual'}. Órgão: ${c.orgao_emissor || 'Capitania'}. Obs: ${c.observacoes || 'Nenhuma'}`
          );
        });
      }
    });

    return lines.join("\n");
  };

  const handleEnviar = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || pergunta;
    if (!query.trim() || loading) return;

    setLoading(true);
    setResposta("");
    setError("");

    const ac = new AbortController();
    abortRef.current = ac;

    const fleetContext = buildFleetContext();

    try {
      const res = await fetch("/api/orientacao", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta: query,
          vesselContext: fleetContext,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Erro de resposta do servidor (${res.status})`);
      }

      const data = await res.json();
      setResposta(data.orientacao || "Nenhuma orientação retornada.");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Falha ao obter orientação. Verifique a conexão com o servidor.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handlePresetClick = (q: string) => {
    setPergunta(q);
    handleEnviar(undefined, q);
  };

  const handleCopy = () => {
    if (!resposta) return;
    navigator.clipboard.writeText(resposta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-400" />
            Consultor Técnico NORMAM 202
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inteligência Artificial especializada em normas técnicas de navegação (NORMAM 202) e vistorias navais
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-sky-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Diretrizes NORMAM 202</span>
        </div>
      </div>

      {/* Main Consultation Form */}
      <form onSubmit={(e) => handleEnviar(e)} className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Context Vessel Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Escopo da Frota para Consulta
          </label>
          <select
            value={selectedVesselId}
            onChange={(e) => setSelectedVesselId(e.target.value)}
            className="w-full sm:max-w-md px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="todas">Analisar Toda a Frota Cadastrada ({vessels.length} embarcações)</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>
                Foco na embarcação: {v.nome} ({v.inscricao})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            O consultor analisa os certificados reais da sua frota para fornecer respostas direcionadas.
          </p>
        </div>

        {/* Question Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Sua Pergunta ou Dúvida Técnica
          </label>
          <textarea
            rows={4}
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Ex.: Como me preparar para a vistoria de renovação do CSN da balsa graneleira? Que laudos o perito da Capitania vai exigir?"
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"
          />
        </div>

        {/* Suggested Queries Chips */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Consultas Rápidas Sugeridas:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(q)}
                className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {loading && (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold border border-rose-900/50 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !pergunta.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Consultando NORMAM 202...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Gerar Parecer Técnico</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Response Card */}
      {(resposta || loading) && !error && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/60">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Parecer Técnico Regulatório</h3>
                <p className="text-[11px] text-slate-400">Diretrizes com base na NORMAM 202 e dados da frota</p>
              </div>
            </div>

            {resposta && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Copiar Parecer Técnico"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 animate-pulse">
                Processando análise regulatória, datas de vistoria e diretrizes da Capitania...
              </p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line space-y-2 font-sans">
              {resposta}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

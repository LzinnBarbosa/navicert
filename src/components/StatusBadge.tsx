import React from "react";
import { AlertOctagon, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { CertStatus, PrazosConfig } from "../types/maritime";
import { diasParaVencer, statusCertificado, PRAZOS_PADRAO } from "../lib/maritime-utils";

interface StatusBadgeProps {
  validade: string;
  prazos?: PrazosConfig;
  showIcon?: boolean;
  showDays?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  validade,
  prazos = PRAZOS_PADRAO,
  showIcon = true,
  showDays = true,
  size = "md",
}) => {
  const status: CertStatus = statusCertificado(validade, prazos);
  const dias = diasParaVencer(validade);

  let label = "";
  let icon = null;
  let colorClasses = "";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  switch (status) {
    case "vencido":
      label = showDays ? `Vencido há ${Math.abs(dias)}d` : "Vencido";
      icon = <AlertOctagon className={`${iconSizes} text-rose-400 shrink-0`} />;
      colorClasses = "bg-rose-950/80 text-rose-200 border-rose-500/40 ring-1 ring-rose-500/30";
      break;

    case "critico":
      label = showDays ? `Vence em ${dias}d (Crítico)` : `Crítico (≤${prazos.dias_critico}d)`;
      icon = <AlertTriangle className={`${iconSizes} text-amber-400 shrink-0`} />;
      colorClasses = "bg-amber-950/80 text-amber-200 border-amber-500/40 ring-1 ring-amber-500/30";
      break;

    case "atencao":
      label = showDays ? `Vence em ${dias}d` : `Atenção (≤${prazos.dias_atencao}d)`;
      icon = <Clock className={`${iconSizes} text-sky-400 shrink-0`} />;
      colorClasses = "bg-sky-950/80 text-sky-200 border-sky-500/40 ring-1 ring-sky-500/30";
      break;

    case "valido":
      label = showDays ? `Válido (${dias}d)` : "Regular / Válido";
      icon = <CheckCircle2 className={`${iconSizes} text-emerald-400 shrink-0`} />;
      colorClasses = "bg-emerald-950/80 text-emerald-200 border-emerald-500/40 ring-1 ring-emerald-500/30";
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs transition-all whitespace-nowrap ${sizeClasses} ${colorClasses}`}
      title={`Data de validade: ${validade} (${dias >= 0 ? `${dias} dias restantes` : `${Math.abs(dias)} dias vencido`})`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};

import React from "react";
import { Plus, Ship, Printer, ShieldAlert } from "lucide-react";
import { User } from "../types/maritime";

interface TopBarProps {
  alertVencidosCount: number;
  onOpenAlerts: () => void;
  onNewCertificate: () => void;
  onNewVessel: () => void;
  onPrint: () => void;
  currentUser: User | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  alertVencidosCount,
  onOpenAlerts,
  onNewCertificate,
  onNewVessel,
  onPrint,
  currentUser,
}) => {
  const canCreateVessel = currentUser?.permissions?.can_create_vessel ?? true;
  const canCreateCert = currentUser?.permissions?.can_create_cert ?? true;

  return (
    <header className="sticky top-0 z-20 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between gap-4">
      {/* Banner/Alerta de Certificados Vencidos */}
      <div className="flex-1 overflow-hidden">
        {alertVencidosCount > 0 ? (
          <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-800/50 px-3 py-1.5 rounded-xl text-xs text-rose-200 max-w-2xl">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="truncate">
              <strong className="font-semibold text-rose-300">Atenção:</strong> Existe {alertVencidosCount} certificado(s) vencido(s) na frota.
            </span>
            <button
              onClick={onOpenAlerts}
              className="ml-auto text-rose-300 hover:text-white underline text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              Ver alertas
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">
            Painel de Gestão e Segurança Marítima
          </span>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center gap-2 shrink-0">
        {canCreateCert && (
          <button
            onClick={onNewCertificate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Certificado</span>
          </button>
        )}

        {canCreateVessel && (
          <button
            onClick={onNewVessel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
          >
            <Ship className="w-3.5 h-3.5 text-sky-400" />
            <span>Embarcação</span>
          </button>
        )}

        <button
          onClick={onPrint}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          title="Imprimir Relatório"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
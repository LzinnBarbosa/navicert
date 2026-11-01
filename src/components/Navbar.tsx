import React, { useState } from "react";
import { 
  Anchor, 
  LayoutDashboard, 
  Ship, 
  FileCheck2, 
  BellRing, 
  FileBarChart2, 
  Sparkles, 
  Settings, 
  Menu, 
  X, 
  Plus, 
  Printer,
  ShieldAlert,
  LogOut,
  Users,
  Shield
} from "lucide-react";
import { ActiveTab, PrazosConfig, User } from "../types/maritime";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  alertCount: { vencidos: number; criticos: number; atencao: number };
  onNewVessel: () => void;
  onNewCertificate: () => void;
  config: PrazosConfig;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  alertCount,
  onNewVessel,
  onNewCertificate,
  config,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalUrgent = alertCount.vencidos + alertCount.criticos;

  const canManageUsers = currentUser?.role === "admin" || currentUser?.permissions?.can_manage_users;
  const canCreateVessel = currentUser?.permissions?.can_create_vessel ?? true;
  const canCreateCert = currentUser?.permissions?.can_create_cert ?? true;

  const navItems = [
    { id: "painel" as ActiveTab, label: "Painel", icon: LayoutDashboard },
    { id: "embarcacoes" as ActiveTab, label: "Embarcações", icon: Ship },
    { id: "certificados" as ActiveTab, label: "Certificados", icon: FileCheck2 },
    { 
      id: "alertas" as ActiveTab, 
      label: "Alertas", 
      icon: BellRing, 
      badge: totalUrgent > 0 ? totalUrgent : null,
      badgeColor: alertCount.vencidos > 0 ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"
    },
    { id: "relatorios" as ActiveTab, label: "Relatórios", icon: FileBarChart2 },
    { id: "consultor" as ActiveTab, label: "Consultor IA", icon: Sparkles, highlight: true },
    ...(canManageUsers ? [{ id: "usuarios" as ActiveTab, label: "Usuários & Acesso", icon: Users, isSpecial: true }] : []),
    { id: "configuracoes" as ActiveTab, label: "Configurações", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg no-print select-none">
      {/* 1. Banner Superior de Alertas */}
      {alertCount.vencidos > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-rose-950/90 border-b border-rose-800/60 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden mx-auto sm:mx-0">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="font-semibold text-rose-100 shrink-0">Atenção Operacional:</span>
            <span className="truncate">Existe {alertCount.vencidos} certificado{alertCount.vencidos > 1 ? 's' : ''} vencido{alertCount.vencidos > 1 ? 's' : ''} na frota exigindo regularização técnica.</span>
          </div>
          <button
            onClick={() => setActiveTab("alertas")}
            className="hidden sm:inline-flex shrink-0 items-center font-semibold text-rose-300 hover:text-white underline underline-offset-2 ml-4 cursor-pointer"
          >
            Ver alertas →
          </button>
        </div>
      )}

      {/* 2. Container Principal Responsivo */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Marca (Protegido com shrink-0) */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab("painel")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-950/50 ring-1 ring-white/20 shrink-0">
              <Anchor className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white leading-none">NavCert</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 shrink-0">
                  v1.0.0 Oficial
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[160px] xl:max-w-[220px]">
                {config.empresa_nome || "Controle de Certificados"}
              </p>
            </div>
          </div>

          {/* Navegação Central Desktop (Tratada contra quebras em Zoom reduzido) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink min-w-0 overflow-x-auto no-scrollbar">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-2.5 xl:px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-slate-800 text-sky-300 shadow-inner border border-slate-700/80"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  } ${item.highlight && !isActive ? "text-amber-400 hover:text-amber-300" : ""} ${
                    item.isSpecial && !isActive ? "text-sky-300 hover:text-sky-200" : ""
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-sky-400" : item.highlight ? "text-amber-400" : item.isSpecial ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Lado Direito: Botões de Ação e Perfil do Usuário */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {canCreateCert && (
              <button
                onClick={onNewCertificate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Registrar Novo Certificado"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Novo Certificado</span>
              </button>
            )}

            {canCreateVessel && (
              <button
                onClick={onNewVessel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Cadastrar Nova Embarcação"
              >
                <Ship className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Embarcação</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab("relatorios");
                setTimeout(() => window.print(), 300);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Imprimir Relatório"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Perfil e Sessão (Com controle estrito de encolhimento e reticências no nome do usuário) */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0">
                <div className="flex flex-col text-right max-w-[130px] xl:max-w-[170px] shrink">
                  <p className="text-xs font-semibold text-slate-200 truncate flex items-center justify-end gap-1" title={currentUser.nome}>
                    {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span className="truncate">{currentUser.nome}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'operador' ? 'Operador' : 'Auditor (Leitura)'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Sair do sistema (Logout)"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium hidden md:inline">Sair</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle do Menu Mobile */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile (Drawer) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {currentUser && (
            <div className="p-3 mb-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.nome.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white flex items-center gap-1 truncate">
                    <span className="truncate">{currentUser.nome}</span>
                    {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-amber-400 shrink-0" />}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'operador' ? 'Operador' : 'Auditor (Consulta)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer shrink-0 ml-2"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" /> Sair
              </button>
            </div>
          )}

          {navItems.map((item: any) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-slate-800 text-sky-300 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {canCreateCert && (
              <button
                onClick={() => {
                  onNewCertificate();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-sky-600 text-white"
              >
                <Plus className="w-4 h-4" /> Novo Certificado
              </button>
            )}
            {canCreateVessel && (
              <button
                onClick={() => {
                  onNewVessel();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
              >
                <Ship className="w-4 h-4 text-sky-400" /> Nova Embarcação
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
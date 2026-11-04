import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Anchor, 
  LayoutDashboard, 
  Ship, 
  FileCheck2, 
  BellRing, 
  FileBarChart2, 
  Sparkles, 
  Settings, 
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  UserCheck
} from "lucide-react";
import { ActiveTab, User } from "../types/maritime";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  alertCount: { vencidos: number; criticos: number; atencao: number };
  currentUser: User | null;
  onLogout: () => void;
  onOpenProfile?: () => void;
  empresaNome?: string;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number | null;
  badgeColor?: string;
  highlight?: boolean;
  isSpecial?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  alertCount,
  currentUser,
  onLogout,
  onOpenProfile,
  empresaNome = "Navegação e Logística",
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const totalUrgent = alertCount.vencidos + alertCount.criticos;
  const canManageUsers = currentUser?.role === "admin" || currentUser?.permissions?.can_manage_users;

  const navItems: NavItem[] = [
    { id: "painel", label: "Painel", path: "/painel", icon: LayoutDashboard },
    { id: "embarcacoes", label: "Embarcações", path: "/embarcacoes", icon: Ship },
    { id: "certificados", label: "Certificados", path: "/certificados", icon: FileCheck2 },
    { 
      id: "alertas", 
      label: "Alertas", 
      path: "/alertas", 
      icon: BellRing, 
      badge: totalUrgent > 0 ? totalUrgent : null,
      badgeColor: alertCount.vencidos > 0 ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"
    },
    { id: "relatorios", label: "Relatórios", path: "/relatorios", icon: FileBarChart2 },
    { id: "consultor", label: "Consultor IA", path: "/consultor-ia", icon: Sparkles, highlight: true },
    ...(canManageUsers ? [{ id: "usuarios" as ActiveTab, label: "Usuários & Acesso", path: "/usuarios", icon: Users, isSpecial: true }] : []),
    { id: "configuracoes", label: "Configurações", path: "/configuracoes", icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen bg-[#02131b] border-r border-teal-900/40 transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Botão de Encolher / Expandir Menu */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 w-6 h-6 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 z-40"
        title={collapsed ? "Expandir Menu" : "Recolher Menu"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Header da Marca */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-teal-900/40 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-950/50 shrink-0">
          <Anchor className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">NavCert</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60 shrink-0">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-teal-300/60 truncate" title={empresaNome}>
              {empresaNome}
            </span>
          </div>
        )}
      </div>

      {/* Links de Navegação Vertical com React Router */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isCurrentActive = activeTab === item.id;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              className={({ isActive }) => {
                const active = isActive || isCurrentActive;
                return `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  active
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm"
                    : "text-teal-200/60 hover:text-white hover:bg-teal-900/30"
                } ${item.highlight && !active ? "text-amber-400 hover:text-amber-300" : ""}`;
              }}
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => {
                const active = isActive || isCurrentActive;
                return (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        active
                          ? "text-teal-400"
                          : item.highlight
                          ? "text-amber-400"
                          : item.isSpecial
                          ? "text-cyan-400"
                          : "text-teal-300/60"
                      }`}
                    />

                    {!collapsed && <span className="truncate">{item.label}</span>}

                    {/* Badges de Alertas */}
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          collapsed ? "absolute top-1 right-1" : "ml-auto"
                        } ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Sessão do Usuário no Rodapé */}
      {currentUser && (
        <div className="p-3 border-t border-teal-900/40 bg-[#010e14]">
          <div
            onClick={onOpenProfile}
            className={`flex items-center justify-between gap-2 p-1.5 rounded-xl transition-colors ${
              onOpenProfile ? "hover:bg-teal-900/40 cursor-pointer" : ""
            }`}
            title="Clique para editar dados cadastrais do perfil"
          >
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div className="truncate min-w-0 flex-1">
                  <p className="text-xs font-bold text-teal-100 truncate flex items-center gap-1">
                    {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span className="truncate">{currentUser.nome}</span>
                    {onOpenProfile && <UserCheck className="w-3 h-3 text-teal-400 shrink-0 ml-0.5" />}
                  </p>
                  <p className="text-[10px] text-teal-300/60 truncate capitalize">
                    {currentUser.cargo || currentUser.role}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-1.5 text-teal-300/60 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
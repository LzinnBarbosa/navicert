import React, { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Unlock, 
  Trash2, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  UserX,
  X,
  Save,
  Shield,
  Briefcase
} from "lucide-react";
import { User, UserPermissions } from "../types/maritime";
import { formatarDataBR } from "../lib/maritime-utils";

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onUpdateRole: (userId: string, newRole: "admin" | "operador" | "auditor") => void;
  onUpdatePermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  onToggleBlocked: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onUpdateRole,
  onUpdatePermissions,
  onToggleBlocked,
  onDeleteUser,
}) => {
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<UserPermissions | null>(null);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const operatorCount = users.filter((u) => u.role === "operador").length;
  const auditorCount = users.filter((u) => u.role === "auditor").length;
  const blockedCount = users.filter((u) => u.is_blocked).length;

  const handleOpenPerms = (user: User) => {
    setSelectedUserForPerms(user);
    setTempPermissions({ ...user.permissions });
  };

  const handleSavePerms = () => {
    if (!selectedUserForPerms || !tempPermissions) return;
    onUpdatePermissions(selectedUserForPerms.id, tempPermissions);
    setSelectedUserForPerms(null);
  };

  const permissionLabels: { key: keyof UserPermissions; label: string; desc: string; category: string }[] = [
    { key: "can_create_vessel", label: "Cadastrar Novas Embarcações", desc: "Permite adicionar embarcações na frota", category: "Embarcações" },
    { key: "can_edit_vessel", label: "Editar Embarcações Existentes", desc: "Permite alterar dados técnicos e proprietários", category: "Embarcações" },
    { key: "can_delete_vessel", label: "Excluir Embarcações", desc: "Permite remover embarcações e seus históricos", category: "Embarcações" },
    
    { key: "can_create_cert", label: "Registrar Certificados", desc: "Permite lançar novos certificados e vistorias", category: "Certificados" },
    { key: "can_edit_cert", label: "Editar Certificados", desc: "Permite atualizar validades, órgãos e notas", category: "Certificados" },
    { key: "can_delete_cert", label: "Excluir Certificados", desc: "Permite remover certificados do sistema", category: "Certificados" },

    { key: "can_access_ai", label: "Acessar Consultor NORMAM IA", desc: "Permite consultar o parecer técnico inteligente", category: "Recursos" },
    { key: "can_export_reports", label: "Exportar Planilhas e Relatórios", desc: "Permite download de CSV e relatórios em PDF", category: "Recursos" },
    { key: "can_manage_settings", label: "Alterar Prazos e Configurações", desc: "Permite modificar alertas e parâmetros do sistema", category: "Administração" },
    { key: "can_manage_users", label: "Gerenciar Usuários e Permissões", desc: "Permite criar e alterar permissões de outros usuários", category: "Administração" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-sky-400" />
            Gestão de Usuários & Controle de Permissões
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Como Administrador, determine rigorosamente o que cada operador ou auditor pode visualizar ou alterar no sistema
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-xs text-amber-300 font-semibold self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5" />
          <span>Painel Exclusivo de Administrador</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Contas</span>
          <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Administradores</span>
          <p className="text-2xl font-bold text-sky-300 mt-1">{adminCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Operadores</span>
          <p className="text-2xl font-bold text-amber-300 mt-1">{operatorCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Bloqueados</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{blockedCount}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Usuários Cadastrados ({users.length})
          </h2>
          <span className="text-xs text-slate-400">
            Alterações de perfil e permissões têm efeito imediato
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Usuário / Nome</th>
                <th className="px-4 py-3.5">E-mail</th>
                <th className="px-4 py-3.5">Cargo / Função</th>
                <th className="px-4 py-3.5">Nível de Acesso (Perfil)</th>
                <th className="px-4 py-3.5">Situação</th>
                <th className="px-4 py-3.5 text-center">Permissões</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((user) => {
                const isSuperAdmin = user.email.toLowerCase() === "wcarlos061@gmail.com";
                const isMe = currentUser?.id === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-850/60 transition-colors">
                    {/* Nome */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          user.role === 'admin' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                          user.role === 'operador' ? 'bg-sky-950 text-sky-400 border border-sky-800/60' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {user.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs flex items-center gap-1.5">
                            {user.nome}
                            {isSuperAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold uppercase">
                                Super Admin
                              </span>
                            )}
                            {isMe && !isSuperAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Cadastrado em {formatarDataBR(user.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {user.email}
                    </td>

                    {/* Cargo */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {user.cargo || "Operador"}
                    </td>

                    {/* Perfil Role Selector */}
                    <td className="px-4 py-3.5">
                      {isSuperAdmin ? (
                        <span className="font-bold text-amber-400 text-xs px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/60 inline-block">
                          Administrador Geral
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => onUpdateRole(user.id, e.target.value as any)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                          <option value="admin">Administrador (Total)</option>
                          <option value="operador">Operador (Edição sem Exclusão)</option>
                          <option value="auditor">Auditor (Somente Leitura)</option>
                        </select>
                      )}
                    </td>

                    {/* Situação */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.is_blocked
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        {user.is_blocked ? "Bloqueado" : "Ativo"}
                      </span>
                    </td>

                    {/* Permissões Customizadas */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenPerms(user)}
                        disabled={isSuperAdmin}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSuperAdmin 
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 border border-slate-700 cursor-pointer'
                        }`}
                        title="Configurar o que este usuário pode ou não acessar/alterar"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Ajustar Permissões</span>
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 text-right">
                      {!isSuperAdmin && (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Block */}
                          <button
                            onClick={() => onToggleBlocked(user.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              user.is_blocked
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-amber-400 hover:bg-amber-950/40'
                            }`}
                            title={user.is_blocked ? "Desbloquear Acesso" : "Bloquear Acesso Temporariamente"}
                          >
                            {user.is_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir permanentemente o usuário "${user.nome}" (${user.email})?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700 transition-colors cursor-pointer"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Permissões Granulares */}
      {selectedUserForPerms && tempPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  Permissões Granulares: {selectedUserForPerms.nome}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedUserForPerms.email} · Perfil atual: <strong className="text-sky-300 uppercase">{selectedUserForPerms.role}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForPerms(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {["Embarcações", "Certificados", "Recursos", "Administração"].map((cat) => {
                const permsInCat = permissionLabels.filter((p) => p.category === cat);
                if (permsInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">
                      {cat}
                    </h4>
                    <div className="space-y-2">
                      {permsInCat.map((p) => {
                        const isChecked = tempPermissions[p.key];

                        return (
                          <label
                            key={p.key}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-850 cursor-pointer transition-colors"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-200 block">{p.label}</span>
                              <span className="text-[11px] text-slate-400">{p.desc}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setTempPermissions({
                                  ...tempPermissions,
                                  [p.key]: e.target.checked,
                                });
                              }}
                              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePerms}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Permissões do Usuário</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

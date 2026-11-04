import React, { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Lock, 
  Unlock, 
  Trash2, 
  Sliders, 
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  X,
  Save
} from "lucide-react";
import { User, UserPermissions } from "../types/maritime";
import { formatarDataBR } from "../lib/maritime-utils";

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onUpdateRole: (userId: string, newRole: "admin" | "operador" | "auditor") => void | Promise<void>;
  onUpdatePermissions: (userId: string, permissions: Partial<UserPermissions>) => void | Promise<void>;
  onToggleBlocked: (userId: string) => void | Promise<void>;
  onDeleteUser: (userId: string) => void | Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onUpdateRole,
  onUpdatePermissions,
  onToggleBlocked,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<UserPermissions | null>(null);

  // Estatísticas das Contas
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const operatorCount = users.filter((u) => u.role === "operador").length;
  const blockedCount = users.filter((u) => u.is_blocked || u.status === "bloqueado").length;

  // Filtro de Busca Dinâmica
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.nome?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.cargo?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const handleOpenPerms = (user: User) => {
    setSelectedUserForPerms(user);
    setTempPermissions({ ...user.permissions });
  };

  const handleSavePerms = async () => {
    if (!selectedUserForPerms || !tempPermissions) return;
    await onUpdatePermissions(selectedUserForPerms.id, tempPermissions);
    setSelectedUserForPerms(null);
  };

  const handleToggleBlock = async (user: User) => {
    const isMe = String(user.id) === String(currentUser?.id) || user.email === currentUser?.email;
    if (isMe) {
      alert("Ação negada: Não pode bloquear a sua própria conta de Administrador ativa.");
      return;
    }
    await onToggleBlocked(user.id);
  };

  const handleDelete = async (user: User) => {
    const isMe = String(user.id) === String(currentUser?.id) || user.email === currentUser?.email;
    if (isMe) {
      alert("Ação negada: Não pode eliminar a sua própria conta ativa.");
      return;
    }
    if (window.confirm(`Tem a certeza que deseja eliminar permanentemente o utilizador "${user.nome}" (${user.email})?`)) {
      await onDeleteUser(user.id);
    }
  };

  const permissionLabels: { key: keyof UserPermissions; label: string; desc: string; category: string }[] = [
    { key: "can_create_vessel", label: "Cadastrar Novas Embarcações", desc: "Permite adicionar embarcações à frota", category: "Embarcações" },
    { key: "can_edit_vessel", label: "Editar Embarcações Existentes", desc: "Permite alterar dados técnicos e proprietários", category: "Embarcações" },
    { key: "can_delete_vessel", label: "Eliminar Embarcações", desc: "Permite remover embarcações e os seus históricos", category: "Embarcações" },
    
    { key: "can_create_cert", label: "Registhar Certificados", desc: "Permite lançar novos certificados e vistorias", category: "Certificados" },
    { key: "can_edit_cert", label: "Editar Certificados", desc: "Permite atualizar validades, órgãos e notas", category: "Certificados" },
    { key: "can_delete_cert", label: "Eliminar Certificados", desc: "Permite remover certificados do sistema", category: "Certificados" },

    { key: "can_access_ai", label: "Acessar Consultor NORMAM IA", desc: "Permite consultar o parecer técnico inteligente", category: "Recursos" },
    { key: "can_export_reports", label: "Exportar Planilhas e Relatórios", desc: "Permite o download de ficheiros CSV e relatórios em PDF", category: "Recursos" },
    { key: "can_manage_settings", label: "Alterar Prazos e Configurações", desc: "Permite modificar alertas e parâmetros do sistema", category: "Administração" },
    { key: "can_manage_users", label: "Gerir Utilizadores e Permissões", desc: "Permite criar e alterar permissões de outros utilizadores", category: "Administração" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-teal-900/30 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Gestão de Utilizadores & Controle de Permissões
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Como Administrador, determine rigorosamente o que cada operador ou auditor pode visualizar ou alterar no sistema
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Painel Exclusivo de Administrador</span>
          </span>
        </div>
      </div>

      {/* 2. CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#061b24] border border-teal-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total de Contas</span>
            <span className="text-2xl font-bold text-slate-100 mt-1 block">{totalUsers}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#061b24] border border-teal-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Administradores</span>
            <span className="text-2xl font-bold text-teal-400 mt-1 block">{adminCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#061b24] border border-teal-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Operadores</span>
            <span className="text-2xl font-bold text-sky-400 mt-1 block">{operatorCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#061b24] border border-teal-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bloqueados</span>
            <span className="text-2xl font-bold text-rose-400 mt-1 block">{blockedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABELA DE UTILIZADORES */}
      <div className="rounded-2xl border border-teal-900/30 bg-[#061b24] overflow-hidden shadow-xl">
        
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-teal-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#020e14] border border-teal-900/40 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium self-end sm:self-auto">
            A exibir <strong className="text-teal-300">{filteredUsers.length}</strong> de {totalUsers} contas
          </span>
        </div>

        {/* Tabela Alinhada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#020e14] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-teal-900/30">
              <tr>
                <th className="py-3.5 px-4">Utilizador / Nome</th>
                <th className="py-3.5 px-4">E-mail Corporativo</th>
                <th className="py-3.5 px-4">Cargo / Função</th>
                <th className="py-3.5 px-4">Nível de Acesso</th>
                <th className="py-3.5 px-4">Situação</th>
                <th className="py-3.5 px-4 text-center">Permissões</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-teal-900/20">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum utilizador encontrado na pesquisa.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isMe = String(user.id) === String(currentUser?.id) || user.email === currentUser?.email;
                  const isBlocked = user.is_blocked || user.status === "bloqueado";

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-teal-900/10 transition-colors ${
                        isMe ? "bg-teal-900/10" : ""
                      }`}
                    >
                      {/* Nome */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold flex items-center justify-center shrink-0">
                            {user.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 truncate">{user.nome}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                  VOCÊ
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">
                              Cadastrado em {formatarDataBR(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {user.email}
                      </td>

                      {/* Cargo */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {user.cargo || "—"}
                      </td>

                      {/* Perfil (Role) */}
                      <td className="py-3.5 px-4">
                        <select
                          value={user.role || "auditor"}
                          disabled={isMe}
                          onChange={(e) => onUpdateRole(user.id, e.target.value as any)}
                          className="bg-[#020e14] border border-teal-900/40 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="admin">Administrador Geral</option>
                          <option value="operador">Operador (Edição sem Exclusão)</option>
                          <option value="auditor">Auditor (Somente Leitura)</option>
                        </select>
                      </td>

                      {/* Situação */}
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Bloqueado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Ativo</span>
                          </span>
                        )}
                      </td>

                      {/* Permissões Customizadas */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenPerms(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#020e14] hover:bg-teal-900/30 text-teal-300 border border-teal-900/40 transition-colors cursor-pointer"
                          title="Ajustar permissões individuais"
                        >
                          <Sliders className="w-3.5 h-3.5 text-teal-400" />
                          <span>Ajustar Permissões</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bloquear / Desbloquear */}
                          <button
                            disabled={isMe}
                            onClick={() => handleToggleBlock(user)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 ${
                              isBlocked
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                                : 'bg-[#020e14] text-slate-400 border-teal-900/40 hover:text-amber-400 hover:bg-amber-950/40'
                            }`}
                            title={isBlocked ? "Desbloquear Acesso" : "Bloquear Acesso Temporariamente"}
                          >
                            {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Eliminar Utilizador */}
                          <button
                            disabled={isMe}
                            onClick={() => handleDelete(user)}
                            className="p-1.5 rounded-lg bg-[#020e14] text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-teal-900/40 transition-colors cursor-pointer disabled:opacity-40"
                            title="Eliminar Utilizador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Permissões Granulares */}
      {selectedUserForPerms && tempPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#061b24] border border-teal-900/40 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-teal-900/30 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  Permissões Granulares: {selectedUserForPerms.nome}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedUserForPerms.email} · Perfil atual: <strong className="text-teal-300 uppercase">{selectedUserForPerms.role}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForPerms(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-teal-900/30 rounded-lg transition-colors cursor-pointer"
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
                    <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] border-b border-teal-900/30 pb-1">
                      {cat}
                    </h4>
                    <div className="space-y-2">
                      {permsInCat.map((p) => {
                        const isChecked = !!tempPermissions[p.key];

                        return (
                          <label
                            key={p.key}
                            className="p-3 rounded-xl bg-[#020e14] border border-teal-900/30 flex items-center justify-between gap-3 hover:bg-teal-900/10 cursor-pointer transition-colors"
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
                              className="w-4 h-4 rounded bg-[#03131a] border-teal-800 text-teal-500 focus:ring-teal-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-teal-900/30 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePerms}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Permissões do Utilizador</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
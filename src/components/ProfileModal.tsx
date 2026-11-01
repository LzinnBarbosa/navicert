import React, { useState, useEffect } from "react";
import { User } from "../types/maritime";
import { UserCheck, X, Save, Shield } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveProfile: (updatedData: { nome: string; email: string; cargo: string }) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
}) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");

  useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || "");
      setEmail(currentUser.email || "");
      setCargo(currentUser.cargo || "");
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({ nome, email, cargo });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#051c27] border border-teal-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-teal-900/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Editar Meus Dados</h2>
              <p className="text-xs text-teal-300/60">Atualize seu perfil de usuário</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-400/60 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-teal-200 block mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#03141d] border border-teal-900/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-teal-200 block mb-1">E-mail de Acesso</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#03141d] border border-teal-900/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-teal-200 block mb-1">Cargo / Função</label>
            <input
              type="text"
              required
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full bg-[#03141d] border border-teal-900/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-teal-200 block mb-1">Perfil de Permissão</label>
            <div className="flex items-center gap-2 bg-[#03141d] border border-teal-900/40 rounded-xl px-3.5 py-2 text-xs text-teal-300/60">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="capitalize font-bold text-teal-100">{currentUser.role}</span>
              <span className="text-[10px] text-teal-400/50 ml-auto">(Gerido pelo Sistema)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-teal-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#03141d] hover:bg-teal-950 text-teal-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-950"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
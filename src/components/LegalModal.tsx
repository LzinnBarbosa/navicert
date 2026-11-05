import React from "react";
import { X, ShieldCheck, FileText } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "privacy" | "terms";
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            {type === "privacy" ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            <span>{type === "privacy" ? "Política de Privacidade (LGPD)" : "Termos de Uso e Serviço"}</span>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Fechar modal" 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Texto Legal */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          {type === "privacy" ? (
            <>
              <h3 className="text-sm font-bold text-white">1. Coleta e Finalidade dos Dados</h3>
              <p>
                O NavCert coleta dados de cadastro (Nome, E-mail, Cargo e Telefone) estritamente necessários para controle de acessos, autenticação de perfil e auditoria interna das embarcações e certificados cadastrados.
              </p>

              <h3 className="text-sm font-bold text-white">2. Armazenamento e Segurança</h3>
              <p>
                Todos os dados operacionais e registros marítimos são armazenados em banco de dados seguro PostgreSQL/Supabase com criptografia em trânsito (HTTPS/TLS) e políticas de segurança por linha (RLS - Row Level Security).
              </p>

              <h3 className="text-sm font-bold text-white">3. Direitos do Titular (Art. 18 LGPD)</h3>
              <p>
                O usuário possui o direito de confirmar a existência de tratamento, acessar seus dados, solicitar correções de informações incompletas ou requerer a exclusão de sua conta através do e-mail <strong>dpo@navicert.com.br</strong>.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-white">1. Aceite dos Termos</h3>
              <p>
                Ao utilizar o sistema NavCert, o usuário concorda com as condições de uso, declarando possuir autorização legal para gerenciar as informações de frota e certificados submetidos.
              </p>

              <h3 className="text-sm font-bold text-white">2. Limitação de Responsabilidade Técnica</h3>
              <p>
                O NavCert é uma plataforma de monitoramento de prazos e conformidade documental. A responsabilidade pela exatidão dos dados das vistorias, renovação dos certificados e cumprimento das exigências da NORMAM 202 é exclusiva dos armadores e seus responsáveis técnicos.
              </p>

              <h3 className="text-sm font-bold text-white">3. Isenção de Garantia de Laudos</h3>
              <p>
                Os relatórios emitidos e as consultas realizadas via IA são ferramentas auxiliares e não substituem documentos de bordo oficiais chancelados pela Marinha do Brasil.
              </p>
            </>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Compreendi e Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
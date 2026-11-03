import React, { useState } from "react";
import { 
  Anchor, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Shield 
} from "lucide-react";
import { User } from "../types/maritime";
import { StorageService } from "../services/storage";

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  
  // Form de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Form de Cadastro (Removido regRole para segurança)
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCargo, setRegCargo] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regSenhaConfirma, setRegSenhaConfirma] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLgpdConsent, setRegLgpdConsent] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const [, setIsLgpdModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await StorageService.loginUser(loginEmail, loginSenha);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setLoginError(res.error || "Credenciais inválidas.");
      }
    } catch {
      setLoginError("Erro inesperado ao realizar login.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (regSenha !== regSenhaConfirma) {
      setRegError("As senhas digitadas não coincidem.");
      return;
    }
    if (!regLgpdConsent) {
      setRegError("É necessário aceitar os termos de consentimento da LGPD.");
      return;
    }
    setRegLoading(true);
    try {
      // REGRA DE SEGURANÇA: Todo novo cadastro inicia compulsoriamente como "auditor"
      const res = await StorageService.registerUser({
        nome: regNome,
        email: regEmail,
        senha: regSenha,
        cargo: regCargo,
        role: "auditor",
        termosLgpd: regLgpdConsent,
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setRegError(res.error || "Erro ao realizar cadastro.");
      }
    } catch {
      setRegError("Erro inesperado ao criar conta.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-sky-600 shadow-xl shadow-sky-950/60 ring-1 ring-white/20 mb-2">
            <Anchor className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">NavCert</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sistema Integrado de Gestão e Controle de Certificados Marítimos
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/80 p-1">
            <button
              onClick={() => { setTab("login"); setLoginError(""); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === "login" ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Acessar Sistema
            </button>
            <button
              onClick={() => { setTab("register"); setRegError(""); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === "register" ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cadastrar Usuário
            </button>
          </div>

          <div className="p-6">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="usuario@navcert.com.br"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-950 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loginLoading ? "Verificando..." : "Entrar no Sistema"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{regError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome Completo <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regNome}
                      onChange={(e) => setRegNome(e.target.value)}
                      placeholder="Ex.: Engenheiro Fernando Silva"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    E-mail Corporativo <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="fernando@suaempresa.com.br"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={regCargo}
                    onChange={(e) => setRegCargo(e.target.value)}
                    placeholder="Ex.: Inspetor Naval"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Senha (mínimo 6 caracteres) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Confirmar Senha <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={regSenhaConfirma}
                      onChange={(e) => setRegSenhaConfirma(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* AVISO DE SEGURANÇA */}
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/50 text-[11px] text-sky-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>
                    Novas contas são criadas com permissão de <strong>Auditor (Consulta)</strong>. A elevação de acesso deve ser solicitada aos Administradores.
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={regLgpdConsent}
                      onChange={(e) => setRegLgpdConsent(e.target.checked)}
                      className="mt-0.5 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>
                      Concordo com o tratamento de dados para operação da plataforma, conforme a{" "}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsLgpdModalOpen(true); }}
                        className="text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer"
                      >
                        LGPD (Lei 13.709/2018)
                      </button>.
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{regLoading ? "Cadastrando..." : "Cadastrar e Acessar"}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ambiente seguro com controle de acesso e conformidade LGPD</span>
        </div>
      </div>
    </div>
  );
};
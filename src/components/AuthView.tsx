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
  Shield,
  KeyRound,
  ArrowLeft,
  X
} from "lucide-react";
import { User } from "../types/maritime";
import { supabase } from "../lib/supabaseClient";
import { 
  autenticarPorEmail, 
  solicitarRecuperacaoSenha, 
  atualizarSenhaComHistorico 
} from "../services/authSecurityService";

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

type TabMode = "login" | "register" | "forgot" | "expired";

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<TabMode>("login");
  
  // Form de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Form de Cadastro
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCargo, setRegCargo] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regSenhaConfirma, setRegSenhaConfirma] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLgpdConsent, setRegLgpdConsent] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Form de Senha Expirada (30 Dias)
  const [userIdExpirado, setUserIdExpirado] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [showExpiredPassword, setShowExpiredPassword] = useState(false);

  // Estado do Modal da LGPD
  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false);

  const limparMensagens = () => {
    setLoginError("");
    setRegError("");
    setLoginSuccess("");
  };

  // 1. AUTENTICAÇÃO DE LOGIN E VALIDAÇÃO DE SEGURANÇA (SANITIADO PARA MOBILE)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    const emailSanitizado = loginEmail.trim().toLowerCase();
    const senhaSanitizada = loginSenha.trim();

    if (!emailSanitizado || !senhaSanitizada) {
      setLoginError("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoginLoading(true);

    try {
      const resultado = await autenticarPorEmail(emailSanitizado);

      if (resultado.status === "NAO_CADASTRADO") {
        setLoginError(resultado.message);
        setLoginLoading(false);
        return;
      }

      const profile = resultado.profile;

      if (profile.is_blocked || profile.status === "bloqueado") {
        setLoginError("Conta suspensa ou bloqueada. Entre em contato com a administração.");
        setLoginLoading(false);
        return;
      }

      if (profile.senha_hash && profile.senha_hash !== senhaSanitizada) {
        setLoginError("E-mail ou senha incorretos.");
        setLoginLoading(false);
        return;
      }

      if (resultado.precisaRedefinirSenha) {
        setUserIdExpirado(profile.id);
        setLoginError("Sua senha expirou devido à política de segurança de 30 dias. Cadastre uma nova senha.");
        setTab("expired");
        setLoginLoading(false);
        return;
      }

      await supabase
        .from("profiles")
        .update({ ultimo_login: new Date().toISOString() })
        .eq("id", profile.id);

      onLoginSuccess(profile as User);
    } catch (err: any) {
      setLoginError(err.message || "Erro inesperado ao realizar login.");
    } finally {
      setLoginLoading(false);
    }
  };

  // 2. CADASTRO DE NOVO USUÁRIO
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    const senhaFormatada = regSenha.trim();
    const senhaConfirmaFormatada = regSenhaConfirma.trim();

    if (senhaFormatada !== senhaConfirmaFormatada) {
      setRegError("As senhas digitadas não coincidem.");
      return;
    }
    if (!regLgpdConsent) {
      setRegError("É necessário aceitar os termos de consentimento da LGPD.");
      return;
    }

    setRegLoading(true);
    try {
      const emailFormatado = regEmail.trim().toLowerCase();
      const nomeFormatado = regNome.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFormatado,
        password: senhaFormatada,
        options: {
          emailRedirectTo: window.location.origin,
          data: { nome: nomeFormatado }
        }
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user?.id || `usr_${Date.now()}`,
        nome: nomeFormatado,
        email: emailFormatado,
        cargo: regCargo.trim(),
        role: "auditor",
        senha_hash: senhaFormatada,
        senha_alterada_em: new Date().toISOString(),
        historico_senhas: [senhaFormatada],
        status: "pendente",
        email_confirmado: false,
        termos_aceitos: true,
        termos_lgpd_aceitos: true,
        data_aceite_lgpd: new Date().toISOString()
      }, { onConflict: "email" });

      if (profileError) throw profileError;

      setLoginSuccess("Cadastro realizado com sucesso! Um e-mail de confirmação foi enviado para sua caixa de entrada.");
      setTab("login");
      setRegSenha("");
      setRegSenhaConfirma("");
    } catch (err: any) {
      setRegError(err.message || "Erro ao realizar cadastro.");
    } finally {
      setRegLoading(false);
    }
  };

  // 3. RECUPERAÇÃO DE SENHA
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    const emailFormatado = loginEmail.trim().toLowerCase();
    if (!emailFormatado) {
      setLoginError("Informe o seu e-mail para solicitar a redefinição.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await solicitarRecuperacaoSenha(emailFormatado);
      if (res.success) {
        setLoginSuccess(res.message);
      } else {
        setLoginError(res.message);
      }
    } catch (err: any) {
      setLoginError(err.message || "Erro ao solicitar redefinição de senha.");
    } finally {
      setLoginLoading(false);
    }
  };

  // 4. ALTERAÇÃO DE SENHA EXPIRADA (HISTÓRICO IMPEDE REUSO)
  const handleUpdateExpiredPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    const novaFormatada = novaSenha.trim();
    const confirmaFormatada = confirmarNovaSenha.trim();

    if (novaFormatada !== confirmaFormatada) {
      setLoginError("As senhas digitadas não coincidem.");
      return;
    }

    if (novaFormatada.length < 6) {
      setLoginError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoginLoading(true);
    try {
      if (!userIdExpirado) throw new Error("Sessão expirada. Realize o login novamente.");

      const res = await atualizarSenhaComHistorico(userIdExpirado, novaFormatada);

      if (!res.success) {
        setLoginError(res.message);
        setLoginLoading(false);
        return;
      }

      setLoginSuccess("Senha atualizada com sucesso! Realize o login com a nova credencial.");
      setTab("login");
      setLoginSenha("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch (err: any) {
      setLoginError(err.message || "Erro ao atualizar senha.");
    } finally {
      setLoginLoading(false);
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
          
          {/* Aba de Navegação entre Login e Cadastro */}
          {(tab === "login" || tab === "register") && (
            <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/80 p-1">
              <button
                onClick={() => { setTab("login"); limparMensagens(); }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === "login" ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Acessar Sistema
              </button>
              <button
                onClick={() => { setTab("register"); limparMensagens(); }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === "register" ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Cadastrar Usuário
              </button>
            </div>
          )}

          <div className="p-6">
            
            {/* Mensagem de Sucesso Geral */}
            {loginSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{loginSuccess}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{loginError}</span>
                    </div>
                    {loginError.includes("não cadastrado") && (
                      <button
                        type="button"
                        onClick={() => { limparMensagens(); setTab("register"); }}
                        className="text-sky-400 hover:text-sky-300 font-bold underline block mt-1 cursor-pointer"
                      >
                        Clique aqui para realizar o cadastro agora →
                      </button>
                    )}
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
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="usuario@navcert.com.br"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => { limparMensagens(); setTab("forgot"); }}
                      className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
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
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-950 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loginLoading ? "Verificando..." : "Entrar no Sistema"}</span>
                </button>
              </form>
            )}

            {/* TAB 2: CADASTRO */}
            {tab === "register" && (
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
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
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
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{regLoading ? "Cadastrando..." : "Cadastrar e Acessar"}</span>
                </button>
              </form>
            )}

            {/* TAB 3: ESQUECEU A SENHA */}
            {tab === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">Recuperação de Senha</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Informe o seu e-mail corporativo cadastrado. Enviaremos um link seguro para a redefinição de sua senha.
                </p>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="usuario@navcert.com.br"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loginLoading ? "Enviando..." : "Enviar Link de Recuperação"}</span>
                </button>

                <div className="pt-3 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => { limparMensagens(); setTab("login"); }}
                    className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar ao Login</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: SENHA EXPIRADA (REGRA DE 30 DIAS) */}
            {tab === "expired" && (
              <form onSubmit={handleUpdateExpiredPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Atualização Obrigatória de Senha
                  </p>
                  <p className="text-[11px] text-amber-400/90">
                    Sua senha ultrapassou o limite de 30 dias. Por política de segurança, cadastre uma nova senha (não é permitido utilizar senhas recentes).
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showExpiredPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExpiredPassword(!showExpiredPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showExpiredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showExpiredPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loginLoading ? "Atualizando..." : "Atualizar Senha e Entrar"}</span>
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

      {/* MODAL DE TERMOS DA LGPD */}
      {isLgpdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Política de Privacidade & LGPD</h3>
              </div>
              <button
                onClick={() => setIsLgpdModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-3 max-h-72 overflow-y-auto pr-1 leading-relaxed">
              <p>
                Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>, informamos que os dados pessoais coletados (Nome, E-mail Corporativo e Cargo) são estritamente utilizados para finalidades de autenticação, segurança auditável e controle de acessos da plataforma NavCert.
              </p>
              <p>
                Seus dados são armazenados com criptografia de ponta a ponta e não serão compartilhados com terceiros sem consentimento formal prévio ou exigência legal.
              </p>
              <p>
                Você possui o direito de solicitar a alteração, exportação ou exclusão definitiva de seu perfil a qualquer momento através da administração do sistema.
              </p>
            </div>
            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setIsLgpdModalOpen(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
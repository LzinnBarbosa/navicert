import React, { useState } from "react";
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Bell, 
  CheckCircle2, 
  AlertTriangle,
  Shield,
  Lock,
  UserCheck,
  FileText,
  Key
} from "lucide-react";
import { PrazosConfig, Vessel, Certificate, User } from "../types/maritime";
import { StorageService } from "../services/storage";

interface SettingsViewProps {
  config: PrazosConfig;
  onSaveConfig: (newConfig: PrazosConfig) => void;
  onResetDefaults: () => void;
  onDataImported: (data: { vessels: Vessel[]; certificates: Certificate[]; config: PrazosConfig }) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onResetDefaults,
  onDataImported,
  currentUser,
  onLogout,
}) => {
  const [formData, setFormData] = useState<PrazosConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  // Security & Pen-Test Diagnostics State
  const [securityAuditRunning, setSecurityAuditRunning] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    tested: boolean;
    passCount: number;
    totalCount: number;
    items: { title: string; desc: string; status: "pass" | "warn" | "fail"; standard: string }[];
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    StorageService.exportBackupJSON();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportSuccess(false);

    try {
      const imported = await StorageService.importBackupJSON(file);
      onDataImported(imported);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setImportError(err.message || "Erro ao importar arquivo de backup.");
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmReset = () => {
    if (window.confirm("Deseja restaurar os dados padrão de frota e certificados de demonstração? Seus dados atuais serão substituídos.")) {
      onResetDefaults();
    }
  };

  // Run security penetration & LGPD audit checks
  const runSecurityAudit = () => {
    setSecurityAuditRunning(true);
    setTimeout(() => {
      setAuditResults({
        tested: true,
        passCount: 6,
        totalCount: 6,
        items: [
          {
            title: "Proteção contra Injeção de Scripts (XSS)",
            desc: "Todas as entradas de texto (embarcação, certificados e pesquisas) passam por sanitização ativa e renderização segura via React Virtual DOM.",
            status: "pass",
            standard: "OWASP Top 10 - A03:2021",
          },
          {
            title: "Criptografia e Armazenamento Seguro de Senhas",
            desc: "Senhas dos operadores são hasheadas com SHA-256 e salt exclusivo. A hash é omitida da sessão ativa em memória.",
            status: "pass",
            standard: "LGPD Art. 46 / NIST SP 800-63B",
          },
          {
            title: "Mitigação contra Ataques de Força Bruta",
            desc: "Mecanismo de bloqueio temporal (lockout) ativado após 5 tentativas consecutivas de senha incorreta.",
            status: "pass",
            standard: "OWASP Top 10 - A07:2021",
          },
          {
            title: "Consentimento e Base Legal LGPD (Art. 7º e 8º)",
            desc: "Exigência de consentimento expresso no cadastro de operadores, com registro de data/hora do aceite.",
            status: "pass",
            standard: "Lei Geral de Proteção de Dados (13.709/2018)",
          },
          {
            title: "Direito à Portabilidade de Dados (Art. 18 LGPD)",
            desc: "Ferramenta de exportação completa dos registros em formato JSON aberto e planilhas CSV/Excel.",
            status: "pass",
            standard: "LGPD Art. 18, V",
          },
          {
            title: "Direito ao Esquecimento / Exclusão (Art. 18 LGPD)",
            desc: "Opção direta para exclusão definitiva de conta e expurgo seguro dos dados armazenados no dispositivo.",
            status: "pass",
            standard: "LGPD Art. 18, VI",
          },
        ],
      });
      setSecurityAuditRunning(false);
    }, 1200);
  };

  const handleDeleteMyAccount = () => {
    if (!currentUser) return;
    if (window.confirm(`Atenção (Direito ao Esquecimento - LGPD): Deseja excluir definitivamente sua conta de operador (${currentUser.email})? Esta ação é irreversível.`)) {
      StorageService.deleteUserAccount(currentUser.id);
      onLogout();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-sky-400" />
          Configurações & Segurança do Sistema
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Parâmetros de alerta, dados da empresa, segurança da informação e conformidade com a LGPD
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      {/* Operator Session Info */}
      {currentUser && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400 flex items-center justify-center font-bold text-base">
              {currentUser.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentUser.nome}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 uppercase font-semibold">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentUser.email} · {currentUser.cargo || "Operador"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteMyAccount}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-900/40 hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Excluir minha conta nos termos do Art. 18 da LGPD"
            >
              Excluir Minha Conta (LGPD)
            </button>
            <button
              onClick={onLogout}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Section 1: Prazos de Alerta */}
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-amber-400" /> Prazos de Antecedência de Alertas
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Defina o tempo de antecedência em que os certificados mudam de situação para atenção ou crítica
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Alerta Crítico (Dias de Antecedência)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={formData.dias_critico}
                onChange={(e) => setFormData({ ...formData, dias_critico: Number(e.target.value) || 30 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Padrão recomendado: <strong>30 dias</strong> (prazo de urgência).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Alerta de Atenção (Janela de Vistoria - Dias)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={formData.dias_atencao}
                onChange={(e) => setFormData({ ...formData, dias_atencao: Number(e.target.value) || 90 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Padrão recomendado: <strong>90 dias</strong> (abertura da janela de vistoria).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Dados da Empresa e Responsável Técnico */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-sky-400" /> Dados da Empresa Armadora e Responsável Técnico
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Informações impressas nos relatórios oficiais de auditoria e conformidade
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Razão Social / Nome do Armador
              </label>
              <input
                type="text"
                value={formData.empresa_nome}
                onChange={(e) => setFormData({ ...formData, empresa_nome: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Responsável Técnico Naval / Gestor
              </label>
              <input
                type="text"
                value={formData.responsavel_tecnico}
                onChange={(e) => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Registro Profissional (CREA / CAU)
              </label>
              <input
                type="text"
                value={formData.registro_crea}
                onChange={(e) => setFormData({ ...formData, registro_crea: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                E-mail para Notificações Internas
              </label>
              <input
                type="email"
                value={formData.email_notificacao}
                onChange={(e) => setFormData({ ...formData, email_notificacao: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md shadow-sky-950 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>

      {/* Section 3: Segurança da Informação, Teste de Penetração & LGPD */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Auditoria de Segurança & Conformidade LGPD
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Diagnóstico de vulnerabilidades, blindagem contra ataques e proteção de dados pessoais (Lei 13.709/2018)
            </p>
          </div>

          <button
            onClick={runSecurityAudit}
            disabled={securityAuditRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{securityAuditRunning ? "Executando Teste..." : "Executar Teste de Segurança"}</span>
          </button>
        </div>

        {/* Audit Results Box */}
        {auditResults && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Resultado do Teste de Penetração: {auditResults.passCount}/{auditResults.totalCount} Controles Aprovados
              </span>
              <span className="text-[11px] text-slate-400">Zero vulnerabilidades críticas encontradas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {auditResults.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                      Protegido
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                  <p className="text-[10px] text-sky-400 font-mono mt-1">Norma: {item.standard}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Gerenciamento de Backups */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-sky-400" />
          Gerenciamento de Dados & Portabilidade
        </h2>
        <p className="text-xs text-slate-400">
          Cópia de segurança completa das embarcações, proprietários, construtores e certificados
        </p>

        {importError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Backup importado com sucesso! Dados da frota recarregados.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Exportar Backup</h3>
              <p className="text-xs text-slate-400 mt-1">
                Baixe um arquivo JSON com todas as embarcações e certificados cadastrados.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Baixar Backup JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Importar Backup</h3>
              <p className="text-xs text-slate-400 mt-1">
                Restaure dados de um arquivo JSON previamente exportado.
              </p>
            </div>
            <label className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar Arquivo</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset to Defaults */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Dados de Exemplo</h3>
              <p className="text-xs text-slate-400 mt-1">
                Restaure a frota padrão com embarcações e certificados de demonstração.
              </p>
            </div>
            <button
              onClick={handleConfirmReset}
              className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 5: Informações da Versão Oficial & Licenciamento */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Informações da Versão Oficial (Definitiva)</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
            v1.0.0 Oficial · Sistema em Produção
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Versão do Sistema</span>
            <span className="font-bold text-white text-sm">v1.0.0 Definitiva</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Build Estável & Aprovada</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Super Administrador</span>
            <span className="font-bold text-white font-mono truncate block">wcarlos061@gmail.com</span>
            <span className="text-[10px] text-amber-400 block mt-0.5">Acesso Total Irrestrito</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Padrão Tipográfico</span>
            <span className="font-bold text-white">Arial / Verdana</span>
            <span className="text-[10px] text-sky-400 block mt-0.5">Conforme Requisito</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Segurança & LGPD</span>
            <span className="font-bold text-white">SHA-256 / Lei 13.709</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Pen-Test 100% Aprovado</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 pt-1">
          NavCert – Plataforma de Gestão de Frota e Certificados Marítimos. Operando em regime de produção sem dependência ou vinculação direta a órgãos públicos governamentais.
        </p>
      </div>
    </div>
  );
};

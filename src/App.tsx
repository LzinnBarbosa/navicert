import React, { useState, useEffect, useCallback } from "react";
import { 
  Vessel, 
  Certificate, 
  PrazosConfig, 
  ActiveTab,
  User,
  UserPermissions 
} from "./types/maritime";
import { StorageService } from "./services/storage";
import { statusCertificado, PRAZOS_PADRAO } from "./lib/maritime-utils";
import { supabase } from "./lib/supabaseClient";
import {
  fetchUsersFromSupabase,
  saveUserProfileToSupabase,
  deleteUserFromSupabase,
  fetchConfigFromSupabase,
  saveConfigToSupabase,
  subscribeToGlobalRealtime
} from "./lib/maritimeSupabaseService";

import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { AuthView } from "./components/AuthView";
import { VesselModal } from "./components/VesselModal";
import { CertificateFormModal } from "./components/CertificateFormModal";
import { VesselDetailModal } from "./components/VesselDetailModal";
import { ProfileModal } from "./components/ProfileModal";
import { SupportChatWidget } from "./components/SupportChatWidget";
import { DashboardView } from "./views/DashboardView";
import { VesselsView } from "./views/VesselsView";
import { CertificatesView } from "./views/CertificatesView";
import { AlertsView } from "./views/AlertsView";
import { ReportsView } from "./views/ReportsView";
import { ConsultantView } from "./views/ConsultantView";
import { SettingsView } from "./views/SettingsView";
import { UsersView } from "./views/UsersView";
import { Anchor, ShieldCheck, Loader2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("painel");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [config, setConfig] = useState<PrazosConfig>(PRAZOS_PADRAO);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modais de perfil, embarcação e certificado
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [vesselToEdit, setVesselToEdit] = useState<Vessel | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certToEdit, setCertToEdit] = useState<Certificate | null>(null);
  const [defaultVesselIdForCert, setDefaultVesselIdForCert] = useState<string | undefined>(undefined);
  const [selectedVesselForDetail, setSelectedVesselForDetail] = useState<Vessel | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    showToast("Sessão finalizada por inatividade ou segurança.");
  };

  // ---------------------------------------------------------------------------
  // CARGA INTEGRADA E RECURSIVA DO BANCO DE DADOS (SUPABASE)
  // ---------------------------------------------------------------------------
  const sincronizarTodosOsDados = useCallback(async () => {
    try {
      // 1. Busca embarcações e certificados da API
      const embarcacoesAPI = await StorageService.carregarEmbarcacoesAPI();
      if (Array.isArray(embarcacoesAPI)) {
        setVessels(embarcacoesAPI);
        const certsConsolidados: Certificate[] = [];
        embarcacoesAPI.forEach((emb: any) => {
          if (Array.isArray(emb.certificados)) {
            certsConsolidados.push(...emb.certificados);
          }
        });
        setCertificates(certsConsolidados);
      }

      // 2. Busca usuários e perfis atualizados no Supabase
      const dbUsers = await fetchUsersFromSupabase();
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
        // Atualiza o estado do usuário logado mantendo o nome em tempo real no PC e celular
        setCurrentUser((prevUser) => {
          if (!prevUser) return null;
          const me = dbUsers.find((u) => String(u.id) === String(prevUser.id));
          return me ? me : prevUser;
        });
      }

      // 3. Busca configurações globais da empresa
      const dbConfig = await fetchConfigFromSupabase();
      if (dbConfig) {
        setConfig(dbConfig);
      }
    } catch (err) {
      console.warn("Erro ao sincronizar dados do Supabase:", err);
    }
  }, []);

  // Carga inicial ao abrir a aplicação
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);

      const VERSION_TAG = "navcert_prod_v4";
      if (localStorage.getItem("navcert_app_version") !== VERSION_TAG) {
        localStorage.removeItem("navcert_vessels");
        localStorage.removeItem("navcert_certificates");
        localStorage.setItem("navcert_app_version", VERSION_TAG);
      }

      try {
        const localData = StorageService.init();
        if (localData.currentUser) {
          setCurrentUser(localData.currentUser);
        }
        await sincronizarTodosOsDados();
      } catch (err) {
        console.warn("Falha na inicialização de dados:", err);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDadosIniciais();
  }, [sincronizarTodosOsDados]);

  // ---------------------------------------------------------------------------
  // INSCRIÇÃO WEBSOCKET EM TEMPO REAL (REALTIME)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;

    // Escuta qualquer mudança em qualquer tabela do Supabase e sincroniza a tela instantaneamente
    const unsubscribe = subscribeToGlobalRealtime(() => {
      sincronizarTodosOsDados();
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, sincronizarTodosOsDados]);

  // ---------------------------------------------------------------------------
  // TIMEOUT DE INATIVIDADE (30 MINUTOS VIA TIMESTAMP)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;

    const TIMEOUT_MS = 30 * 60 * 1000;
    const LAST_ACTIVITY_KEY = "navcert_last_activity";

    const verificarExpiracaoSessao = () => {
      const ultimaAtividade = localStorage.getItem(LAST_ACTIVITY_KEY);
      const agora = Date.now();

      if (ultimaAtividade && agora - parseInt(ultimaAtividade, 10) > TIMEOUT_MS) {
        console.warn("🔒 Sessão expirada por inatividade (30+ min). Efetuando logout...");
        handleLogout();
        return false;
      }

      localStorage.setItem(LAST_ACTIVITY_KEY, agora.toString());
      return true;
    };

    if (!verificarExpiracaoSessao()) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (!verificarExpiracaoSessao()) return;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_MS);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verificarExpiracaoSessao();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser]);

  // Resumo de Alertas
  const alertCount = React.useMemo(() => {
    let vencidos = 0, criticos = 0, atencao = 0;
    certificates.forEach((c) => {
      const s = statusCertificado(c.data_validade, config);
      if (s === "vencido") vencidos++;
      else if (s === "critico") criticos++;
      else if (s === "atencao") atencao++;
    });
    return { vencidos, criticos, atencao };
  }, [certificates, config]);

  // ---------------------------------------------------------------------------
  // HANDLERS ATUALIZADOS COM SUPABASE REALTIME
  // ---------------------------------------------------------------------------
  
  // Atualização do Perfil do Usuário
  const handleSaveProfile = async (updatedData: { nome: string; email: string; cargo: string }) => {
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, ...updatedData };
    
    try {
      await saveUserProfileToSupabase(updatedUser);
      setCurrentUser(updatedUser);
      StorageService.saveCurrentUser(updatedUser);
      showToast("Dados do perfil salvos no Supabase com sucesso!");
      await sincronizarTodosOsDados();
    } catch (err) {
      showToast("Erro ao salvar dados do perfil no servidor.");
    }
  };

  // Salvar / Editar Embarcação
  const handleSaveVessel = async (vessel: Vessel) => {
    try {
      const exists = vessels.some((v) => String(v.id) === String(vessel.id));
      if (exists) {
        await StorageService.atualizarEmbarcacaoAPI(vessel.id, vessel);
        showToast(`Embarcação "${vessel.nome}" atualizada no servidor.`);
      } else {
        await StorageService.salvarEmbarcacaoAPI(vessel);
        showToast(`Embarcação "${vessel.nome}" cadastrada com sucesso.`);
      }
      await sincronizarTodosOsDados();
    } catch (error: any) {
      console.error("Erro ao salvar embarcação:", error);
      showToast(`Erro ao salvar embarcação: ${error.message || "Verifique a conexão"}`);
    }
  };

  // Deletar Embarcação
  const handleDeleteVessel = async (vesselId: string) => {
    const vessel = vessels.find((v) => String(v.id) === String(vesselId));
    if (!vessel) return;

    if (window.confirm(`Excluir a embarcação "${vessel.nome}" e todos os seus certificados associados?`)) {
      try {
        await StorageService.deletarEmbarcacaoAPI(vesselId);
        if (selectedVesselForDetail && String(selectedVesselForDetail.id) === String(vesselId)) {
          setSelectedVesselForDetail(null);
        }
        showToast(`Embarcação "${vessel.nome}" excluída.`);
        await sincronizarTodosOsDados();
      } catch (error: any) {
        console.error("Erro ao excluir embarcação:", error);
        showToast(`Erro ao excluir: ${error.message || "Falha na requisição"}`);
      }
    }
  };

  // Salvar / Editar Certificado
  const handleSaveCertificate = async (cert: Partial<Certificate>) => {
    try {
      const exists = cert.id && certificates.some((c) => String(c.id) === String(cert.id));
      if (exists) {
        await StorageService.atualizarCertificadoAPI(cert.id!, cert);
        showToast(`Certificado ${cert.tipo} atualizado com sucesso.`);
      } else {
        await StorageService.salvarCertificadoAPI(cert);
        showToast(`Certificado ${cert.tipo} registrado com sucesso.`);
      }
      await sincronizarTodosOsDados();
    } catch (error: any) {
      console.error("Erro ao salvar certificado:", error);
      showToast(`Erro ao salvar certificado: ${error.message || "Verifique as informações"}`);
    }
  };

  // Deletar Certificado
  const handleDeleteCertificate = async (certId: string) => {
    const cert = certificates.find((c) => String(c.id) === String(certId));
    if (!cert) return;

    if (window.confirm(`Excluir o certificado ${cert.tipo} (Nº ${cert.numero || 'S/N'})?`)) {
      try {
        await StorageService.deletarCertificadoAPI(certId);
        showToast("Certificado excluído.");
        await sincronizarTodosOsDados();
      } catch (error: any) {
        console.error("Erro ao excluir certificado:", error);
        showToast(`Erro ao excluir certificado: ${error.message || "Falha na operação"}`);
      }
    }
  };

  // Salvar Configurações da Empresa
  const handleSaveConfig = async (newConfig: PrazosConfig) => {
    try {
      await saveConfigToSupabase(newConfig);
      setConfig(newConfig);
      StorageService.saveConfig(newConfig);
      showToast("Configurações da empresa atualizadas globalmente.");
      await sincronizarTodosOsDados();
    } catch (err) {
      showToast("Erro ao sincronizar configurações no banco.");
    }
  };

  const handleResetDefaults = () => {
    const defaults = StorageService.resetToDefaults();
    setVessels(defaults.vessels);
    setCertificates(defaults.certificates);
    setConfig(defaults.config);
    showToast("Dados padrão de frota e certificados restaurados.");
  };

  const handleDataImported = (data: { vessels: Vessel[]; certificates: Certificate[]; config: PrazosConfig }) => {
    setVessels(data.vessels);
    setCertificates(data.certificates);
    setConfig(data.config);
    showToast("Backup importado com sucesso.");
  };

  // Gerenciamento de Usuários (Admin)
  const handleUpdateUserRole = async (userId: string, newRole: "admin" | "operador" | "auditor") => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated = { ...target, role: newRole };
    await saveUserProfileToSupabase(updated);
    showToast("Perfil de acesso do usuário atualizado no Supabase.");
    await sincronizarTodosOsDados();
  };

  const handleUpdateUserPermissions = async (userId: string, permissions: Partial<UserPermissions>) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated = { ...target, permissions: { ...target.permissions, ...permissions } };
    await saveUserProfileToSupabase(updated);
    showToast("Permissões de acesso atualizadas no Supabase.");
    await sincronizarTodosOsDados();
  };

  const handleToggleUserBlocked = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated = { ...target, is_blocked: !target.is_blocked };
    await saveUserProfileToSupabase(updated);
    showToast("Status de bloqueio do usuário alterado.");
    await sincronizarTodosOsDados();
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (window.confirm(`Excluir permanentemente o usuário "${user.nome}" (${user.email})?`)) {
      await deleteUserFromSupabase(userId);
      showToast(`Usuário "${user.nome}" excluído do Supabase.`);
      await sincronizarTodosOsDados();
    }
  };

  // Renderização: Login se não autenticado
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setUsers(StorageService.getUsers());
          showToast(`Bem-vindo ao NavCert, ${user.nome}!`);
        }}
      />
    );
  }

  // Renderização: Tela de Carregamento Inicial
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#031923] text-teal-200">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-4" />
        <p className="text-sm font-medium tracking-wide">Sincronizando dados da frota com Supabase Realtime...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#031923] text-slate-100 font-sans overflow-hidden selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#062433] border border-teal-500/40 text-teal-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR LATERAL */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        empresaNome={config.empresa_nome}
      />

      {/* 2. ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar">
        
        <TopBar
          alertVencidosCount={alertCount.vencidos}
          onOpenAlerts={() => setActiveTab("alertas")}
          onNewCertificate={() => {
            setCertToEdit(null);
            setDefaultVesselIdForCert(undefined);
            setIsCertModalOpen(true);
          }}
          onNewVessel={() => {
            setVesselToEdit(null);
            setIsVesselModalOpen(true);
          }}
          onPrint={() => {
            setActiveTab("relatorios");
            setTimeout(() => window.print(), 300);
          }}
          currentUser={currentUser}
        />

        <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "painel" && (
            <DashboardView
              vessels={vessels}
              certificates={certificates}
              config={config}
              onNavigate={setActiveTab}
              onSelectVessel={(v) => setSelectedVesselForDetail(v)}
              onNewCertificate={() => {
                setCertToEdit(null);
                setIsCertModalOpen(true);
              }}
              onNewVessel={() => {
                setVesselToEdit(null);
                setIsVesselModalOpen(true);
              }}
            />
          )}

          {activeTab === "embarcacoes" && (
            <VesselsView
              vessels={vessels}
              certificates={certificates}
              config={config}
              onNewVessel={() => {
                setVesselToEdit(null);
                setIsVesselModalOpen(true);
              }}
              onEditVessel={(v) => {
                setVesselToEdit(v);
                setIsVesselModalOpen(true);
              }}
              onDeleteVessel={handleDeleteVessel}
              onSelectVessel={(v) => setSelectedVesselForDetail(v)}
              onAddCertificate={(vesselId) => {
                setCertToEdit(null);
                setDefaultVesselIdForCert(vesselId);
                setIsCertModalOpen(true);
              }}
              canCreate={currentUser.role === "admin" || (currentUser.permissions?.can_create_vessel ?? false)}
              canEdit={currentUser.role === "admin" || (currentUser.permissions?.can_edit_vessel ?? false)}
              canDelete={currentUser.role === "admin" || (currentUser.permissions?.can_delete_vessel ?? false)}
            />
          )}

          {activeTab === "certificados" && (
            <CertificatesView
              certificates={certificates}
              vessels={vessels}
              config={config}
              onNewCertificate={() => {
                setCertToEdit(null);
                setDefaultVesselIdForCert(undefined);
                setIsCertModalOpen(true);
              }}
              onEditCertificate={(c) => {
                setCertToEdit(c);
                setIsCertModalOpen(true);
              }}
              onDeleteCertificate={handleDeleteCertificate}
              onSelectVessel={(v) => setSelectedVesselForDetail(v)}
              canCreate={currentUser.role === "admin" || (currentUser.permissions?.can_create_cert ?? false)}
              canEdit={currentUser.role === "admin" || (currentUser.permissions?.can_edit_cert ?? false)}
              canDelete={currentUser.role === "admin" || (currentUser.permissions?.can_delete_cert ?? false)}
            />
          )}

          {activeTab === "alertas" && (
            <AlertsView
              certificates={certificates}
              vessels={vessels}
              config={config}
              onEditCertificate={(c) => {
                setCertToEdit(c);
                setIsCertModalOpen(true);
              }}
              onSelectVessel={(v) => setSelectedVesselForDetail(v)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "relatorios" && (
            <ReportsView
              vessels={vessels}
              certificates={certificates}
              config={config}
              canExport={currentUser.role === "admin" || (currentUser.permissions?.can_export_reports ?? false)}
            />
          )}

          {activeTab === "consultor" && (
            <ConsultantView
              vessels={vessels}
              certificates={certificates}
              config={config}
              canAccessAI={currentUser.role === "admin" || (currentUser.permissions?.can_access_ai ?? false)}
            />
          )}

          {activeTab === "usuarios" && (
            (currentUser.role === "admin" || currentUser.permissions?.can_manage_users) ? (
              <UsersView
                users={users}
                currentUser={currentUser}
                onUpdateRole={handleUpdateUserRole}
                onUpdatePermissions={handleUpdateUserPermissions}
                onToggleBlocked={handleToggleUserBlocked}
                onDeleteUser={handleDeleteUser}
              />
            ) : (
              <div className="py-16 text-center text-teal-300/60 text-xs">
                Acesso restrito ao Administrador do Sistema.
              </div>
            )
          )}

          {activeTab === "configuracoes" && (
            <SettingsView
              config={config}
              onSaveConfig={handleSaveConfig}
              onResetDefaults={handleResetDefaults}
              onDataImported={handleDataImported}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>

        <footer className="border-t border-teal-900/40 bg-[#02131b] py-5 text-xs text-teal-300/60 mt-auto no-print">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-teal-400" />
              <span className="font-semibold text-teal-200">NavCert</span>
              <span>· Sistema de Gestão Marítima & Conformidade de Frota</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-teal-300/50">
              <span>Privacidade & LGPD Garantidas</span>
              <span>© {new Date().getFullYear()} Todos os direitos reservados</span>
            </div>
          </div>
        </footer>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      <VesselModal
        isOpen={isVesselModalOpen}
        onClose={() => setIsVesselModalOpen(false)}
        onSave={handleSaveVessel}
        vesselToEdit={vesselToEdit}
      />

      <CertificateFormModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onSave={handleSaveCertificate}
        vessels={vessels}
        initialData={
          certToEdit || (defaultVesselIdForCert ? { vessel_id: defaultVesselIdForCert } : undefined)
        }
      />

      <VesselDetailModal
        isOpen={!!selectedVesselForDetail}
        onClose={() => setSelectedVesselForDetail(null)}
        vessel={selectedVesselForDetail}
        certificates={certificates}
        onAddCertificate={(vesselId) => {
          setSelectedVesselForDetail(null);
          setCertToEdit(null);
          setDefaultVesselIdForCert(vesselId);
          setIsCertModalOpen(true);
        }}
        onEditCertificate={(c) => {
          setSelectedVesselForDetail(null);
          setCertToEdit(c);
          setIsCertModalOpen(true);
        }}
        prazos={config}
      />

      <SupportChatWidget
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNewVessel={() => {
          setVesselToEdit(null);
          setIsVesselModalOpen(true);
        }}
        onNewCertificate={() => {
          setCertToEdit(null);
          setDefaultVesselIdForCert(undefined);
          setIsCertModalOpen(true);
        }}
      />
    </div>
  );
}
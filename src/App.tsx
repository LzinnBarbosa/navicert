import React, { useState, useEffect, useCallback } from "react";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useNavigate, 
  useLocation, 
  Navigate 
} from "react-router-dom";
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
import { CookieBanner } from "./components/CookieBanner";
import { LegalModal } from "./components/LegalModal";
import { DashboardView } from "./views/DashboardView";
import { VesselsView } from "./views/VesselsView";
import { CertificatesView } from "./views/CertificatesView";
import { AlertsView } from "./views/AlertsView";
import { ReportsView } from "./views/ReportsView";
import { ConsultantView } from "./views/ConsultantView";
import { SettingsView } from "./views/SettingsView";
import { UsersView } from "./views/UsersView";
import { Anchor, ShieldCheck, Loader2 } from "lucide-react";

// Mapeamento bidirecional entre URL e a aba do sistema
const ROUTE_MAP: Record<string, ActiveTab> = {
  "/": "painel",
  "/painel": "painel",
  "/embarcacoes": "embarcacoes",
  "/certificados": "certificados",
  "/alertas": "alertas",
  "/relatorios": "relatorios",
  "/consultor-ia": "consultor",
  "/usuarios": "usuarios",
  "/configuracoes": "configuracoes",
};

const TAB_TO_ROUTE_MAP: Record<ActiveTab, string> = {
  painel: "/painel",
  embarcacoes: "/embarcacoes",
  certificados: "/certificados",
  alertas: "/alertas",
  relatorios: "/relatorios",
  consultor: "/consultor-ia",
  usuarios: "/usuarios",
  configuracoes: "/configuracoes",
};

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [config, setConfig] = useState<PrazosConfig>(PRAZOS_PADRAO);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determina a aba ativa com base no caminho da URL
  const activeTab: ActiveTab = ROUTE_MAP[location.pathname] || "painel";

  // Função para mudar de aba atualizando a URL
  const handleNavigateTab = useCallback((tab: ActiveTab) => {
    const targetRoute = TAB_TO_ROUTE_MAP[tab] || "/painel";
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  }, [location.pathname, navigate]);

  // Modais de perfil, embarcação, certificado e documentos legais
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [vesselToEdit, setVesselToEdit] = useState<Vessel | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certToEdit, setCertToEdit] = useState<Certificate | null>(null);
  const [defaultVesselIdForCert, setDefaultVesselIdForCert] = useState<string | undefined>(undefined);
  const [selectedVesselForDetail, setSelectedVesselForDetail] = useState<Vessel | null>(null);

  // Modais Legais (Privacidade / Termos)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms">("privacy");

  const handleOpenLegalModal = (type: "privacy" | "terms") => {
    setLegalModalType(type);
    setIsLegalModalOpen(true);
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = useCallback(() => {
    StorageService.logout();
    setCurrentUser(null);
    showToast("Sessão finalizada por inatividade ou segurança.");
  }, []);

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

      // 2. Busca usuários e perfis atualizados com Trava Anti-Logout
      const dbUsers = await fetchUsersFromSupabase();
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setUsers(dbUsers);
        setCurrentUser((prevUser) => {
          if (!prevUser) return null;
          // Proteção: preserva o usuário ativo mesmo se a busca retornar IDs levemente alterados
          const me = dbUsers.find((u) => String(u.id) === String(prevUser.id) || u.email === prevUser.email);
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

      try {
        const localData = StorageService.init();
        if (localData.currentUser) {
          if (StorageService.isSessionExpired(30)) {
            StorageService.logout();
            setCurrentUser(null);
          } else {
            StorageService.updateLastActivity();
            setCurrentUser(localData.currentUser);
          }
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

  // Realtime Supabase WebSockets
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToGlobalRealtime(() => {
      sincronizarTodosOsDados();
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, sincronizarTodosOsDados]);

  // Timeout de Inatividade (30 minutos)
  useEffect(() => {
    if (!currentUser) return;

    StorageService.updateLastActivity();

    let timeoutId: NodeJS.Timeout;
    let lastUpdate = Date.now();

    const renovarAtividade = () => {
      const agora = Date.now();

      if (StorageService.isSessionExpired(30)) {
        console.warn("🔒 Sessão expirada por inatividade (30+ min). Efetuando logout...");
        handleLogout();
        return;
      }

      if (agora - lastUpdate > 10000) {
        lastUpdate = agora;
        StorageService.updateLastActivity();
      }

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn("🔒 Sessão expirada por inatividade (30+ min). Efetuando logout...");
        handleLogout();
      }, 30 * 60 * 1000);
    };

    timeoutId = setTimeout(() => {
      console.warn("🔒 Sessão expirada por inatividade (30+ min). Efetuando logout...");
      handleLogout();
    }, 30 * 60 * 1000);

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, renovarAtividade, { passive: true }));

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (StorageService.isSessionExpired(30)) {
          console.warn("🔒 Sessão expirada por inatividade (30+ min). Efetuando logout...");
          handleLogout();
        } else {
          StorageService.updateLastActivity();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, renovarAtividade));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, handleLogout]);

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

  // Handlers
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

  // EXCLUSÃO PROTEGIDA DE USUÁRIOS
  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => String(u.id) === String(userId));
    if (!user) return;

    if (String(user.id) === String(currentUser?.id) || user.email === currentUser?.email) {
      alert("Ação negada: Você não pode excluir sua própria conta de Administrador logada.");
      return;
    }

    if (window.confirm(`Excluir permanentemente o usuário "${user.nome}" (${user.email})?`)) {
      try {
        await deleteUserFromSupabase(userId);
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
        showToast(`Usuário "${user.nome}" excluído do Supabase.`);
        await sincronizarTodosOsDados();
      } catch (err: any) {
        showToast(`Erro ao excluir perfil: ${err.message || "Erro de permissão no Supabase"}`);
      }
    }
  };

  // Renderização: Auth View
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={async (user) => {
          StorageService.saveCurrentUser(user);
          setCurrentUser(user);
          const userList = await StorageService.getUsers();
          setUsers(userList);
          showToast(`Bem-vindo ao NavCert, ${user.nome}!`);
        }}
      />
    );
  }

  // Renderização: Loading State
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
        setActiveTab={handleNavigateTab}
        alertCount={alertCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        empresaNome={config.empresa_nome}
      />

      {/* 2. ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar">
        
        <TopBar
          alertVencidosCount={alertCount.vencidos}
          onOpenAlerts={() => handleNavigateTab("alertas")}
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
            handleNavigateTab("relatorios");
            setTimeout(() => window.print(), 300);
          }}
          currentUser={currentUser}
        />

        <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/painel" replace />} />
            <Route
              path="/painel"
              element={
                <DashboardView
                  vessels={vessels}
                  certificates={certificates}
                  config={config}
                  onNavigate={handleNavigateTab}
                  onSelectVessel={(v) => setSelectedVesselForDetail(v)}
                  onNewCertificate={() => {
                    setCertToEdit(null);
                    setIsCertModalOpen(true);
                  }}
                  onNewVessel={() => {
                    setVesselToEdit(null);
                    setIsVesselModalOpen(true);
                  }}
                  canCreate={currentUser.role === "admin" || (currentUser.permissions?.can_create_cert ?? false)}
                />
              }
            />
            <Route
              path="/embarcacoes"
              element={
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
              }
            />
            <Route
              path="/certificados"
              element={
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
              }
            />
            <Route
              path="/alertas"
              element={
                <AlertsView
                  certificates={certificates}
                  vessels={vessels}
                  config={config}
                  onEditCertificate={(c) => {
                    setCertToEdit(c);
                    setIsCertModalOpen(true);
                  }}
                  onSelectVessel={(v) => setSelectedVesselForDetail(v)}
                  onNavigate={handleNavigateTab}
                />
              }
            />
            <Route
              path="/relatorios"
              element={
                <ReportsView
                  vessels={vessels}
                  certificates={certificates}
                  config={config}
                  canExport={currentUser.role === "admin" || (currentUser.permissions?.can_export_reports ?? false)}
                />
              }
            />
            <Route
              path="/consultor-ia"
              element={
                <ConsultantView
                  vessels={vessels}
                  certificates={certificates}
                  config={config}
                  canAccessAI={currentUser.role === "admin" || (currentUser.permissions?.can_access_ai ?? false)}
                />
              }
            />
            <Route
              path="/usuarios"
              element={
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
              }
            />
            <Route
              path="/configuracoes"
              element={
                <SettingsView
                  config={config}
                  onSaveConfig={handleSaveConfig}
                  onResetDefaults={handleResetDefaults}
                  onDataImported={handleDataImported}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              }
            />
            <Route path="*" element={<Navigate to="/painel" replace />} />
          </Routes>
        </main>

        {/* Rodapé do Sistema com Identificação Jurídica e Links LGPD */}
        <footer className="border-t border-teal-900/40 bg-[#02131b] py-6 text-xs text-teal-300/60 mt-auto no-print">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex flex-col gap-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Anchor className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-teal-200">NavCert Gestão Marítima</span>
                <span>· CNPJ: 00.000.000/0001-00</span>
              </div>
              <p className="text-[11px] text-teal-300/50">
                NavCert Tecnologia & Serviços Marítimos Ltda. | Endereço: Av. das Nações, 1000, Sala 201 - Rio de Janeiro/RJ
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-teal-300/70 font-medium">
              <button 
                onClick={() => handleOpenLegalModal("privacy")} 
                className="hover:text-teal-200 underline cursor-pointer"
              >
                Política de Privacidade
              </button>
              <span>·</span>
              <button 
                onClick={() => handleOpenLegalModal("terms")} 
                className="hover:text-teal-200 underline cursor-pointer"
              >
                Termos de Uso
              </button>
              <span>·</span>
              <a 
                href="mailto:dpo@navicert.com.br" 
                className="hover:text-teal-200 underline"
              >
                Contato DPO (LGPD)
              </a>
              <span>·</span>
              <span>© {new Date().getFullYear()} NavCert</span>
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
        setActiveTab={handleNavigateTab}
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

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        type={legalModalType}
      />

      <CookieBanner />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}
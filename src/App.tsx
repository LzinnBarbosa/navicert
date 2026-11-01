import React, { useState, useEffect } from "react";
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
import { Anchor, ShieldCheck } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("painel");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [config, setConfig] = useState<PrazosConfig>(PRAZOS_PADRAO);

  // Modal de perfil do usuário
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modals de embarcação e certificado
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

  // Carga inicial dos dados
  useEffect(() => {
    const data = StorageService.init();
    setVessels(data.vessels);
    setCertificates(data.certificates);
    setConfig(data.config);
    setUsers(StorageService.getUsers());
    if (data.currentUser) {
      setCurrentUser(data.currentUser);
    }
  }, []);

  // Cálculo do resumo de alertas para badges e header
  const alertCount = React.useMemo(() => {
    let vencidos = 0;
    let criticos = 0;
    let atencao = 0;

    certificates.forEach((c) => {
      const s = statusCertificado(c.data_validade, config);
      if (s === "vencido") vencidos++;
      else if (s === "critico") criticos++;
      else if (s === "atencao") atencao++;
    });

    return { vencidos, criticos, atencao };
  }, [certificates, config]);

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    showToast("Sessão finalizada com sucesso.");
  };

  // Atualização dos dados cadastrais do próprio usuário
  const handleSaveProfile = (updatedData: { nome: string; email: string; cargo: string }) => {
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, ...updatedData };
    setCurrentUser(updatedUser);
    StorageService.saveCurrentUser(updatedUser);

    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    showToast("Dados cadastrais do usuário atualizados com sucesso!");
  };

  // Handlers de Embarcações
  const handleSaveVessel = (vessel: Vessel) => {
    let updated: Vessel[];
    const exists = vessels.some((v) => v.id === vessel.id);
    if (exists) {
      updated = vessels.map((v) => (v.id === vessel.id ? vessel : v));
      showToast(`Embarcação "${vessel.nome}" atualizada com sucesso.`);
    } else {
      updated = [vessel, ...vessels];
      showToast(`Embarcação "${vessel.nome}" cadastrada com sucesso.`);
    }
    setVessels(updated);
    StorageService.saveVessels(updated);
  };

  const handleDeleteVessel = (vesselId: string) => {
    const vessel = vessels.find((v) => v.id === vesselId);
    if (!vessel) return;

    if (window.confirm(`Excluir a embarcação "${vessel.nome}" e todos os seus certificados associados?`)) {
      const updatedVessels = vessels.filter((v) => v.id !== vesselId);
      const updatedCerts = certificates.filter((c) => c.vessel_id !== vesselId);

      setVessels(updatedVessels);
      setCertificates(updatedCerts);

      StorageService.saveVessels(updatedVessels);
      StorageService.saveCertificates(updatedCerts);

      if (selectedVesselForDetail?.id === vesselId) {
        setSelectedVesselForDetail(null);
      }
      showToast(`Embarcação "${vessel.nome}" excluída.`);
    }
  };

  // Handlers de Certificados
  const handleSaveCertificate = (cert: Partial<Certificate>) => {
    let updated: Certificate[];
    const exists = certificates.some((c) => c.id === cert.id);
    if (exists) {
      updated = certificates.map((c) => (c.id === cert.id ? { ...c, ...cert } as Certificate : c));
      showToast(`Certificado ${cert.tipo} atualizado.`);
    } else {
      const newCert: Certificate = {
        id: cert.id || String(Date.now()),
        vessel_id: cert.vessel_id || '',
        tipo: cert.tipo || 'CSN',
        numero: cert.numero || '',
        data_validade: cert.data_validade || '',
        orgao_emissor: cert.orgao_emissor || '',
        created_at: new Date().toISOString(),
        ...cert
      };
      updated = [newCert, ...certificates];
      showToast(`Certificado ${cert.tipo} registrado.`);
    }
    setCertificates(updated);
    StorageService.saveCertificates(updated);
  };

  const handleDeleteCertificate = (certId: string) => {
    const cert = certificates.find((c) => c.id === certId);
    if (!cert) return;

    if (window.confirm(`Excluir o certificado ${cert.tipo} (Nº ${cert.numero})?`)) {
      const updated = certificates.filter((c) => c.id !== certId);
      setCertificates(updated);
      StorageService.saveCertificates(updated);
      showToast("Certificado excluído.");
    }
  };

  // Handlers de Configuração e Backup
  const handleSaveConfig = (newConfig: PrazosConfig) => {
    setConfig(newConfig);
    StorageService.saveConfig(newConfig);
    showToast("Configurações atualizadas.");
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

  // Handlers de Gerenciamento de Usuários (Admin)
  const handleUpdateUserRole = (userId: string, newRole: "admin" | "operador" | "auditor") => {
    const updated = StorageService.updateUserRole(userId, newRole);
    setUsers(updated);
    if (currentUser && currentUser.id === userId) {
      const me = updated.find((u) => u.id === userId);
      if (me) setCurrentUser(me);
    }
    showToast("Perfil de acesso do usuário atualizado.");
  };

  const handleUpdateUserPermissions = (userId: string, permissions: Partial<UserPermissions>) => {
    const updated = StorageService.updateUserPermissions(userId, permissions);
    setUsers(updated);
    if (currentUser && currentUser.id === userId) {
      const me = updated.find((u) => u.id === userId);
      if (me) setCurrentUser(me);
    }
    showToast("Permissões de acesso atualizadas.");
  };

  const handleToggleUserBlocked = (userId: string) => {
    const updated = StorageService.toggleUserBlocked(userId);
    setUsers(updated);
    showToast("Status de bloqueio do usuário alterado.");
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (window.confirm(`Excluir permanentemente o usuário "${user.nome}" (${user.email})?`)) {
      const updated = StorageService.deleteUser(userId);
      setUsers(updated);
      showToast(`Usuário "${user.nome}" excluído.`);
    }
  };

  // Se não estiver autenticado, exibe a tela de login
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

  return (
    <div className="flex h-screen w-screen bg-[#031923] text-slate-100 font-sans overflow-hidden selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#062433] border border-teal-500/40 text-teal-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR LATERAL RETRÁTIL */}
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
        
        {/* TopBar com Ações e Banner de Alertas */}
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

        {/* Renderizador de Views das Abas */}
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

        {/* Rodapé Corporativo */}
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

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      {/* MODAIS DE CADASTRO E DETALHES */}
      <VesselModal
        isOpen={isVesselModalOpen}
        onClose={() => setIsVesselModalOpen(false)}
        onSave={handleSaveVessel}
        vesselToEdit={vesselToEdit}
      />

      {/* MODAL ATUALIZADO DE CERTIFICADOS & TESTES TÉCNICOS */}
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

      {/* WIDGET FLUTUANTE DE ASSISTENTE DE SUPORTE E NAVEGAÇÃO */}
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
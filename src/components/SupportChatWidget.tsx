import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  ArrowRight, 
  Ship, 
  Compass,
  Sparkles,
  GripVertical
} from "lucide-react";
import { ActiveTab } from "../types/maritime";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  action?: {
    label: string;
    tab?: ActiveTab;
    customAction?: "profile" | "new_vessel" | "new_cert";
  };
}

interface SupportChatWidgetProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfile?: () => void;
  onNewVessel?: () => void;
  onNewCertificate?: () => void;
}

function normalizarTexto(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

interface KnowledgeItem {
  id: string;
  keywords: string[];
  exactPhrases?: string[];
  response: string;
  action?: {
    label: string;
    tab?: ActiveTab;
    customAction?: "profile" | "new_vessel" | "new_cert";
  };
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: "vessels_list",
    keywords: ["embarcacao", "embarcacoes", "cadastrada", "cadastradas", "frota", "balsa", "empurrador", "rebocador", "modulos", "rampas", "tipo", "tipos", "listar", "ver", "onde", "visualizar"],
    exactPhrases: ["onde vejo", "embarcacoes cadastradas", "minha frota", "ver embarcacoes", "quais embarcacoes", "lista de embarcacoes"],
    response: "Você pode visualizar e gerenciar todas as embarcações cadastradas na aba **Embarcações**. Lá elas estão divididas nas 5 classes oficiais e ordenadas sequencialmente.",
    action: { label: "Ir para Embarcações", tab: "embarcacoes" }
  },
  {
    id: "vessel_new",
    keywords: ["cadastrar", "nova", "novo", "incluir", "adicionar", "embarcacao", "barco"],
    exactPhrases: ["cadastrar embarcacao", "nova embarcacao", "adicionar embarcacao", "incluir barco"],
    response: "Para cadastrar uma nova embarcação, acesse a aba **Embarcações** e clique no botão '+ Nova Embarcação' ou use o atalho abaixo:",
    action: { label: "Nova Embarcação", customAction: "new_vessel" }
  },
  {
    id: "certs_list",
    keywords: ["certificado", "certificados", "csn", "borda livre", "casco", "maquinas", "documento", "documentos", "vistoria", "vistorias", "validade"],
    exactPhrases: ["ver certificados", "onde vejo certificados", "lista de certificados", "documentos das embarcacoes"],
    response: "Na aba **Certificados** você consulta todos os documentos de segurança cadastrados, acompanha prazos de vencimento e registra novas vistorias.",
    action: { label: "Ir para Certificados", tab: "certificados" }
  },
  {
    id: "cert_new",
    keywords: ["novo", "cadastrar", "incluir", "adicionar", "certificado", "documento", "vistoria"],
    exactPhrases: ["novo certificado", "cadastrar certificado", "adicionar documento", "lancar vistoria"],
    response: "Você pode registrar um novo certificado de segurança abrindo o formulário de cadastro direto no botão abaixo:",
    action: { label: "Novo Certificado", customAction: "new_cert" }
  },
  {
    id: "alerts",
    keywords: ["alerta", "alertas", "vencido", "vencidos", "vencer", "critico", "criticos", "atencao", "prazo", "prazos", "expirado", "expirados", "renovar"],
    exactPhrases: ["certificados vencidos", "quais vencem", "central de alertas", "prazos criticos"],
    response: "Na **Central de Alertas** você identifica em tempo real quais certificados já expiraram ou estão na janela crítica de renovação (30 a 90 dias).",
    action: { label: "Ver Central de Alertas", tab: "alertas" }
  },
  {
    id: "dashboard",
    keywords: ["painel", "dashboard", "inicio", "home", "resumo", "geral", "indicadores", "graficos"],
    exactPhrases: ["visao geral", "painel principal", "resumo da frota"],
    response: "O **Painel** apresenta a visão executiva consolidada da frota, totalizadores de certificados válidos/críticos e atalhos rápidos de navegação.",
    action: { label: "Ir para o Painel", tab: "painel" }
  },
  {
    id: "reports",
    keywords: ["relatorio", "relatorios", "exportar", "csv", "pdf", "imprimir", "baixar", "planilha", "excel", "auditoria"],
    exactPhrases: ["exportar relatorio", "baixar csv", "imprimir relatorio", "relatorio de conformidade"],
    response: "Na aba **Relatórios** você pode gerar a matriz de conformidade em tempo real, exportar os dados completos da frota para CSV ou imprimir o documento oficial.",
    action: { label: "Ir para Relatórios", tab: "relatorios" }
  },
  {
    id: "profile",
    keywords: ["perfil", "meu nome", "email", "e-mail", "cargo", "senha", "meus dados", "minha conta", "alterar usuario", "alterar nome"],
    exactPhrases: ["editar perfil", "alterar meu nome", "mudar email", "meus dados"],
    response: "Você pode alterar seu Nome, E-mail e Cargo a qualquer momento clicando no seu cartão de perfil localizado no rodapé do menu lateral.",
    action: { label: "Editar Meu Perfil", customAction: "profile" }
  },
  {
    id: "users_admin",
    keywords: ["usuario", "usuarios", "permissao", "permissoes", "acesso", "bloquear", "desbloquear", "funcoes", "gerenciar", "admin"],
    exactPhrases: ["gerenciar usuarios", "permissoes de acesso", "bloquear usuario"],
    response: "A aba **Usuários & Acesso** permite que Administradores gerenciem perfis (Admin, Operador, Auditor), concedam permissões granulares e bloqueiem acessos.",
    action: { label: "Gerenciar Usuários", tab: "usuarios" }
  },
  {
    id: "settings",
    keywords: ["configuracao", "configuracoes", "configurar", "prazo padrao", "empresa", "dias", "backup", "restaurar", "importar"],
    exactPhrases: ["alterar configuracoes", "ajustar prazos", "fazer backup"],
    response: "Na aba **Configurações** você ajusta os prazos padrão dos alertas (30/90 dias), edita o nome corporativo e realiza o backup/importação dos dados em JSON.",
    action: { label: "Ir para Configurações", tab: "configuracoes" }
  },
  {
    id: "ai_consultant",
    keywords: ["normam", "normam 202", "marinha", "legislacao", "lei", "regra", "consultor", "ia", "gemini", "duvida tecnica", "engenharia"],
    exactPhrases: ["duvida tecnica", "consultor ia", "regras da marinha", "normam 202"],
    response: "Para consultas regulatórias avançadas, normas da Marinha do Brasil (NORMAM 202) ou dúvidas de engenharia naval, utilize o nosso **Consultor IA**.",
    action: { label: "Abrir Consultor IA", tab: "consultor" }
  },
  {
    id: "greetings",
    keywords: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "ajuda", "menu", "quem e voce", "o que faz"],
    exactPhrases: ["olá", "como funciona"],
    response: "Olá! Sou o assistente de navegação do NavCert. Posso te orientar sobre como utilizar o sistema e te direcionar rapidamente para qualquer aba.",
  }
];

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onNewVessel,
  onNewCertificate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "bot",
      text: "Olá! Sou o assistente de navegação do NavCert. O que você deseja encontrar no sistema?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // ENGINE DE POSICIONAMENTO E ARRASTE COM POINTER EVENTS
  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 84) : 800,
    y: typeof window !== "undefined" ? Math.max(16, window.innerHeight - 84) : 600,
  }));

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const hasMovedFar = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fecha o widget automaticamente sempre que a aba/tela ativa mudar
  useEffect(() => {
    setIsOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // HANDLERS UNIFICADOS PARA POINTER EVENTS (TOUCH & MOUSE)
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedFar.current = false;

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...position };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    if (Math.hypot(deltaX, deltaY) > 5) {
      hasMovedFar.current = true;
    }

    const newX = Math.max(16, Math.min(window.innerWidth - 75, elementStartPos.current.x + deltaX));
    const newY = Math.max(16, Math.min(window.innerHeight - 75, elementStartPos.current.y + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMovedFar.current) {
      setIsOpen((prev) => !prev);
    }
  };

  const findBestMatch = (userQuery: string): KnowledgeItem | null => {
    const normQuery = normalizarTexto(userQuery);
    if (!normQuery) return null;

    const queryTokens = normQuery.split(/\s+/);
    let bestMatch: KnowledgeItem | null = null;
    let highestScore = 0;

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;

      if (item.exactPhrases) {
        for (const phrase of item.exactPhrases) {
          const normPhrase = normalizarTexto(phrase);
          if (normQuery.includes(normPhrase)) {
            score += 10;
          }
        }
      }

      for (const kw of item.keywords) {
        const normKw = normalizarTexto(kw);
        if (queryTokens.includes(normKw)) {
          score += 2;
        } else if (normQuery.includes(normKw) && normKw.length > 3) {
          score += 1;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    return highestScore >= 2 ? bestMatch : null;
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    setTimeout(() => {
      const match = findBestMatch(query);

      let botResponseText = "";
      let botAction = undefined;

      if (match) {
        botResponseText = match.response;
        botAction = match.action;
      } else {
        botResponseText = "Não encontrei uma opção exata para este termo no guia de navegação. Você pode usar os atalhos rápidos abaixo para acessar a área desejada:";
        botAction = { label: "Ir para Embarcações", tab: "embarcacoes" as ActiveTab };
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: botAction
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 300);
  };

  const handleExecuteAction = (action: Message["action"]) => {
    if (!action) return;

    if (action.tab) {
      setActiveTab(action.tab);
    } else if (action.customAction === "profile" && onOpenProfile) {
      onOpenProfile();
    } else if (action.customAction === "new_vessel" && onNewVessel) {
      onNewVessel();
    } else if (action.customAction === "new_cert" && onNewCertificate) {
      onNewCertificate();
    }

    setIsOpen(false);
  };

  const suggestionChips = [
    "Ver embarcações cadastradas",
    "Onde vejo os alertas?",
    "Como editar meu perfil?",
    "Exportar relatório em CSV"
  ];

  const isRightSide = position.x > window.innerWidth / 2;
  const isBottomSide = position.y > window.innerHeight / 2;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: "auto",
        right: "auto",
        zIndex: 9999,
        touchAction: "none"
      }}
      className="select-none font-sans"
    >
      {/* 1. BOTÃO CIRCULAR ARRASTÁVEL (FAB DRAGGABLE) */}
      {!isOpen && (
        <div className="relative group touch-none">
          <div className={`absolute ${isRightSide ? "right-full mr-3" : "left-full ml-3"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none`}>
            <div className="bg-slate-900/95 text-cyan-300 border border-cyan-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap backdrop-blur-sm flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Clique para abrir • Segure para mover</span>
            </div>
          </div>

          <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleButtonClick}
            aria-label="Assistente NavCert Arrastável"
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-[1.5px] shadow-2xl shadow-cyan-500/40 ${
              isDragging ? "scale-110 cursor-grabbing ring-4 ring-cyan-400/40" : "hover:scale-105 cursor-grab"
            } transition-all duration-150 group`}
          >
            <div className="w-full h-full bg-[#03141d] rounded-full flex items-center justify-center relative overflow-hidden group-hover:bg-[#051c27] transition-colors">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex items-center justify-center">
                <Ship className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 group-hover:text-white transition-colors transform group-hover:-rotate-6" />
                <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1.5 -right-2 animate-pulse" />
              </div>

              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. JANELA DE CHAT FLUTUANTE */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            [isBottomSide ? "bottom" : "top"]: "0px",
            [isRightSide ? "right" : "left"]: "0px",
          }}
          className="w-[360px] sm:w-[400px] h-[520px] bg-[#051c27] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="bg-gradient-to-r from-[#03141d] via-[#082a38] to-[#03141d] p-4 border-b border-cyan-900/50 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-inner">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Guia NavCert
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-cyan-300/70 flex items-center gap-1">
                  <GripVertical className="w-3.5 h-3.5 text-cyan-400/50 inline" /> Arraste para mover a janela
                </p>
              </div>
            </div>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-2 text-cyan-400/60 hover:text-white rounded-xl hover:bg-cyan-900/40 transition-colors cursor-pointer"
              aria-label="Fechar Guia"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar bg-[#03151f]/90">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white font-medium rounded-tr-none shadow-lg shadow-cyan-950/50"
                      : "bg-[#082635] text-cyan-100 border border-cyan-900/60 rounded-tl-none shadow-md"
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.action && (
                    <button
                      onClick={() => handleExecuteAction(msg.action)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white rounded-xl font-bold text-[11px] border border-cyan-500/40 transition-all cursor-pointer shadow-sm"
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-cyan-400/40 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2.5 bg-[#021017] border-t border-cyan-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/50 text-[10px] whitespace-nowrap cursor-pointer transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#03141d] border-t border-cyan-900/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Onde vejo as embarcações?"
              className="flex-1 bg-[#051c27] border border-cyan-900/60 rounded-2xl px-3.5 py-2 text-xs text-cyan-100 placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-cyan-950"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
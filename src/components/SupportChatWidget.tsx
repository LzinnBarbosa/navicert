import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  ArrowRight, 
  Ship, 
  FileCheck2, 
  BellRing, 
  FileBarChart2, 
  Settings, 
  UserCheck, 
  Sparkles,
  Users,
  Compass
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

/**
 * Função utilitária para normalizar strings (remove acentos, caixa alta e pontuação)
 */
function normalizarTexto(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // Remove pontuação
    .trim();
}

/**
 * Base de conhecimento determinística e parametrizada sobre a aplicação
 */
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
      text: "Olá! Sou o assistente de suporte do NavCert. O que você deseja encontrar no sistema?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  /**
   * Motor de Relevância por Tokenização e Pontuação
   */
  const findBestMatch = (userQuery: string): KnowledgeItem | null => {
    const normQuery = normalizarTexto(userQuery);
    if (!normQuery) return null;

    const queryTokens = normQuery.split(/\s+/);
    let bestMatch: KnowledgeItem | null = null;
    let highestScore = 0;

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;

      // 1. Checagem de frases exatas (peso alto = 10 pontos)
      if (item.exactPhrases) {
        for (const phrase of item.exactPhrases) {
          const normPhrase = normalizarTexto(phrase);
          if (normQuery.includes(normPhrase)) {
            score += 10;
          }
        }
      }

      // 2. Checagem por sobreposição de palavras-chave (peso = 2 pontos cada)
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

    // Exige pontuação mínima de 2 para confirmar o match
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

    // Processamento com pequeno delay para simular resposta natural
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

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* BOTÃO FLUTUANTE (WIDGET CLOSED) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-extrabold rounded-full shadow-2xl shadow-teal-950/80 transition-all transform hover:scale-105 cursor-pointer border border-teal-300/40"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
          </span>
          <Bot className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs tracking-wide uppercase hidden sm:inline">Ajuda NavCert</span>
        </button>
      )}

      {/* JANELA DE CHAT (WIDGET OPEN) */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-[#051c27] border border-teal-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* CABEÇALHO DO CHAT */}
          <div className="bg-gradient-to-r from-[#03141d] to-[#082a38] p-4 border-b border-teal-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  Guia do Sistema
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] text-teal-300/60">Suporte e navegação direta</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-teal-300/60 hover:text-white rounded-lg hover:bg-teal-900/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ÁREA DE MENSAGENS */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar bg-[#03151f]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-teal-500 text-slate-950 font-semibold rounded-tr-none shadow-md"
                      : "bg-[#082635] text-teal-100 border border-teal-900/60 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* BOTÃO DE AÇÃO DIRETA (DEEP-LINKING) */}
                  {msg.action && (
                    <button
                      onClick={() => handleExecuteAction(msg.action)}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-white rounded-xl font-bold text-[11px] border border-teal-500/40 transition-all cursor-pointer shadow-sm"
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-teal-400/40 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGESTÕES RÁPIDAS (CHIPS) */}
          <div className="px-3 py-2 bg-[#021017] border-t border-teal-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-900/80 text-teal-300 border border-teal-800/50 text-[10px] whitespace-nowrap cursor-pointer transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* CAMPO DE DIGITAÇÃO */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#03141d] border-t border-teal-900/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Onde vejo as embarcações?"
              className="flex-1 bg-[#051c27] border border-teal-900/60 rounded-xl px-3 py-2 text-xs text-teal-100 placeholder-teal-400/40 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
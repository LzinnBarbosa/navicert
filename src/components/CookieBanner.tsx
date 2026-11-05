import React, { useState, useEffect } from "react";
import { Cookie, Check } from "lucide-react";

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("navicert_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("navicert_cookie_consent", "accepted_" + new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 p-4 rounded-2xl bg-slate-900 border border-teal-500/40 text-slate-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-white">Privacidade e Armazenamento Local</p>
          <p className="text-slate-300 leading-relaxed">
            Utilizamos armazenamento local (`localStorage`) estritamente necessário para manter sua sessão autenticada com segurança e salvar suas preferências de conformidade NORMAM 202.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Entendido e Aceitar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
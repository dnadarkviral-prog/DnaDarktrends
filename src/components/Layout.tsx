import React, { useEffect, useState } from "react";
import { ConfigModal } from "./ConfigModal";

export type TabKey = "tendencias" | "titulos" | "json";

interface LayoutProps {
  active: TabKey;
  onChange(tab: TabKey): void;
  children: React.ReactNode;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "tendencias", label: "Tendências" },
  { key: "titulos", label: "Títulos Virais" },
  
  { key: "json", label: "Dados JSON" }
];

export const Layout: React.FC<LayoutProps> = ({
  active,
  onChange,
  children
}) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "valid" | "invalid">(
    "unknown"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasGemini = !!window.localStorage.getItem("dna_api_gemini");
    const hasYt = !!window.localStorage.getItem("dna_api_youtube");
    setApiStatus(hasGemini && hasYt ? "valid" : "invalid");
    // se não tiver chave, já abre o modal
    if (!hasGemini || !hasYt) {
      setConfigOpen(true);
    }
  }, []);

  const configOk = apiStatus === "valid";

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-white">
      <header className="border-b border-neutral-800">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-lg">
              <span>⚡</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">DnaDarktrends</div>
              <div className="text-[10px] text-neutral-400">
                Minerador de tendências & roteiros
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="inline-flex bg-black/40 border border-neutral-800 rounded-full p-1 text-[11px]">
              {tabs.map((tab) => {
                const activeTab = tab.key === active;
                return (
                  <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      activeTab
                        ? "bg-primary-600 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                configOk
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-600 hover:bg-emerald-600/40"
                  : "bg-red-600/20 text-red-300 border-red-600 hover:bg-red-600/40 animate-pulse"
              }`}
            >
              <span className="text-sm">🛠</span>
              <span>{configOk ? "Configuração OK" : "Configurar API (Obrigatório)"}</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>

      {configOpen && (
        <ConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          onStatusChange={(status) => setApiStatus(status)}
        />
      )}
    </div>
  );
};

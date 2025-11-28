import React, { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  onStatusChange?: (status: "valid" | "invalid") => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  onClose,
  onStatusChange
}) => {
  const [gemini, setGemini] = useState("");
  const [yt, setYt] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const g = window.localStorage.getItem("dna_api_gemini") ?? "";
    const y = window.localStorage.getItem("dna_api_youtube") ?? "";
    setGemini(g);
    setYt(y);
    setError(null);
  }, [open]);

  if (!open) return null;

  async function testGemini(apiKey: string) {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      throw new Error("Chave Gemini vazia.");
    }
    const genAI = new GoogleGenerativeAI(trimmed);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("ping");
    await result.response.text(); // apenas para garantir que chegou
  }

  async function testYoutube(apiKey: string) {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      throw new Error("Chave YouTube vazia.");
    }
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("q", "teste");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", trimmed);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(
        `Erro ao validar YouTube API (${resp.status}): ${txt.slice(0, 120)}`
      );
    }
  }

  async function handleSave() {
    setTesting(true);
    setError(null);
    try {
      await testGemini(gemini);
      await testYoutube(yt);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("dna_api_gemini", gemini.trim());
        window.localStorage.setItem("dna_api_youtube", yt.trim());
      }

      onStatusChange?.("valid");
      onClose();
    } catch (err: any) {
      console.error("Erro ao validar chaves:", err);
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "Falha ao validar as chaves.";
      setError(msg);
      onStatusChange?.("invalid");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center">
      <div className="bg-dark-800 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-black/60">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <span className="text-primary-500 text-xl">⚙</span>
          Configurações de API
        </h2>
        <p className="text-xs text-neutral-400 mb-4">
          Insira suas chaves para ativar a análise de dados. Elas ficam
          salvas apenas no seu navegador (localStorage).
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 mb-1">
              Gemini API Key (Tendências/Roteiros)
            </label>
            <input
              type="password"
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs"
              value={gemini}
              onChange={(e) => setGemini(e.target.value)}
              placeholder="Cole sua chave do Google AI Studio..."
            />
          </div>

          <div>
            <label className="block text-neutral-300 mb-1">
              YouTube Data API v3 Key
            </label>
            <input
              type="password"
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs"
              value={yt}
              onChange={(e) => setYt(e.target.value)}
              placeholder="Cole sua chave do YouTube Data API..."
            />
          </div>

          {error && (
            <div className="mt-2 text-[11px] text-red-400 bg-red-900/20 border border-red-700/60 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <p className="text-[10px] text-neutral-500">
            As chaves são usadas apenas no seu navegador para se comunicar
            direto com as APIs oficiais do Google.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={testing}
            className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
          >
            {testing ? "Testando..." : "Salvar e Ativar"}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import {
  fetchTrendsFromYoutube,
  RegionCode,
  TrendsResult
} from "../lib/youtube";

const regionOptions: { label: string; value: RegionCode }[] = [
  { label: "Brasil", value: "BR" },
  { label: "US EUA", value: "US" },
  { label: "ES ESP", value: "ES" },
  { label: "Global", value: "GLOBAL" }
];

const periodOptions = ["24H", "7 Dias", "15 Dias", "30 Dias"];

export const TendenciasPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionCode>("BR");
  const [period, setPeriod] = useState<string>("7 Dias");
  const [storyNiche, setStoryNiche] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [minDuration, setMinDuration] = useState(8);
  const [maxDuration, setMaxDuration] = useState(120);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrendsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  function formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return "-";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setPage(0);

    try {
      const data = await fetchTrendsFromYoutube(
        query.trim(),
        region,
        period,
        storyNiche,
        minDuration,
        maxDuration,
        advancedMode,
        turboMode
      );

      // ⭐ Limitar quantidade final de cards conforme modo Turbo
      data.cards = data.cards.slice(0, turboMode ? 200 : 50);

      setResult(data);
    } catch (err: any) {
      console.error(err);
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "Erro desconhecido ao buscar tendências.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-dark-800 border border-neutral-800 rounded-2xl p-5 space-y-4">
        
        {/* FORM */}
        <form
          onSubmit={handleAnalyze}
          className="flex flex-col md:flex-row gap-3 md:items-center"
        >
          <div className="flex-1">
            <input
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-4 py-3 text-sm"
              placeholder="Digite uma palavra-chave para minerar tendências..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Analisando..." : "Analisar"}
          </button>
        </form>

        {/* FILTROS */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px]">
          
          {/* REGIÃO */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs">Região:</span>
            {regionOptions.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRegion(r.value)}
                className={`px-2 py-1 rounded-md text-xs ${
                  region === r.value
                    ? "bg-red-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* PERÍODO */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs">Período:</span>
            {periodOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded-md text-xs ${
                  period === p
                    ? "bg-red-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* MODO AVANÇADO */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedMode}
                onChange={(e) => setAdvancedMode(e.target.checked)}
                className="h-3 w-3 rounded border-neutral-600 bg-black/40"
              />
              <span>Modo avançado</span>
            </label>

            <button
              type="button"
              className="text-yellow-400 text-xs"
              title="Modo avançado: amplia a busca (multi-páginas), melhora a precisão e encontra mais vídeos relevantes."
            >
              ❓
            </button>
          </div>

          {/* MODO TURBO ⚡ */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={turboMode}
                onChange={(e) => setTurboMode(e.target.checked)}
                className="h-3 w-3 rounded border-neutral-600 bg-black/40"
              />
              <span>Modo Turbo ⚡</span>
            </label>
          </div>

          {/* DURAÇÃO */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs">Duração de vídeo:</span>

            <input
              type="number"
              min={1}
              max={500}
              value={minDuration}
              onChange={(e) => setMinDuration(Number(e.target.value))}
              className="w-16 p-1 rounded bg-black/40 border border-neutral-700 text-white text-xs"
            />

            <span className="text-neutral-400 text-xs">x</span>

            <input
              type="number"
              min={1}
              max={500}
              value={maxDuration}
              onChange={(e) => setMaxDuration(Number(e.target.value))}
              className="w-16 p-1 rounded bg-black/40 border border-neutral-700 text-white text-xs"
            />
          </div>
        </div>

        {/* NICHO HISTÓRIA */}
        <div className="flex items-center gap-2 mt-2 text-[11px]">
          <label className="inline-flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={storyNiche}
              onChange={(e) => setStoryNiche(e.target.checked)}
              className="h-3 w-3 rounded border-neutral-600 bg-black/40"
            />
            <span>Nicho história (focar em vídeos de storytelling)</span>
          </label>

          <button
            type="button"
            title="Quando ativado, o sistema foca em vídeos de storytelling (histórias)."
            className="text-yellow-400 text-xs leading-none"
          >
            &#9888;
          </button>
        </div>

        {/* MENSAGEM INSPIRADA DE ERRO */}
        {error && (
          <div className="text-xs bg-red-900/20 border border-red-700/60 rounded-xl px-3 py-2 text-red-300">
            {error.toLowerCase().includes("quota") ||
            error.toLowerCase().includes("exceeded") ||
            error.toLowerCase().includes("limit") ? (
              <p>
                💡 <strong>Sua chave atingiu o limite da API do YouTube.</strong><br />
                A força da sua criatividade ultrapassou até os limites do YouTube hoje. <br />
                Respire fundo, recarregue sua inspiração… <br />
                e volte daqui a pouco para minerar novas ideias. 🚀✨
              </p>
            ) : (
              <p>
                🔄 Algo deu errado, mas não desanime.<br />
                Mesmo quando uma porta se fecha, outra tendência está esperando para ser descoberta.<br />
                Tente novamente! 💫
              </p>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <p className="text-xs text-neutral-500">
            Configure os filtros e clique em analisar para ver as tendências
            em tempo real usando a YouTube Data API.
          </p>
        )}
      </section>

      {/* ===========================================================
          RESULTADOS
      ============================================================ */}
      {result && (
        <section className="space-y-4">

          {/* HEADER DOS RESULTADOS */}
          <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-primary-400 font-semibold tracking-wide">
                TOP NICHO VIRAL
              </p>

              <h2 className="text-xl font-bold mt-1">
                {result.topNiche || query}
              </h2>

              <p className="text-xs text-neutral-400 mt-1">
                Emoção predominante:{" "}
                <span className="text-neutral-100 font-semibold">
                  {result.topEmotion}
                </span>
              </p>

              <p className="text-xs text-neutral-400 mt-1">
                Engajamento estimado:{" "}
                <span className="text-neutral-100 font-semibold">
                  {result.engagementLabel}
                </span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-neutral-400 mb-1">Variação (7 dias)</p>

              <p
                className={`text-2xl font-bold ${
                  result.variation7d >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {result.variation7d >= 0 ? "+" : ""}
                {result.variation7d}%
              </p>

              <p className="text-[10px] text-neutral-500 mt-1">
                *Estimativa baseada nos vídeos mais relevantes.
              </p>
            </div>
          </div>

          {/* GRID DE CARDS */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {result.cards
              .slice(page * pageSize, page * pageSize + pageSize)
              .map((card, idx) => (
                <div
                  key={idx}
                  className="bg-dark-800 border border-neutral-800 rounded-2xl p-4 text-xs flex flex-col justify-between"
                >
                  
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      
                      {/* TAGS */}
                      <span
                        className="px-2 py-0.5 rounded-full border text-[10px] font-semibold inline-flex items-center gap-1"
                        style={
                          card.scoreLabel === "Viral"
                            ? {
                                color: "#1E90FF",
                                borderColor: "#1E90FF",
                                backgroundColor: "rgba(30,144,255,0.10)"
                              }
                            : card.scoreLabel === "Muito Alto"
                            ? {
                                color: "#39ff14",
                                borderColor: "#39ff14",
                                backgroundColor: "rgba(57,255,20,0.08)"
                              }
                            : card.scoreLabel === "Alto"
                            ? {
                                color: "#22c55e",
                                borderColor: "#22c55e",
                                backgroundColor: "rgba(34,197,94,0.08)"
                              }
                            : card.scoreLabel === "Médio"
                            ? {
                                color: "#eab308",
                                borderColor: "#eab308",
                                backgroundColor: "rgba(234,179,8,0.08)"
                              }
                            : {
                                color: "#ef4444",
                                borderColor: "#ef4444",
                                backgroundColor: "rgba(239,68,68,0.08)"
                              }
                        }
                      >
                        {card.scoreLabel === "Viral" && <span>⭐</span>}
                        {card.scoreLabel === "Muito Alto" && <span>🔥</span>}
                        <span>{card.scoreLabel}</span>
                      </span>

                      {/* DIREÇÃO */}
                      <span
                        className={`text-[10px] ${
                          card.direction === "Subindo"
                            ? "text-emerald-400"
                            : card.direction === "Caindo"
                            ? "text-red-400"
                            : "text-neutral-400"
                        }`}
                      >
                        {card.direction}
                      </span>
                    </div>

                    {/* TÍTULO */}
                    <h3 className="mt-2 font-semibold line-clamp-2">
                      {card.keyword}
                    </h3>

                    {/* DICA */}
                    <p className="mt-1 text-neutral-400 line-clamp-2">
                      {card.audienceHint}
                    </p>
                  </div>

                  {/* MÉTRICAS */}
                  <div className="mt-3 pt-2 border-t border-neutral-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      
                      <div>
                        <p className="text-[10px] text-neutral-500">
                          Views (amostra)
                        </p>
                        <p className="text-xs font-semibold">
                          {card.viewsSample.toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-500">
                          Likes (est.)
                        </p>
                        <p className="text-xs font-semibold">
                          {card.likes?.toLocaleString("pt-BR") ?? "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-500">
                          Comentários
                        </p>
                        <p className="text-xs font-semibold">
                          {card.comments?.toLocaleString("pt-BR") ?? "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-500">Duração</p>
                        <p className="text-xs font-semibold">
                          {formatDuration(card.durationSeconds)}
                        </p>
                      </div>
                    </div>

                    {/* BOTÕES */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-neutral-500">
                          Engajamento
                        </p>
                        <p className="text-xs font-semibold">
                          {card.engagementScore} / 100
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Copiar título"
                          onClick={() =>
                            navigator.clipboard.writeText(card.keyword)
                          }
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px]"
                        >
                          Copiar título
                        </button>

                        <button
                          type="button"
                          disabled={!card.videoId}
                          title="Abrir vídeo"
                          onClick={() => {
                            if (!card.videoId) return;
                            window.open(
                              `https://www.youtube.com/watch?v=${card.videoId}`,
                              "_blank"
                            );
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] ${
                            card.videoId
                              ? "bg-primary-600 hover:bg-primary-700"
                              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                          }`}
                        >
                          Abrir vídeo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

          </div>

          {/* PAGINAÇÃO */}
          <div className="flex justify-between mt-4">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-neutral-800 rounded disabled:opacity-40"
            >
              ← Voltar
            </button>

            <button
              disabled={(page + 1) * pageSize >= (result?.cards.length || 0)}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-neutral-800 rounded disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

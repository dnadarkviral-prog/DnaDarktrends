// ============================================================================
// youtube.ts — FINAL COMPLETO + MODO TURBO ⚡ REAL
// Algoritmo 100% baseado em VIEWS
// ============================================================================

export type RegionCode = "BR" | "US" | "ES" | "GLOBAL";

export interface TrendKeywordCard {
  keyword: string;
  scoreLabel: "Baixo" | "Médio" | "Alto" | "Muito Alto" | "Viral";
  engagementScore: number;
  direction: "Subindo" | "Estável" | "Caindo";
  audienceHint: string;
  viewsSample: number;
  avgViewPerVideo: number;
  likes?: number;
  comments?: number;
  durationSeconds?: number;
  videoId?: string;
}

export interface TrendsResult {
  topNiche: string;
  topEmotion: string;
  engagementLabel: string;
  variation7d: number;
  cards: TrendKeywordCard[];
}

// ============================================================================
// API KEY
// ============================================================================
function getYoutubeKey(): string {
  const key =
    localStorage.getItem("dna_api_youtube_trends") ??
    localStorage.getItem("dna_api_youtube") ??
    localStorage.getItem("DNA_YT_KEY") ??
    "";

  if (!key.trim()) throw new Error("Chave do YouTube não configurada.");
  return key.trim();
}

// ============================================================================
// DETECÇÃO DE IDIOMA
// ============================================================================
function detectLanguage(value: string): "pt" | "en" | "es" | "other" {
  const text = value.toLowerCase();
  if (/[ãõáéíóúâêôç]/.test(text)) return "pt";
  if (/\b(my|husband|cheated|wife|storytime|cheating)\b/.test(text)) return "en";
  if (/[áéíóúñü]/.test(text)) return "es";
  return "other";
}

// ============================================================================
// DECODE & DURAÇÃO
// ============================================================================
function decodeHtmlEntities(str: string) {
  const t = document.createElement("textarea");
  t.innerHTML = str;
  return t.value;
}

function parseISODurationToSeconds(iso: string | undefined | null): number {
  if (!iso) return 0;
  const m =
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.replace(",", ".")) ?? [];
  return (
    parseInt(m[1] || "0") * 3600 +
    parseInt(m[2] || "0") * 60 +
    parseInt(m[3] || "0")
  );
}

// ============================================================================
// ⭐ ALGORITMO BASEADO EM VIEWS
// ============================================================================
function computeViewScore(views: number): number {
  if (views < 5000) return 15;
  if (views < 10000) return 30;
  if (views < 20000) return 50;
  if (views < 100000) return 70;
  if (views < 300000) return 90;
  return 100; // ⭐ VIRAL
}

function getScoreLabel(
  views: number
): "Baixo" | "Médio" | "Alto" | "Muito Alto" | "Viral" {
  if (views < 5000) return "Baixo";
  if (views < 10000) return "Médio";
  if (views < 20000) return "Médio";
  if (views < 100000) return "Alto";
  if (views < 300000) return "Muito Alto";
  return "Viral";
}

function buildAudienceHint(views: number, region: RegionCode): string {
  if (views >= 500000) return "Altíssimo volume de buscas.";
  if (views >= 100000) return "Tendência forte com chance real de viral.";
  if (views >= 20000) return `Tema em crescimento em ${region}.`;
  return "Volume moderado. Bom para testes.";
}

// ============================================================================
// MULTIPÁGINAS
// ============================================================================
async function fetchSearchItems(baseUrl: URL, maxPages: number) {
  let result: any[] = [];
  let token: string | undefined;

  for (let i = 0; i < maxPages; i++) {
    if (token) baseUrl.searchParams.set("pageToken", token);
    else baseUrl.searchParams.delete("pageToken");

    const resp = await fetch(baseUrl.toString());
    const data = await resp.json();

    result.push(...(data.items ?? []));
    token = data.nextPageToken;

    if (!token) break;
  }

  return result;
}

// ============================================================================
// ⭐ FUNÇÃO PRINCIPAL — com TURBO REAL ⚡
// ============================================================================
export async function fetchTrendsFromYoutube(
  query: string,
  region: RegionCode,
  period: string,
  storyNiche?: boolean,
  minDuration?: number,
  maxDuration?: number,
  advancedMode?: boolean,
  turboMode?: boolean
): Promise<TrendsResult> {
  const key = getYoutubeKey();

  const baseQuery = storyNiche ? `${query} história` : query;
  const finalQuery = advancedMode ? `"${baseQuery}"` : baseQuery;

  const p = period.toLowerCase();
  let days = p.includes("24") ? 1 : p.includes("15") ? 15 : p.includes("30") ? 30 : 7;

  const publishedAfter = new Date(Date.now() - days * 86400000).toISOString();

  // ========================================================================
  // SEARCH URL
  // ========================================================================
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "50");
  searchUrl.searchParams.set("q", finalQuery);
  searchUrl.searchParams.set("publishedAfter", publishedAfter);
  searchUrl.searchParams.set("order", advancedMode ? "relevance" : "viewCount");
  searchUrl.searchParams.set("key", key);

  // 🔥 ESSENCIAL: PERMITIR QUALQUER DURAÇÃO
  searchUrl.searchParams.set("videoDuration", "any");

  const lang = detectLanguage(baseQuery);
  if (lang !== "other") searchUrl.searchParams.set("relevanceLanguage", lang);

  // ========================================================================
  // ⭐ TURBO REAL → 10 páginas = até 500 vídeos
  // ========================================================================
  const maxPages = turboMode ? 10 : advancedMode ? 6 : 3;

  const searchItems = await fetchSearchItems(searchUrl, maxPages);

  const videoIds = Array.from(
    new Set(
      searchItems
        .map((v) => v.id?.videoId)
        .filter((id) => typeof id === "string")
    )
  ) as string[];

  if (!videoIds.length) throw new Error("Nenhum vídeo encontrado.");

  // ========================================================================
  // FETCH DETALHES DOS VÍDEOS
  // ========================================================================
  const allVideos: any[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);

    const u = new URL("https://www.googleapis.com/youtube/v3/videos");
    u.searchParams.set("part", "statistics,contentDetails,snippet");
    u.searchParams.set("id", chunk.join(","));
    u.searchParams.set("key", key);

    const resp = await fetch(u.toString());
    const json = await resp.json();
    allVideos.push(...(json.items ?? []));
  }

  // ========================================================================
  // PROCESSAMENTO FINAL
  // ========================================================================
  const minDurSec = Math.max(60, (minDuration ?? 8) * 60);
  const maxDurSec = Math.max(minDurSec, (maxDuration ?? 120) * 60);

  const cards: TrendKeywordCard[] = [];

  for (const v of allVideos) {
    const stats = v.statistics ?? {};
    const snippet = v.snippet ?? {};

    const views = Number(stats.viewCount ?? 0);
    const likes = Number(stats.likeCount ?? 0);
    const comments = Number(stats.commentCount ?? 0);
    const duration = parseISODurationToSeconds(v.contentDetails?.duration);

    if (duration < minDurSec || duration > maxDurSec) continue;

    const title = decodeHtmlEntities(snippet.title || query);

    const score = computeViewScore(views);
    const label = getScoreLabel(views);

    const direction =
      score >= 70 ? "Subindo" : score >= 45 ? "Estável" : "Caindo";

    cards.push({
      keyword: title.replace(/"/g, ""),
      scoreLabel: label,
      engagementScore: score,
      direction,
      audienceHint: buildAudienceHint(views, region),
      viewsSample: views,
      avgViewPerVideo: views,
      likes,
      comments,
      durationSeconds: duration,
      videoId: v.id
    });
  }

  const sorted = cards.sort((a, b) => b.engagementScore - a.engagementScore);

  // ⭐ LIMITADOR FINAL — 200 NO TURBO
  const limit = turboMode ? 200 : 50;
  const limitedCards = sorted.slice(0, limit);

  const avgEng =
    limitedCards.reduce((s, c) => s + c.engagementScore, 0) /
    limitedCards.length;

  return {
    topNiche: query,
    topEmotion: avgEng > 70 ? "Mágoa, raiva, choque" : "Curiosidade, interesse",
    engagementLabel: avgEng > 60 ? "Alta Retenção" : "Média Retenção",
    variation7d: avgEng >= 70 ? 12 : avgEng >= 50 ? 4 : -6,
    cards: limitedCards
  };
}

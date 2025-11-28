import React, { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GeneratedTitle {
  title: string;
  tag: "Viral" | "Promissor" | "Médio" | "Baixo";
  score: number;
}

type LanguageOption = "pt-BR" | "en-US" | "es-ES";


type TitleTag = "Viral" | "Promissor" | "Médio" | "Baixo";

function getTagColorClasses(tag: TitleTag): string {
  switch (tag) {
    case "Viral":
      return "border-emerald-400 text-emerald-300 bg-emerald-500/10";
    case "Promissor":
      return "border-sky-400 text-sky-300 bg-sky-500/10";
    case "Médio":
      return "border-amber-400 text-amber-300 bg-amber-500/10";
    case "Baixo":
    default:
      return "border-red-400 text-red-300 bg-red-500/10";
  }
}


export const TitulosViraisPage: React.FC = () => {
  const [language, setLanguage] = useState<LanguageOption>("pt-BR");
  const [niche, setNiche] = useState("");
  const [theme, setTheme] = useState("");
  const [audience, setAudience] = useState("");
  const [firstPerson, setFirstPerson] = useState(true);
  const [charLimit, setCharLimit] = useState(70);
  const [referenceTitle, setReferenceTitle] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [titles, setTitles] = useState<GeneratedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  

  const [apiKey, setApiKey] = useState("");
  const [apiStatus, setApiStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
  const [testingKey, setTestingKey] = useState(false);
  const [ytApiKey, setYtApiKey] = useState("");
  const [ytApiStatus, setYtApiStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
  const [testingYtKey, setTestingYtKey] = useState(false);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("dna_api_gemini_titles");
    if (saved) {
      setApiKey(saved);
      setApiStatus("valid");
    }
    const savedYt = window.localStorage.getItem("dna_api_youtube_titles");
    if (savedYt) {
      setYtApiKey(savedYt);
      setYtApiStatus("valid");
    }
  }, []);

  function getYoutubeKey(): string {
    if (typeof window === "undefined") {
      throw new Error("Configuração da API só funciona no navegador.");
    }
    const key =
      window.localStorage.getItem("dna_api_youtube_titles") ??
      window.localStorage.getItem("dna_api_youtube") ??
      window.localStorage.getItem("DNA_YT_KEY") ??
      "";
    if (!key.trim()) {
      throw new Error(
        "Chave da API do YouTube não configurada. Clique em 'Configurar API' no topo e informe sua chave YouTube Data v3."
      );
    }
    return key.trim();
  }

  function getGeminiKey(): string {
    const explicit = apiKey.trim();
    if (explicit) return explicit;
    if (typeof window === "undefined") {
      throw new Error("Ambiente inválido para Gemini.");
    }
    const fallback =
      window.localStorage.getItem("dna_api_gemini_titles") ??
      window.localStorage.getItem("dna_api_gemini") ??
      "";
    if (!fallback.trim()) {
      throw new Error(
        "Chave da API Gemini para títulos não configurada. Informe abaixo ou use a chave global."
      );
    }
    return fallback.trim();
  }

  async function handleTestKey() {
    try {
      setTestingKey(true);
      setError(null);
      const key = apiKey.trim();
      if (!key) {
        throw new Error("Informe uma chave para testar.");
      }
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Responda apenas com: ok");
      const text = (await result.response.text()).toLowerCase();
      if (!text.includes("ok")) {
        throw new Error("Resposta inesperada da IA ao testar a chave.");
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dna_api_gemini_titles", key);
      }
      setApiStatus("valid");
    } catch (err: any) {
      console.error("Erro ao testar chave Gemini (títulos):", err);
      setApiStatus("invalid");
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "Falha ao testar a chave Gemini.";
      setError(msg);
    } finally {
      setTestingKey(false);
    }
  }


  async function handleTestYtKey() {
    try {
      setTestingYtKey(true);
      setError(null);
      const key = ytApiKey.trim();
      if (!key) {
        throw new Error("Informe uma chave YouTube para testar.");
      }
      const testUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      testUrl.searchParams.set("part", "snippet");
      testUrl.searchParams.set("q", "test");
      testUrl.searchParams.set("maxResults", "1");
      testUrl.searchParams.set("key", key);

      const resp = await fetch(testUrl.toString());
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(
          "Erro ao testar chave YouTube: " + resp.status + " " + txt
        );
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("dna_api_youtube_titles", key);
      }
      setYtApiStatus("valid");
    } catch (err: any) {
      console.error("Erro ao testar chave YouTube (títulos virais):", err);
      setYtApiStatus("invalid");
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "Falha ao testar a chave YouTube.";
      setError(msg);
    } finally {
      setTestingYtKey(false);
    }
  }

  function mapLanguageDisplayToCode(value: string): LanguageOption {
    if (value.includes("English")) return "en-US";
    if (value.includes("Español")) return "es-ES";
    return "pt-BR";
  }

  function getRegionFromLanguage(lang: LanguageOption): string {
    if (lang === "pt-BR") return "BR";
    if (lang === "es-ES") return "ES";
    return "US";
  }

  function buildKeyword(): string {
    const parts = [referenceTitle, theme, niche]
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return "drama familiar história emocionante";
    return parts.join(" - ");
  }

  function normalizeCharLimit(limit: number): number {
    if (!limit || limit < 30) return 80;
    if (limit > 120) return 120;
    return limit;
  }

  function cleanJsonTitles(raw: string): string[] {
    let text = raw.trim();
    // remover markdown ```json ou ```
    if (text.startsWith("```")) {
      const first = text.indexOf("```");
      const last = text.lastIndexOf("```");
      if (last > first) {
        text = text.slice(first + 3, last).trim();
      }
    }
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      text = text.slice(firstBracket, lastBracket + 1);
    }
    let parsed: any = [];
    try {
      parsed = JSON.parse(text);
    } catch {
      // tentativa bruta: separar por linhas com hífen ou número
      const lines = text.split("\n").map((l) => l.trim());
      const onlyText = lines
        .filter((l) => l.length > 0)
        .map((l) => l.replace(/^[-*\d\.\)]+\s*/, ""));
      return onlyText;
    }
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") return item;
          if (typeof item.title === "string") return item.title;
          return null;
        })
        .filter((t): t is string => !!t);
    }
    return [];
  }
// Extrai apenas o @username da URL
function extractHandle(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/@([A-Za-z0-9._-]+)/);
  return match ? match[1] : null;
}
// Converte @username → channelId real
async function fetchChannelId(handle: string, ytKey: string): Promise<string | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id");
  url.searchParams.set("forHandle", handle);
  url.searchParams.set("key", ytKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) return null;

  const data = await resp.json();
  return data.items?.[0]?.id ?? null;
}
async function fetchChannelTitles(channelId: string, ytKey: string): Promise<string[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("order", "viewCount");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", ytKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) return [];

  const data = await resp.json();

  return data.items
    ?.map((i: any) => i.snippet?.title)
    .filter((t: string) => typeof t === "string") ?? [];
}

  async function fetchViralTitlesFromYoutube(
    keyword: string,
    lang: LanguageOption
  ): Promise<string[]> {
    const key = getYoutubeKey();
    const regionCode = getRegionFromLanguage(lang);

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "25");
    searchUrl.searchParams.set("q", keyword);
    searchUrl.searchParams.set("regionCode", regionCode);
    searchUrl.searchParams.set("order", "relevance");
    searchUrl.searchParams.set("key", key);

    const searchResp = await fetch(searchUrl.toString());
    if (!searchResp.ok) {
      const txt = await searchResp.text();
      throw new Error(
        "Erro ao buscar vídeos no YouTube: " +
          searchResp.status +
          " " +
          txt
      );
    }

    const searchData: any = await searchResp.json();
    const items: any[] = searchData.items ?? [];
    const ids = items
      .map((it) => it.id && it.id.videoId)
      .filter((v: any) => typeof v === "string");

    if (ids.length === 0) return [];

    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "statistics,snippet");
    videosUrl.searchParams.set("id", ids.join(","));
    videosUrl.searchParams.set("key", key);

    const videosResp = await fetch(videosUrl.toString());
    if (!videosResp.ok) {
      const txt = await videosResp.text();
      throw new Error(
        "Erro ao buscar estatísticas dos vídeos: " +
          videosResp.status +
          " " +
          txt
      );
    }

    const videosData: any = await videosResp.json();
    const videos: { title: string; views: number }[] = [];

    for (const item of videosData.items ?? []) {
      const snippet = item.snippet ?? {};
      const stats = item.statistics ?? {};
      const title: string = snippet.title ?? "";
      const views = Number(stats.viewCount ?? 0);
      if (title) {
        videos.push({ title, views: Number.isFinite(views) ? views : 0 });
      }
    }

    videos.sort((a, b) => b.views - a.views);
    return videos.slice(0, 10).map((v) => v.title);
  }

  

  type TitleTag = "Viral" | "Promissor" | "Médio" | "Baixo";

  async function scoreGeneratedTitleWithYoutube(
    generatedTitle: string,
    lang: LanguageOption
  ): Promise<{ tag: TitleTag; score: number }> {
    try {
      const key = getYoutubeKey();
      const regionCode = getRegionFromLanguage(lang);

      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("maxResults", "8");
      searchUrl.searchParams.set("q", generatedTitle);
      searchUrl.searchParams.set("regionCode", regionCode);
      searchUrl.searchParams.set("order", "relevance");
      searchUrl.searchParams.set("key", key);

      const searchResp = await fetch(searchUrl.toString());
      if (!searchResp.ok) {
        throw new Error("Falha ao buscar vídeos para o título gerado.");
      }
      const searchData: any = await searchResp.json();
      const items: any[] = searchData.items ?? [];
      const ids = items
        .map((it) => it.id && it.id.videoId)
        .filter((v: any) => typeof v === "string");

      if (!ids.length) {
        return { tag: "Médio", score: 50 };
      }

      const videosUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos"
      );
      videosUrl.searchParams.set("part", "statistics,snippet");
      videosUrl.searchParams.set("id", ids.join(","));
      videosUrl.searchParams.set("key", key);

      const videosResp = await fetch(videosUrl.toString());
      if (!videosResp.ok) {
        throw new Error("Falha ao buscar métricas dos vídeos para o título.");
      }
      const videosData: any = await videosResp.json();

      const scored: number[] = [];
      for (const item of videosData.items ?? []) {
        const stats = item.statistics ?? {};
        const snippet = item.snippet ?? {};
        const views = Number(stats.viewCount ?? 0);
        const likes = Number(stats.likeCount ?? 0);
        const likeRate =
          views > 0 && likes >= 0 ? Math.min(likes / views, 1) : 0;
        const baseScore = Math.log10(views + 10) * 20; // 1k ~60, 10k ~80, 100k ~100
        const likeBoost = likeRate * 40; // até ~4 pontos extras
        const final = Math.min(100, Math.max(0, Math.round(baseScore + likeBoost)));
        scored.push(final);
      }

      if (!scored.length) {
        return { tag: "Médio", score: 50 };
      }

      scored.sort((a, b) => b - a);
      const top = scored.slice(0, 3);
      const avg =
        top.reduce((sum, v) => sum + v, 0) / (top.length || 1);
      const score = Math.min(100, Math.max(0, Math.round(avg)));

      let tag: TitleTag;
      if (score >= 80) tag = "Viral";
      else if (score >= 60) tag = "Promissor";
      else if (score >= 40) tag = "Médio";
      else tag = "Baixo";

      return { tag, score };
    } catch (err) {
      console.warn(
        "Não foi possível analisar o título pelo YouTube. Mantendo pontuação padrão.",
        err
      );
      return { tag: "Promissor", score: 60 };
    }
  }

  async function handleGenerateTitles() {
    try {
      setLoading(true);
      setError(null);
      setTitles([]);

      if (!niche.trim() || !theme.trim()) {
        throw new Error("Preencha pelo menos o Nicho e o Tema / Resumo.");
      }

      const geminiKey = getGeminiKey();
      const keyword = buildKeyword();
      const lang = language;
// --- Canal: estilo e títulos reais ---
let channelTitles: string[] = [];
if (channelUrl.trim()) {
  try {
    const handle = extractHandle(channelUrl.trim());
    if (handle) {
      const ytKey = getYoutubeKey();
      const channelId = await fetchChannelId(handle, ytKey);

      if (channelId) {
        channelTitles = await fetchChannelTitles(channelId, ytKey);
      }
    }
  } catch (e) {
    console.warn("Falha ao obter estilo do canal:", e);
  }
}

      const charTarget = normalizeCharLimit(charLimit);

      let viralTitles: string[] = [];
      try {
        viralTitles = await fetchViralTitlesFromYoutube(keyword, lang);
      } catch (ytErr) {
        console.warn("Falha ao buscar títulos virais no YouTube:", ytErr);
        viralTitles = [];
      }

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const idiomaDescricao =
        lang === "pt-BR"
          ? "português do Brasil"
          : lang === "es-ES"
          ? "espanhol"
          : "inglês dos Estados Unidos";

      const prompt =
        "Você é um especialista em títulos virais para vídeos de storytelling dramático no YouTube.\n\n" +
        "Sua tarefa é criar EXATAMENTE 15 títulos diferentes, altamente clicáveis, seguindo as regras abaixo:\n\n" +
        "REGRAS CENTRAIS:\n" +
        "- Sempre em 1ª pessoa no idioma alvo (" +
        idiomaDescricao +
        "), usando pronomes como eu, meu/minha, etc.\n" +
        "- Foque SEMPRE em: conflito + evento concreto + reação emocional ou reviravolta.\n" +
        "- Comece direto com um fato emocional impactante ou uma injustiça clara (evite introduções genéricas).\n" +
        "- Inclua, quando natural, um local ou evento visual (ex.: casamento, jantar, graduação, reunião de família, leitura de testamento).\n" +
        '- Sempre que fizer sentido, use falas reais entre aspas para humanizar (por exemplo: "Você não pertence a esta família").\n' +
        "- Os títulos devem ter tamanho fluido, com foco aproximado de até " +
        String(charTarget) +
        " caracteres. Não precisa ser exato, mas evite ser muito curto.\n" +
        "- Mantenha o tom emocional e humano, com foco em mágoa, injustiça, humilhação, virada ou revelação.\n\n" +
        "CONTEXTO DO VÍDEO:\n" +
        "- Nicho: " +
        niche +
        "\n" +
        "- Tema / Resumo: " +
        theme +
        "\n" +
        "- Público alvo: " +
        (audience || "não especificado") +
        "\n" +
        "- Categoria temática: " +
        (category || "nenhuma (apenas contexto geral)") +
        "\n" +
        "- Título de referência (se houver): " +
        (referenceTitle || "nenhum") +
        "\n" +
        "- Palavra-chave principal construída: " +
        keyword +
        "\n\n" +
        "EXEMPLOS DE PADRÕES E FÓRMULAS (referência estrutural, adapte SEMPRE ao idioma alvo):\n" +
        "1) They Told Me [Frase Cruel] — So I [Reação/Revide]\n" +
        "2) After [Situação Impactante], I Heard \"[Fala Real]\" — That Changed Everything\n" +
        "3) My [Parente] Said [Fala Cruel] At [Evento Visual] — So I Left With [Virada]\n" +
        "4) [Ocasião Esperada] Turned Into [Surpresa Emocional] — I Wasn’t Ready\n" +
        "5) I Was [Verbo Forte] During [Evento], But [Virada ou Reação de Valor]\n" +
        "6) They Ignored Me While I Was [Ação de Sacrifício] — But I Had the Last Word\n" +
        "7) Everyone Laughed When I [Ação Humilhante] — Until [Reconhecimento Público]\n" +
        "8) I Gave Them [Presente/Esforço Real] — They Gave Me [Humilhação ou Indiferença]\n" +
        "9) On the Day of [Evento Importante], My [Parente] Did [Ação Cruel] — So I Responded With [Virada]\n" +
        "10) While Everyone Was Celebrating, I Was [Ação de Dor/Sofrimento] — And No One Noticed\n\n" +
        "LISTA DE CATEGORIAS TEMÁTICAS POSSÍVEIS (use apenas se combinar com o contexto informado):\n" +
        "- Herança desigual revelada em funeral\n" +
        "- Presentes desiguais em ocasiões especiais\n" +
        "- Humilhação pública em reunião de família\n" +
        "- Favoritismo escancarado em jantar de família\n" +
        "- Rebaixamento profissional injusto\n" +
        "- Negligência com idosos em casa\n" +
        "- Tirar alguém da herança após briga\n" +
        "- Descoberta de traição durante viagem\n" +
        "- Filho ignorado em formatura\n" +
        "- Exclusão em aniversário ou casamento\n" +
        "- Expulsão de casa por genro/nora\n" +
        "- Briga por casa herdada\n" +
        "- Sacrifício ignorado em doença familiar\n" +
        "- Manipulação emocional em hospital\n" +
        "- Mentiras reveladas em testamento\n" +
        "- Divisão injusta de bens entre irmãos\n" +
        "- Filha desprezada após cuidar dos pais\n" +
        "- Apropriação de bens por cunhado ou cunhada\n" +
        "- Desprezo profissional seguido de reviravolta\n" +
        "- Farsa exposta em jantar formal\n" +
        '- Roubo disfarçado de "ajuda"\n' +
        "- Afastamento de netos por vingança\n" +
        "- Noivado interrompido por segredo familiar\n" +
        "- Críticas ao estilo de vida em evento religioso\n" +
        "- Comentários cruéis sobre aparência\n" +
        "- Desdém por profissão ou classe social\n" +
        "- Exclusão em reunião de negócios\n" +
        "- Filho escondido do testamento\n" +
        "- Genro tentando controlar finanças\n" +
        "- Nora tentando mudar testamento\n" +
        "- Filho que abandona pais no hospital\n" +
        "- Desprezo por presente simples\n" +
        "- Comparação cruel entre irmãos\n" +
        "- Reação pública a uma carta de despedida\n" +
        "- Briga por joias da avó\n" +
        "- Festa surpresa que vira humilhação\n" +
        "- Acusação de inutilidade no trabalho\n" +
        "- Promoção roubada no escritório\n" +
        "- Término cruel durante evento público\n" +
        "- Retirada de apoio financeiro sem aviso\n" +
        "- Filho preferido ganha casa da mãe\n" +
        '- Filha expulsa por não casar "como manda"\n' +
        "- Rejeição em evento tradicional da família\n" +
        "- Sogra tentando apagar nora das fotos\n" +
        "- Esposa excluída da decisão médica do marido\n\n" +
// Se houver títulos do canal, adiciona ao prompt
+ (channelTitles.length
    ? "ESTILO DO CANAL DO CLIENTE — USE APENAS COMO REFERÊNCIA ESTRUTURAL:\n" +
      channelTitles.map((t, i) => `${i + 1}) ${t}`).join("\n") +
      "\n\n"
    : "")

        "TÍTULOS VIRAIS REAIS PARA SE INSPIRAR (NÃO COPIE, APENAS USE COMO BASE ESTRUTURAL):\n" +
        (viralTitles.length
          ? viralTitles.map((t, i) => String(i + 1) + ") " + t).join("\n") +
            "\n\n"
          : "") +
        "Se não houver muitos títulos acima, use principalmente o contexto fornecido.\n\n" +
        "AGORA, GERE APENAS UM JSON com o formato:\n" +
        '[{"title": "título 1"}, {"title": "título 2"}, ...]\n' +
        "NÃO explique nada, não use markdown, não adicione texto fora do JSON.";

      const result = await model.generateContent(prompt);
      const raw = await result.response.text();
      const titlesList = cleanJsonTitles(raw);

      if (!titlesList.length) {
        throw new Error(
          "A IA não retornou títulos válidos. Tente refinar o tema ou a palavra-chave."
        );
      }

      const limited = titlesList.slice(0, 15);
      let enriched: GeneratedTitle[] = [];

      try {
        const scored = await Promise.all(
          limited.map((t) => scoreGeneratedTitleWithYoutube(t, lang))
        );
        enriched = limited.map((t, index) => ({
          title: t,
          tag: scored[index]?.tag ?? "Promissor",
          score: scored[index]?.score ?? 60
        }));
      } catch {
        enriched = limited.map((t) => ({
          title: t,
          tag: "Promissor",
          score: 60
        }));
      }

      setTitles(enriched);
    } catch (err: any) {
      console.error("Erro ao gerar títulos virais:", err);
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "Falha ao gerar títulos virais.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions: string[] = [
    "",
    "Herança desigual revelada em funeral",
    "Presentes desiguais em ocasiões especiais",
    "Humilhação pública em reunião de família",
    "Favoritismo escancarado em jantar de família",
    "Rebaixamento profissional injusto",
    "Negligência com idosos em casa",
    "Tirar alguém da herança após briga",
    "Descoberta de traição durante viagem",
    "Filho ignorado em formatura",
    "Exclusão em aniversário ou casamento",
    "Expulsão de casa por genro/nora",
    "Briga por casa herdada",
    "Sacrifício ignorado em doença familiar",
    "Manipulação emocional em hospital",
    "Mentiras reveladas em testamento",
    "Divisão injusta de bens entre irmãos",
    "Filha desprezada após cuidar dos pais",
    "Apropriação de bens por cunhado ou cunhada",
    "Desprezo profissional seguido de reviravolta",
    "Farsa exposta em jantar formal",
    "Roubo disfarçado de ajuda",
    "Afastamento de netos por vingança",
    "Noivado interrompido por segredo familiar",
    "Críticas ao estilo de vida em evento religioso",
    "Comentários cruéis sobre aparência",
    "Desdém por profissão ou classe social",
    "Exclusão em reunião de negócios",
    "Filho escondido do testamento",
    "Genro tentando controlar finanças",
    "Nora tentando mudar testamento",
    "Filho que abandona pais no hospital",
    "Desprezo por presente simples",
    "Comparação cruel entre irmãos",
    "Reação pública a uma carta de despedida",
    "Briga por joias da avó",
    "Festa surpresa que vira humilhação",
    "Acusação de inutilidade no trabalho",
    "Promoção roubada no escritório",
    "Término cruel durante evento público",
    "Retirada de apoio financeiro sem aviso",
    "Filho preferido ganha casa da mãe",
    'Filha expulsa por não casar "como manda"',
    "Rejeição em evento tradicional da família",
    "Sogra tentando apagar nora das fotos",
    "Esposa excluída da decisão médica do marido"
  ];

  return (
    <div className="grid md:grid-cols-[minmax(0,340px),minmax(0,1fr)] gap-6">
      <section className="bg-dark-800 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold">Configurar Gerador</h2>

        <div className="bg-black/40 border border-neutral-800 rounded-xl p-3 space-y-2 text-xs mb-2">
          <p className="text-neutral-300 font-semibold flex items-center justify-between">
            <span>Chave API Gemini (Títulos Virais)</span>
            {apiStatus === "valid" && (
              <span className="text-[10px] text-emerald-400">
                chave válida
              </span>
            )}
            {apiStatus === "invalid" && (
              <span className="text-[10px] text-red-400">erro na chave</span>
            )}
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setApiStatus("idle");
            }}
            className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-[11px]"
            placeholder="Cole aqui uma chave Gemini exclusiva ou deixe em branco para usar a global..."
          />
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testingKey || !apiKey.trim()}
            className="w-full mt-2 text-[11px] py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50"
          >
            {testingKey ? "Testando chave..." : "Testar e salvar chave"}
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Idioma</label>
            <select
              value={language}
              onChange={(e) =>
                setLanguage(mapLanguageDisplayToCode(e.target.value))
              }
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2"
            >
              <option>🇧🇷 Português (Brasil)</option>
              <option>🇺🇸 English (USA)</option>
              <option>🇪🇸 Español</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Nicho *</label>
            <input
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2"
              placeholder="Ex: História, True Crime, Mistério..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">
              Tema / Resumo *
            </label>
            <textarea
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 min-h-[80px]"
              placeholder="Explique a ideia geral do vídeo..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">
              Categoria do título (opcional)
            </label>
            <select
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-[11px]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryOptions.map((opt, index) => (
                <option key={index} value={opt}>
                  {opt || "Nenhuma (usar apenas o contexto)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Público alvo</label>
            <input
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2"
              placeholder="Ex: Mulheres 40+"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <input
              id="p1"
              type="checkbox"
              className="rounded border-neutral-600"
              checked={firstPerson}
              onChange={(e) => setFirstPerson(e.target.checked)}
            />
            <label htmlFor="p1" className="text-neutral-300">
              História em primeira pessoa
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-neutral-400">
                Caracteres (máx. sugerido):
              </label>
              <span className="text-red-500 font-semibold">{charLimit}</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              value={charLimit}
              onChange={(e) =>
                setCharLimit(Number(e.target.value) || 70)
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">
              Referência (opcional)
            </label>
            <input
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-[11px]"
              placeholder="Cole um título inspiração..."
              value={referenceTitle}
              onChange={(e) => setReferenceTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">
              Link do canal (opcional)
            </label>
            <input
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-[11px]"
              placeholder="Ex: youtube.com/@SeuCanal"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-red-400 mb-1">
              Prompt personalizado (opcional)
            </label>
            <textarea
              className="w-full bg-black/60 border border-red-800/70 rounded-xl px-3 py-2 min-h-[60px] text-[11px]"
              placeholder="Instruções extras para a IA..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={handleGenerateTitles}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl py-3 disabled:opacity-50"
          >
            {loading ? "Gerando títulos..." : "Gerar Títulos Virais"}
          </button>
        </div>
      </section>

      <section className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-2">Títulos Gerados</h2>

        {error && (
          <div className="mb-3 text-[11px] text-red-400 bg-red-900/20 border border-red-800/60 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!titles.length && !error && !loading && (
          <p className="text-xs text-neutral-500">
            Preencha o formulário ao lado e clique em &quot;Gerar Títulos
            Virais&quot; para criar 15 ideias com base no nicho, tema e vídeos
            reais do YouTube.
          </p>
        )}

        {loading && (
          <p className="text-xs text-neutral-400 animate-pulse">
            Analisando vídeos virais no YouTube e gerando variações de títulos
            com o Gemini...
          </p>
        )}

       {!!titles.length && (
  <div className="space-y-2 text-xs">
    {titles.map((t, index) => (
        <div
        key={index}
        className="flex items-start gap-2 bg-black/40 border border-neutral-800 rounded-lg px-3 py-2 relative"
      >
        <span className="text-neutral-500 text-[10px] mt-0.5">
          {index + 1}.
        </span>

        <div className="flex flex-col gap-1 flex-1">
          <p className="text-neutral-100 pr-6">{t.title}</p>

          <div className="flex items-center gap-2 text-[10px] mt-1">
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getTagColorClasses(
                t.tag
              )}`}
            >
              {t.tag === "Viral"
                ? "🔥 Viral"
                : t.tag === "Promissor"
                ? "⚡ Promissor"
                : t.tag === "Médio"
                ? "🟡 Médio"
                : "🔻 Baixo"}
            </span>

            <span className="text-neutral-500">
              score: {t.score}/100
            </span>
          </div>
        </div>

        {/* 📑 Botão copiar */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(t.title);

            const el = document.getElementById(`copied-${index}`);
            if (el) {
              el.style.opacity = "1";
              setTimeout(() => {
                if (el) el.style.opacity = "0";
              }, 1000);
            }
          }}
          className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-200 transition text-xs"
          title="Copiar título"
        >
          📑
        </button>

        {/* ✔️ Mensagem de copiado */}
        <span
          id={`copied-${index}`}
          className="absolute right-2 top-6 text-emerald-400 text-[10px] opacity-0 transition-opacity duration-200"
        >
          Copiado ✔️
        </span>
      </div>
    ))}
  </div>
)}
      </section>
    </div>
  );
};


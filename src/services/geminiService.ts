import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ScriptConcept,
  ScriptGenerationParams,
  VideoScript,
  ScriptChapter
} from "../types";

const MODEL_NAME = "gemini-2.5-flash";

function getApiKey(override?: string): string {
  if (override && override.trim()) return override.trim();
  if (typeof window === "undefined") {
    throw new Error("Ambiente inválido para Gemini.");
  }
  const key = window.localStorage.getItem("dna_api_gemini");
  if (!key || !key.trim()) {
    throw new Error("Chave de API do Gemini não encontrada. Configure nas configurações.");
  }
  return key.trim();
}

function cleanJson(text: string): any {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

function clampScriptToTargets(
  script: VideoScript,
  charsPerBlock: number
): VideoScript {
  const targetMin = Math.floor(charsPerBlock * 0.85);
  const targetMax = Math.floor(charsPerBlock * 1.15);

  const adjustBlock = (text: string) => {
    if (!text) return text;
    const len = text.length;
    if (len < targetMin) {
      // não ajustar aqui — deixamos o modelo tratar expansão
      return text;
    }
    if (len > targetMax) {
      // corta suavemente no último ponto final antes do limite
      const slice = text.slice(0, targetMax);
      const lastDot = slice.lastIndexOf(".");
      if (lastDot > targetMin * 0.6) {
        return slice.slice(0, lastDot + 1);
      }
      return slice;
    }
    return text;
  };

  return {
    ...script,
    intro: adjustBlock(script.intro),
    chapters: script.chapters?.map((c) => ({
      ...c,
      content: adjustBlock(c.content)
    })),
    moral: adjustBlock(script.moral),
    cta: adjustBlock(script.cta)
  };
}

export async function generateScriptConcepts(
  params: ScriptGenerationParams,
  apiKeyOverride?: string
): Promise<ScriptConcept[]> {
  const apiKey = getApiKey(apiKeyOverride);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `Você é um roteirista especialista em histórias de drama familiar para YouTube, focado em mulheres e alta retenção.

Gere exatamente 3 opções de CONCEITOS DE ROTEIRO (título + sinopse + hookPreview) com base nos dados abaixo.

RETORNE EXCLUSIVAMENTE JSON VÁLIDO, no formato:

[
  {
    "id": 1,
    "title": "Título chamativo em primeira pessoa...",
    "synopsis": "Sinopse em primeira pessoa, em 4–6 frases, linguagem simples e coloquial...",
    "hookPreview": "Frase curta em primeira pessoa, para abrir o vídeo com impacto..."
  },
  {
    "id": 2,
    "title": "Título chamativo em primeira pessoa...",
    "synopsis": "Sinopse em primeira pessoa, em 4–6 frases, linguagem simples e coloquial...",
    "hookPreview": "Frase curta em primeira pessoa, para abrir o vídeo com impacto..."
  },
  {
    "id": 3,
    "title": "Título chamativo em primeira pessoa...",
    "synopsis": "Sinopse em primeira pessoa, em 4–6 frases, linguagem simples e coloquial...",
    "hookPreview": "Frase curta em primeira pessoa, para abrir o vídeo com impacto..."
  }
]

REGRAS IMPORTANTES:
- Todas as SINOPSES devem ser escritas em primeira pessoa ("eu"), como se a protagonista estivesse contando a própria história.
- Use linguagem coloquial, natural, cotidiana, sem formalidade, sem palavras difíceis e sem clichês.
- Foque sempre em conflitos de drama familiar (casamento, filhos, sogra, herança, traição, abandono, humilhação, segredos, recomeços).
- Cada sinopse deve entregar claramente a PROMESSA do título, sem revelar o final.
- O hookPreview deve ser uma frase forte em primeira pessoa, que já traga o conflito de cara.
- Evite termos forçados ou muito literários; escreva como alguém comum desabafando.

DADOS BASE:
- Título sugerido do vídeo: ${params.videoTitle || "Deixe a IA sugerir"}
- Nicho: ${params.niche}
- Subnicho: ${params.subniche}
- Perspectiva desejada: ${params.perspective}
- Tom / Estilo: ${params.narrativeTone}
- Público alvo: ${params.targetAudience}
- Emoção principal: ${params.emotion}
- Idade média da audiência: ${params.ageGroup}
- Ritmo: ${params.pace}
- Estilo de roteiro: ${params.scriptStyle}
- Idioma: ${params.language}
- Tema específico detalhado: ${params.synopsis}${
    params.customPrompt
      ? "\nInstruções extras do usuário: " + params.customPrompt
      : ""
  }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const parsed = cleanJson(text);

  return Array.isArray(parsed) ? parsed : [];
}

export async function generateFullScriptFromConcept(
  params: ScriptGenerationParams,
  concept: ScriptConcept,
  apiKeyOverride?: string
): Promise<VideoScript> {
  const apiKey = getApiKey(apiKeyOverride);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const totalCharsApprox = params.charsPerBlock * params.chapterCount;
  const paceExplain =
    params.pace === "Lento"
      ? "Lento — Sofrimento prolongado, tensão emocional forte, introspecção."
      : params.pace === "Rápido"
      ? "Rápido — Explosões emocionais, discussões, decisões impulsivas, impacto imediato."
      : "Moderado — Drama equilibrado, natural, com emoção fluindo junto da história.";

  // Comportamento base do gerador de roteiro
  const baseBehavior = `
Você é um gerador de roteiros especializado em histórias de drama familiar para vídeos longos no YouTube, focado em mulheres e alta retenção.

Regras gerais de escrita:
- Narre SEMPRE em primeira pessoa ("eu"), como se a personagem estivesse desabafando a própria história.
- Use linguagem simples, coloquial, natural, sem formalidade, sem palavras difíceis, sem gírias exageradas e sem clichês.
- Evite termos forçados como "ensurdecedor", "minha nora fora", frases muito literárias ou rebuscadas.
- Foque em conflitos reais: casamento, filhos, sogra, família tóxica, traição, herança, abandono, humilhação, recomeços.
- A história deve ser emocional, envolvente, clara e realista, sem invenções absurdas que fujam do contexto do formulário.

Estrutura obrigatória:
- Abertura: comece com HOOK + CONFLITO, como se estivesse "narrando o título" logo nos primeiros segundos, sem spoiler do final.
- Desenvolvimento: avance o conflito em cada bloco, sempre adicionando novas tensões, revelações ou consequências.
- Clímax: um ponto de virada forte, onde algo decisivo acontece.
- Desfecho: resolução do conflito + reflexão final.
- Moral da história: sempre com foco em autoajuda, empoderamento feminino, respeito, limites saudáveis e recomeços.

CTAs obrigatórios:
- No BLOCO 2: pergunte de onde a pessoa está ouvindo e peça inscrição no canal.
- No BLOCO 4: peça curtida de forma natural, conectada com a história.
- No FINAL (cta): agradeça, peça comentários, pergunte se já viveram algo semelhante e peça curtida + inscrição.

SEO e retenção:
- Escreva pensando em retenção máxima: mini-ganchos no final de cada bloco.
- Use termos que o público realmente buscaria, sem parecer spam de palavras-chave.
- Nunca explique que isso é um roteiro; apenas conte a história.

Restrições:
- Não repita a história, frases, personagens ou diálogos de qualquer roteiro-modelo.
- Não copie trechos longos de nada; gere conteúdo sempre novo.
- Respeite fielmente as informações do formulário do usuário (conflito, contexto, tom, público, etc.).
`;

  // Prioridade das instruções:
  // 1) Se houver modelo de roteiro (params.modelScript), ele domina e as regras internas + prompt personalizado são ignorados.
  // 2) Se NÃO houver modelo, mas houver customPrompt, o customPrompt domina as regras internas.
  // 3) Se nenhum dos dois existir, usa apenas o baseBehavior.

  let behaviorBlock: string;

  if (params.modelScript && params.modelScript.trim().length > 0) {
    behaviorBlock = `
Você recebeu um ROTEIRO-MODELO que deve ser usado APENAS como referência de ESTRUTURA NARRATIVA, e nunca como conteúdo a ser copiado.

ROTEIRO-MODELO (APENAS ESTRUTURA, NÃO COPIAR CONTEÚDO):

"""${params.modelScript.slice(0, 12000)}"""

Instruções obrigatórias:
- Use esse modelo apenas para entender estrutura de blocos, ritmo, forma de abertura, desenvolvimento, clímax, reviravolta, encerramento, CTAs e estilo geral.
- Gere uma história 100% nova, com personagens, conflitos, cenas, diálogos e desfechos totalmente diferentes.
- É PROIBIDO copiar frases, parágrafos, diálogos, nomes, cidades ou acontecimentos específicos do roteiro-modelo.
- Respeite os dados do formulário do usuário como fonte principal de conteúdo.
- Mantenha o foco em drama familiar, empoderamento e moral final.
`;
  } else if (params.customPrompt && params.customPrompt.trim().length > 0) {
    behaviorBlock = `
Siga com prioridade as instruções personalizadas abaixo, acima de qualquer regra interna. Ainda assim, mantenha CTAs obrigatórios, estrutura em blocos e foco em drama familiar:

"""${params.customPrompt}"""

Reforce:
- Primeira pessoa.
- Linguagem coloquial.
- Conflito logo no início.
- Final com moral e reflexão para mulheres.
`;
  } else {
    behaviorBlock = baseBehavior;
  }

  const prompt = `${behaviorBlock}

Agora, com base no CONCEITO abaixo e nas configurações, escreva um roteiro completo em JSON válido.

FORMATO OBRIGATÓRIO DO RETORNO (JSON):

{
  "title": "Título final do vídeo",
  "intro": "Texto de abertura com hook forte...",
  "chapters": [
    { "title": "Bloco 1", "content": "Texto do bloco 1..." },
    { "title": "Bloco 2", "content": "Texto do bloco 2..." }
  ],
  "moral": "Mensagem final / lição da história...",
  "cta": "Chamada para ação para o final do vídeo..."
}

CONCEITO ESCOLHIDO:
- Título base: ${concept.title}
- Sinopse: ${concept.synopsis}
- Hook sugerido: ${concept.hookPreview}

CONFIGURAÇÕES DO ROTEIRO:
- Nicho: ${params.niche}
- Subnicho: ${params.subniche}
- Perspectiva: ${params.perspective}
- Tom / Estilo: ${params.narrativeTone}
- Público alvo: ${params.targetAudience}
- Emoção principal: ${params.emotion}
- Idade média: ${params.ageGroup}
- Ritmo selecionado: ${params.pace} (interprete assim: ${paceExplain})
- Estilo de roteiro: ${params.scriptStyle}
- Idioma: ${params.language}
- Quantidade de blocos: ${params.chapterCount}
- Caracteres aproximados por bloco: ${params.charsPerBlock}
- Comprimento alvo aproximado do roteiro inteiro: cerca de ${totalCharsApprox} caracteres no total.

REGRAS DE TAMANHO:
- Divida a história em exatamente ${params.chapterCount} blocos em "chapters".
- Cada bloco deve ter por volta de ${params.charsPerBlock} caracteres.
- Evite blocos muito curtos ou muito longos em relação aos demais.
- Se for necessário, ajuste o texto para se aproximar ao máximo desse tamanho por bloco.

Agora gere o JSON do roteiro seguindo tudo acima, sem adicionar comentários fora do JSON.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const parsed = cleanJson(text);

  const script: VideoScript = {
    title: parsed.title || concept.title,
    intro: parsed.intro || "",
    chapters: Array.isArray(parsed.chapters)
      ? parsed.chapters.map((c: any, index: number) => ({
          title: c.title || `Bloco ${index + 1}`,
          content: c.content || ""
        }))
      : [],
    moral: parsed.moral || "",
    cta: parsed.cta || ""
  };

  const adjusted = clampScriptToTargets(script, params.charsPerBlock);
  return adjusted;
}

export async function adjustScriptLength(
  script: VideoScript,
  deltaChars: number,
  mode: "expand" | "shrink",
  apiKeyOverride?: string
): Promise<VideoScript> {
  const apiKey = getApiKey(apiKeyOverride);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const direction =
    mode === "expand"
      ? "AUMENTAR o tamanho do texto aproximadamente em " + deltaChars + " caracteres."
      : "REDUZIR o tamanho do texto aproximadamente em " + deltaChars + " caracteres, removendo redundâncias sem quebrar a história.";

  const prompt = `Você é um editor de roteiros de drama familiar.

Sua tarefa é manter a MESMA história, mesma estrutura, mesmos personagens, mesmo tom e mesmos CTAs,
apenas ${direction}

REGRAS:
- Não mude o ponto de vista: mantenha sempre em primeira pessoa ("eu").
- Não troque o conflito central nem o desfecho.
- Não remova CTAs já existentes.
- Não adicione novos personagens importantes.
- Ajuste apenas nível de detalhe, descrições, transições, ritmo e diálogo.

RETORNE SOMENTE JSON VÁLIDO NO FORMATO:

{
  "title": "...",
  "intro": "...",
  "chapters": [
    { "title": "Bloco 1", "content": "..." },
    { "title": "Bloco 2", "content": "..." }
  ],
  "moral": "...",
  "cta": "..."
}

ROTEIRO ATUAL:

${JSON.stringify(script)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const parsed = cleanJson(text);

  const adjusted: VideoScript = {
    title: parsed.title || script.title,
    intro: parsed.intro || script.intro,
    chapters: Array.isArray(parsed.chapters)
      ? parsed.chapters.map((c: any, index: number) => ({
          title: c.title || script.chapters[index]?.title || `Bloco ${index + 1}`,
          content: c.content || script.chapters[index]?.content || ""
        }))
      : script.chapters,
    moral: parsed.moral || script.moral,
    cta: parsed.cta || script.cta
  };

  return adjusted;
}

export async function autoAdjustScript(
  script: VideoScript,
  charsPerBlock: number,
  apiKeyOverride?: string
): Promise<VideoScript> {
  const target = charsPerBlock;
  const blocks = script.chapters?.length || 0;
  if (!blocks || !target) return script;

  const currentTotal =
    (script.intro?.length || 0) +
    (script.moral?.length || 0) +
    (script.cta?.length || 0) +
    script.chapters.reduce((acc, c) => acc + (c.content?.length || 0), 0);

  const desiredTotal = target * blocks;
  const diff = desiredTotal - currentTotal;

  if (Math.abs(diff) < target * 0.1) {
    return clampScriptToTargets(script, charsPerBlock);
  }

  const mode: "expand" | "shrink" = diff > 0 ? "expand" : "shrink";
  const adjusted = await adjustScriptLength(script, Math.abs(diff), mode, apiKeyOverride);
  return clampScriptToTargets(adjusted, charsPerBlock);
}

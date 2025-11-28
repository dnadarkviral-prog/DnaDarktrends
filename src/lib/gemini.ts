import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey =
  typeof window !== "undefined"
    ? window.localStorage.getItem("dna_api_gemini")
    : null;

const MODEL_NAME = "gemini-2.5-flash"; // modelo rápido/free

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface RoteiroFormData {
  niche: string;
  perspective: string;
  tone: string;
  subniche: string;
  blocks: number;
  charsPerBlock: number;
  temaEspecifico: string;
  publicoAlvo: string;
  emocaoPrincipal: string;
  idadeMedia: string;
  ritmo: string;
  estiloRoteiro: string;
  idioma: string;
  promptExtra?: string;
}

export interface SynopsisOption {
  id: number;
  title: string;
  text: string;
}

function ensureGemini() {
  if (!apiKey || !genAI) {
    throw new Error(
      "Gemini API não configurada. Clique em 'Configurar API' e informe sua chave."
    );
  }
  return genAI;
}

export async function generateSynopses(
  form: RoteiroFormData
): Promise<SynopsisOption[]> {
  const client = ensureGemini();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
Você é um roteirista profissional especializado em vídeos de histórias dark para YouTube.

Gere EXATAMENTE 3 opções de sinopse curtas e viciantes para um vídeo com as seguintes características:

- Nicho: ${form.niche}
- Subnicho: ${form.subniche}
- Perspectiva: ${form.perspective}
- Tom/estilo: ${form.tone}
- Público alvo: ${form.publicoAlvo}
- Emoção principal: ${form.emocaoPrincipal}
- Idade média do público: ${form.idadeMedia}
- Ritmo: ${form.ritmo}
- Estilo de roteiro: ${form.estiloRoteiro}
- Idioma: ${form.idioma}
- Tema específico: ${form.temaEspecifico}

Regras:
- Responda em ${form.idioma}.
- Cada sinopse deve ter entre 3 e 5 frases.
- Comece cada opção com "TÍTULO:" e na linha de baixo "SINOPSE:".
- Separe as opções com uma linha contendo apenas "###".
${
  form.promptExtra
    ? `Instruções extras do criador:
${form.promptExtra}
`
    : ""
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const blocks = text
    .split("###")
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, idx) => {
    const titleMatch = block.match(/T[ÍI]TULO:?\s*(.+)/i);
    const sinopseMatch = block.match(/SINOPSE:?\s*([\s\S]+)/i);

    return {
      id: idx,
      title: titleMatch ? titleMatch[1].trim() : `Opção ${idx + 1}`,
      text: sinopseMatch ? sinopseMatch[1].trim() : block.trim()
    };
  });
}

export async function generateScriptFromSynopsis(
  form: RoteiroFormData,
  synopsis: SynopsisOption
): Promise<string> {
  const client = ensureGemini();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
Você é um roteirista profissional. A partir da sinopse abaixo, escreva um roteiro COMPLETO para vídeo de YouTube no estilo storytelling dark.

SINOPSE ESCOLHIDA:
Título: ${synopsis.title}
Sinopse: ${synopsis.text}

Detalhes do projeto:
- Nicho: ${form.niche}
- Subnicho: ${form.subniche}
- Perspectiva: ${form.perspective}
- Tom/estilo: ${form.tone}
- Público alvo: ${form.publicoAlvo}
- Emoção principal: ${form.emocaoPrincipal}
- Idade média do público: ${form.idadeMedia}
- Ritmo: ${form.ritmo}
- Estilo de roteiro: ${form.estiloRoteiro}
- Idioma: ${form.idioma}
- Quantidade de blocos: ${form.blocks}
- Caracteres aproximados por bloco: ${form.charsPerBlock}

Estrutura:
- Divida o roteiro em ${form.blocks} blocos numerados (BLOCO 1, BLOCO 2, ...).
- Cada bloco deve terminar em mini-gancho para reter a atenção.
- Use linguagem natural de narração em primeira pessoa quando apropriado.
- Não escreva instruções técnicas, apenas o texto que será narrado.
- Responda em ${form.idioma}.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

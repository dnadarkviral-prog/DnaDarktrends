export interface ScriptConcept {
  id: number;
  title: string;
  synopsis: string;
  hookPreview: string;
}

export interface ScriptGenerationParams {
  niche: string;
  perspective: string;
  narrativeTone: string;
  subniche: string;
  chapterCount: number;
  charsPerBlock: number;
  synopsis: string;
  videoTitle: string;
  targetAudience: string;
  emotion: string;
  ageGroup: string;
  pace: string;
  scriptStyle: string;
  language: string;
  customPrompt?: string;
  modelScript?: string;
}

export interface ScriptChapter {
  title: string;
  content: string;
}

export interface VideoScript {
  title: string;
  intro: string;
  chapters: ScriptChapter[];
  moral: string;
  cta: string;
}

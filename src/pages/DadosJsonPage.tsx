import React from "react";

export const DadosJsonPage: React.FC = () => {
  return (
    <section className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
      <h2 className="text-sm font-semibold mb-2">Dados JSON</h2>
      <p className="text-xs text-neutral-400">
        Esta aba pode ser usada para exibir as respostas brutas das APIs
        (Gemini/YouTube) em formato JSON para debug ou integrações futuras.
      </p>
      <p className="mt-3 text-xs text-neutral-500">
        Implemente aqui o que fizer mais sentido para o seu fluxo (logs,
        exportações, etc.).
      </p>
    </section>
  );
};

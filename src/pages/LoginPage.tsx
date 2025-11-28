import React, { useState } from "react";

interface LoginPageProps {
  onUnlock: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === "Acessodnadark") {
      setError(null);
      onUnlock();
    } else {
      setError("Senha inválida. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-dark-800 border border-neutral-800 shadow-2xl shadow-black/60 rounded-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-xl mb-3">
            ⚡
          </div>
          <h1 className="text-xl font-bold">DnaDarktrends</h1>
          <p className="text-xs text-neutral-400 mt-1 text-center">
            Insira a senha administrativa para liberar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] text-neutral-400 mb-1 block">
              SENHA DE ACESSO
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-lg"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary-900/40"
          >
            <span>🔓</span>
            <span>Acessar Sistema</span>
          </button>
        </form>
      </div>
    </div>
  );
};

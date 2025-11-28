import React, { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { Layout, TabKey } from "./components/Layout";
import { TendenciasPage } from "./pages/TendenciasPage";
import { TitulosViraisPage } from "./pages/TitulosViraisPage";
import { DadosJsonPage } from "./pages/DadosJsonPage";

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabKey>("tendencias");

  if (!unlocked) {
    return <LoginPage onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <Layout active={tab} onChange={setTab}>
      {tab === "tendencias" && <TendenciasPage />}
      {tab === "titulos" && <TitulosViraisPage />}
            {tab === "json" && <DadosJsonPage />}
    </Layout>
  );
};

export default App;

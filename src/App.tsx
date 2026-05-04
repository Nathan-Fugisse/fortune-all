import React, { useState } from "react";
import { useSync } from "./hooks/useSync";
import Roulette from "./components/Roulette";
import SlotMachine from "./components/SlotMachine";
import CoinFlip from "./components/CoinFlip";
import GMSettings from "./components/GMSettings";

type Tab = "roulette" | "slots" | "coin" | "settings";

const App: React.FC = () => {
  const { state, isGM, playerName, ready, updateState } = useSync();
  const [activeTab, setActiveTab] = useState<Tab>("roulette");

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Carregando Fortune All...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">🎰 Fortune All</h1>
        <span className="player-badge">
          {isGM ? "🛡️ GM" : "🎮"} {playerName}
        </span>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "roulette" ? "active" : ""}`}
          onClick={() => setActiveTab("roulette")}
        >
          🎡 Roleta
        </button>
        <button
          className={`tab-btn ${activeTab === "slots" ? "active" : ""}`}
          onClick={() => setActiveTab("slots")}
        >
          🎰 Slots
        </button>
        <button
          className={`tab-btn ${activeTab === "coin" ? "active" : ""}`}
          onClick={() => setActiveTab("coin")}
        >
          🪙 Moeda
        </button>
        {isGM && (
          <button
            className={`tab-btn settings-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === "roulette" && (
          <Roulette
            config={state.rouletteConfig}
            result={state.rouletteResult}
            playerName={playerName}
            onSpin={(result) => updateState({ rouletteResult: result })}
          />
        )}
        {activeTab === "slots" && (
          <SlotMachine
            config={state.slotConfig}
            result={state.slotResult}
            playerName={playerName}
            isGM={isGM}
            onSpin={(result) => updateState({ slotResult: result })}
          />
        )}
        {activeTab === "coin" && (
          <CoinFlip
            result={state.coinResult}
            playerName={playerName}
            onFlip={(result) => updateState({ coinResult: result })}
          />
        )}
        {activeTab === "settings" && isGM && (
          <GMSettings state={state} onUpdate={updateState} />
        )}
      </div>
    </div>
  );
};

export default App;
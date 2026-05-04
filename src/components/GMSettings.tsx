import React, { useState } from "react";
import type { FortuneState } from "../hooks/useSync";
import "./GMSettings.css";

const ALL_COLORS = [
  "#E74C3C","#3498DB","#2ECC71","#F39C12","#9B59B6",
  "#1ABC9C","#E67E22","#EC407A","#26A69A","#AB47BC",
  "#42A5F5","#FFA726","#EF5350","#66BB6A","#5C6BC0",
  "#FF7043","#26C6DA","#D4E157","#8D6E63","#78909C",
];

interface Props {
  state: FortuneState;
  onUpdate: (partial: Partial<FortuneState>) => void;
}

const GMSettings: React.FC<Props> = ({ state, onUpdate }) => {
  const [segments, setSegments] = useState<string[]>([...state.rouletteConfig.segments]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newSeg, setNewSeg] = useState("");
  const [winProb, setWinProb] = useState(state.slotConfig.winProbability);
  const [saved, setSaved] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");

  const addSegment = () => {
    const t = newSeg.trim();
    if (!t || segments.length >= 20) return;
    setSegments([...segments, t]);
    setNewSeg("");
  };

  const removeSegment = (i: number) => {
    if (segments.length <= 2) return;
    setSegments(segments.filter((_, idx) => idx !== i));
  };

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditValue(segments[i]);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const t = editValue.trim();
    if (!t) return;
    const next = [...segments];
    next[editingIndex] = t;
    setSegments(next);
    setEditingIndex(null);
    setEditValue("");
  };

  const moveSegment = (i: number, dir: "up" | "down") => {
    const ti = dir === "up" ? i - 1 : i + 1;
    if (ti < 0 || ti >= segments.length) return;
    const next = [...segments];
    [next[i], next[ti]] = [next[ti], next[i]];
    setSegments(next);
  };

  const applyBulk = () => {
    setBulkError("");
    const lines = bulkText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) { setBulkError("Mínimo 2 itens."); return; }
    if (lines.length > 20) { setBulkError("Máximo 20 itens."); return; }
    setSegments(lines);
    setBulkOpen(false);
    setBulkText("");
  };

  const handleSave = () => {
    if (segments.length < 2) return;
    onUpdate({
      rouletteConfig: { segments: [...segments] },
      slotConfig: { winProbability: Math.max(0, Math.min(100, winProb)) },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="gm-settings">
      <div className="settings-title">⚙️ Configurações do GM</div>

      {/* ── ROULETTE ── */}
      <div className="settings-card">
        <div className="card-title">🎡 Roleta — Segmentos</div>
        <div className="card-sub">Mín 2 · Máx 20 · Clique no nome para editar</div>

        <div className="seg-list">
          {segments.map((seg, i) => (
            <div key={i} className="seg-row">
              <span className="seg-dot" style={{ background: ALL_COLORS[i % 20] }} />
              {editingIndex === i ? (
                <input
                  className="seg-edit-input"
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                  maxLength={32}
                />
              ) : (
                <span className="seg-name" onClick={() => startEdit(i)} title="Clique para editar">
                  {seg}
                </span>
              )}
              <div className="seg-btns">
                {editingIndex === i ? (
                  <>
                    <button className="sbt ok" onClick={confirmEdit}>✓</button>
                    <button className="sbt" onClick={() => setEditingIndex(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <button className="sbt" onClick={() => moveSegment(i, "up")} disabled={i === 0}>▲</button>
                    <button className="sbt" onClick={() => moveSegment(i, "down")} disabled={i === segments.length - 1}>▼</button>
                    <button className="sbt del" onClick={() => removeSegment(i)} disabled={segments.length <= 2}>✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="add-row">
          <input
            className="add-input"
            type="text"
            placeholder="Novo segmento..."
            value={newSeg}
            onChange={(e) => setNewSeg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addSegment(); }}
            maxLength={32}
            disabled={segments.length >= 20}
          />
          <button className="add-btn" onClick={addSegment} disabled={!newSeg.trim() || segments.length >= 20}>
            + Add
          </button>
        </div>

        <div className="bulk-row">
          <button className="text-btn" onClick={() => { setBulkOpen(!bulkOpen); setBulkText(segments.join("\n")); setBulkError(""); }}>
            {bulkOpen ? "✕ Fechar importação" : "📋 Importar lista"}
          </button>
          <button className="text-btn" onClick={() => setSegments(["Opção 1","Opção 2","Opção 3","Opção 4","Opção 5","Opção 6"])}>
            🔄 Reset
          </button>
          <span className="seg-count">{segments.length}/20</span>
        </div>

        {bulkOpen && (
          <div className="bulk-box">
            <textarea
              className="bulk-ta"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Uma opção por linha (2–20 linhas)"
              rows={7}
            />
            {bulkError && <div className="bulk-err">{bulkError}</div>}
            <button className="add-btn" onClick={applyBulk}>✓ Aplicar lista</button>
          </div>
        )}
      </div>

      {/* ── SLOT ── */}
      <div className="settings-card">
        <div className="card-title">🎰 Caça-Níquel — Probabilidade de Vitória</div>
        <div className="card-sub">Invisível para jogadores. Apenas o GM vê o indicador na tela do jogo.</div>

        <div className="prob-row">
          <input
            type="range" min={0} max={100} value={winProb}
            onChange={(e) => setWinProb(Number(e.target.value))}
            className="prob-range"
          />
          <div className="prob-badge">{winProb}%</div>
        </div>

        <div className="presets">
          {[
            { label: "Raro", val: 5 },
            { label: "Difícil", val: 15 },
            { label: "Normal", val: 30 },
            { label: "Fácil", val: 50 },
            { label: "Generoso", val: 80 },
          ].map((p) => (
            <button
              key={p.val}
              className={`preset ${winProb === p.val ? "preset-active" : ""}`}
              onClick={() => setWinProb(p.val)}
            >
              {p.label} {p.val}%
            </button>
          ))}
        </div>

        <div className="limitations">
          <div className="lim-title">⚠️ Limitações do Caça-Níquel</div>
          <ul>
            <li>A probabilidade é avaliada a cada jogada independentemente (não há garantia de distribuição exata).</li>
            <li>O resultado é calculado ANTES da animação. A animação é apenas visual.</li>
            <li>Vitória = 3 símbolos idênticos. Sem paylines parciais ou combinações especiais.</li>
            <li>Configurações ficam salvas nos metadados da sala e persistem entre sessões.</li>
          </ul>
        </div>
      </div>

      {/* ── SAVE ── */}
      <button className="btn-primary save-btn" onClick={handleSave}>
        {saved ? "✓ Salvo e sincronizado!" : "💾 Salvar Configurações"}
      </button>
      {saved && <div className="save-ok">Configurações aplicadas para todos os jogadores.</div>}
    </div>
  );
};

export default GMSettings;
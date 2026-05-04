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
  const [manualProb, setManualProb] = useState(String(state.slotConfig.winProbability));
  const [saved, setSaved] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");

  const setProbValue = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setWinProb(clamped);
    setManualProb(String(clamped));
  };

  const handleManualProbChange = (text: string) => {
    setManualProb(text);
    const num = parseFloat(text);
    if (!isNaN(num)) {
      const clamped = Math.min(100, Math.max(0, num));
      setWinProb(clamped);
    }
  };

  const handleManualProbBlur = () => {
    const num = parseFloat(manualProb);
    if (isNaN(num)) {
      setManualProb(String(winProb));
    } else {
      const clamped = Math.min(100, Math.max(0, num));
      setWinProb(clamped);
      setManualProb(String(clamped));
    }
  };

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
    const finalProb = Math.min(100, Math.max(0, winProb));
    onUpdate({
      rouletteConfig: { segments: [...segments] },
      slotConfig: { winProbability: finalProb },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="gm-settings">
      <div className="settings-title">⚙️ Configurações do GM</div>

      {/* ROULETTE */}
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

      {/* SLOT */}
      <div className="settings-card">
        <div className="card-title">🎰 Caça-Níquel — Probabilidade de Vitória</div>
        <div className="card-sub">
          De 0% (impossível ganhar) até 100% (sempre ganha). Invisível para jogadores.
        </div>

        <div className="prob-row">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={winProb}
            onChange={(e) => setProbValue(Number(e.target.value))}
            className="prob-range"
          />
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={manualProb}
            onChange={(e) => handleManualProbChange(e.target.value)}
            onBlur={handleManualProbBlur}
            className="prob-input"
          />
          <span className="prob-percent">%</span>
        </div>

        <div className="prob-labels">
          <span>0% = Nunca</span>
          <span>100% = Sempre</span>
        </div>

        <div className="presets">
          {[
            { label: "Impossível", val: 0 },
            { label: "Raro", val: 5 },
            { label: "Difícil", val: 15 },
            { label: "Normal", val: 30 },
            { label: "Fácil", val: 50 },
            { label: "Generoso", val: 75 },
            { label: "Garantido", val: 100 },
          ].map((p) => (
            <button
              key={p.val}
              className={`preset ${winProb === p.val ? "preset-active" : ""}`}
              onClick={() => setProbValue(p.val)}
            >
              {p.label} ({p.val}%)
            </button>
          ))}
        </div>

        <div className="limitations">
          <div className="lim-title">⚠️ Limitações do Caça-Níquel</div>
          <ul>
            <li><strong>0%</strong> = Nunca dará jackpot, não importa quantas vezes jogue.</li>
            <li><strong>100%</strong> = Sempre dará jackpot em toda jogada.</li>
            <li>A probabilidade é avaliada a cada jogada independentemente.</li>
            <li>O resultado é calculado ANTES da animação.</li>
            <li>Vitória = 3 símbolos idênticos. Sem paylines parciais.</li>
            <li>Configurações persistem nos metadados da sala.</li>
          </ul>
        </div>
      </div>

      {/* SAVE */}
      <button className="btn-primary save-btn" onClick={handleSave}>
        {saved ? "✓ Salvo e sincronizado!" : "💾 Salvar Configurações"}
      </button>
      {saved && <div className="save-ok">Configurações aplicadas para todos os jogadores.</div>}
    </div>
  );
};

export default GMSettings;
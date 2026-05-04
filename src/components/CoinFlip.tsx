import React, { useState, useEffect, useRef } from "react";
import { COIN_FACES } from "../utils/colors";
import { playCoinSound, playWinSound } from "../utils/sounds";
import "./CoinFlip.css";

interface CoinResult {
  face: "heads" | "tails";
  flipId: string;
  flipperName: string;
}

interface Props {
  result: CoinResult | null;
  playerName: string;
  onFlip: (result: CoinResult) => void;
}

const CoinFlip: React.FC<Props> = ({ result, playerName, onFlip }) => {
  const [flipping, setFlipping] = useState(false);
  const [showFace, setShowFace] = useState<"heads" | "tails">("heads");
  const [animState, setAnimState] = useState<"idle" | "flipping" | "landing">("idle");
  const [displayResult, setDisplayResult] = useState<CoinResult | null>(null);
  const lastFlipId = useRef<string>("");
  const intervalRef = useRef<number>(0);
  const timeoutRef = useRef<number>(0);

  const runFlip = (targetFace: "heads" | "tails", flipperName: string) => {
    if (flipping) return;
    setFlipping(true);
    setDisplayResult(null);
    setAnimState("flipping");
    playCoinSound();

    let count = 0;
    const totalFlips = 14 + Math.floor(Math.random() * 6);

    clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      count++;
      setShowFace((f) => (f === "heads" ? "tails" : "heads"));

      if (count >= totalFlips) {
        clearInterval(intervalRef.current);
        setShowFace(targetFace);
        setAnimState("landing");
        playWinSound();

        timeoutRef.current = window.setTimeout(() => {
          setAnimState("idle");
          setFlipping(false);
          setDisplayResult({ face: targetFace, flipId: "", flipperName });
        }, 600);
      }
    }, 110);
  };

  useEffect(() => {
    if (!result) return;
    if (result.flipId === lastFlipId.current) return;
    lastFlipId.current = result.flipId;
    runFlip(result.face, result.flipperName);
  }, [result]);

  const handleFlip = () => {
    if (flipping) return;
    const face: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
    const flipId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    lastFlipId.current = flipId;
    onFlip({ face, flipId, flipperName: playerName });
    runFlip(face, playerName);
  };

  const isHeads = showFace === "heads";

  return (
    <div className="coin-container">
      <div className="coin-scene">
        <div className={`coin-3d ${animState === "flipping" ? "coin-anim-flip" : ""} ${animState === "landing" ? "coin-anim-land" : ""} ${isHeads ? "" : "coin-show-tails"}`}>
          <div className="coin-side coin-heads-side">
            <span className="coin-emoji">{COIN_FACES.heads}</span>
            <span className="coin-word">CARA</span>
          </div>
          <div className="coin-side coin-tails-side">
            <span className="coin-emoji">{COIN_FACES.tails}</span>
            <span className="coin-word">COROA</span>
          </div>
        </div>
      </div>

      <button className="btn-primary flip-btn" onClick={handleFlip} disabled={flipping}>
        {flipping ? "🪙 Lançando..." : "🪙 Lançar Moeda!"}
      </button>

      {displayResult && (
        <div className="result-banner">
          <div className="result-label">Resultado</div>
          <div className="result-value">
            {displayResult.face === "heads"
              ? `${COIN_FACES.heads} CARA`
              : `${COIN_FACES.tails} COROA`}
          </div>
          <div className="result-player">Lançado por {displayResult.flipperName}</div>
        </div>
      )}

      <div className="coin-legend">
        <div className="legend-row">
          <span>{COIN_FACES.heads}</span>
          <span>= Cara (Heads)</span>
        </div>
        <div className="legend-row">
          <span>{COIN_FACES.tails}</span>
          <span>= Coroa (Tails)</span>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;
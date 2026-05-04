import React, { useState, useEffect, useRef, useCallback } from "react";
import { SLOT_SYMBOLS } from "../utils/colors";
import { playSlotTickSound, playWinSound } from "../utils/sounds";
import "./SlotMachine.css";

interface SlotConfig {
  winProbability: number;
}

interface SlotResult {
  reels: number[];
  isWin: boolean;
  spinId: string;
  spinnerName: string;
}

interface Props {
  config: SlotConfig;
  result: SlotResult | null;
  playerName: string;
  isGM: boolean;
  onSpin: (result: SlotResult) => void;
}

const SlotMachine: React.FC<Props> = ({ config, result, playerName, isGM, onSpin }) => {
  const [spinning, setSpinning] = useState(false);
  const [visibleSymbols, setVisibleSymbols] = useState<string[]>(["🍒", "🍋", "🍊"]);
  const [reelSpinning, setReelSpinning] = useState([false, false, false]);
  const [displayResult, setDisplayResult] = useState<SlotResult | null>(null);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const lastSpinId = useRef<string>("");
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const determineOutcome = useCallback((): { reels: number[]; isWin: boolean } => {
    const isWin = Math.random() * 100 < config.winProbability;
    if (isWin) {
      const sym = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      return { reels: [sym, sym, sym], isWin: true };
    }
    let r0 = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    let r1 = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    let r2 = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    while (r0 === r1 && r1 === r2) {
      r2 = (r2 + 1) % SLOT_SYMBOLS.length;
    }
    return { reels: [r0, r1, r2], isWin: false };
  }, [config.winProbability]);

  const runAnimation = useCallback(
    (targetReels: number[], isWin: boolean, spinnerName: string) => {
      if (spinning) return;
      setSpinning(true);
      setDisplayResult(null);
      setShowWinFlash(false);
      setReelSpinning([true, true, true]);
      clearAllTimers();

      // Rapid symbol cycling during spin
      let cycleCount = 0;
      const cycleInterval = 80;
      const cycleDuration = [2000, 2600, 3200];

      const cycleTimer = window.setInterval(() => {
        cycleCount++;
        setVisibleSymbols([
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        ]);
        playSlotTickSound();
      }, cycleInterval);

      timersRef.current.push(cycleTimer as unknown as number);

      // Stop each reel at different times
      [0, 1, 2].forEach((reelIdx) => {
        const t = window.setTimeout(() => {
          setReelSpinning((prev) => {
            const next = [...prev];
            next[reelIdx] = false;
            return next;
          });
          setVisibleSymbols((prev) => {
            const next = [...prev];
            next[reelIdx] = SLOT_SYMBOLS[targetReels[reelIdx]];
            return next;
          });

          if (reelIdx === 2) {
            clearInterval(cycleTimer);
            setSpinning(false);
            const finalResult = { reels: targetReels, isWin, spinId: "", spinnerName };
            setDisplayResult(finalResult);
            if (isWin) {
              setShowWinFlash(true);
              playWinSound();
              const flashTimer = window.setTimeout(() => setShowWinFlash(false), 2500);
              timersRef.current.push(flashTimer);
            }
          }
        }, cycleDuration[reelIdx]);
        timersRef.current.push(t);
      });
    },
    [spinning]
  );

  useEffect(() => {
    if (!result) return;
    if (result.spinId === lastSpinId.current) return;
    lastSpinId.current = result.spinId;
    runAnimation(result.reels, result.isWin, result.spinnerName);
  }, [result, runAnimation]);

  const handleSpin = () => {
    if (spinning) return;
    const { reels, isWin } = determineOutcome();
    const spinId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    lastSpinId.current = spinId;
    onSpin({ reels, isWin, spinId, spinnerName: playerName });
    runAnimation(reels, isWin, playerName);
  };

  return (
    <div className={`slot-container ${showWinFlash ? "win-flash" : ""}`}>
      <div className="slot-machine">
        <div className="slot-header">
          <span className="slot-title">★ FORTUNE SLOTS ★</span>
          <div className="slot-lights">
            {[...Array(7)].map((_, i) => (
              <span key={i} className={`slot-light ${spinning ? "blink" : ""}`} />
            ))}
          </div>
        </div>

        <div className="slot-display">
          {[0, 1, 2].map((i) => (
            <div key={i} className="reel-window">
              <div className={`reel-inner ${reelSpinning[i] ? "reel-spinning" : ""}`}>
                <span className="reel-symbol">{visibleSymbols[i]}</span>
              </div>
            </div>
          ))}
        </div>

        {isGM && (
          <div className="gm-indicator">
            🔒 Prob. vitória: {config.winProbability}%
          </div>
        )}
      </div>

      <button className="btn-primary slot-btn" onClick={handleSpin} disabled={spinning}>
        {spinning ? "🎰 Girando..." : "🎰 Jogar!"}
      </button>

      {displayResult && (
        <div className={`result-banner ${displayResult.isWin ? "win-banner" : "lose-banner"}`}>
          <div className="result-label">Resultado</div>
          <div className="result-value">
            {displayResult.isWin ? "🎉 JACKPOT! 🎉" : "Tente novamente!"}
          </div>
          <div className="result-symbols">
            {displayResult.reels.map((r) => SLOT_SYMBOLS[r]).join("  ")}
          </div>
          <div className="result-player">Jogado por {displayResult.spinnerName}</div>
        </div>
      )}

      <p className="slot-note">
        Vitória = 3 símbolos iguais. Probabilidade definida pelo GM.
      </p>
    </div>
  );
};

export default SlotMachine;
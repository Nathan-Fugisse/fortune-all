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
  const [reel0, setReel0] = useState("🍒");
  const [reel1, setReel1] = useState("🍋");
  const [reel2, setReel2] = useState("🍊");
  const [reel0Spinning, setReel0Spinning] = useState(false);
  const [reel1Spinning, setReel1Spinning] = useState(false);
  const [reel2Spinning, setReel2Spinning] = useState(false);
  const [displayResult, setDisplayResult] = useState<SlotResult | null>(null);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const lastSpinId = useRef<string>("");
  const timersRef = useRef<number[]>([]);
  const intervalsRef = useRef<number[]>([]);

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timersRef.current = [];
    intervalsRef.current = [];
  };

  const determineOutcome = useCallback((): { reels: number[]; isWin: boolean } => {
    const isWin = Math.random() * 100 < config.winProbability;
    if (isWin) {
      const s = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      return { reels: [s, s, s], isWin: true };
    }
    let r0 = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    let r1 = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    let r2 = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    // Guarantee NOT all same
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
      setReel0Spinning(true);
      setReel1Spinning(true);
      setReel2Spinning(true);
      clearAll();

      const setters = [setReel0, setReel1, setReel2];
      const setSpinners = [setReel0Spinning, setReel1Spinning, setReel2Spinning];

      // Rapid cycling for each reel
      const intervals: number[] = [];
      for (let i = 0; i < 3; i++) {
        const iv = window.setInterval(() => {
          const randSym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
          setters[i](randSym);
          playSlotTickSound();
        }, 80 + i * 10);
        intervals.push(iv);
        intervalsRef.current.push(iv);
      }

      // Stop reel 0 at 1.5s
      const t0 = window.setTimeout(() => {
        clearInterval(intervals[0]);
        setters[0](SLOT_SYMBOLS[targetReels[0]]);
        setSpinners[0](false);
      }, 1500);
      timersRef.current.push(t0);

      // Stop reel 1 at 2.3s
      const t1 = window.setTimeout(() => {
        clearInterval(intervals[1]);
        setters[1](SLOT_SYMBOLS[targetReels[1]]);
        setSpinners[1](false);
      }, 2300);
      timersRef.current.push(t1);

      // Stop reel 2 at 3.0s
      const t2 = window.setTimeout(() => {
        clearInterval(intervals[2]);
        setters[2](SLOT_SYMBOLS[targetReels[2]]);
        setSpinners[2](false);

        // All stopped — show result
        setSpinning(false);
        const finalResult: SlotResult = {
          reels: targetReels,
          isWin,
          spinId: "",
          spinnerName,
        };
        setDisplayResult(finalResult);

        if (isWin) {
          setShowWinFlash(true);
          playWinSound();
          const flashOff = window.setTimeout(() => setShowWinFlash(false), 2500);
          timersRef.current.push(flashOff);
        }
      }, 3000);
      timersRef.current.push(t2);
    },
    [spinning]
  );

  // Sync from other players
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
          <div className="reel-window">
            <div className={`reel-inner ${reel0Spinning ? "reel-spinning" : ""}`}>
              <span className="reel-symbol">{reel0}</span>
            </div>
          </div>
          <div className="reel-window">
            <div className={`reel-inner ${reel1Spinning ? "reel-spinning" : ""}`}>
              <span className="reel-symbol">{reel1}</span>
            </div>
          </div>
          <div className="reel-window">
            <div className={`reel-inner ${reel2Spinning ? "reel-spinning" : ""}`}>
              <span className="reel-symbol">{reel2}</span>
            </div>
          </div>
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
            {SLOT_SYMBOLS[displayResult.reels[0]]}{" "}
            {SLOT_SYMBOLS[displayResult.reels[1]]}{" "}
            {SLOT_SYMBOLS[displayResult.reels[2]]}
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
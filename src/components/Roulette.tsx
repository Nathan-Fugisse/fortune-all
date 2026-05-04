import React, { useRef, useEffect, useState, useCallback } from "react";
import { getSegmentColor } from "../utils/colors";
import { playTickSound, playWinSound } from "../utils/sounds";
import "./Roulette.css";

interface RouletteConfig {
  segments: string[];
}

interface RouletteResult {
  winnerIndex: number;
  spinId: string;
  spinnerName: string;
}

interface Props {
  config: RouletteConfig;
  result: RouletteResult | null;
  playerName: string;
  onSpin: (result: RouletteResult) => void;
}

const Roulette: React.FC<Props> = ({ config, result, playerName, onSpin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayResult, setDisplayResult] = useState<string | null>(null);
  const [displayPlayer, setDisplayPlayer] = useState<string>("");
  const animRef = useRef<number>(0);
  const lastSpinId = useRef<string>("");
  const angleRef = useRef<number>(0);

  const segments = config.segments;
  const count = segments.length;
  const segAngle = (2 * Math.PI) / count;

  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const r = cx - 12;

      ctx.clearRect(0, 0, size, size);

      // Shadow
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();

      // Segments
      for (let i = 0; i < count; i++) {
        const a1 = rotation + i * segAngle;
        const a2 = a1 + segAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a1, a2);
        ctx.closePath();
        ctx.fillStyle = getSegmentColor(i);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a1 + segAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        const fs = Math.max(9, Math.min(13, 160 / count));
        ctx.font = `bold ${fs}px Segoe UI, sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        const maxL = Math.floor(220 / count) + 6;
        const txt = segments[i].length > maxL ? segments[i].slice(0, maxL - 1) + "…" : segments[i];
        ctx.fillText(txt, r - 14, fs / 3);
        ctx.restore();
      }

      // Border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
      grad.addColorStop(0, "#f39c12");
      grad.addColorStop(1, "#e74c3c");
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pointer at top
      ctx.beginPath();
      ctx.moveTo(cx - 14, 2);
      ctx.lineTo(cx + 14, 2);
      ctx.lineTo(cx, 30);
      ctx.closePath();
      ctx.fillStyle = "#e74c3c";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [segments, count, segAngle]
  );

  // Draw on mount / config change
  useEffect(() => {
    drawWheel(angleRef.current);
  }, [drawWheel]);

  const getWinnerFromAngle = useCallback(
    (rotation: number): number => {
      // Pointer is at top = -PI/2 from east
      // Normalize rotation to 0..2PI
      const norm = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      // The angle at the pointer (top) in wheel space
      const pointerAngle = ((2 * Math.PI - norm + (3 * Math.PI) / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const idx = Math.floor(pointerAngle / segAngle) % count;
      return idx;
    },
    [segAngle, count]
  );

  const runAnimation = useCallback(
    (winnerIndex: number, spinnerName: string) => {
      if (spinning) return;
      setSpinning(true);
      setDisplayResult(null);

      // Calculate the exact final angle that lands on winnerIndex
      // We want the CENTER of the winner segment under the top pointer
      // Pointer = -PI/2 from east = 3PI/2
      // For segment i, its center in wheel coords = i * segAngle + segAngle/2
      // After rotation R, segment center appears at R + i*segAngle + segAngle/2
      // We want: R + winnerIndex*segAngle + segAngle/2 = 3PI/2 (mod 2PI)
      // So: R = 3PI/2 - winnerIndex*segAngle - segAngle/2

      const targetRotation =
        (3 * Math.PI) / 2 - winnerIndex * segAngle - segAngle / 2;

      // Normalize to positive
      const targetNorm = ((targetRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      // Add full spins (always spin forward)
      const fullSpins = (6 + Math.floor(Math.random() * 4)) * 2 * Math.PI;

      // Small random offset within segment (so it doesn't always land dead center)
      const jitter = (Math.random() - 0.5) * segAngle * 0.6;

      const startAngle = angleRef.current;
      const startNorm = ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      // How much to rotate from current position
      let delta = targetNorm + jitter - startNorm;
      if (delta <= 0) delta += 2 * Math.PI;
      const totalSpin = fullSpins + delta;

      const finalAngle = startAngle + totalSpin;
      const duration = 4500 + Math.random() * 1000;
      const tStart = performance.now();
      let lastSeg = -1;

      const animate = (now: number) => {
        const elapsed = now - tStart;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const angle = startAngle + totalSpin * eased;

        angleRef.current = angle;
        drawWheel(angle);

        // Tick
        const curSeg = getWinnerFromAngle(angle);
        if (curSeg !== lastSeg) {
          lastSeg = curSeg;
          if (t < 0.9) playTickSound();
        }

        if (t < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          angleRef.current = finalAngle;
          drawWheel(finalAngle);

          // Verify the winner
          const landed = getWinnerFromAngle(finalAngle);
          setSpinning(false);
          setDisplayResult(segments[landed]);
          setDisplayPlayer(spinnerName);
          playWinSound();
        }
      };

      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    },
    [spinning, drawWheel, segments, segAngle, count, getWinnerFromAngle]
  );

  // React to synced results
  useEffect(() => {
    if (!result) return;
    if (result.spinId === lastSpinId.current) return;
    lastSpinId.current = result.spinId;
    runAnimation(result.winnerIndex, result.spinnerName);
  }, [result, runAnimation]);

  const handleSpin = () => {
    if (spinning) return;
    const winnerIndex = Math.floor(Math.random() * count);
    const spinId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    lastSpinId.current = spinId;
    onSpin({ winnerIndex, spinId, spinnerName: playerName });
    runAnimation(winnerIndex, playerName);
  };

  return (
    <div className="roulette-container">
      <div className="roulette-wheel-wrapper">
        <canvas ref={canvasRef} width={320} height={320} className="roulette-canvas" />
      </div>
      <button className="btn-primary spin-btn" onClick={handleSpin} disabled={spinning}>
        {spinning ? "🎡 Girando..." : "🎡 Girar Roleta!"}
      </button>
      {displayResult && (
        <div className="result-banner">
          <div className="result-label">Resultado</div>
          <div className="result-value">{displayResult}</div>
          <div className="result-player">Girado por {displayPlayer}</div>
        </div>
      )}
    </div>
  );
};

export default Roulette;
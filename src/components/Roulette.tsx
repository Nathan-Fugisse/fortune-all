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
  const currentAngleRef = useRef<number>(0);

  const segments = config.segments;
  const segmentAngle = (2 * Math.PI) / segments.length;

  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = cx - 12;

      ctx.clearRect(0, 0, size, size);

      // Outer ring shadow
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();

      // Draw each segment
      segments.forEach((seg, i) => {
        const startAngle = angle + i * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = getSegmentColor(i);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        const fontSize = Math.max(9, Math.min(13, 160 / segments.length));
        ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        const maxLen = Math.floor(220 / segments.length) + 6;
        const label = seg.length > maxLen ? seg.slice(0, maxLen - 1) + "…" : seg;
        ctx.fillText(label, radius - 14, fontSize / 3);
        ctx.restore();
      });

      // Outer border
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center circle
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

      // Pointer (top center, pointing down)
      const pw = 14;
      const ph = 28;
      ctx.beginPath();
      ctx.moveTo(cx - pw, 2);
      ctx.lineTo(cx + pw, 2);
      ctx.lineTo(cx, ph + 2);
      ctx.closePath();
      ctx.fillStyle = "#e74c3c";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [segments, segmentAngle]
  );

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  const runAnimation = useCallback(
    (winnerIndex: number, spinnerName: string) => {
      setSpinning(true);
      setDisplayResult(null);

      const startAngle = currentAngleRef.current;
      const fullSpins = 6 + Math.random() * 4;

      // We want the middle of winnerIndex segment to stop at the top pointer.
      // Pointer is at top = angle 3π/2 from east (standard canvas coords).
      // The segment middle in wheel coords = winnerIndex * segmentAngle + segmentAngle/2
      // After rotation by `finalAngle`, the segment middle is at:
      //   finalAngle + winnerIndex * segmentAngle + segmentAngle/2 = 3π/2 (mod 2π)
      // So: finalAngle = 3π/2 - (winnerIndex * segmentAngle + segmentAngle/2)
      // Then add full spins.
      const segMiddle = winnerIndex * segmentAngle + segmentAngle / 2;
      const targetBase = (3 * Math.PI) / 2 - segMiddle;
      const currentMod = ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const targetMod = ((targetBase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const diff = ((targetMod - currentMod) + 2 * Math.PI) % (2 * Math.PI);
      const totalSpin = fullSpins * 2 * Math.PI + diff;
      const finalAngle = startAngle + totalSpin;

      const duration = 4500 + Math.random() * 1000;
      const start = performance.now();
      let lastSeg = -1;

      const animate = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const angle = startAngle + totalSpin * eased;
        currentAngleRef.current = angle;
        drawWheel(angle);

        // Tick sound
        const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const atPointer = (((3 * Math.PI) / 2 - norm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const seg = Math.floor(atPointer / segmentAngle) % segments.length;
        if (seg !== lastSeg) {
          lastSeg = seg;
          if (t < 0.92) playTickSound();
        }

        if (t < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          currentAngleRef.current = finalAngle;
          drawWheel(finalAngle);
          setSpinning(false);
          setDisplayResult(segments[winnerIndex]);
          setDisplayPlayer(spinnerName);
          playWinSound();
        }
      };

      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    },
    [drawWheel, segments, segmentAngle]
  );

  // React to synced results from other players
  useEffect(() => {
    if (!result) return;
    if (result.spinId === lastSpinId.current) return;
    lastSpinId.current = result.spinId;
    runAnimation(result.winnerIndex, result.spinnerName);
  }, [result, runAnimation]);

  const handleSpin = () => {
    if (spinning) return;
    const winnerIndex = Math.floor(Math.random() * segments.length);
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
import { useEffect, useState, useCallback, useRef } from "react";
import OBR from "@owlbear-rodeo/sdk";

const METADATA_KEY = "com.fortune-all";

export interface RouletteConfig {
  segments: string[];
}

export interface SlotConfig {
  winProbability: number;
}

export interface FortuneState {
  rouletteConfig: RouletteConfig;
  slotConfig: SlotConfig;
  rouletteResult: {
    winnerIndex: number;
    spinId: string;
    spinnerName: string;
  } | null;
  slotResult: {
    reels: number[];
    isWin: boolean;
    spinId: string;
    spinnerName: string;
  } | null;
  coinResult: {
    face: "heads" | "tails";
    flipId: string;
    flipperName: string;
  } | null;
}

const DEFAULT_STATE: FortuneState = {
  rouletteConfig: {
    segments: ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5", "Opção 6"],
  },
  slotConfig: {
    winProbability: 30,
  },
  rouletteResult: null,
  slotResult: null,
  coinResult: null,
};

export function useSync() {
  const [state, setState] = useState<FortuneState>(DEFAULT_STATE);
  const [isGM, setIsGM] = useState(false);
  const [playerName, setPlayerName] = useState("Jogador");
  const [ready, setReady] = useState(false);
  const stateRef = useRef<FortuneState>(DEFAULT_STATE);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    OBR.onReady(async () => {
      try {
        const role = await OBR.player.getRole();
        setIsGM(role === "GM");

        const name = await OBR.player.getName();
        setPlayerName(name || "Jogador");

        const metadata = await OBR.room.getMetadata();
        const saved = metadata[METADATA_KEY] as FortuneState | undefined;

        if (saved && saved.rouletteConfig) {
          setState(saved);
          stateRef.current = saved;
        } else if (role === "GM") {
          await OBR.room.setMetadata({ [METADATA_KEY]: DEFAULT_STATE });
        }
      } catch (e) {
        console.error("Error on OBR ready:", e);
      }

      setReady(true);

      OBR.room.onMetadataChange((metadata) => {
        const updated = metadata[METADATA_KEY] as FortuneState | undefined;
        if (updated && updated.rouletteConfig) {
          setState(updated);
          stateRef.current = updated;
        }
      });
    });
  }, []);

  const updateState = useCallback(async (partial: Partial<FortuneState>) => {
    const newState = { ...stateRef.current, ...partial };
    stateRef.current = newState;
    setState(newState);
    try {
      await OBR.room.setMetadata({ [METADATA_KEY]: newState });
    } catch (e) {
      console.error("Error saving metadata:", e);
    }
  }, []);

  return { state, isGM, playerName, ready, updateState };
}
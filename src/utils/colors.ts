export const SEGMENT_COLORS: string[] = [
  "#E74C3C", "#3498DB", "#2ECC71", "#F39C12", "#9B59B6",
  "#1ABC9C", "#E67E22", "#EC407A", "#26A69A", "#AB47BC",
  "#42A5F5", "#FFA726", "#EF5350", "#66BB6A", "#5C6BC0",
  "#FF7043", "#26C6DA", "#D4E157", "#8D6E63", "#78909C",
];

export function getSegmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

export const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣", "🔔"];

export const COIN_FACES = {
  heads: "👑",
  tails: "🐉",
};
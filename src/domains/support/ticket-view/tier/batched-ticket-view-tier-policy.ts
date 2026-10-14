import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched ticket view tier code in its canonical BTVT- form. */
export function normalizeBatchedTicketViewTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BTVT-")) return clean;
  return `BTVT-${clean.replaceAll(" ", "-")}`;
}

export function batchedTicketViewTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched ticket view tier score falls in. */
export function classifyBatchedTicketViewTier(score: number): string {
  if (score < 2.7) return "watch";
  if (score < 90.8) return "ok";
  return "medium";
}

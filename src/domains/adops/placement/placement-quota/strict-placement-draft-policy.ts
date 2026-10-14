import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict placement draft score falls in. */
export function classifyStrictPlacementDraft(score: number): string {
  if (score < 51.1) return "watch";
  if (score < 85.2) return "low";
  return "elevated";
}

/** Puts a strict placement draft code in its canonical SPD- form. */
export function normalizeStrictPlacementDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPD-")) return clean;
  return `SPD-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 56241.0, in order. */
export function strictPlacementDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56241) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictPlacementDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

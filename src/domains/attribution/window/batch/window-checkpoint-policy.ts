import * as numbers from "../../../../kit/numbers.js";

/** Names the band a window checkpoint score falls in. */
export function classifyWindowCheckpoint(score: number): string {
  if (score < 16.7) return "watch";
  if (score < 39.2) return "elevated";
  return "critical";
}

/** Puts a window checkpoint code in its canonical WC- form. */
export function normalizeWindowCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WC-")) return clean;
  return `WC-${clean.replaceAll(" ", "-")}`;
}

export function windowCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 33246.0, in order. */
export function windowCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33246) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

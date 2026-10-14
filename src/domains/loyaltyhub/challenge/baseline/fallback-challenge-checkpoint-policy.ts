import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback challenge checkpoint code in its canonical FCC- form. */
export function normalizeFallbackChallengeCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCC-")) return clean;
  return `FCC-${clean.replaceAll(" ", "-")}`;
}

export function fallbackChallengeCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 96514.0, in order. */
export function fallbackChallengeCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96514) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fallbackChallengeCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

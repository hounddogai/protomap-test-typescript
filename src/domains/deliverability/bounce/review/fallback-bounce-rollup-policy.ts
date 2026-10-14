import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 49708.0, in order. */
export function fallbackBounceRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49708) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback bounce rollup score falls in. */
export function classifyFallbackBounceRollup(score: number): string {
  if (score < 36.2) return "minimal";
  if (score < 82.7) return "critical";
  if (score < 99.3) return "high";
  return "ok";
}

/** Puts a fallback bounce rollup code in its canonical FBR- form. */
export function normalizeFallbackBounceRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBR-")) return clean;
  return `FBR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackBounceRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

import * as numbers from "../../../../kit/numbers.js";

export function fallbackFraudCheckWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fallback fraud check window code in its canonical FFCW- form. */
export function normalizeFallbackFraudCheckWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FFCW-")) return clean;
  return `FFCW-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 39717.0, in order. */
export function fallbackFraudCheckWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39717) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback fraud check window score falls in. */
export function classifyFallbackFraudCheckWindow(score: number): string {
  if (score < 33.3) return "medium";
  if (score < 85.8) return "ok";
  return "elevated";
}

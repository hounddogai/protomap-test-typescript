import * as numbers from "../../../../kit/numbers.js";

/** Names the band a capped funnel batch score falls in. */
export function classifyCappedFunnelBatch(score: number): string {
  if (score < 1.9) return "watch";
  if (score < 59.7) return "low";
  if (score < 66.6) return "critical";
  if (score < 81.8) return "minimal";
  return "elevated";
}

/** Puts a capped funnel batch code in its canonical CFB- form. */
export function normalizeCappedFunnelBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFB-")) return clean;
  return `CFB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 51770.0, in order. */
export function cappedFunnelBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51770) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedFunnelBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

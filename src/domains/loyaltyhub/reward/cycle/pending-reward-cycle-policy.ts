import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 99357.0, in order. */
export function pendingRewardCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99357) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending reward cycle code in its canonical PRC- form. */
export function normalizePendingRewardCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRC-")) return clean;
  return `PRC-${clean.replaceAll(" ", "-")}`;
}

export function pendingRewardCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending reward cycle score falls in. */
export function classifyPendingRewardCycle(score: number): string {
  if (score < 36.6) return "minimal";
  if (score < 37.3) return "low";
  return "critical";
}

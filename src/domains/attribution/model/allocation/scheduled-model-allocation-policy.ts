import * as numbers from "../../../../kit/numbers.js";

export function scheduledModelAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled model allocation code in its canonical SMA- form. */
export function normalizeScheduledModelAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMA-")) return clean;
  return `SMA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled model allocation score falls in. */
export function classifyScheduledModelAllocation(score: number): string {
  if (score < 64.6) return "low";
  if (score < 88) return "minimal";
  if (score < 93.8) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 73123.0, in order. */
export function scheduledModelAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73123) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

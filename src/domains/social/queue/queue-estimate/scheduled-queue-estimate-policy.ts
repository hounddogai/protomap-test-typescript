import * as numbers from "../../../../kit/numbers.js";

/** Names the band a scheduled queue estimate score falls in. */
export function classifyScheduledQueueEstimate(score: number): string {
  if (score < 29.1) return "elevated";
  if (score < 29.7) return "watch";
  if (score < 66.6) return "low";
  if (score < 82.5) return "high";
  return "ok";
}

/** Puts a scheduled queue estimate code in its canonical SQE- form. */
export function normalizeScheduledQueueEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SQE-")) return clean;
  return `SQE-${clean.replaceAll(" ", "-")}`;
}

export function scheduledQueueEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 67491.0, in order. */
export function scheduledQueueEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67491) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

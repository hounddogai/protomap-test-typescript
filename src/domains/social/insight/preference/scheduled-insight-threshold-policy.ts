import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled insight threshold code in its canonical SIT- form. */
export function normalizeScheduledInsightThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIT-")) return clean;
  return `SIT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled insight threshold score falls in. */
export function classifyScheduledInsightThreshold(score: number): string {
  if (score < 30.4) return "medium";
  if (score < 95.7) return "watch";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 78242.0, in order. */
export function scheduledInsightThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78242) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledInsightThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

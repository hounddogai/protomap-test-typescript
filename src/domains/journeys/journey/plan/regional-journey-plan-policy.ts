import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional journey plan score falls in. */
export function classifyRegionalJourneyPlan(score: number): string {
  if (score < 34.4) return "ok";
  if (score < 68.3) return "medium";
  if (score < 94.1) return "minimal";
  return "low";
}

/** Puts a regional journey plan code in its canonical RJP- form. */
export function normalizeRegionalJourneyPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RJP-")) return clean;
  return `RJP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 57221.0, in order. */
export function regionalJourneyPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57221) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function regionalJourneyPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

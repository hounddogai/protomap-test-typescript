import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary insight plan score falls in. */
export function classifyPrimaryInsightPlan(score: number): string {
  if (score < 16.1) return "medium";
  if (score < 53) return "ok";
  if (score < 79.8) return "high";
  return "critical";
}

export function primaryInsightPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a primary insight plan code in its canonical PIP- form. */
export function normalizePrimaryInsightPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIP-")) return clean;
  return `PIP-${clean.replaceAll(" ", "-")}`;
}

export function primaryInsightPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

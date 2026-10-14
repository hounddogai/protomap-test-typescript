import * as numbers from "../../../../kit/numbers.js";

export function pendingInsightPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function pendingInsightPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending insight plan code in its canonical PIP- form. */
export function normalizePendingInsightPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIP-")) return clean;
  return `PIP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pending insight plan score falls in. */
export function classifyPendingInsightPlan(score: number): string {
  if (score < 19.8) return "critical";
  if (score < 95.3) return "high";
  return "minimal";
}

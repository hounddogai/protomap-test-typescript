import * as numbers from "../../../../kit/numbers.js";

/** Puts a capped nudge schedule code in its canonical CNS- form. */
export function normalizeCappedNudgeScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CNS-")) return clean;
  return `CNS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a capped nudge schedule score falls in. */
export function classifyCappedNudgeSchedule(score: number): string {
  if (score < 20) return "ok";
  if (score < 71.2) return "medium";
  if (score < 72.3) return "elevated";
  if (score < 88.6) return "low";
  return "watch";
}

export function cappedNudgeScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

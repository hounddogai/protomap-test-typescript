import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual activation schedule code in its canonical MAS- form. */
export function normalizeManualActivationScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MAS-")) return clean;
  return `MAS-${clean.replaceAll(" ", "-")}`;
}

export function manualActivationScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.33;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualActivationScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a manual activation schedule score falls in. */
export function classifyManualActivationSchedule(score: number): string {
  if (score < 3.4) return "high";
  if (score < 63.8) return "low";
  return "medium";
}

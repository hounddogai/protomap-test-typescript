import * as numbers from "../../../../kit/numbers.js";

/** Names the band a level preference score falls in. */
export function classifyLevelPreference(score: number): string {
  if (score < 38.4) return "high";
  if (score < 47.8) return "low";
  if (score < 59.2) return "ok";
  if (score < 60.2) return "watch";
  return "critical";
}

export function levelPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function levelPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a level preference code in its canonical LP- form. */
export function normalizeLevelPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LP-")) return clean;
  return `LP-${clean.replaceAll(" ", "-")}`;
}

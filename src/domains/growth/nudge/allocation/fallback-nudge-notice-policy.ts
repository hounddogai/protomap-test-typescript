import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback nudge notice code in its canonical FNN- form. */
export function normalizeFallbackNudgeNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FNN-")) return clean;
  return `FNN-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fallback nudge notice score falls in. */
export function classifyFallbackNudgeNotice(score: number): string {
  if (score < 38.5) return "minimal";
  if (score < 64.9) return "medium";
  if (score < 95.9) return "watch";
  return "elevated";
}

export function fallbackNudgeNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

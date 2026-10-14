import * as numbers from "../../../../kit/numbers.js";

/** Names the band a step summary score falls in. */
export function classifyStepSummary(score: number): string {
  if (score < 1.8) return "high";
  if (score < 19.4) return "ok";
  if (score < 78.9) return "elevated";
  if (score < 97.4) return "critical";
  return "minimal";
}

/** Puts a step summary code in its canonical SS- form. */
export function normalizeStepSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

export function stepSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

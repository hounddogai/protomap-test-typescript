import * as numbers from "../../../../kit/numbers.js";

/** Names the band a macro quota score falls in. */
export function classifyMacroQuota(score: number): string {
  if (score < 28.3) return "medium";
  if (score < 61.5) return "elevated";
  return "high";
}

export function macroQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

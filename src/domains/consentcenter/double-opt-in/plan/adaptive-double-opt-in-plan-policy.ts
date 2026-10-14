import * as numbers from "../../../../kit/numbers.js";

/** Names the band a adaptive double opt in plan score falls in. */
export function classifyAdaptiveDoubleOptInPlan(score: number): string {
  if (score < 50.1) return "elevated";
  if (score < 54.9) return "medium";
  if (score < 55) return "critical";
  if (score < 72.7) return "watch";
  return "minimal";
}

/** Puts a adaptive double opt in plan code in its canonical ADOIP- form. */
export function normalizeAdaptiveDoubleOptInPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ADOIP-")) return clean;
  return `ADOIP-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveDoubleOptInPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

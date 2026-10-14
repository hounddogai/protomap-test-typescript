import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default credit estimate score falls in. */
export function classifyDefaultCreditEstimate(score: number): string {
  if (score < 17.1) return "low";
  if (score < 61.1) return "elevated";
  if (score < 70.8) return "minimal";
  if (score < 77.4) return "watch";
  return "high";
}

export function defaultCreditEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a default credit estimate code in its canonical DCE- form. */
export function normalizeDefaultCreditEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCE-")) return clean;
  return `DCE-${clean.replaceAll(" ", "-")}`;
}

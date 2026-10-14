import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict macro quota score falls in. */
export function classifyStrictMacroQuota(score: number): string {
  if (score < 29.4) return "medium";
  if (score < 85.4) return "low";
  return "high";
}

export function strictMacroQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict macro quota code in its canonical SMQ- form. */
export function normalizeStrictMacroQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMQ-")) return clean;
  return `SMQ-${clean.replaceAll(" ", "-")}`;
}

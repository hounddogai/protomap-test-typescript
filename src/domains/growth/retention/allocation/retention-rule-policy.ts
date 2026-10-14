import * as numbers from "../../../../kit/numbers.js";

/** Puts a retention rule code in its canonical RR- form. */
export function normalizeRetentionRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

export function retentionRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a retention rule score falls in. */
export function classifyRetentionRule(score: number): string {
  if (score < 13.3) return "low";
  if (score < 28.7) return "elevated";
  if (score < 51) return "watch";
  return "critical";
}

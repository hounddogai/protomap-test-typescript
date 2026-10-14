import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient reputation rule code in its canonical LRR- form. */
export function normalizeLenientReputationRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRR-")) return clean;
  return `LRR-${clean.replaceAll(" ", "-")}`;
}

export function lenientReputationRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientReputationRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a lenient reputation rule score falls in. */
export function classifyLenientReputationRule(score: number): string {
  if (score < 10.2) return "critical";
  if (score < 55) return "ok";
  if (score < 61.6) return "low";
  if (score < 88.6) return "elevated";
  return "minimal";
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict exit rule mapping code in its canonical SERM- form. */
export function normalizeStrictExitRuleMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SERM-")) return clean;
  return `SERM-${clean.replaceAll(" ", "-")}`;
}

export function strictExitRuleMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a strict exit rule mapping score falls in. */
export function classifyStrictExitRuleMapping(score: number): string {
  if (score < 7.9) return "low";
  if (score < 61.9) return "medium";
  return "high";
}

export function strictExitRuleMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

import * as numbers from "../../../../kit/numbers.js";

export function regionalExitRuleBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional exit rule baseline score falls in. */
export function classifyRegionalExitRuleBaseline(score: number): string {
  if (score < 28.6) return "minimal";
  if (score < 93.5) return "elevated";
  return "critical";
}

/** Puts a regional exit rule baseline code in its canonical RERB- form. */
export function normalizeRegionalExitRuleBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RERB-")) return clean;
  return `RERB-${clean.replaceAll(" ", "-")}`;
}

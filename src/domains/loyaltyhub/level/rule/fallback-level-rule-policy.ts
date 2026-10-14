import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback level rule code in its canonical FLR- form. */
export function normalizeFallbackLevelRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FLR-")) return clean;
  return `FLR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackLevelRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackLevelRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

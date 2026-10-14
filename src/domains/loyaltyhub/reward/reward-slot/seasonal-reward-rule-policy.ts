import * as numbers from "../../../../kit/numbers.js";

export function seasonalRewardRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function seasonalRewardRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal reward rule code in its canonical SRR- form. */
export function normalizeSeasonalRewardRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRR-")) return clean;
  return `SRR-${clean.replaceAll(" ", "-")}`;
}

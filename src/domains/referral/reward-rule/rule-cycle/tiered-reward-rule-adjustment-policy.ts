import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function tieredRewardRuleAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered reward rule adjustment code in its canonical TRRA- form. */
export function normalizeTieredRewardRuleAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRRA-")) return clean;
  return `TRRA-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredRewardRuleAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

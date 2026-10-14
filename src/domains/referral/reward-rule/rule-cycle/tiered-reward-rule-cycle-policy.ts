import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredRewardRuleCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a tiered reward rule cycle score falls in. */
export function classifyTieredRewardRuleCycle(score: number): string {
  if (score < 48.2) return "medium";
  if (score < 73) return "high";
  return "watch";
}

/** Puts a tiered reward rule cycle code in its canonical TRRC- form. */
export function normalizeTieredRewardRuleCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRRC-")) return clean;
  return `TRRC-${clean.replaceAll(" ", "-")}`;
}

export function tieredRewardRuleCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

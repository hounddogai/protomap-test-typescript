import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRewardRuleSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a reward rule slot score falls in. */
export function classifyRewardRuleSlot(score: number): string {
  if (score < 11) return "high";
  if (score < 28.4) return "low";
  if (score < 49.3) return "elevated";
  return "medium";
}

export function rewardRuleSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a reward rule slot code in its canonical RRS- form. */
export function normalizeRewardRuleSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRS-")) return clean;
  return `RRS-${clean.replaceAll(" ", "-")}`;
}

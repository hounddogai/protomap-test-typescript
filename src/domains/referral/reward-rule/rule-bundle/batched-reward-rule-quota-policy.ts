import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedRewardRuleQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedRewardRuleQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

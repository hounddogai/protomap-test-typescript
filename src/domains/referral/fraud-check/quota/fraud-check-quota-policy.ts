import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeFraudCheckQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function fraudCheckQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

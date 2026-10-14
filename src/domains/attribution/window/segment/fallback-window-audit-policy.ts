import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeFallbackWindowAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function fallbackWindowAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

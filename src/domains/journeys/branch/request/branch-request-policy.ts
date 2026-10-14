import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function branchRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function mergeBranchRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function branchRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

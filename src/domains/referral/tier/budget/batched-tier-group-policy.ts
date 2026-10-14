import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function batchedTierGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeBatchedTierGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a batched tier group code in its canonical BTG- form. */
export function normalizeBatchedTierGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BTG-")) return clean;
  return `BTG-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a batched tier group score falls in. */
export function classifyBatchedTierGroup(score: number): string {
  if (score < 18) return "critical";
  if (score < 99.8) return "minimal";
  return "high";
}

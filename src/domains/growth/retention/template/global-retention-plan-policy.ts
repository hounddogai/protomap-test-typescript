import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function globalRetentionPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeGlobalRetentionPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a global retention plan code in its canonical GRP- form. */
export function normalizeGlobalRetentionPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRP-")) return clean;
  return `GRP-${clean.replaceAll(" ", "-")}`;
}

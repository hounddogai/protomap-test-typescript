import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function proofMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeProofMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a proof metric code in its canonical PM- form. */
export function normalizeProofMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PM-")) return clean;
  return `PM-${clean.replaceAll(" ", "-")}`;
}

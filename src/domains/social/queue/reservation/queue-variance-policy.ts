import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function queueVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeQueueVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a queue variance code in its canonical QV- form. */
export function normalizeQueueVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QV-")) return clean;
  return `QV-${clean.replaceAll(" ", "-")}`;
}

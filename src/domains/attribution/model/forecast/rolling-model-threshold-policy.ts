import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function rollingModelThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeRollingModelThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling model threshold code in its canonical RMT- form. */
export function normalizeRollingModelThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMT-")) return clean;
  return `RMT-${clean.replaceAll(" ", "-")}`;
}

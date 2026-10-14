import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function seasonalQueueMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal queue metric code in its canonical SQM- form. */
export function normalizeSeasonalQueueMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SQM-")) return clean;
  return `SQM-${clean.replaceAll(" ", "-")}`;
}

export function mergeSeasonalQueueMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

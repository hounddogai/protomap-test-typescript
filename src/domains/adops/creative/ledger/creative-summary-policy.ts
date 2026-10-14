import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function creativeSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a creative summary score falls in. */
export function classifyCreativeSummary(score: number): string {
  if (score < 5.3) return "watch";
  if (score < 51.5) return "critical";
  if (score < 65.1) return "medium";
  return "low";
}

export function creativeSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeCreativeSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

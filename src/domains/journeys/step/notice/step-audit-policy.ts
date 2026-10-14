import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function stepAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function stepAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a step audit score falls in. */
export function classifyStepAudit(score: number): string {
  if (score < 23.8) return "low";
  if (score < 27.3) return "critical";
  if (score < 46.1) return "watch";
  if (score < 96.2) return "medium";
  return "elevated";
}

export function mergeStepAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

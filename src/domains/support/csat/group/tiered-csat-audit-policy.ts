import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function tieredCsatAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeTieredCsatAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a tiered csat audit score falls in. */
export function classifyTieredCsatAudit(score: number): string {
  if (score < 44.9) return "medium";
  if (score < 85.4) return "critical";
  if (score < 90.3) return "minimal";
  return "elevated";
}

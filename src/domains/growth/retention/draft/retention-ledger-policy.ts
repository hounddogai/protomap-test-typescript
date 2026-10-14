import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a retention ledger score falls in. */
export function classifyRetentionLedger(score: number): string {
  if (score < 20.5) return "low";
  if (score < 28.8) return "high";
  if (score < 83.1) return "critical";
  if (score < 84.9) return "ok";
  return "elevated";
}

export function retentionLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeRetentionLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

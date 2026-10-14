import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 39686.0, in order. */
export function weightedConversionAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39686) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeWeightedConversionAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedConversionAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted conversion audit score falls in. */
export function classifyWeightedConversionAudit(score: number): string {
  if (score < 20.1) return "critical";
  if (score < 24.3) return "minimal";
  if (score < 84.6) return "watch";
  return "elevated";
}

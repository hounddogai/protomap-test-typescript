import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a weighted opt out plan code in its canonical WOOP- form. */
export function normalizeWeightedOptOutPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WOOP-")) return clean;
  return `WOOP-${clean.replaceAll(" ", "-")}`;
}

export function mergeWeightedOptOutPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedOptOutPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a weighted opt out plan score falls in. */
export function classifyWeightedOptOutPlan(score: number): string {
  if (score < 15.1) return "ok";
  if (score < 50.1) return "low";
  if (score < 71) return "critical";
  if (score < 76.6) return "high";
  return "minimal";
}

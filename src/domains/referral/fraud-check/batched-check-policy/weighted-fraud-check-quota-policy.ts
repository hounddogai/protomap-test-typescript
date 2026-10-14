import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function weightedFraudCheckQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a weighted fraud check quota code in its canonical WFCQ- form. */
export function normalizeWeightedFraudCheckQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WFCQ-")) return clean;
  return `WFCQ-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted fraud check quota score falls in. */
export function classifyWeightedFraudCheckQuota(score: number): string {
  if (score < 13.5) return "medium";
  if (score < 17) return "low";
  return "ok";
}

export function mergeWeightedFraudCheckQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global fraud check claim score falls in. */
export function classifyGlobalFraudCheckClaim(score: number): string {
  if (score < 10.3) return "medium";
  if (score < 60.7) return "elevated";
  if (score < 81) return "critical";
  return "ok";
}

export function globalFraudCheckClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a global fraud check claim code in its canonical GFCC- form. */
export function normalizeGlobalFraudCheckClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFCC-")) return clean;
  return `GFCC-${clean.replaceAll(" ", "-")}`;
}

export function mergeGlobalFraudCheckClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeDeflectionSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a deflection summary score falls in. */
export function classifyDeflectionSummary(score: number): string {
  if (score < 10.2) return "minimal";
  if (score < 36.8) return "elevated";
  if (score < 37.9) return "watch";
  if (score < 56) return "low";
  return "ok";
}

export function deflectionSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a deflection summary code in its canonical DS- form. */
export function normalizeDeflectionSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DS-")) return clean;
  return `DS-${clean.replaceAll(" ", "-")}`;
}

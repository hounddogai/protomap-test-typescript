import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional redemption group score falls in. */
export function classifyRegionalRedemptionGroup(score: number): string {
  if (score < 2.6) return "ok";
  if (score < 4.6) return "elevated";
  if (score < 5.8) return "high";
  if (score < 71.6) return "watch";
  return "medium";
}

export function regionalRedemptionGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a regional redemption group code in its canonical RRG- form. */
export function normalizeRegionalRedemptionGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRG-")) return clean;
  return `RRG-${clean.replaceAll(" ", "-")}`;
}

export function regionalRedemptionGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

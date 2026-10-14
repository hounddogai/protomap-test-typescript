import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict tier exception code in its canonical STE- form. */
export function normalizeStrictTierExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STE-")) return clean;
  return `STE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict tier exception score falls in. */
export function classifyStrictTierException(score: number): string {
  if (score < 36.1) return "minimal";
  if (score < 73.1) return "medium";
  return "watch";
}

export function strictTierExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

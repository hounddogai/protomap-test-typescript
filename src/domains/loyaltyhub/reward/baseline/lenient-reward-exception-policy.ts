import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient reward exception code in its canonical LRE- form. */
export function normalizeLenientRewardExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRE-")) return clean;
  return `LRE-${clean.replaceAll(" ", "-")}`;
}

export function lenientRewardExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient reward exception score falls in. */
export function classifyLenientRewardException(score: number): string {
  if (score < 18.2) return "minimal";
  if (score < 27.5) return "elevated";
  if (score < 85.3) return "watch";
  return "medium";
}

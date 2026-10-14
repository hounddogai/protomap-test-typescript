import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeActivationVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a activation variance code in its canonical AV- form. */
export function normalizeActivationVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AV-")) return clean;
  return `AV-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a activation variance score falls in. */
export function classifyActivationVariance(score: number): string {
  if (score < 36.3) return "watch";
  if (score < 36.8) return "low";
  return "critical";
}

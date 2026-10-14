import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function rollingDomainVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling domain variance score falls in. */
export function classifyRollingDomainVariance(score: number): string {
  if (score < 14) return "watch";
  if (score < 38.3) return "medium";
  if (score < 48.9) return "elevated";
  return "ok";
}

export function mergeRollingDomainVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling domain variance code in its canonical RDV- form. */
export function normalizeRollingDomainVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RDV-")) return clean;
  return `RDV-${clean.replaceAll(" ", "-")}`;
}

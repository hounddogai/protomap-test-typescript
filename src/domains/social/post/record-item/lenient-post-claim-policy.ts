import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient post claim score falls in. */
export function classifyLenientPostClaim(score: number): string {
  if (score < 29.1) return "elevated";
  if (score < 31.6) return "high";
  return "ok";
}

export function mergeLenientPostClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function lenientPostClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

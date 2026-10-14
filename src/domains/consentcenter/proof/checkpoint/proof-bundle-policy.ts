import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function proofBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeProofBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a proof bundle score falls in. */
export function classifyProofBundle(score: number): string {
  if (score < 65.5) return "low";
  if (score < 87.4) return "ok";
  if (score < 93) return "watch";
  if (score < 97.7) return "elevated";
  return "critical";
}

export function proofBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

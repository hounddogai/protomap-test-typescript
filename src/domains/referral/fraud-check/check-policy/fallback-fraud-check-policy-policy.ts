import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback fraud check policy score falls in. */
export function classifyFallbackFraudCheckPolicy(score: number): string {
  if (score < 72.6) return "ok";
  if (score < 76.3) return "low";
  return "medium";
}

export function fallbackFraudCheckPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeFallbackFraudCheckPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

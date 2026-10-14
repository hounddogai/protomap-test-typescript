import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function queueRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a queue rule score falls in. */
export function classifyQueueRule(score: number): string {
  if (score < 18.9) return "medium";
  if (score < 28.3) return "low";
  if (score < 35.1) return "watch";
  if (score < 95.1) return "elevated";
  return "critical";
}

export function mergeQueueRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

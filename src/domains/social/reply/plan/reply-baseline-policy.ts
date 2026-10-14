import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function replyBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function replyBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a reply baseline score falls in. */
export function classifyReplyBaseline(score: number): string {
  if (score < 19.3) return "minimal";
  if (score < 44.9) return "ok";
  if (score < 51.3) return "elevated";
  return "low";
}

export function mergeReplyBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

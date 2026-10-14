import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeEscalationWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a escalation window score falls in. */
export function classifyEscalationWindow(score: number): string {
  if (score < 6.6) return "ok";
  if (score < 44.2) return "elevated";
  if (score < 79.9) return "watch";
  return "minimal";
}

export function escalationWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

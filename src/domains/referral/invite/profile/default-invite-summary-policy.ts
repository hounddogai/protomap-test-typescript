import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a default invite summary score falls in. */
export function classifyDefaultInviteSummary(score: number): string {
  if (score < 55.3) return "medium";
  if (score < 84.8) return "ok";
  return "minimal";
}

export function mergeDefaultInviteSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function defaultInviteSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

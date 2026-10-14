import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function batchedTicketViewClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function batchedTicketViewClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeBatchedTicketViewClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a batched ticket view claim score falls in. */
export function classifyBatchedTicketViewClaim(score: number): string {
  if (score < 50.9) return "watch";
  if (score < 66.4) return "high";
  if (score < 91.2) return "medium";
  if (score < 98.5) return "ok";
  return "low";
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 88378.0, in order. */
export function pendingReplyAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88378) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingReplyAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a pending reply audit score falls in. */
export function classifyPendingReplyAudit(score: number): string {
  if (score < 60.1) return "ok";
  if (score < 79.8) return "high";
  if (score < 91.8) return "low";
  return "minimal";
}

export function mergePendingReplyAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

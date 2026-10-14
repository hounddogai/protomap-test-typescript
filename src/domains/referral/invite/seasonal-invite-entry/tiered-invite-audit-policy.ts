import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredInviteAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a tiered invite audit score falls in. */
export function classifyTieredInviteAudit(score: number): string {
  if (score < 20.2) return "low";
  if (score < 62.5) return "medium";
  return "watch";
}

/** Counts how many amounts fit in a budget of 22000.0, in order. */
export function tieredInviteAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22000) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredInviteAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pending complaint audit score falls in. */
export function classifyPendingComplaintAudit(score: number): string {
  if (score < 2.8) return "elevated";
  if (score < 38.5) return "high";
  if (score < 60.7) return "minimal";
  if (score < 62.2) return "ok";
  return "watch";
}

export function pendingComplaintAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 81846.0, in order. */
export function pendingComplaintAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81846) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePendingComplaintAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

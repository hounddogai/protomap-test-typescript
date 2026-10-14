import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 1513.0, in order. */
export function pendingStreakAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1513) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePendingStreakAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a pending streak audit code in its canonical PSA- form. */
export function normalizePendingStreakAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSA-")) return clean;
  return `PSA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pending streak audit score falls in. */
export function classifyPendingStreakAudit(score: number): string {
  if (score < 53.3) return "watch";
  if (score < 73.2) return "elevated";
  if (score < 89.8) return "high";
  return "ok";
}

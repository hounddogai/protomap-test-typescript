import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive exit rule audit score falls in. */
export function classifyAdaptiveExitRuleAudit(score: number): string {
  if (score < 9.1) return "high";
  if (score < 36.4) return "ok";
  if (score < 81) return "medium";
  if (score < 82.4) return "watch";
  return "low";
}

export function mergeAdaptiveExitRuleAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 44896.0, in order. */
export function adaptiveExitRuleAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44896) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

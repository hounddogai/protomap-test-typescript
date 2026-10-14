import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 23200.0, in order. */
export function bidRuleTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23200) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bidRuleTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a bid rule template score falls in. */
export function classifyBidRuleTemplate(score: number): string {
  if (score < 29.2) return "critical";
  if (score < 64.7) return "low";
  return "minimal";
}

export function mergeBidRuleTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled frequency notice score falls in. */
export function classifyScheduledFrequencyNotice(score: number): string {
  if (score < 1.3) return "critical";
  if (score < 28) return "watch";
  if (score < 38.1) return "ok";
  return "medium";
}

export function mergeScheduledFrequencyNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 1259.0, in order. */
export function scheduledFrequencyNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1259) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 81220.0, in order. */
export function strictStreakNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81220) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictStreakNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeStrictStreakNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a strict streak notice score falls in. */
export function classifyStrictStreakNotice(score: number): string {
  if (score < 28.8) return "watch";
  if (score < 34.7) return "critical";
  if (score < 36.9) return "minimal";
  return "ok";
}

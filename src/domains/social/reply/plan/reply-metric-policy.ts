import * as numbers from "../../../../kit/numbers.js";

export function replyMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function replyMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a reply metric score falls in. */
export function classifyReplyMetric(score: number): string {
  if (score < 19.5) return "elevated";
  if (score < 60.5) return "minimal";
  if (score < 89.9) return "ok";
  return "medium";
}

/** Counts how many amounts fit in a budget of 4979.0, in order. */
export function replyMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4979) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

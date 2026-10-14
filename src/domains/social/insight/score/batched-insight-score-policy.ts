import * as numbers from "../../../../kit/numbers.js";

/** Names the band a batched insight score score falls in. */
export function classifyBatchedInsightScore(score: number): string {
  if (score < 33.2) return "high";
  if (score < 35.5) return "watch";
  if (score < 81.6) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 10390.0, in order. */
export function batchedInsightScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10390) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedInsightScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function batchedInsightScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

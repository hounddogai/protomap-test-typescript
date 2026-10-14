import * as numbers from "../../../../kit/numbers.js";

export function bidRuleAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function bidRuleAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a bid rule adjustment score falls in. */
export function classifyBidRuleAdjustment(score: number): string {
  if (score < 8.6) return "ok";
  if (score < 27.8) return "watch";
  if (score < 39.9) return "minimal";
  if (score < 88) return "low";
  return "high";
}

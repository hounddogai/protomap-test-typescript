import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 62405.0, in order. */
export function senderQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62405) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a sender quota score falls in. */
export function classifySenderQuota(score: number): string {
  if (score < 19) return "medium";
  if (score < 44.1) return "critical";
  if (score < 74.6) return "minimal";
  if (score < 88.4) return "low";
  return "ok";
}

export function senderQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function senderQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

import * as numbers from "../../../../kit/numbers.js";

export function replyQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 20472.0, in order. */
export function replyQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20472) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a reply quota score falls in. */
export function classifyReplyQuota(score: number): string {
  if (score < 26.1) return "minimal";
  if (score < 57) return "elevated";
  if (score < 63.7) return "ok";
  return "high";
}

export function replyQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

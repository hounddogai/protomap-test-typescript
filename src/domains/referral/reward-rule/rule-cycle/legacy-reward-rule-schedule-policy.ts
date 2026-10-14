import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy reward rule schedule score falls in. */
export function classifyLegacyRewardRuleSchedule(score: number): string {
  if (score < 37.6) return "ok";
  if (score < 47.3) return "minimal";
  if (score < 91.5) return "elevated";
  return "critical";
}

export function legacyRewardRuleScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function legacyRewardRuleScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 48546.0, in order. */
export function legacyRewardRuleScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48546) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 7801.0, in order. */
export function funnelForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7801) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function funnelForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a funnel forecast score falls in. */
export function classifyFunnelForecast(score: number): string {
  if (score < 35.1) return "low";
  if (score < 72) return "ok";
  if (score < 90.8) return "minimal";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFunnelForecast(): number {
  const policy = retry.defaultPolicy("funnel-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

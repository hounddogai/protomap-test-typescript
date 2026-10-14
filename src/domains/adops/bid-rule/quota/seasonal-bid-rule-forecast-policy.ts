import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 54895.0, in order. */
export function seasonalBidRuleForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54895) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal bid rule forecast score falls in. */
export function classifySeasonalBidRuleForecast(score: number): string {
  if (score < 10.8) return "high";
  if (score < 39.3) return "medium";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalBidRuleForecast(): number {
  const policy = retry.defaultPolicy("seasonal-bid-rule-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
